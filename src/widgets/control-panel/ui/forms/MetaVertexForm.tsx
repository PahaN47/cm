import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { Form } from '@/shared/ui/Form';
import { Button } from '@/shared/ui/Button';

import { AttributesFields } from './AttributesFields';
import { RelationFields } from './RelationFields';
import { buildAttributeDefaults, parseFormAttributes } from './utils';
import type { AttributeFormField, ElementFormProps } from './types';
import { FormHistoryWatch } from '@/shared/ui/FormHistoryWatch';

interface MetaVertexFormValues {
    attributes: AttributeFormField[];
    children: string[];
    parents: string[];
}

export const MetaVertexForm = ({
    element,
    childrenOptions,
    parentOptions,
    onSubmit,
    submitLabel = 'Применить',
}: ElementFormProps) => {
    const defaultValues = useMemo<MetaVertexFormValues>(
        () => ({
            attributes: buildAttributeDefaults(element),
            children: element.children,
            parents: element.parents,
        }),
        [element],
    );

    const { control, watch, register, handleSubmit, reset, setValue } =
        useForm<MetaVertexFormValues>({ defaultValues });

    const children = watch('children');
    const parents = watch('parents');

    const filteredChildrenOptions = useMemo(
        () => childrenOptions.filter(({ id }) => !children.includes(id)),
        [childrenOptions, children],
    );

    const filteredParentOptions = useMemo(
        () => parentOptions.filter(({ id }) => !parents.includes(id)),
        [parentOptions, parents],
    );

    useEffect(() => {
        reset({
            attributes: buildAttributeDefaults(element),
            children: element.children,
            parents: element.parents,
        });
    }, [element, reset]);

    const handleFormSubmit = useMemo(
        () =>
            handleSubmit((data) => {
                onSubmit({
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
                        allOptions={childrenOptions}
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
                        allOptions={parentOptions}
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
