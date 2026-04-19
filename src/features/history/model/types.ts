import type { ElementSnapshot, ElementType } from '@/entities/graph';

export interface CreateElementAction {
    type: 'add';
    elementId: string;
    elementType: ElementType;
    data: ElementSnapshot;
}

export interface RemoveElementAction {
    type: 'remove';
    elementId: string;
    elementType: ElementType;
    data: ElementSnapshot;
}

export interface UpdateFormAction {
    type: 'update-form';
    elementId: string;
    data: Partial<ElementSnapshot>;
    prevData: Partial<ElementSnapshot>;
}

export interface UpdateElementAction {
    type: 'update';
    elementId: string;
    data: ElementSnapshot;
    prevData: ElementSnapshot;
}

// Combined "change type + apply form values". The data/prevData on each side
// match that side's element type (e.g. prevData may carry source/target while
// data does not, when going edge → vertex).
export interface ChangeTypeAction {
    type: 'change-type';
    elementId: string;
    prevType: ElementType;
    nextType: ElementType;
    data: ElementSnapshot;
    prevData: ElementSnapshot;
}

export interface BatchAction {
    type: 'batch';
    actions: ActionDescriptor[];
}

export type ActionDescriptor =
    | CreateElementAction
    | RemoveElementAction
    | UpdateFormAction
    | UpdateElementAction
    | ChangeTypeAction
    | BatchAction;

export interface HistoryState {
    undoStack: ActionDescriptor[];
    redoStack: ActionDescriptor[];
    nextUndo: ActionDescriptor | null;
    nextRedo: ActionDescriptor | null;
    maxLength: number;
}
