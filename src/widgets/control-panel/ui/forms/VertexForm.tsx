import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { Form } from '@/shared/ui/Form';
import { Button } from '@/shared/ui/Button';

import { AttributesFields } from './AttributesFields';
import { RelationFields } from './RelationFields';
import { buildAttributeDefaults, parseFormAttributes } from './utils';
import type { AttributeFormField, ElementFormProps } from './types';

interface VertexFormValues {
    attributes: AttributeFormField[];
    children: string[];
    parents: string[];
}

export const VertexForm = ({
    element,
    parentOptions,
    onSubmit,
    submitLabel = 'Apply',
}: ElementFormProps) => {
    const defaultValues = useMemo<VertexFormValues>(
        () => ({
            attributes: buildAttributeDefaults(element),
            children: element.children,
            parents: element.parents,
        }),
        [element],
    );

    const { control, watch, register, handleSubmit, reset } =
        useForm<VertexFormValues>({ defaultValues });

    const parents = watch('parents');

    const filteredParentOptions = useMemo(() => {
        return parentOptions.filter((id) => !parents.includes(id));
    }, [parentOptions, parents]);

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
                        label="Parents"
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
