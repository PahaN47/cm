import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { ActivityRecord, ActivityState } from './types';

const DEFAULT_MAX_LENGTH = 1000;

const initialState: ActivityState = {
    log: [],
    maxLength: DEFAULT_MAX_LENGTH,
};

interface LogActionInput {
    name: string;
    payload?: unknown;
    timestamp?: number;
}

export const activitySlice = createSlice({
    name: 'activity',
    initialState,
    reducers: {
        logAction: {
            reducer(state, action: PayloadAction<ActivityRecord>) {
                state.log.push(action.payload);
                if (state.log.length > state.maxLength) {
                    state.log.splice(0, state.log.length - state.maxLength);
                }
            },
            // `Date.now()` is non-deterministic, so the timestamp is captured
            // in `prepare` instead of inside the reducer. That keeps the
            // reducer a pure function of its inputs.
            prepare({ name, payload, timestamp }: LogActionInput) {
                const record: ActivityRecord = {
                    name,
                    payload,
                    timestamp: timestamp ?? Date.now(),
                };
                return { payload: record };
            },
        },

        clearLog(state) {
            state.log = [];
        },

        setMaxLength(state, action: PayloadAction<number>) {
            state.maxLength = action.payload;
            if (state.log.length > state.maxLength) {
                state.log = state.log.slice(-state.maxLength);
            }
        },
    },
});

export const { logAction, clearLog, setMaxLength } = activitySlice.actions;
