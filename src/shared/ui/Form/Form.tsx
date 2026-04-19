import React, { useCallback, useEffect, useId, useMemo } from 'react';
import debounceUntyped from 'lodash/debounce';

import { cn } from '@/shared/lib/cn';
import { ActionNames, useActivityLog } from '@/features/activity-log';

import './Form.scss';

const b = cn('Form');

interface DebouncedFn<Args extends unknown[]> {
    (...args: Args): void;
    cancel: () => void;
    flush: () => void;
}

const debounce = debounceUntyped as <Args extends unknown[]>(
    fn: (...args: Args) => void,
    wait: number,
) => DebouncedFn<Args>;

const FIELD_CHANGE_DEBOUNCE_MS = 500;

// Best-effort extraction of the "current value" from whatever the wrapped
// component passes to its `onChange`. Covers DOM change events (Input,
// Checkbox, Textarea) and value-style callbacks (Select, custom inputs).
const extractChangeValue = (args: unknown[]): unknown => {
    const first = args[0];
    if (first && typeof first === 'object' && 'target' in first) {
        const target = (first as { target?: unknown }).target as
            | { value?: unknown; checked?: unknown; type?: string }
            | undefined;
        if (target) {
            if (target.type === 'checkbox' || target.type === 'radio') {
                return target.checked;
            }
            if ('value' in target) return target.value;
        }
    }
    return first;
};

// ── Divider ─────────────────────────────────────────────────────────────────

const FormDivider = () => <hr className={b('divider')} />;

// ── Field ───────────────────────────────────────────────────────────────────

type FormFieldProps<C extends React.ElementType = React.ElementType> = {
    label: string;
    component: C;
} & Omit<React.ComponentPropsWithoutRef<C>, 'label' | 'component'>;

const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
    ({ label, component: Component, name, onFocus, onChange, ...rest }, ref) => {
        const id = useId();
        const log = useActivityLog();

        const handleFocus = useCallback(
            (e: React.FocusEvent<HTMLInputElement>) => {
                log(ActionNames.FOCUS_FIELD, {
                    name: name as string | undefined,
                    label: label as string | undefined,
                });

                (
                    onFocus as
                        | React.FocusEventHandler<HTMLInputElement>
                        | undefined
                )?.(e);
            },
            [label, log, name, onFocus],
        );

        // Named fields are tracked by `FormHistoryWatch` via the form's value
        // diff, so we only emit a per-field change event for unnamed fields to
        // avoid double-logging. Debounce ensures we log the value the user
        // actually paused on, not every keystroke.
        const logFieldChange = useMemo(
            () =>
                debounce((value: unknown, timestamp: number) => {
                    log(
                        ActionNames.UPDATE_FIELD,
                        { label: label as string | undefined, value },
                        timestamp,
                    );
                }, FIELD_CHANGE_DEBOUNCE_MS),
            [log, label],
        );

        useEffect(() => () => logFieldChange.cancel(), [logFieldChange]);

        const handleChange = useCallback(
            (...args: unknown[]) => {
                if (!name) {
                    logFieldChange(extractChangeValue(args), Date.now());
                }

                (onChange as ((...args: unknown[]) => void) | undefined)?.(
                    ...args,
                );
            },
            [name, logFieldChange, onChange],
        );

        return (
            <>
                <label className={b('label')} htmlFor={id}>
                    {label}
                </label>
                {/* Type safety is enforced at the call site via FormFieldProps<C> */}
                {React.createElement(Component, {
                    ...rest,
                    id,
                    name: name as string | undefined,
                    onFocus: handleFocus,
                    onChange: handleChange,
                    ref,
                } as never)}
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
