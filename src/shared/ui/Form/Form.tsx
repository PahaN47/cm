import React, { useId } from 'react';

import { cn } from '@/shared/lib/cn';

import './Form.scss';

const b = cn('Form');

// ── Divider ─────────────────────────────────────────────────────────────────

const FormDivider = () => <hr className={b('divider')} />;

// ── Field ───────────────────────────────────────────────────────────────────

type FormFieldProps<C extends React.ElementType = React.ElementType> = {
    label: string;
    component: C;
} & Omit<React.ComponentPropsWithoutRef<C>, 'label' | 'component'>;

const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
    ({ label, component: Component, ...rest }, ref) => {
        const id = useId();

        return (
            <>
                <label className={b('label')} htmlFor={id}>
                    {label}
                </label>
                {/* Type safety is enforced at the call site via FormFieldProps<C> */}
                {React.createElement(Component, { ...rest, id, ref } as never)}
            </>
        );
    },
) as <C extends React.ElementType>(
    props: FormFieldProps<C>,
) => React.ReactElement;

// @ts-expect-error - We want to set the displayName after the forwardRef
FormField.displayName = 'Form.Field';

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
