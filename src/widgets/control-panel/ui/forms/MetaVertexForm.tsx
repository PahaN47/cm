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
    submitLabel = 'Apply',
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

    const filteredChildrenOptions = useMemo(() => {
        return childrenOptions.filter((id) => !children.includes(id));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [childrenOptions, children, children.length]);

    const filteredParentOptions = useMemo(() => {
        return parentOptions.filter((id) => !parents.includes(id));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [parentOptions, parents, parents.length]);

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
                        label="Children"
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
