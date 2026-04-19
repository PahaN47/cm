import type {
    AttributeType,
    ElementSnapshot,
    SerializedElement,
} from '@/entities/graph';

export interface AttributeFormField {
    label: string;
    type: AttributeType;
    system: boolean;
    value: string;
}

// Form-submit payload is structurally identical to a snapshot of an element's
// editable state, so we alias rather than duplicate.
export type ElementFormSubmitData = ElementSnapshot;

export interface ElementFormProps {
    element: SerializedElement;
    childrenOptions: string[];
    parentOptions: string[];
    onSubmit: (data: ElementFormSubmitData) => void;
    submitLabel?: string;
}
