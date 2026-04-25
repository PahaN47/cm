import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { Form } from '@/shared/ui/Form';
import { Checkbox } from '@/shared/ui/Checkbox';
import { Button } from '@/shared/ui/Button';

import { AttributesFields } from './AttributesFields';
import { RelationFields } from './RelationFields';
import { buildAttributeDefaults, parseFormAttributes } from './utils';
import type { AttributeFormField, ElementFormProps } from './types';
import { FormHistoryWatch } from '@/shared/ui/FormHistoryWatch';
import { Select } from '@/shared/ui/Select';
import { useSelectedElementActions } from '@/features/element-selection';

interface MetaEdgeFormValues {
    source: string;
    target: string;
    attributes: AttributeFormField[];
    children: string[];
    parents: string[];
}

function buildDefaults(
    element: { source?: string; target?: string } & {
        attributes: Record<
            string,
            { type: string; system: boolean; value: string | number }
        >;
        children: string[];
        parents: string[];
    },
): MetaEdgeFormValues {
    return {
        source: element.source ?? '',
        target: element.target ?? '',
        attributes: buildAttributeDefaults(element as never),
        children: element.children,
        parents: element.parents,
    };
}

export const MetaEdgeForm = ({
    element,
    childrenOptions,
    parentOptions,
    vertexOptions,
    onSubmit,
    submitLabel = 'Применить',
}: ElementFormProps) => {
    const { setSelectedElementId } = useSelectedElementActions();

    const defaultValues = useMemo<MetaEdgeFormValues>(
        () => buildDefaults(element),
        [element],
    );

    const { control, watch, register, handleSubmit, reset, setValue } =
        useForm<MetaEdgeFormValues>({ defaultValues });

    const vertexOptionNodes = useMemo(
        () =>
            vertexOptions
                .filter((option) => option !== element.id)
                .map((option) => (
                    <Select.Option key={option}>{option}</Select.Option>
                )),
        [element.id, vertexOptions],
    );

    const children = watch('children');
    const parents = watch('parents');

    const filteredChildrenOptions = useMemo(() => {
        console.log({ childrenOptions, children });
        return childrenOptions.filter((id) => !children.includes(id));
    }, [childrenOptions, children]);

    const filteredParentOptions = useMemo(() => {
        return parentOptions.filter((id) => !parents.includes(id));
    }, [parentOptions, parents]);

    useEffect(() => {
        reset(buildDefaults(element));
    }, [element, reset]);

    const handleFormSubmit = useMemo(
        () =>
            handleSubmit((data) => {
                onSubmit({
                    source: data.source,
                    target: data.target,
                    directed: true,
                    attributes: parseFormAttributes(data.attributes),
                    children: data.children,
                    parents: data.parents,
                });
            }),
        [handleSubmit, onSubmit],
    );

    return (
        <Form onSubmit={handleFormSubmit}>
            <FormHistoryWatch
                control={control}
                setValue={setValue}
                elementId={element.id}
            />
            <Form.Group>
                <Controller
                    name="source"
                    control={control}
                    render={({ field }) => (
                        <div
                            style={{
                                display: 'grid',
                                gap: 8,
                                gridTemplateColumns: '108px auto min-content',
                                alignItems: 'center',
                            }}
                        >
                            <Form.Field
                                label="Источник"
                                component={Select}
                                size="s"
                                name={field.name}
                                value={field.value}
                                onChange={(
                                    e: React.ChangeEvent<HTMLInputElement>,
                                ) => field.onChange(e.target.value)}
                                onBlur={field.onBlur}
                            >
                                {vertexOptionNodes}
                            </Form.Field>
                            <Button
                                type="button"
                                size="s"
                                onClick={() =>
                                    setSelectedElementId(field.value)
                                }
                            >
                                {'>'}
                            </Button>
                        </div>
                    )}
                />
                <Controller
                    name="target"
                    control={control}
                    render={({ field }) => (
                        <div
                            style={{
                                display: 'grid',
                                gap: 8,
                                gridTemplateColumns: '108px auto min-content',
                                alignItems: 'center',
                            }}
                        >
                            <Form.Field
                                label="Цель"
                                component={Select}
                                size="s"
                                name={field.name}
                                value={field.value}
                                onChange={(
                                    e: React.ChangeEvent<HTMLInputElement>,
                                ) => field.onChange(e.target.value)}
                                onBlur={field.onBlur}
                            >
                                {vertexOptionNodes}
                            </Form.Field>
                            <Button
                                type="button"
                                size="s"
                                onClick={() =>
                                    setSelectedElementId(field.value)
                                }
                            >
                                {'>'}
                            </Button>
                        </div>
                    )}
                />
                <Form.Field
                    label="Направлен"
                    component={Checkbox}
                    size="s"
                    checked
                    disabled
                />
            </Form.Group>
            <AttributesFields
                control={control}
                register={register}
                name="attributes"
            />
            <Controller
                name="children"
                control={control}
                render={({ field }) => (
                    <RelationFields
                        type="children"
                        label="Потомки"
                        value={field.value}
                        onChange={field.onChange}
                        options={filteredChildrenOptions}
                        defaultCollapsed
                    />
                )}
            />
            <Controller
                name="parents"
                control={control}
                render={({ field }) => (
                    <RelationFields
                        type="parents"
                        label="Родители"
                        value={field.value}
                        onChange={field.onChange}
                        options={filteredParentOptions}
                    />
                )}
            />
            <Form.Group>
                <Button type="submit" size="s">
                    {submitLabel}
                </Button>
            </Form.Group>
        </Form>
    );
};
