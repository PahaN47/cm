import React from 'react';

import { cn } from '@/shared/lib/cn';

import './Radio.scss';

const b = cn('Radio');

interface RadioOptionProps {
    value: string;
    children: React.ReactNode;
    name?: string;
    selected?: boolean;
    disabled?: boolean;
    onChange?: () => void;
}

const RadioOption = ({
    value,
    children,
    name,
    selected,
    disabled,
    onChange,
}: RadioOptionProps) => {
    return (
        <label className={b('option', { selected, disabled })}>
            <input
                className={b('input')}
                type="radio"
                name={name}
                value={value}
                checked={selected}
                disabled={disabled}
                onChange={onChange}
            />
            {children}
        </label>
    );
};

type OptionElement = React.ReactElement<RadioOptionProps, typeof RadioOption>;

interface RadioProps<T extends string = string> {
    value?: T;
    name?: string;
    onChange?: (value: T) => void;
    size?: 's' | 'm' | 'l';
    color?: 'default' | 'accent';
    disabled?: boolean;
    className?: string;
    children: OptionElement | OptionElement[];
}

let radioId = 0;

const Radio = <T extends string = string>({
    value,
    name,
    onChange,
    size = 'm',
    color = 'default',
    disabled,
    className,
    children,
}: RadioProps<T>) => {
    const groupName = React.useMemo(() => name ?? `radio-${++radioId}`, [name]);

    const options = React.Children.map(children, (child) => {
        const optionValue = child.props.value;
        return React.cloneElement(child, {
            name: groupName,
            selected: optionValue === value,
            disabled,
            onChange: () => onChange?.(optionValue as T),
        });
    });

    return (
        <div
            className={b({ size, color, disabled }, className)}
            role="radiogroup"
        >
            {options}
        </div>
    );
};

Radio.Option = RadioOption;

export default Radio;
