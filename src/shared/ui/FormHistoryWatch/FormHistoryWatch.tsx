import {
    Control,
    FieldValues,
    Path,
    PathValue,
    UseFormSetValue,
    useWatch,
} from 'react-hook-form';
import isEqualUntyped from 'lodash/isEqual';
import debounceUntyped from 'lodash/debounce';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useHistory } from '@/features/history/useHistory';
import { useRegisterFormApplier } from '@/features/history/HistoryFormApplierContext';
import { ActionNames, useActivityLog } from '@/features/activity-log';

const isEqual = isEqualUntyped as (a: unknown, b: unknown) => boolean;

interface DebouncedFn<Args extends unknown[]> {
    (...args: Args): void;
    cancel: () => void;
    flush: () => void;
}

const debounce = debounceUntyped as <Args extends unknown[]>(
    fn: (...args: Args) => void,
    wait: number,
) => DebouncedFn<Args>;

interface FormHistoryWatchProps<T extends FieldValues> {
    control: Control<T>;
    setValue: UseFormSetValue<T>;
    elementId: string;
}

type AnyRecord = Record<string, unknown>;

interface Diff<T> {
    prev: Partial<T>;
    next: Partial<T>;
}

const isPlainObject = (value: unknown): value is AnyRecord => {
    if (value === null || typeof value !== 'object') return false;
    const proto: unknown = Object.getPrototypeOf(value);
    return proto === null || proto === Object.prototype;
};

const getDiff = <T extends AnyRecord>(prev: T, next: T): Diff<T> | null => {
    const keys = new Set<string>([...Object.keys(prev), ...Object.keys(next)]);

    const result: Diff<AnyRecord> = { prev: {}, next: {} };
    let changed = false;

    for (const key of keys) {
        const prevValue = prev[key];
        const nextValue = next[key];

        if (Object.is(prevValue, nextValue)) continue;

        if (Array.isArray(prevValue) && Array.isArray(nextValue)) {
            if (!isEqual(prevValue, nextValue)) {
                result.prev[key] = prevValue;
                result.next[key] = nextValue;
                changed = true;
            }
            continue;
        }

        if (isPlainObject(prevValue) && isPlainObject(nextValue)) {
            const partDiff = getDiff(prevValue, nextValue);
            if (partDiff) {
                result.prev[key] = partDiff.prev;
                result.next[key] = partDiff.next;
                changed = true;
            }
            continue;
        }

        // Leaf, mixed-type, or non-plain-object (Date/Map/Set/...) values:
        // fall back to deep equality and store the raw values.
        if (!isEqual(prevValue, nextValue)) {
            result.prev[key] = prevValue ?? null;
            result.next[key] = nextValue ?? null;
            changed = true;
        }
    }

    return changed ? (result as Diff<T>) : null;
};

const DEBOUNCE_TIME = 500;

const FormHistoryWatch = <T extends FieldValues>({
    control,
    setValue,
    elementId,
}: FormHistoryWatchProps<T>) => {
    const formValues = useWatch({ control }) as T;
    const { pushUndo } = useHistory();
    const log = useActivityLog();

    // Snapshot at the start of the current "burst" of edits. Updated only
    // after the debounce flushes and a diff is committed, so the captured
    // value cannot drift while the user is still typing.
    const prevValuesRef = useRef<T>(formValues);

    // True while we're applying values from undo/redo (or the runner has just
    // mutated the underlying element). The next observed value change should
    // become the new baseline rather than producing a new history entry.
    const skipNextDiffRef = useRef(false);

    // Always call the latest pushUndo / elementId from inside the debounced
    // function without re-creating the debounce.
    const pushUndoRef = useRef(pushUndo);
    const elementIdRef = useRef(elementId);
    useEffect(() => {
        pushUndoRef.current = pushUndo;
    }, [pushUndo]);
    useEffect(() => {
        elementIdRef.current = elementId;
    }, [elementId]);

    const flush = useMemo(
        () =>
            debounce((next: T, timestamp: number) => {
                const diff = getDiff(
                    prevValuesRef.current as AnyRecord,
                    next as AnyRecord,
                );
                prevValuesRef.current = next;

                if (diff) {
                    log(
                        ActionNames.UPDATE_FORM,
                        {
                            diff: diff.next,
                        },
                        timestamp,
                    );

                    pushUndoRef.current({
                        type: 'update-form',
                        elementId: elementIdRef.current,
                        data: diff.next as Partial<T>,
                        prevData: diff.prev as Partial<T>,
                    });
                }
            }, DEBOUNCE_TIME),
        [log],
    );

    useEffect(() => {
        if (Object.is(prevValuesRef.current, formValues)) return;

        if (skipNextDiffRef.current) {
            // The change came from an undo/redo or external reset; rebase
            // silently instead of pushing a new entry.
            prevValuesRef.current = formValues;
            skipNextDiffRef.current = false;
            return;
        }

        flush(formValues, Date.now());
    }, [formValues, flush]);

    useEffect(() => {
        return () => {
            flush.cancel();
        };
    }, [flush]);

    // Wire the form into the global undo/redo runner.
    const apply = useCallback(
        (values: Partial<T>) => {
            flush.cancel();
            skipNextDiffRef.current = true;
            for (const [key, value] of Object.entries(values)) {
                setValue(key as Path<T>, value as PathValue<T, Path<T>>, {
                    shouldDirty: true,
                    shouldTouch: true,
                });
            }
        },
        [flush, setValue],
    );

    const markBaseline = useCallback(() => {
        flush.cancel();
        skipNextDiffRef.current = true;
    }, [flush]);

    useRegisterFormApplier(
        elementId,
        apply as (values: Partial<Record<string, unknown>>) => void,
        markBaseline,
    );

    return null;
};

export default FormHistoryWatch;
