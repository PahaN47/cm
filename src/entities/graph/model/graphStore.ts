import type {
    GraphElement,
    EdgeElement,
    ParsedGraph,
    RelationType,
} from './types';

type Listener = () => void;

export class GraphStore {
    elements: Map<string, GraphElement> = new Map();

    nodeEdges: Map<string, Set<GraphElement>> = new Map();
    parentChildren: Map<string, Set<GraphElement>> = new Map();
    childParents: Map<string, Set<GraphElement>> = new Map();

    private listeners: Set<Listener> = new Set();
    private dirtyIds: Set<string> | null = null;

    constructor(data?: ParsedGraph) {
        if (data) this.load(data);
    }

    // ── Bulk load ──

    load(data: ParsedGraph): void {
        this.elements.clear();
        this.nodeEdges.clear();
        this.parentChildren.clear();
        this.childParents.clear();

        for (const el of data.elements) {
            this.elements.set(el.id, el);

            if (this.isEdge(el)) {
                this.addToRelationSet('nodeEdges', el.source, el);
                this.addToRelationSet('nodeEdges', el.target, el);
            }
        }

        for (const rel of data.relations) {
            const target = this.elements.get(rel.toId);
            if (!target) continue;

            this.addToRelationSet(rel.type, rel.fromId, target);

            if (rel.type === 'parentChildren') {
                const parent = this.elements.get(rel.fromId);
                if (parent)
                    this.addToRelationSet('childParents', rel.toId, parent);
            }
        }

        this.dirtyIds = null;
        this.notify();
    }

    subscribe = (listener: Listener): (() => void) => {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    };

    consumeDirtyIds(): Set<string> | null {
        const ids = this.dirtyIds;
        this.dirtyIds = new Set();
        return ids;
    }

    isElementDirty(id: string): boolean {
        return this.dirtyIds === null || this.dirtyIds.has(id);
    }

    private markDirty(...ids: string[]): void {
        if (this.dirtyIds === null) return;
        for (const id of ids) this.dirtyIds.add(id);
    }

    private notify(): void {
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
            this.markDirty(element.id, element.source, element.target);
        } else {
            this.markDirty(element.id);
        }

        this.notify();
    }

    removeElement(id: string): void {
        const element = this.elements.get(id);
        if (!element) return;

        const affected = [id];

        if (this.isEdge(element)) {
            affected.push(element.source, element.target);
            this.removeFromRelationSet('nodeEdges', element.source, element);
            this.removeFromRelationSet('nodeEdges', element.target, element);
        }

        const collectIds = (set: Set<GraphElement> | undefined) => {
            if (set) for (const el of set) affected.push(el.id);
        };
        collectIds(this.nodeEdges.get(id));
        collectIds(this.parentChildren.get(id));
        collectIds(this.childParents.get(id));

        this.nodeEdges.delete(id);
        this.parentChildren.delete(id);
        this.childParents.delete(id);

        for (const set of this.parentChildren.values()) set.delete(element);
        for (const set of this.childParents.values()) set.delete(element);
        for (const set of this.nodeEdges.values()) set.delete(element);

        this.elements.delete(id);
        this.markDirty(...affected);
        this.notify();
    }

    updateElement(id: string, patch: Partial<GraphElement>): void {
        const element = this.elements.get(id);
        if (!element) return;
        Object.assign(element, patch);
        this.markDirty(id);
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
        this.markDirty(fromId, toElement.id);
        this.notify();
    }

    removeRelation(
        type: RelationType,
        fromId: string,
        toElement: GraphElement,
    ): void {
        this.removeFromRelationSet(type, fromId, toElement);
        this.markDirty(fromId, toElement.id);
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
