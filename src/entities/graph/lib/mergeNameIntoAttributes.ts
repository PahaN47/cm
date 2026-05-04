import type { AttributeValue } from '../model/types';

/** Merges the reserved `name` attribute (edited outside the generic attribute list). */
export function mergeNameIntoAttributes(
    attributes: Record<string, AttributeValue>,
    nameDisplayValue: string,
    existingName?: AttributeValue,
): Record<string, AttributeValue> {
    return {
        ...attributes,
        name: {
            type: existingName?.type ?? 'string',
            system: existingName?.system ?? false,
            value: nameDisplayValue.trim(),
        },
    };
}
