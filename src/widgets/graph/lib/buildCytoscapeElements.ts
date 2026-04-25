import type { ElementDefinition } from 'cytoscape';

import type { AttributeValue, SerializedElement } from '@/entities/graph';

function pickLabel(
    attributes: Record<string, AttributeValue>,
    fallback: string,
    ...keys: string[]
): string {
    for (const key of keys) {
        if (!Object.prototype.hasOwnProperty.call(attributes, key)) continue;
        const attr = attributes[key];
        if (attr.value !== '') return String(attr.value);
    }
    return fallback;
}

function findParentId(
    element: SerializedElement,
    getElementById: (id: string) => SerializedElement | undefined,
): string | undefined {
    // Cytoscape supports only a single compound parent per node; prefer a
    // metavertex parent since metaedges can't act as compound nodes.
    let parent: SerializedElement | undefined;
    for (const parentId of element.parents) {
        parent = getElementById(parentId);
        if (parent?.type === 'metavertex') return parentId;
    }
    return undefined;
}

export function buildCytoscapeElements(
    elements: SerializedElement[],
    getElementById: (id: string) => SerializedElement | undefined,
): ElementDefinition[] {
    const result: ElementDefinition[] = [];

    for (const el of elements) {
        switch (el.type) {
            case 'vertex':
            case 'metavertex':
                result.push({
                    group: 'nodes',
                    data: {
                        id: el.id,
                        label: pickLabel(
                            el.attributes,
                            el.id,
                            'name',
                            'label',
                            'title',
                        ),
                        elementType: el.type,
                        parent: findParentId(el, getElementById),
                    },
                    classes: el.type,
                });
                break;
            case 'edge':
            case 'metaedge': {
                if (!el.source || !el.target) break;
                // if (!byId.has(el.source) || !byId.has(el.target)) break;

                result.push({
                    group: 'edges',
                    data: {
                        id: el.id,
                        source: el.source,
                        target: el.target,
                        label: pickLabel(
                            el.attributes,
                            '',
                            'label',
                            'name',
                            'title',
                        ),
                        elementType: el.type,
                        directed: el.directed ?? false,
                    },
                    classes: [
                        el.type,
                        el.directed || el.type === 'metaedge'
                            ? 'directed'
                            : 'undirected',
                    ].join(' '),
                });
            }
        }
    }

    return result;
}
