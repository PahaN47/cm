import type { GraphElement } from '@/entities/graph';

export interface AddElementAction {
    type: 'addElement';
    element: GraphElement;
}

export interface RemoveElementAction {
    type: 'removeElement';
    element: GraphElement;
}

export interface UpdateElementAction {
    type: 'updateElement';
    id: string;
    before: Partial<GraphElement>;
    after: Partial<GraphElement>;
}

export interface AddRelationAction {
    type: 'addRelation';
    relation: 'nodeEdges' | 'parentChildren' | 'childParents';
    fromId: string;
    toElementId: string;
}

export interface RemoveRelationAction {
    type: 'removeRelation';
    relation: 'nodeEdges' | 'parentChildren' | 'childParents';
    fromId: string;
    toElementId: string;
}

export interface BatchAction {
    type: 'batch';
    actions: ActionDescriptor[];
}

export type ActionDescriptor =
    | AddElementAction
    | RemoveElementAction
    | UpdateElementAction
    | AddRelationAction
    | RemoveRelationAction
    | BatchAction;

export interface HistoryState {
    undoStack: ActionDescriptor[];
    redoStack: ActionDescriptor[];
    maxLength: number;
}
