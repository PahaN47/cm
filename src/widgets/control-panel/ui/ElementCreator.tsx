import React, { useCallback, useMemo, useState } from 'react';

import {
    useGraphState,
    useGraphStore,
    type ElementType,
    type GraphElement,
    type SerializedElement,
} from '@/entities/graph';
import { ELEMENT_TYPES } from '@/shared/contants/graph';
import { Form } from '@/shared/ui/Form';
import { Input } from '@/shared/ui/Input';
import Select from '@/shared/ui/Select/Select';

import {
    VertexForm,
    EdgeForm,
    MetaVertexForm,
    MetaEdgeForm,
    type ElementFormProps,
    type ElementFormSubmitData,
} from './forms';

const FORM_MAP: Record<ElementType, React.ComponentType<ElementFormProps>> = {
    vertex: VertexForm,
    edge: EdgeForm,
    metavertex: MetaVertexForm,
    metaedge: MetaEdgeForm,
};

function buildEmptyElement(type: ElementType): SerializedElement {
    return {
        id: '',
        type,
        attributes: {},
        edges: [],
        children: [],
        parents: [],
        ...(type === 'edge' && { source: '', target: '', directed: false }),
        ...(type === 'metaedge' && { source: '', target: '', directed: true }),
    };
}

function buildGraphElement(
    id: string,
    type: ElementType,
    data: ElementFormSubmitData,
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

interface ElementCreatorProps {
    onSubmit?: (elementId: string) => void;
}

export const ElementCreator = ({ onSubmit }: ElementCreatorProps) => {
    const store = useGraphStore();
    const elements = useGraphState();

    const childrenOptions = useMemo(() => {
        return elements
            .filter(({ type }) => type !== 'vertex' && type !== 'edge')
            .map(({ id }) => id);
    }, [elements]);

    const parentOptions = useMemo(() => {
        return elements
            .filter(({ type }) => type === 'metavertex' || type === 'metaedge')
            .map(({ id }) => id);
    }, [elements]);

    const [id, setId] = useState('');
    const [type, setType] = useState<ElementType>('vertex');
    const [formKey, setFormKey] = useState(0);

    const emptyElement = useMemo(() => buildEmptyElement(type), [type]);

    const handleCreate = useCallback(
        (data: ElementFormSubmitData) => {
            const trimmedId = id.trim();
            if (!trimmedId) return;

            store.addElement(buildGraphElement(trimmedId, type, data));

            if (data.children.length) {
                store.setRelations('parentChildren', trimmedId, data.children);
            }
            if (data.parents.length) {
                store.setRelations('childParents', trimmedId, data.parents);
            }

            setId('');
            setFormKey((k) => k + 1);
            onSubmit?.(trimmedId);
        },
        [id, store, type, onSubmit],
    );

    const FormComponent = FORM_MAP[type];

    return (
        <>
            <Form.Group>
                <Form.Field
                    label="ID"
                    component={Input}
                    size="s"
                    value={id}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setId(e.target.value)
                    }
                />
                <Form.Field
                    label="Type"
                    component={Select}
                    size="s"
                    value={type}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setType(e.target.value as ElementType)
                    }
                >
                    {ELEMENT_TYPES.map((t) => (
                        <Select.Option key={t}>{t}</Select.Option>
                    ))}
                </Form.Field>
            </Form.Group>
            <Form.Divider />
            <FormComponent
                key={formKey}
                element={emptyElement}
                onSubmit={handleCreate}
                submitLabel="Create"
                childrenOptions={childrenOptions}
                parentOptions={parentOptions}
            />
        </>
    );
};
