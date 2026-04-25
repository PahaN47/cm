import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    buildGraphElement,
    useGraphStore,
    type ElementSnapshot,
    type ElementType,
    type GraphElement,
} from '@/entities/graph';
import { useSelectedElementActions } from '@/features/element-selection';

import { useFormApplierRef } from './HistoryFormApplierContext';
import {
    HistoryState,
    pushUndo as pushUndoAction,
    redo as redoAction,
    undo as undoAction,
} from './model';
import type {
    ActionDescriptor,
    ChangeTypeAction,
    CreateElementAction,
    RemoveElementAction,
    UpdateElementAction,
    UpdateFormAction,
} from './model';
import { ActionNames, useActivityLog } from '../activity-log';

// Local minimal root-state shape; see useHistory.ts for the same pattern.
interface WithHistoryState {
    history: HistoryState;
}

type Direction = 'undo' | 'redo';

/**
 * Mounts global Cmd/Ctrl+Z (undo) and Cmd/Ctrl+Shift+Z (redo) listeners and
 * runs the side effects of the corresponding history descriptors against the
 * graph store and the currently-mounted form. Must be called inside a
 * `GraphStateProvider`, a `HistoryFormApplierProvider`, and a
 * `SelectedElementProvider`.
 */
export function useHistoryShortcuts() {
    const dispatch = useDispatch();
    const store = useGraphStore();
    const log = useActivityLog();
    const applierRef = useFormApplierRef();
    const { setSelectedElementId, clearIfSelected } =
        useSelectedElementActions();

    const { nextUndo, nextRedo } = useSelector(
        (state: WithHistoryState) => state.history,
    );

    // Apply a snapshot of editable fields (attributes, source/target/directed,
    // children, parents) to an existing element, refocusing it. Used by both
    // `update` and `change-type` runners.
    const applySnapshot = useCallback(
        (
            elementId: string,
            snap: ElementSnapshot,
            opts?: { skipMarkBaseline?: boolean },
        ) => {
            if (
                !opts?.skipMarkBaseline &&
                applierRef?.current &&
                applierRef.current.elementId === elementId
            ) {
                applierRef.current.markBaseline();
            }

            const { children, parents, ...patch } = snap;
            store.updateElement(elementId, patch as Partial<GraphElement>);
            store.setRelations('childParents', elementId, parents);
            store.setRelations('parentChildren', elementId, children);
        },
        [store, applierRef],
    );

    const recreate = useCallback(
        (
            elementId: string,
            elementType: ElementType,
            data: ElementSnapshot,
        ) => {
            const element: GraphElement = buildGraphElement(
                elementId,
                elementType,
                data,
            );
            store.addElement(element);
            store.setRelations('childParents', elementId, data.parents);
            store.setRelations('parentChildren', elementId, data.children);
        },
        [store],
    );

    const runAction = useCallback(
        (action: ActionDescriptor, direction: Direction): void => {
            switch (action.type) {
                case 'add': {
                    const a: CreateElementAction = action;
                    if (direction === 'undo') {
                        clearIfSelected(a.elementId);
                        store.removeElement(a.elementId);
                    } else {
                        recreate(a.elementId, a.elementType, a.data);
                        setSelectedElementId(a.elementId);
                    }
                    break;
                }
                case 'remove': {
                    const a: RemoveElementAction = action;
                    if (direction === 'undo') {
                        recreate(a.elementId, a.elementType, a.data);
                        setSelectedElementId(a.elementId);
                    } else {
                        clearIfSelected(a.elementId);
                        store.removeElement(a.elementId);
                    }
                    break;
                }
                case 'update': {
                    const a: UpdateElementAction = action;
                    const target = direction === 'undo' ? a.prevData : a.data;
                    applySnapshot(a.elementId, target);
                    setSelectedElementId(a.elementId);
                    break;
                }
                case 'change-type': {
                    const a: ChangeTypeAction = action;
                    const targetType =
                        direction === 'undo' ? a.prevType : a.nextType;
                    const targetData =
                        direction === 'undo' ? a.prevData : a.data;

                    // The form (if mounted for this element) will swap form
                    // components when type changes, so it remounts with fresh
                    // baseline values. No `markBaseline` needed.
                    store.changeElementType(a.elementId, targetType);
                    applySnapshot(a.elementId, targetData, {
                        skipMarkBaseline: true,
                    });
                    setSelectedElementId(a.elementId);
                    break;
                }
                case 'update-form': {
                    const a: UpdateFormAction = action;
                    // Form-level edits live only in the active form. If the
                    // applier doesn't match (e.g., the form was unmounted by
                    // some path other than selection change), skip silently.
                    const applier = applierRef?.current ?? null;
                    if (!applier || applier.elementId !== a.elementId) {
                        return;
                    }
                    applier.apply(direction === 'undo' ? a.prevData : a.data);
                    break;
                }
                case 'batch': {
                    const children =
                        direction === 'undo'
                            ? [...action.actions].reverse()
                            : action.actions;
                    for (const child of children) {
                        runAction(child, direction);
                    }
                    break;
                }
            }
        },
        [
            store,
            applierRef,
            applySnapshot,
            recreate,
            setSelectedElementId,
            clearIfSelected,
        ],
    );

    const undo = useCallback(() => {
        if (!nextUndo) return;
        runAction(nextUndo, 'undo');
        dispatch(undoAction());
    }, [nextUndo, runAction, dispatch]);

    const redo = useCallback(() => {
        if (!nextRedo) return;
        runAction(nextRedo, 'redo');
        dispatch(redoAction());
    }, [nextRedo, runAction, dispatch]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const isMeta = e.metaKey || e.ctrlKey;
            if (!isMeta) return;
            if (e.key !== 'z' && e.key !== 'Z') return;

            // Always intercept: even though browsers natively undo
            // text-input edits, our undo stack already covers form changes
            // (debounced via FormHistoryWatch), so we want a single source of
            // truth.
            e.preventDefault();
            if (e.shiftKey) {
                log(ActionNames.REDO);
                redo();
            } else {
                log(ActionNames.UNDO);
                undo();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [undo, redo, log]);

    return useMemo(
        () => ({
            undo,
            redo,
            // Expose the raw push for callers that want it without going
            // through useHistory.
            pushUndo: (action: ActionDescriptor) =>
                dispatch(pushUndoAction(action)),
        }),
        [undo, redo, dispatch],
    );
}
