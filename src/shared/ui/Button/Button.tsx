import React from 'react';

import { cn } from '@/shared/lib/cn';

import './Button.scss';

const b = cn('Button');

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'normal' | 'clear';
    size?: 's' | 'm' | 'l';
    color?: 'default' | 'accent';
}

const Button = ({
    variant = 'normal',
    size = 'm',
    color = 'default',
    className,
    children,
    ...rest
}: ButtonProps) => {
    return (
        <button className={b({ variant, size, color }, className)} {...rest}>
            {children}
        </button>
    );
};

export default Button;
