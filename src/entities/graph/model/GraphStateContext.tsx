import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useSyncExternalStore,
} from 'react';
import type { GraphStore } from './graphStore';
import type { GraphElement, RelationType, SerializedElement } from './types';
import { createGraphParser, type GraphParser } from './parseState';

interface GraphContextValue {
    elements: SerializedElement[];
    store: GraphStore;
    getElementById: (id: string) => SerializedElement | undefined;
}

const GraphStateContext = createContext<GraphContextValue | null>(null);

export function GraphStateProvider({
    store,
    children,
}: {
    store: GraphStore;
    children: React.ReactNode;
}) {
    const storeRef = useRef<GraphStore | null>(null);
    const parserRef = useRef<GraphParser | null>(null);

    if (storeRef.current !== store) {
        storeRef.current = store;
        parserRef.current = createGraphParser(store);
    }

    const parser = parserRef.current!;

    const elements = useSyncExternalStore(
        store.subscribe,
        parser.getSnapshot,
    );

    const value = useMemo<GraphContextValue>(
        () => ({ elements, store, getElementById: parser.getElementById }),
        [elements, store, parser.getElementById],
    );

    return (
        <GraphStateContext.Provider value={value}>
            {children}
        </GraphStateContext.Provider>
    );
}

function useGraphContext(): GraphContextValue {
    const ctx = useContext(GraphStateContext);
    if (!ctx) throw new Error('useGraphState/useGraphElement must be used within GraphStateProvider');
    return ctx;
}

export function useGraphState(): SerializedElement[] {
    return useGraphContext().elements;
}

export function useGraphElement(id: string) {
    const { store, getElementById } = useGraphContext();

    const element = getElementById(id);

    const update = useCallback(
        (patch: Partial<GraphElement>) => {
            store.updateElement(id, patch);
        },
        [store, id],
    );

    const remove = useCallback(() => {
        store.removeElement(id);
    }, [store, id]);

    const addRelation = useCallback(
        (type: RelationType, toElement: GraphElement) => {
            store.addRelation(type, id, toElement);
        },
        [store, id],
    );

    const removeRelation = useCallback(
        (type: RelationType, toElement: GraphElement) => {
            store.removeRelation(type, id, toElement);
        },
        [store, id],
    );

    return { element, update, remove, addRelation, removeRelation };
}
