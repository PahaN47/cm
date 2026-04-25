import React, { useCallback, useMemo, useState } from 'react';

import {
    buildGraphElement,
    useGraphState,
    useGraphStore,
    type ElementType,
    type SerializedElement,
} from '@/entities/graph';
import { ELEMENT_TYPES } from '@/shared/constants/graph';
import { Form } from '@/shared/ui/Form';
import { Input } from '@/shared/ui/Input';
import Select from '@/shared/ui/Select/Select';
import { useHistory } from '@/features/history';

import {
    VertexForm,
    EdgeForm,
    MetaVertexForm,
    MetaEdgeForm,
    type ElementFormProps,
    type ElementFormSubmitData,
} from './forms';
import { ActionNames, useActivityLog } from '@/features/activity-log';

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

interface ElementCreatorProps {
    onSubmit?: (elementId: string) => void;
}

export const ElementCreator = ({ onSubmit }: ElementCreatorProps) => {
    const store = useGraphStore();
    const elements = useGraphState();
    const { pushUndo } = useHistory();
    const log = useActivityLog();

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

    const vertices = useGraphState('vertex');
    const metavertices = useGraphState('metavertex');

    const vertexOptions = useMemo(() => {
        return [...vertices, ...metavertices].map(({ id }) => id);
    }, [vertices, metavertices]);

    const [id, setId] = useState('');
    const [idError, setIdError] = useState(false);
    const [type, setType] = useState<ElementType>('vertex');
    const [formKey, setFormKey] = useState(0);

    const emptyElement = useMemo(() => buildEmptyElement(type), [type]);

    const handleCreate = useCallback(
        (data: ElementFormSubmitData) => {
            const trimmedId = id.trim();

            const existingElement = store.getElement(trimmedId);
            if (existingElement) {
                setIdError(true);
                return;
            }

            log(ActionNames.CREATE_ELEMENT, { id: trimmedId, type, ...data });

            if (!trimmedId) return;

            store.addElement(buildGraphElement(trimmedId, type, data));

            if (data.children.length) {
                store.setRelations('parentChildren', trimmedId, data.children);
            }
            if (data.parents.length) {
                store.setRelations('childParents', trimmedId, data.parents);
            }

            pushUndo({
                type: 'add',
                elementId: trimmedId,
                elementType: type,
                data,
            });

            setId('');
            setFormKey((k) => k + 1);
            onSubmit?.(trimmedId);
        },
        [log, id, store, type, pushUndo, onSubmit],
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
                    error={idError}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setId(e.target.value);
                        setIdError(false);
                    }}
                />
                <Form.Field
                    label="Тип"
                    component={Select}
                    size="s"
                    value={type}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setType(e.target.value as ElementType);
                    }}
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
                submitLabel="Создать"
                childrenOptions={childrenOptions}
                parentOptions={parentOptions}
                vertexOptions={vertexOptions}
            />
        </>
    );
};
