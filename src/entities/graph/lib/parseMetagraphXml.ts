import type {
    AttributeType,
    AttributeValue,
    Edge,
    GraphElement,
    MetaVertex,
    ParsedGraph,
    ParsedRelation,
} from '../model/types';

function parseAttributes(parent: Element): Record<string, AttributeValue> {
    const attrs: Record<string, AttributeValue> = {};

    for (const el of parent.children) {
        if (el.tagName !== 'Attribute') continue;

        const name = el.getAttribute('name')!;
        const type = el.getAttribute('type') as AttributeType;
        const system = el.getAttribute('system') === 'true';
        const raw = el.textContent ?? '';

        let value: string | number;
        if (type === 'int') value = parseInt(raw, 10);
        else if (type === 'float') value = parseFloat(raw);
        else value = raw;

        attrs[name] = { value, type, system };
    }

    return attrs;
}

function parseEdge(el: Element): Edge {
    const id = el.getAttribute('name')!;
    const directed = el.getAttribute('directed') === 'true';
    const source = el.querySelector(':scope > StartVertexRef')!.getAttribute('ref')!;
    const target = el.querySelector(':scope > EndVertexRef')!.getAttribute('ref')!;

    return {
        id,
        type: 'edge',
        directed,
        source,
        target,
        attributes: parseAttributes(el),
    };
}

function walkMetavertex(
    el: Element,
    parentId: string | null,
    elements: GraphElement[],
    relations: ParsedRelation[],
): void {
    const id = el.getAttribute('name')!;

    const mv: MetaVertex = {
        id,
        type: 'metavertex',
        attributes: parseAttributes(el),
    };
    elements.push(mv);

    if (parentId) {
        relations.push({ type: 'parentChildren', fromId: parentId, toId: id });
    }

    for (const child of el.children) {
        switch (child.tagName) {
            case 'Metavertex':
                walkMetavertex(child, id, elements, relations);
                break;

            case 'Edge':
                elements.push(parseEdge(child));
                break;

            case 'MetavertexInverseRef': {
                const ref = child.getAttribute('ref')!;
                relations.push({ type: 'parentChildren', fromId: ref, toId: id });
                break;
            }
        }
    }
}

export function parseMetagraphXml(xml: string): ParsedGraph {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');

    const parseError = doc.querySelector('parsererror');
    if (parseError) {
        throw new Error(`XML parse error: ${parseError.textContent}`);
    }

    const metagraph = doc.querySelector('Metagraph');
    if (!metagraph) {
        throw new Error('Missing <Metagraph> root element');
    }

    const elements: GraphElement[] = [];
    const relations: ParsedRelation[] = [];

    for (const child of metagraph.children) {
        if (child.tagName === 'Metavertex') {
            walkMetavertex(child, null, elements, relations);
        } else if (child.tagName === 'Edge') {
            elements.push(parseEdge(child));
        }
    }

    return { elements, relations };
}
