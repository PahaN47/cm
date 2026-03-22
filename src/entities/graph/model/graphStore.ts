import type { GraphElement, EdgeElement, RelationType } from './types';

type Listener = () => void;

export class GraphStore {
    elements: Map<string, GraphElement> = new Map();

    nodeEdges: Map<string, Set<GraphElement>> = new Map();
    parentChildren: Map<string, Set<GraphElement>> = new Map();
    childParents: Map<string, Set<GraphElement>> = new Map();

    private version = 0;
    private listeners: Set<Listener> = new Set();

    // ── useSyncExternalStore contract ──

    subscribe = (listener: Listener): (() => void) => {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    };

    getVersion = (): number => this.version;

    private notify(): void {
        this.version++;
        this.listeners.forEach((l) => {
            l();
        });
    }

    // ── Element CRUD ──

    addElement(element: GraphElement): void {
        this.elements.set(element.id, element);

        if (this.isEdge(element)) {
            this.addToRelationSet('nodeEdges', element.source, element);
            this.addToRelationSet('nodeEdges', element.target, element);
        }

        this.notify();
    }

    removeElement(id: string): void {
        const element = this.elements.get(id);
        if (!element) return;

        if (this.isEdge(element)) {
            this.removeFromRelationSet('nodeEdges', element.source, element);
            this.removeFromRelationSet('nodeEdges', element.target, element);
        }

        this.nodeEdges.delete(id);
        this.parentChildren.delete(id);
        this.childParents.delete(id);

        for (const set of this.parentChildren.values()) set.delete(element);
        for (const set of this.childParents.values()) set.delete(element);
        for (const set of this.nodeEdges.values()) set.delete(element);

        this.elements.delete(id);
        this.notify();
    }

    updateElement(id: string, patch: Partial<GraphElement>): void {
        const element = this.elements.get(id);
        if (!element) return;
        Object.assign(element, patch);
        this.notify();
    }

    getElement(id: string): GraphElement | undefined {
        return this.elements.get(id);
    }

    // ── Relation helpers ──

    addRelation(
        type: RelationType,
        fromId: string,
        toElement: GraphElement,
    ): void {
        this.addToRelationSet(type, fromId, toElement);
        this.notify();
    }

    removeRelation(
        type: RelationType,
        fromId: string,
        toElement: GraphElement,
    ): void {
        this.removeFromRelationSet(type, fromId, toElement);
        this.notify();
    }

    getRelated(type: RelationType, id: string): Set<GraphElement> | undefined {
        return this.relationMap(type).get(id);
    }

    // ── Private utilities ──

    private relationMap(type: RelationType): Map<string, Set<GraphElement>> {
        switch (type) {
            case 'nodeEdges':
                return this.nodeEdges;
            case 'parentChildren':
                return this.parentChildren;
            case 'childParents':
                return this.childParents;
        }
    }

    private addToRelationSet(
        type: RelationType,
        key: string,
        element: GraphElement,
    ): void {
        const map = this.relationMap(type);
        let set = map.get(key);
        if (!set) {
            set = new Set();
            map.set(key, set);
        }
        set.add(element);
    }

    private removeFromRelationSet(
        type: RelationType,
        key: string,
        element: GraphElement,
    ): void {
        const map = this.relationMap(type);
        const set = map.get(key);
        if (!set) return;
        set.delete(element);
        if (set.size === 0) map.delete(key);
    }

    private isEdge(el: GraphElement): el is EdgeElement {
        return el.type === 'edge' || el.type === 'metaedge';
    }
}

export const graphStore = new GraphStore();
