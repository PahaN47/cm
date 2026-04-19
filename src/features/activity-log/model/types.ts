// A single entry in the activity log. `payload` is intentionally `unknown` so
// callers can attach whatever context is meaningful to the event being logged;
// values should be plain serialisable data (strings, numbers, plain objects)
// to keep the redux store serialisable.
export interface ActivityRecord {
    name: string;
    payload?: unknown;
    timestamp: number;
}

export interface ActivityState {
    log: ActivityRecord[];
    maxLength: number;
}
