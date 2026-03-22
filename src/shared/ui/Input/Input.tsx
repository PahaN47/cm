import React from 'react';

import { cn } from '@/shared/lib/cn';

import './Input.scss';

const i = cn('Input');

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    variant?: 'normal' | 'clear';
    size?: 's' | 'm' | 'l';
    color?: 'default' | 'accent';
    error?: boolean;
}

const Input = ({
    variant = 'normal',
    size = 'm',
    color = 'default',
    error,
    className,
    ...rest
}: InputProps) => {
    return (
        <input className={i({ variant, size, color, error }, className)} {...rest} />
    );
};

export default Input;
