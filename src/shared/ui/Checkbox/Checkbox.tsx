import React from 'react';

import { cn } from '@/shared/lib/cn';

import './Checkbox.scss';

const b = cn('Checkbox');

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
    size?: 's' | 'm' | 'l';
    color?: 'default' | 'accent';
}

const Checkbox = ({
    size = 'm',
    color = 'default',
    className,
    disabled,
    ...rest
}: CheckboxProps) => {
    return (
        <label className={b({ size, color, disabled }, className)}>
            <input className={b('input')} type="checkbox" disabled={disabled} {...rest} />
            <span className={b('box')}>
                <span className={b('checkmark')} />
            </span>
        </label>
    );
};

export default Checkbox;
