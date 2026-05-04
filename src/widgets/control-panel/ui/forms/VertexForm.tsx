import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { Form } from '@/shared/ui/Form';
import { Button } from '@/shared/ui/Button';

import { AttributesFields } from './AttributesFields';
import { RelationFields } from './RelationFields';
import { buildAttributeDefaults, parseFormAttributes } from './utils';
import type { AttributeFormField, ElementFormProps } from './types';
import { FormHistoryWatch } from '@/shared/ui/FormHistoryWatch';

interface VertexFormValues {
    attributes: AttributeFormField[];
    children: string[];
    parents: string[];
}

export const VertexForm = ({
    element,
    parentOptions,
    onSubmit,
    submitLabel = 'Применить',
}: ElementFormProps) => {
    const defaultValues = useMemo<VertexFormValues>(
        () => ({
            attributes: buildAttributeDefaults(element),
            children: element.children,
            parents: element.parents,
        }),
        [element],
    );

    const { control, watch, register, handleSubmit, reset, setValue } =
        useForm<VertexFormValues>({ defaultValues });

    const parents = watch('parents');

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
