import type { ElementDefinition } from 'cytoscape';

import type { AttributeValue, SerializedElement } from '@/entities/graph';

// Synthetic edges that visualise extra parent links get this id prefix so they
// can't collide with real element ids and so the tap handler can tell them
// apart.
const MEMBERSHIP_ID_PREFIX = '__membership__::';

// Metaedges are projected as a node + two endpoint edges ("s → M" and
// "M → t"). The endpoint edges use these prefixes so we can resolve taps and
// selection highlights back to the metaedge they belong to.
const METAEDGE_SOURCE_ID_PREFIX = '__metaedge_source__::';
const METAEDGE_TARGET_ID_PREFIX = '__metaedge_target__::';

export function isMembershipEdgeId(id: string): boolean {
    return id.startsWith(MEMBERSHIP_ID_PREFIX);
}

function membershipEdgeId(childId: string, parentId: string): string {
    return `${MEMBERSHIP_ID_PREFIX}${childId}::${parentId}`;
}

export function metaedgeSourceEdgeId(metaedgeId: string): string {
    return `${METAEDGE_SOURCE_ID_PREFIX}${metaedgeId}`;
}

export function metaedgeTargetEdgeId(metaedgeId: string): string {
    return `${METAEDGE_TARGET_ID_PREFIX}${metaedgeId}`;
}

export function metaedgeIdFromSyntheticEdgeId(id: string): string | null {
    if (id.startsWith(METAEDGE_SOURCE_ID_PREFIX)) {
        return id.slice(METAEDGE_SOURCE_ID_PREFIX.length);
    }
    if (id.startsWith(METAEDGE_TARGET_ID_PREFIX)) {
        return id.slice(METAEDGE_TARGET_ID_PREFIX.length);
    }
    return null;
}

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

function nodeLabelOf(element: SerializedElement): string {
    // Metaedges are semantically edges; prefer the edge-flavoured `label`
    // attribute first. Vertices/metavertices prefer `name`.
    if (element.type === 'metaedge') {
        return pickLabel(
            element.attributes,
            element.id,
            'label',
            'name',
            'title',
        );
    }
    return pickLabel(element.attributes, element.id, 'name', 'label', 'title');
}

// Resolve the parents of `element` down to the subset that can actually act as
// containers in our model (metavertex or metaedge) and still exist in the
// graph. Order is preserved from `element.parents`.
function collectMetaParents(
    element: SerializedElement,
    getElementById: (id: string) => SerializedElement | undefined,
): SerializedElement[] {
    const parents: SerializedElement[] = [];
    for (const parentId of element.parents) {
        if (parentId === element.id) continue;
        const parent = getElementById(parentId);
        if (!parent) continue;
        if (parent.type !== 'metavertex' && parent.type !== 'metaedge') continue;
        parents.push(parent);
    }
    return parents;
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
            case 'metaedge': {
                const parents = collectMetaParents(el, getElementById);

                // First eligible parent becomes the Cytoscape compound parent;
                // remaining ones are rendered as membership overlay edges.
                // Metaedge-nodes participate in both roles on equal footing
                // with metavertices.
                const compoundParentId =
                    parents.length > 0 ? parents[0].id : undefined;
                const extraParents = parents.slice(1);

                result.push({
                    group: 'nodes',
                    data: {
                        id: el.id,
                        label: nodeLabelOf(el),
                        elementType: el.type,
                        parent: compoundParentId,
                    },
                    classes: el.type,
                });

                for (const parent of extraParents) {
                    result.push({
                        group: 'edges',
                        data: {
                            id: membershipEdgeId(el.id, parent.id),
                            source: el.id,
                            target: parent.id,
                            elementType: 'membership',
                        },
                        classes: 'membership',
                    });
                }

                if (el.type === 'metaedge' && el.source && el.target) {
                    const directed = el.directed ?? true;

                    result.push({
                        group: 'edges',
                        data: {
                            id: metaedgeSourceEdgeId(el.id),
                            source: el.source,
                            target: el.id,
                            elementType: 'metaedge-endpoint',
                            metaedgeId: el.id,
                        },
                        classes: 'metaedge metaedge-endpoint metaedge-source',
                    });

                    result.push({
                        group: 'edges',
                        data: {
                            id: metaedgeTargetEdgeId(el.id),
                            source: el.id,
                            target: el.target,
                            elementType: 'metaedge-endpoint',
                            metaedgeId: el.id,
                        },
                        classes: [
                            'metaedge',
                            'metaedge-endpoint',
                            'metaedge-target',
                            directed ? 'directed' : 'undirected',
                        ].join(' '),
                    });
                }
                break;
            }
            case 'edge': {
                if (!el.source || !el.target) break;

                const parents = collectMetaParents(el, getElementById);
                const baseLabel = pickLabel(
                    el.attributes,
                    '',
                    'label',
                    'name',
                    'title',
                );
                const label =
                    parents.length === 0
                        ? baseLabel
                        : `${baseLabel ? `${baseLabel} ` : ''}∈ ${parents
                              .map((p) => nodeLabelOf(p))
                              .join(', ')}`;

                result.push({
                    group: 'edges',
                    data: {
                        id: el.id,
                        source: el.source,
                        target: el.target,
                        label,
                        elementType: el.type,
                        directed: el.directed ?? false,
                    },
                    classes: [
                        'edge',
                        el.directed ? 'directed' : 'undirected',
                    ].join(' '),
                });
                break;
            }
        }
    }

    return result;
}
