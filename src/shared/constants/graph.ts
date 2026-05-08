import { ElementType } from '@/entities/graph';

export type ElementTypeOption = {
    type: ElementType;
    label: string;
};

export const ELEMENT_TYPES: ElementTypeOption[] = [
    { type: 'vertex', label: 'Вершина' },
    { type: 'edge', label: 'Ребро' },
    { type: 'metavertex', label: 'Метавершина' },
];
