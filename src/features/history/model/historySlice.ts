import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ActionDescriptor, HistoryState } from './types';

const DEFAULT_MAX_LENGTH = 100;

const initialState: HistoryState = {
    undoStack: [],
    redoStack: [],
    maxLength: DEFAULT_MAX_LENGTH,
};

export const historySlice = createSlice({
    name: 'history',
    initialState,
    reducers: {
        pushUndo(state, action: PayloadAction<ActionDescriptor>) {
            state.undoStack.push(action.payload);
            if (state.undoStack.length > state.maxLength) {
                state.undoStack.shift();
            }
            state.redoStack = [];
        },

        undo(state) {
            const action = state.undoStack.pop();
            if (action) {
                state.redoStack.push(action);
            }
        },

        redo(state) {
            const action = state.redoStack.pop();
            if (action) {
                state.undoStack.push(action);
                if (state.undoStack.length > state.maxLength) {
                    state.undoStack.shift();
                }
            }
        },

        clearHistory(state) {
            state.undoStack = [];
            state.redoStack = [];
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

export const { pushUndo, undo, redo, clearHistory, setMaxLength } =
    historySlice.actions;
