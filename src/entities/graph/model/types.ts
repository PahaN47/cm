export type AttributeType = 'string' | 'int' | 'float';

export type ElementType = 'vertex' | 'edge' | 'metavertex' | 'metaedge';

export interface AttributeValue {
    value: string | number;
    type: AttributeType;
    system: boolean;
}

export interface BaseElement {
    id: string;
    type: ElementType;
    attributes: Record<string, AttributeValue>;
}

export interface Vertex extends BaseElement {
    type: 'vertex';
}

export interface Edge extends BaseElement {
    type: 'edge';
    source: string;
    target: string;
    directed: boolean;
}

export interface MetaVertex extends BaseElement {
    type: 'metavertex';
}

export interface MetaEdge extends BaseElement {
    type: 'metaedge';
    source: string;
    target: string;
    directed: true;
}

export type GraphElement = Vertex | Edge | MetaVertex | MetaEdge;

export type NodeElement = Vertex | MetaVertex;
export type EdgeElement = Edge | MetaEdge;

export type RelationType = 'nodeEdges' | 'parentChildren' | 'childParents';

export interface ParsedRelation {
    type: RelationType;
    fromId: string;
    toId: string;
}

export interface ParsedGraph {
    elements: GraphElement[];
    relations: ParsedRelation[];
}

export interface SerializedElement {
    id: string;
    type: ElementType;
    attributes: Record<string, AttributeValue>;
    source?: string;
    target?: string;
    directed?: boolean;
    edges: string[];
    children: string[];
    parents: string[];
}

/** Element id plus display `name` string (from `name` attribute when set, otherwise `id`). */
export type GraphElementOption = {
    id: string;
    name: string;
};

// Mutable, type-agnostic view of an element. Anything that wants to round-trip
// an element's editable state (form submission, history snapshots, recreation
// after deletion) should use this shape so the same payload can be replayed
// through `buildGraphElement` + `setRelations`.
export interface ElementSnapshot {
    attributes: Record<string, AttributeValue>;
    children: string[];
    parents: string[];
    source?: string;
    target?: string;
    directed?: boolean;
}
