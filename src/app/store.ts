import { configureStore } from '@reduxjs/toolkit';
import { historySlice } from '@/features/history';

export const store = configureStore({
    reducer: {
        history: historySlice.reducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
