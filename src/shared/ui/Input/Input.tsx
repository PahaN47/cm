import React from 'react';

import { cn } from '@/shared/lib/cn';

import './Input.scss';

const i = cn('Input');

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    size?: 's' | 'm' | 'l';
    color?: 'default' | 'accent';
    error?: boolean;
}

const Input = ({
    size = 'm',
    color = 'default',
    error,
    className,
    ...rest
}: InputProps) => {
    return (
        <input className={i({ size, color, error }, className)} {...rest} />
    );
};

export default Input;
