import type { AttributeValue, SerializedElement } from '@/entities/graph';
import type { AttributeFormField } from './types';

export function buildAttributeDefaults(
    element: SerializedElement,
): AttributeFormField[] {
    return Object.entries(element.attributes).map(([key, attr]) => ({
        label: key,
        type: attr.type,
        system: attr.system,
        value: String(attr.value),
    }));
}

export function parseFormAttributes(
    formAttrs: AttributeFormField[],
): Record<string, AttributeValue> {
    const result: Record<string, AttributeValue> = {};
    for (const attr of formAttrs) {
        if (!attr.label.trim()) continue;

        let value: string | number = attr.value;
        if (attr.type === 'int') value = parseInt(attr.value, 10);
        else if (attr.type === 'float') value = parseFloat(attr.value);

        result[attr.label] = { type: attr.type, system: attr.system, value };
    }
    return result;
}
