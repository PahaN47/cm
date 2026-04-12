import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { Form } from '@/shared/ui/Form';
import { Input } from '@/shared/ui/Input';
import { Checkbox } from '@/shared/ui/Checkbox';
import { Button } from '@/shared/ui/Button';

import { AttributesFields } from './AttributesFields';
import { RelationFields } from './RelationFields';
import { buildAttributeDefaults, parseFormAttributes } from './utils';
import type { AttributeFormField, ElementFormProps } from './types';

interface EdgeFormValues {
    source: string;
    target: string;
    directed: boolean;
    attributes: AttributeFormField[];
    children: string[];
    parents: string[];
}

function buildDefaults(
    element: { source?: string; target?: string; directed?: boolean } & {
        attributes: Record<
            string,
            { type: string; system: boolean; value: string | number }
        >;
        children: string[];
        parents: string[];
    },
): EdgeFormValues {
    return {
        source: element.source ?? '',
        target: element.target ?? '',
        directed: element.directed ?? false,
        attributes: buildAttributeDefaults(element as never),
        children: element.children,
        parents: element.parents,
    };
}

export const EdgeForm = ({
    element,
    parentOptions,
    onSubmit,
    submitLabel = 'Apply',
}: ElementFormProps) => {
    const defaultValues = useMemo<EdgeFormValues>(
        () => buildDefaults(element),
        [element],
    );

    const { control, watch, register, handleSubmit, reset } =
        useForm<EdgeFormValues>({
            defaultValues,
        });

    const parents = watch('parents');

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
                    directed: data.directed,
                    attributes: parseFormAttributes(data.attributes),
                    children: data.children,
                    parents: data.parents,
                });
            }),
        [handleSubmit, onSubmit],
    );

    return (
        <Form onSubmit={handleFormSubmit}>
            <Form.Group>
                <Form.Field
                    label="Source"
                    component={Input}
                    size="s"
                    {...register('source')}
                />
                <Form.Field
                    label="Target"
                    component={Input}
                    size="s"
                    {...register('target')}
                />
                <Controller
                    name="directed"
                    control={control}
                    render={({ field }) => (
                        <Form.Field
                            label="Directed"
                            component={Checkbox}
                            size="s"
                            checked={field.value}
                            onChange={field.onChange}
                        />
                    )}
                />
            </Form.Group>
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
