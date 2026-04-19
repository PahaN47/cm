import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    ActionDescriptor,
    clearPendingFormHistory,
    HistoryState,
    pushUndo,
} from './model';

// Local minimal shape of the root Redux state. Avoids depending on the
// concrete `RootState` from the app layer so this feature stays portable.
interface WithHistoryState {
    history: HistoryState;
}

/**
 * Read-only history surface plus dispatchers for *recording* actions. The
 * actual undo/redo execution (which has side effects on the graph store and
 * the active form) lives in `useHistoryShortcuts`. Components that only need
 * to push entries should use this hook.
 */
export const useHistory = () => {
    const { nextUndo, nextRedo } = useSelector(
        (state: WithHistoryState) => state.history,
    );
    const dispatch = useDispatch();

    const dispatchPushUndo = useCallback(
        (action: ActionDescriptor) => {
            dispatch(pushUndo(action));
        },
        [dispatch],
    );

    const dispatchClearPendingFormHistory = useCallback(() => {
        dispatch(clearPendingFormHistory());
    }, [dispatch]);

    return useMemo(
        () => ({
            nextUndo,
            nextRedo,
            pushUndo: dispatchPushUndo,
            clearPendingFormHistory: dispatchClearPendingFormHistory,
        }),
        [
            nextUndo,
            nextRedo,
            dispatchPushUndo,
            dispatchClearPendingFormHistory,
        ],
    );
};
