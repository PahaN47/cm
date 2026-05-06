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
    vertexOptions,
    onSubmit,
    submitLabel = 'Применить',
}: ElementFormProps) => {
    const { setSelectedElementId } = useSelectedElementActions();

    const defaultValues = useMemo<EdgeFormValues>(
        () => buildDefaults(element),
        [element],
    );

    const { control, watch, register, handleSubmit, reset, setValue } =
        useForm<EdgeFormValues>({
            defaultValues,
            mode: 'onTouched',
        });

    const endpointRules = {
        validate: (v: string) =>
            v.trim() !== '' || 'Выберите вершину',
    } as const;

    const vertexOptionNodes = useMemo(
        () =>
            vertexOptions
                .filter(({ id }) => id !== element.id)
                .map(({ id, name }) => (
                    <Select.Option key={id} value={id}>
                        {name}
                    </Select.Option>
                )),
        [vertexOptions, element.id],
    );

    const parents = watch('parents');

    const filteredParentOptions = useMemo(
        () => parentOptions.filter(({ id }) => !parents.includes(id)),
        [parentOptions, parents],
    );

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
            <FormHistoryWatch
                control={control}
                setValue={setValue}
                elementId={element.id}
            />
            <Form.Group>
                <Controller
                    name="source"
                    control={control}
                    rules={endpointRules}
                    render={({ field, fieldState }) => (
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
                                error={Boolean(fieldState.error)}
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
                    rules={endpointRules}
                    render={({ field, fieldState }) => (
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
                                error={Boolean(fieldState.error)}
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
                    name="directed"
                    control={control}
                    render={({ field }) => (
                        <Form.Field
                            label="Направлен"
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
