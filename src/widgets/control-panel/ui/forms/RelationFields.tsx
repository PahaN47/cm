import React, { useCallback, useState } from 'react';

import { cn } from '@/shared/lib/cn';
import { Form } from '@/shared/ui/Form';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';
import { Select } from '@/shared/ui/Select';
import { InputProps } from '@/shared/ui/Input/Input';
import { useSelectedElementActions } from '@/features/element-selection';
import { ActionNames, useActivityLog } from '@/features/activity-log';

const formCn = cn('Form');

interface RelationFieldsProps {
    type: 'parents' | 'children';
    label: string;
    value: string[];
    onChange: (ids: string[]) => void;
    options?: string[];
    defaultCollapsed?: boolean;
}

export const RelationFields = ({
    type,
    label,
    value,
    onChange,
    options,
    defaultCollapsed = false,
}: RelationFieldsProps) => {
    const log = useActivityLog();
    const { setSelectedElementId } = useSelectedElementActions();

    const [collapsed, setCollapsed] = useState(defaultCollapsed);
    const [newId, setNewId] = useState('');

    const handleAdd = useCallback(() => {
        const trimmed = newId.trim();

        if (!trimmed || value.includes(trimmed)) return;
        onChange([...value, trimmed]);
        setNewId('');
    }, [newId, value, onChange]);

    const handleRemove = useCallback(
        (id: string) => {
            onChange(value.filter((v) => v !== id));
        },
        [onChange, value],
    );

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setNewId(e.target.value);
        },
        [],
    );

    const toggleCollapsed = useCallback(() => {
        setCollapsed((prev) => !prev);
    }, []);

    const renderInput = () => {
        const baseProps: InputProps = {
            size: 's',
            value: newId,
            onChange: handleInputChange,
            placeholder: 'ID элемента',
            style: { flex: 1, minWidth: 0 },
        };

        if (!options) {
            return <Input {...baseProps} />;
        }

        return (
            <Select {...baseProps}>
                {options.map((option) => (
                    <Select.Option key={option}>{option}</Select.Option>
                ))}
            </Select>
        );
    };

    return (
        <>
            <label
                className={formCn('label')}
                onClick={toggleCollapsed}
                style={{ cursor: 'pointer', userSelect: 'none' }}
            >
                {collapsed ? '▸' : '▾'} {label}
                {collapsed && value.length > 0 && ` (${value.length})`}
            </label>
            {!collapsed && (
                <>
                    {value.length > 0 && (
                        <Form.Group>
                            {value.map((id) => (
                                <div
                                    key={id}
                                    style={{
                                        display: 'flex',
                                        gap: 4,
                                        alignItems: 'center',
                                    }}
                                >
                                    <Button
                                        type="button"
                                        size="s"
                                        variant="normal"
                                        style={{ flexGrow: 1 }}
                                        onClick={() => {
                                            log(
                                                type === 'parents'
                                                    ? ActionNames.SELECT_ELEMENT_FROM_PARENT
                                                    : ActionNames.SELECT_ELEMENT_FROM_CHILD,
                                                { id },
                                            );
                                            setSelectedElementId(id);
                                        }}
                                    >
                                        {id}
                                    </Button>
                                    <Button
                                        type="button"
                                        size="s"
                                        variant="clear"
                                        onClick={() => handleRemove(id)}
                                    >
                                        &times;
                                    </Button>
                                </div>
                            ))}
                        </Form.Group>
                    )}
                    <Form.Group>
                        <div
                            style={{
                                display: 'flex',
                                gap: 4,
                                alignItems: 'center',
                            }}
                        >
                            {renderInput()}
                            <Button type="button" size="s" onClick={handleAdd}>
                                Добавить
                            </Button>
                        </div>
                    </Form.Group>
                </>
            )}
        </>
    );
};
