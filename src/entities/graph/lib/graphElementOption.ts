import type { GraphElementOption, SerializedElement } from '../model/types';

function elementDisplayName(el: SerializedElement): string {
    const name = el.attributes.name;
    if (name !== undefined) {
        const s = String(name.value).trim();
        if (s.length > 0) return s;
    }
    return el.id;
}

/** Build one `{ id, name }` row for pickers (call inside `.map` on filtered element lists). */
export function serializedElementToGraphElementOption(
    el: SerializedElement,
): GraphElementOption {
    return {
        id: el.id,
        name: elementDisplayName(el),
    };
}
