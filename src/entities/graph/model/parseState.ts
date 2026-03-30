import type { GraphStore } from './graphStore';
import type { GraphElement, EdgeElement, SerializedElement } from './types';

function idsFromSet(set: Set<GraphElement> | undefined): string[] {
    if (!set) return [];
    const ids: string[] = [];
    for (const el of set) ids.push(el.id);
    return ids;
}

function isEdge(el: GraphElement): el is EdgeElement {
    return el.type === 'edge' || el.type === 'metaedge';
}

function serialize(store: GraphStore, el: GraphElement): SerializedElement {
    const out: SerializedElement = {
        id: el.id,
        type: el.type,
        attributes: el.attributes,
        edges: idsFromSet(store.nodeEdges.get(el.id)),
        children: idsFromSet(store.parentChildren.get(el.id)),
        parents: idsFromSet(store.childParents.get(el.id)),
    };

    if (isEdge(el)) {
        out.source = el.source;
        out.target = el.target;
        out.directed = el.directed;
    }

    return out;
}

export interface GraphParser {
    getSnapshot: () => SerializedElement[];
    getElementById: (id: string) => SerializedElement | undefined;
}

export function createGraphParser(store: GraphStore): GraphParser {
    const cache = new Map<string, SerializedElement>();
    let cachedResult: SerializedElement[] = [];

    function getSnapshot(): SerializedElement[] {
        const dirtyIds = store.consumeDirtyIds();

        if (dirtyIds === null) {
            cache.clear();
            for (const [id, el] of store.elements) {
                cache.set(id, serialize(store, el));
            }
        } else if (dirtyIds.size > 0) {
            for (const id of dirtyIds) {
                const el = store.elements.get(id);
                if (el) {
                    cache.set(id, serialize(store, el));
                } else {
                    cache.delete(id);
                }
            }
        } else {
            return cachedResult;
        }

        cachedResult = Array.from(cache.values());
        return cachedResult;
    }

    function getElementById(id: string): SerializedElement | undefined {
        if (store.isElementDirty(id)) {
            const el = store.elements.get(id);
            if (el) {
                cache.set(id, serialize(store, el));
            } else {
                cache.delete(id);
            }
        }
        return cache.get(id);
    }

    return { getSnapshot, getElementById };
}
