import { configureStore } from '@reduxjs/toolkit';
import { historySlice } from '@/features/history';
import { activitySlice } from '@/features/activity-log';

export const store = configureStore({
    reducer: {
        history: historySlice.reducer,
        activity: activitySlice.reducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
