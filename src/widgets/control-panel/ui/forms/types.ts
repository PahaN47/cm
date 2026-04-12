import type {
    AttributeType,
    AttributeValue,
    SerializedElement,
} from '@/entities/graph';

export interface AttributeFormField {
    label: string;
    type: AttributeType;
    system: boolean;
    value: string;
}

export interface ElementFormSubmitData {
    attributes: Record<string, AttributeValue>;
    children: string[];
    parents: string[];
    source?: string;
    target?: string;
    directed?: boolean;
}

export interface ElementFormProps {
    element: SerializedElement;
    childrenOptions: string[];
    parentOptions: string[];
    onSubmit: (data: ElementFormSubmitData) => void;
    submitLabel?: string;
}
