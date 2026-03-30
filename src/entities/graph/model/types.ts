export type AttributeType = 'string' | 'int' | 'float';

export interface AttributeValue {
    value: string | number;
    type: AttributeType;
    system: boolean;
}

export interface BaseElement {
    id: string;
    type: 'vertex' | 'edge' | 'metavertex' | 'metaedge';
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
    type: 'vertex' | 'edge' | 'metavertex' | 'metaedge';
    attributes: Record<string, AttributeValue>;
    source?: string;
    target?: string;
    directed?: boolean;
    edges: string[];
    children: string[];
    parents: string[];
}
