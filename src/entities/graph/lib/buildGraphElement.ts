import type {
    AttributeValue,
    ElementType,
    GraphElement,
} from '../model/types';

export interface BuildGraphElementInput {
    attributes: Record<string, AttributeValue>;
    source?: string;
    target?: string;
    directed?: boolean;
}

export function buildGraphElement(
    id: string,
    type: ElementType,
    data: BuildGraphElementInput,
): GraphElement {
    const base = { id, attributes: data.attributes };

    switch (type) {
        case 'edge':
            return {
                ...base,
                type: 'edge',
                source: data.source ?? '',
                target: data.target ?? '',
                directed: data.directed ?? false,
            };
        case 'metaedge':
            return {
                ...base,
                type: 'metaedge',
                source: data.source ?? '',
                target: data.target ?? '',
                directed: true,
            };
        case 'metavertex':
            return { ...base, type: 'metavertex' };
        case 'vertex':
        default:
            return { ...base, type: 'vertex' };
    }
}
