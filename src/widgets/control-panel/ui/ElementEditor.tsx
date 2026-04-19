import React, { useCallback, useState } from 'react';

import {
    useGraphElement,
    type ElementSnapshot,
    type ElementType,
    type GraphElement,
    type SerializedElement,
} from '@/entities/graph';
import { Form } from '@/shared/ui/Form';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';
import Select from '@/shared/ui/Select/Select';
import { ELEMENT_TYPES } from '@/shared/constants/graph';
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

// Capture an element's mutable, form-shaped state so that an `update` undo can
// replay it through the same path a user-driven submit would take.
function snapshotElement(element: SerializedElement): ElementSnapshot {
    const snap: ElementSnapshot = {
        attributes: element.attributes,
        children: element.children,
        parents: element.parents,
    };
    if (element.type === 'edge' || element.type === 'metaedge') {
        snap.source = element.source;
        snap.target = element.target;
        snap.directed = element.directed;
    }
    return snap;
}

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

    const { pushUndo } = useHistory();
    const log = useActivityLog();

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
            log(ActionNames.APPLY_ELEMENT, {
                id: element?.id,
                type: pendingType ?? element?.type,
                ...data,
            });

            if (!element) return;

            const prevType = element.type;
            const nextType: ElementType = pendingType ?? element.type;
            const isTypeChange = nextType !== prevType;
            const prevData = snapshotElement(element);

            if (isTypeChange) {
                changeType(nextType);
            }
            setPendingType(null);

            const { children, parents, ...patch } = data;
            // Non-meta types don't carry their own children; mirror that in
            // both the applied state and the action so undo/redo stay
            // symmetrical.
            const childrenToSet =
                nextType === 'metavertex' || nextType === 'metaedge'
                    ? children
                    : [];
            const appliedData: ElementSnapshot = {
                ...data,
                children: childrenToSet,
            };

            update(patch as Partial<GraphElement>);
            setRelations('childParents', parents);
            setRelations('parentChildren', childrenToSet);

            if (isTypeChange) {
                pushUndo({
                    type: 'change-type',
                    elementId: element.id,
                    prevType,
                    nextType,
                    data: appliedData,
                    prevData,
                });
            } else {
                pushUndo({
                    type: 'update',
                    elementId: element.id,
                    data: appliedData,
                    prevData,
                });
            }
        },
        [log, element, pendingType, update, setRelations, changeType, pushUndo],
    );

    const handleDelete = useCallback(() => {
        log(ActionNames.DELETE_ELEMENT, { id: element?.id });

        if (!element) {
            resetSelectedElement();
            return;
        }
        const data = snapshotElement(element);
        const elementType = element.type;
        const removedId = element.id;

        remove();
        pushUndo({
            type: 'remove',
            elementId: removedId,
            elementType,
            data,
        });
        resetSelectedElement();
    }, [log, element, remove, pushUndo, resetSelectedElement]);

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
                    label="Тип"
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
                    onClick={handleDelete}
                >
                    Удалить элемент
                </Button>
            </Form.Group>
        </>
    );
};
