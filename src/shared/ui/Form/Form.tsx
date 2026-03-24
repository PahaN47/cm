import React from 'react';

import { cn } from '@/shared/lib/cn';

import './Form.scss';

const b = cn('Form');

// ── Divider ─────────────────────────────────────────────────────────────────

const FormDivider = () => <hr className={b('divider')} />;

// ── Field ───────────────────────────────────────────────────────────────────

type FormFieldProps<C extends React.ElementType> = {
    label: string;
    component: C;
} & Omit<React.ComponentPropsWithoutRef<C>, 'label' | 'component'>;

const FormField = <C extends React.ElementType>({
    label,
    component: Component,
    ...rest
}: FormFieldProps<C>) => {
    return (
        <>
            <span className={b('label')}>{label}</span>
            {/* Type safety is enforced at the call site via FormFieldProps<C> */}
            {React.createElement(Component, rest as never)}
        </>
    );
};

// ── Group ───────────────────────────────────────────────────────────────────

const FormGroup = ({ children }: React.PropsWithChildren) => {
    return <div className={b('group')}>{children}</div>;
};

// ── Form ────────────────────────────────────────────────────────────────────

interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
    className?: string;
}

const Form = ({ className, children, ...rest }: FormProps) => {
    const items = React.Children.toArray(children);

    return (
        <form className={b(null, className)} {...rest}>
            {items.map((child, i) => (
                <React.Fragment key={i}>
                    {i > 0 && <FormDivider />}
                    {child}
                </React.Fragment>
            ))}
        </form>
    );
};

Form.Field = FormField;
Form.Group = FormGroup;
Form.Divider = FormDivider;

export default Form;
