import React, { useCallback, useMemo, useState } from 'react';

import {
    buildGraphElement,
    useGraphState,
    useGraphStore,
    type ElementType,
    type SerializedElement,
} from '@/entities/graph';
import { serializedElementToGraphElementOption } from '@/entities/graph/lib/graphElementOption';
import { mergeNameIntoAttributes } from '@/entities/graph/lib/mergeNameIntoAttributes';
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

    const childrenOptions = useMemo(
        () => elements.map(serializedElementToGraphElementOption),
        [elements],
    );

    const parentOptions = useMemo(
        () =>
            elements
                .filter(
                    ({ type }) => type === 'metavertex' || type === 'metaedge',
                )
                .map(serializedElementToGraphElementOption),
        [elements],
    );

    const vertices = useGraphState('vertex');
    const metavertices = useGraphState('metavertex');

    const vertexOptions = useMemo(
        () =>
            [...vertices, ...metavertices].map(
                serializedElementToGraphElementOption,
            ),
        [vertices, metavertices],
    );

    const [name, setName] = useState('');
    const [type, setType] = useState<ElementType>('vertex');
    const [formKey, setFormKey] = useState(0);

    const emptyElement = useMemo(() => buildEmptyElement(type), [type]);

    const handleCreate = useCallback(
        (data: ElementFormSubmitData) => {
            const newId = crypto.randomUUID();
            const dataWithName: ElementFormSubmitData = {
                ...data,
                attributes: mergeNameIntoAttributes(
                    data.attributes,
                    name,
                ),
            };

            log(ActionNames.CREATE_ELEMENT, {
                id: newId,
                type,
                ...dataWithName,
            });

            store.addElement(buildGraphElement(newId, type, dataWithName));

            if (dataWithName.children.length) {
                store.setRelations('parentChildren', newId, dataWithName.children);
            }
            if (dataWithName.parents.length) {
                store.setRelations('childParents', newId, dataWithName.parents);
            }

            pushUndo({
                type: 'add',
                elementId: newId,
                elementType: type,
                data: dataWithName,
            });

            setName('');
            setFormKey((k) => k + 1);
            onSubmit?.(newId);
        },
        [log, name, store, type, pushUndo, onSubmit],
    );

    const FormComponent = FORM_MAP[type];

    return (
        <>
            <Form.Group>
                <Form.Field
                    label="Имя"
                    component={Input}
                    size="s"
                    value={name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setName(e.target.value);
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
                        <Select.Option key={t} value={t} />
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
