import React from 'react';

import { cn } from '@/shared/lib/cn';

import './Input.scss';

const i = cn('Input');

export interface InputProps extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'size'
> {
    size?: 's' | 'm' | 'l';
    color?: 'default' | 'accent';
    error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ size = 'm', color = 'default', error, className, ...rest }, ref) => {
        return (
            <input
                ref={ref}
                className={i({ size, color, error }, className)}
                {...rest}
            />
        );
    },
);

Input.displayName = 'Input';

export default Input;
