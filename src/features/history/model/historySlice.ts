import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ActionDescriptor, HistoryState } from './types';

const DEFAULT_MAX_LENGTH = 100;

const initialState: HistoryState = {
    undoStack: [],
    redoStack: [],
    nextUndo: null,
    nextRedo: null,
    maxLength: DEFAULT_MAX_LENGTH,
};

// Pending (not yet committed) edits live as `update-form` entries. They are
// only meaningful while their owning form is still mounted with the same
// values, so any committed action or focus change should drop them.
function dropTrailingFormActions(stack: ActionDescriptor[]): void {
    while (
        stack.length > 0 &&
        stack[stack.length - 1].type === 'update-form'
    ) {
        stack.pop();
    }
}

function syncNext(state: HistoryState): void {
    state.nextUndo = state.undoStack[state.undoStack.length - 1] ?? null;
    state.nextRedo = state.redoStack[state.redoStack.length - 1] ?? null;
}

export const historySlice = createSlice({
    name: 'history',
    initialState,
    reducers: {
        pushUndo(state, action: PayloadAction<ActionDescriptor>) {
            const payload = action.payload;

            if (payload.type !== 'update-form') {
                dropTrailingFormActions(state.undoStack);
            }

            state.undoStack.push(payload);
            if (state.undoStack.length > state.maxLength) {
                state.undoStack.shift();
            }

            state.redoStack = [];
            syncNext(state);
        },

        undo(state) {
            const action = state.undoStack.pop();
            if (action) {
                state.redoStack.push(action);
            }
            syncNext(state);
        },

        redo(state) {
            const action = state.redoStack.pop();
            if (action) {
                state.undoStack.push(action);
                if (state.undoStack.length > state.maxLength) {
                    state.undoStack.shift();
                }
            }
            syncNext(state);
        },

        // Drop any pending (uncommitted) form edits from both stacks. Dispatched
        // when the active form is swapped out (e.g. selection change), since
        // those edits no longer correspond to a live form instance.
        clearPendingFormHistory(state) {
            dropTrailingFormActions(state.undoStack);
            dropTrailingFormActions(state.redoStack);
            syncNext(state);
        },

        clearHistory(state) {
            state.undoStack = [];
            state.redoStack = [];
            state.nextUndo = null;
            state.nextRedo = null;
        },

        setMaxLength(state, action: PayloadAction<number>) {
            state.maxLength = action.payload;
            if (state.undoStack.length > state.maxLength) {
                state.undoStack = state.undoStack.slice(-state.maxLength);
            }
            if (state.redoStack.length > state.maxLength) {
                state.redoStack = state.redoStack.slice(-state.maxLength);
            }
        },
    },
});

export const {
    pushUndo,
    undo,
    redo,
    clearPendingFormHistory,
    clearHistory,
    setMaxLength,
} = historySlice.actions;
