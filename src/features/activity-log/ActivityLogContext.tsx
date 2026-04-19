import { createContext, useCallback, useContext, type ReactNode } from 'react';
import { useDispatch } from 'react-redux';

import { logAction } from './model';

export type LogActivity = (
    name: string,
    payload?: unknown,
    timestamp?: number,
) => void;

const ActivityLogContext = createContext<LogActivity | null>(null);

// Provides a stable `log(name, payload?)` callback to the subtree. Must sit
// inside the redux `<Provider>` since it dispatches into the activity slice.
export function ActivityLogProvider({ children }: { children: ReactNode }) {
    const dispatch = useDispatch();

    const log = useCallback<LogActivity>(
        (name, payload, timestamp) => {
            dispatch(logAction({ name, payload, timestamp }));
        },
        [dispatch],
    );

    return (
        <ActivityLogContext.Provider value={log}>
            {children}
        </ActivityLogContext.Provider>
    );
}

// Returns the stable `log(name, payload?)` callback. Timestamps are stamped
// inside the slice's `prepare`, so callers only supply the semantic name and
// any context payload they care about.
export function useActivityLog(): LogActivity {
    const log = useContext(ActivityLogContext);
    if (!log) {
        throw new Error(
            'useActivityLog must be used within an <ActivityLogProvider>.',
        );
    }
    return log;
}
