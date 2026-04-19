import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useRef,
    type ReactNode,
} from 'react';

import type { ElementSnapshot } from '@/entities/graph';

// A FormApplier is the bridge between the history runner and a currently-mounted
// react-hook-form instance. The runner uses it to roll the form's values
// forward / backward without causing FormHistoryWatch to push a new entry.
export interface FormApplier {
    elementId: string;
    // Apply a partial set of values to the form (used for `update-form` undo/redo).
    apply: (values: Partial<ElementSnapshot>) => void;
    // Tell the form's history watcher to treat the next observed value change
    // as the new baseline, instead of pushing a diff. Used right before a
    // committed graph mutation that will cause the form to reset.
    markBaseline: () => void;
}

interface ApplierRef {
    current: FormApplier | null;
}

const HistoryFormApplierContext = createContext<ApplierRef | null>(null);

export function HistoryFormApplierProvider({
    children,
}: {
    children: ReactNode;
}) {
    const ref = useRef<FormApplier | null>(null);
    // Stable wrapper so React doesn't see a new context value each render.
    const value = useMemo<ApplierRef>(
        () => ({
            get current() {
                return ref.current;
            },
            set current(v) {
                ref.current = v;
            },
        }),
        [],
    );
    return (
        <HistoryFormApplierContext.Provider value={value}>
            {children}
        </HistoryFormApplierContext.Provider>
    );
}

// Read the current applier (or null). Only meaningful from the runner.
export function useFormApplierRef(): ApplierRef | null {
    return useContext(HistoryFormApplierContext);
}

// Register the calling component as the active form applier while it's mounted.
// `apply` and `markBaseline` are read via refs so callers can pass freshly
// allocated functions without re-registering on every render.
export function useRegisterFormApplier(
    elementId: string,
    apply: FormApplier['apply'],
    markBaseline: FormApplier['markBaseline'],
): void {
    const ctxRef = useContext(HistoryFormApplierContext);

    const applyRef = useRef(apply);
    const markBaselineRef = useRef(markBaseline);

    useEffect(() => {
        applyRef.current = apply;
    }, [apply]);

    useEffect(() => {
        markBaselineRef.current = markBaseline;
    }, [markBaseline]);

    useEffect(() => {
        if (!ctxRef) return;
        const applier: FormApplier = {
            elementId,
            apply: (values) => applyRef.current(values),
            markBaseline: () => markBaselineRef.current(),
        };
        ctxRef.current = applier;
        return () => {
            if (ctxRef.current === applier) {
                ctxRef.current = null;
            }
        };
    }, [elementId, ctxRef]);
}
