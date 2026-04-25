import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useSyncExternalStore,
} from 'react';
import type { GraphStore } from './graphStore';
import type {
    ElementType,
    GraphElement,
    RelationType,
    SerializedElement,
} from './types';
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

    const elements = useSyncExternalStore(store.subscribe, parser.getSnapshot);

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
    if (!ctx)
        throw new Error(
            'useGraphState/useGraphElement must be used within GraphStateProvider',
        );
    return ctx;
}

export function useGraphStore(): GraphStore {
    return useGraphContext().store;
}

export function useGraphState(type?: ElementType): SerializedElement[] {
    const { elements } = useGraphContext();

    return useMemo(() => {
        if (type) {
            return elements.filter((element) => element.type === type);
        }
        return elements;
    }, [elements, type]);
}

export function useGetGraphElementById() {
    return useGraphContext().getElementById;
}

export function useGraphElement(id: string) {
    const { store, elements, getElementById } = useGraphContext();

    const element = getElementById(id);

    const availableChildren = useMemo(() => {
        return elements.filter((el) => el.id !== id).map((el) => el.id);
    }, [elements, id]);

    const availableParents = useMemo(() => {
        return elements
            .filter(
                ({ id: elId, type }) =>
                    (type === 'metavertex' || type === 'metaedge') &&
                    elId !== id,
            )
            .map(({ id }) => id);
    }, [elements, id]);

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
        (type: RelationType, toId: string) => {
            store.addRelationById(type, id, toId);
        },
        [store, id],
    );

    const removeRelation = useCallback(
        (type: RelationType, toId: string) => {
            store.removeRelationById(type, id, toId);
        },
        [store, id],
    );

    const setRelations = useCallback(
        (type: RelationType, toIds: string[]) => {
            store.setRelations(type, id, toIds);
        },
        [store, id],
    );

    const changeType = useCallback(
        (newType: ElementType) => {
            store.changeElementType(id, newType);
        },
        [store, id],
    );

    return {
        element,
        availableChildren,
        availableParents,
        update,
        remove,
        changeType,
        addRelation,
        removeRelation,
        setRelations,
    };
}
