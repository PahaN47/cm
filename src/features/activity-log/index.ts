export {
    activitySlice,
    logAction,
    clearLog,
    setMaxLength,
    ActionNames,
} from './model';
export type { ActionName, ActivityRecord, ActivityState } from './model';
export {
    ActivityLogProvider,
    useActivityLog,
    type LogActivity,
} from './ActivityLogContext';
