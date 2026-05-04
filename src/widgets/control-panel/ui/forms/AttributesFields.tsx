import React, { useCallback, useState } from 'react';
import {
    useFieldArray,
    useFormState,
    type Control,
    type FieldValues,
    type Path,
    type UseFormRegister,
} from 'react-hook-form';

import type { AttributeType } from '@/entities/graph';
import { cn } from '@/shared/lib/cn';
import { Form } from '@/shared/ui/Form';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';
import Select from '@/shared/ui/Select/Select';

import type { AttributeFormField } from './types';
import { validateFloat, validateInt, validateString } from './validators';
import { ActionNames, useActivityLog } from '@/features/activity-log';

const formCn = cn('Form');

const ATTRIBUTE_TYPES: AttributeType[] = ['string', 'int', 'float'];
const VALIDATORS = {
    string: validateString,
    int: validateInt,
    float: validateFloat,
} as const;

const isReservedAttributeKey = (label: string) => label.trim() === 'name';

interface AttributesFieldsProps<T extends FieldValues> {
    control: Control<T>;
    register: UseFormRegister<T>;
    name: Path<T>;
}

export const AttributesFields = <T extends FieldValues>({
    control,
    register,
    name,
}: AttributesFieldsProps<T>) => {
    const log = useActivityLog();

    const { errors } = useFormState<T>({
        control,
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: name as never,
    });

    const [newLabel, setNewLabel] = useState('');
    const [newType, setNewType] = useState<AttributeType>('string');
    const [reservedKeyError, setReservedKeyError] = useState(false);

    const handleAdd = useCallback(() => {
        log(ActionNames.ADD_ATTRIBUTE, { label: newLabel, type: newType });

        const trimmed = newLabel.trim();
        if (!trimmed) return;
        if (isReservedAttributeKey(trimmed)) {
            setReservedKeyError(true);
            return;
        }
        setReservedKeyError(false);

        append({
            label: trimmed,
            type: newType,
            system: false,
            value: '',
        } as never);
        setNewLabel('');
        setNewType('string');
    }, [append, log, newLabel, newType]);

    const handleTypeChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setNewType(e.target.value as AttributeType);
        },
        [],
    );

    return (
        <>
            {fields.length > 0 && (
                <Form.Group>
                    {fields.map((field, index) => {
                        const attr = field as unknown as {
                            id: string;
                        } & AttributeFormField;

                        if (attr.system) {
                            return (
                                <Form.Field
                                    key={attr.id}
                                    label={attr.label}
                                    component={Input}
                                    size="s"
                                    placeholder={attr.type}
                                    disabled
                                    {...register(
                                        `${name}.${index}.value` as Path<T>,
                                    )}
                                />
                            );
                        }

                        return (
                            <React.Fragment key={attr.id}>
                                <label className={formCn('label')}>
                                    {attr.label}
                                </label>
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: 4,
                                        alignItems: 'center',
                                    }}
                                >
                                    <Input
                                        size="s"
                                        placeholder={attr.type}
                                        style={{ flex: 1, minWidth: 0 }}
                                        error={Boolean(
                                            // @ts-expect-error - Complicated acces to an error value
                                            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                                            errors[name]?.[index]?.value
                                                ?.message,
                                        )}
                                        {...register(
                                            `${name}.${index}.value` as Path<T>,
                                            {
                                                validate: VALIDATORS[attr.type],
                                            },
                                        )}
                                    />
                                    <Button
                                        type="button"
                                        size="s"
                                        variant="clear"
                                        onClick={() => remove(index)}
                                    >
                                        &times;
                                    </Button>
                                </div>
                            </React.Fragment>
                        );
                    })}
                </Form.Group>
            )}
            <Form.Group>
                <Form.Field
                    label="Название"
                    component={Input}
                    size="s"
                    error={reservedKeyError}
                    value={newLabel}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setReservedKeyError(false);
                        setNewLabel(e.target.value);
                    }}
                />
                <Form.Field
                    label="Тип"
                    component={Select}
                    size="s"
                    value={newType}
                    onChange={handleTypeChange}
                >
                    {ATTRIBUTE_TYPES.map((type) => (
                        <Select.Option key={type} value={type} />
                    ))}
                </Form.Field>
                <Button type="button" size="s" onClick={handleAdd}>
                    Добавить атрибут
                </Button>
            </Form.Group>
        </>
    );
};
