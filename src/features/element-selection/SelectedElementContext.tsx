import {
    createContext,
    useContext,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react';

interface SelectedElementValue {
    selectedElementId: string | null;
}

interface SelectedElementActions {
    setSelectedElementId: (id: string | null) => void;
    resetSelectedElement: () => void;
    /**
     * Clear the selection only if the given id is currently selected.
     * Lets callers react to "this element went away" without subscribing
     * to the selection value (and thus without re-rendering on every
     * selection change).
     */
    clearIfSelected: (id: string) => void;
}

const ValueContext = createContext<SelectedElementValue | null>(null);
const ActionsContext = createContext<SelectedElementActions | null>(null);

// Split into a value context (re-renders on selection change) and an actions
// context (stable for the lifetime of the provider) so that write-only
// consumers don't re-render when the selection changes.
export function SelectedElementProvider({ children }: { children: ReactNode }) {
    const [selectedElementId, setSelectedElementId] = useState<string | null>(
        null,
    );

    // Mirror the latest selection in a ref so the actions object can stay
    // stable while still observing current state inside `clearIfSelected`.
    const selectedRef = useRef<string | null>(selectedElementId);
    selectedRef.current = selectedElementId;

    const actions = useMemo<SelectedElementActions>(
        () => ({
            setSelectedElementId,
            resetSelectedElement: () => setSelectedElementId(null),
            clearIfSelected: (id: string) => {
                if (selectedRef.current === id) {
                    setSelectedElementId(null);
                }
            },
        }),
        [],
    );

    const value = useMemo<SelectedElementValue>(
        () => ({ selectedElementId }),
        [selectedElementId],
    );

    return (
        <ActionsContext.Provider value={actions}>
            <ValueContext.Provider value={value}>
                {children}
            </ValueContext.Provider>
        </ActionsContext.Provider>
    );
}

export function useSelectedElementId(): string | null {
    const ctx = useContext(ValueContext);
    if (!ctx) {
        throw new Error(
            'useSelectedElementId must be used within a <SelectedElementProvider>.',
        );
    }
    return ctx.selectedElementId;
}

export function useSelectedElementActions(): SelectedElementActions {
    const ctx = useContext(ActionsContext);
    if (!ctx) {
        throw new Error(
            'useSelectedElementActions must be used within a <SelectedElementProvider>.',
        );
    }
    return ctx;
}
