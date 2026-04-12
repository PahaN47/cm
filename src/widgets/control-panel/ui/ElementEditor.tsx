import React, { useCallback, useState } from 'react';

import {
    useGraphElement,
    type ElementType,
    type GraphElement,
} from '@/entities/graph';
import { Form } from '@/shared/ui/Form';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';
import Select from '@/shared/ui/Select/Select';
import { ELEMENT_TYPES } from '@/shared/contants/graph';

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

export const ElementEditor = ({
    elementId,
    resetSelectedElement,
}: {
    elementId: string;
    resetSelectedElement: () => void;
}) => {
    const {
        element,
        availableChildren,
        availableParents,
        update,
        remove,
        changeType,
        setRelations,
    } = useGraphElement(elementId);

    const [pendingType, setPendingType] = useState<ElementType | null>(null);

    const displayType = pendingType ?? element?.type;

    const handleTypeChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setPendingType(e.target.value as ElementType);
        },
        [],
    );

    const handleFormSubmit = useCallback(
        (data: ElementFormSubmitData) => {
            if (pendingType && element && pendingType !== element.type) {
                changeType(pendingType);
            }
            setPendingType(null);

            const { children, parents, ...patch } = data;
            const chilrenToSet =
                pendingType === 'metavertex' || pendingType === 'metaedge'
                    ? children
                    : [];
            update(patch as Partial<GraphElement>);
            setRelations('childParents', parents);
            setRelations('parentChildren', chilrenToSet);
        },
        [pendingType, element, changeType, update, setRelations],
    );

    if (!element || !displayType) return null;

    const FormComponent = FORM_MAP[displayType];

    return (
        <>
            <Form.Group>
                <Form.Field
                    label="ID"
                    component={Input}
                    size="s"
                    value={element.id}
                    disabled
                />
                <Form.Field
                    label="Type"
                    component={Select}
                    size="s"
                    value={displayType}
                    onChange={handleTypeChange}
                >
                    {ELEMENT_TYPES.map((type) => (
                        <Select.Option key={type}>{type}</Select.Option>
                    ))}
                </Form.Field>
            </Form.Group>
            <Form.Divider />
            <FormComponent
                element={element}
                onSubmit={handleFormSubmit}
                childrenOptions={availableChildren}
                parentOptions={availableParents}
            />
            <Form.Divider />
            <Form.Group>
                <Button
                    type="button"
                    size="s"
                    variant="clear"
                    color="accent"
                    onClick={() => {
                        remove();
                        resetSelectedElement();
                    }}
                >
                    Delete element
                </Button>
            </Form.Group>
        </>
    );
};
