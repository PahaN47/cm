import React, {
    forwardRef,
    useCallback,
    useMemo,
    useRef,
    useState,
} from 'react';

import { cn } from '@/shared/lib/cn';
import Input, { InputProps } from '../Input/Input';

import './Select.scss';

const b = cn('Select');

interface SelectOptionProps {
    value: string;
    children?: string;
}

const SelectOption = ({ value, children }: SelectOptionProps) => {
    return <option value={value}>{children}</option>;
};

type OptionElement = React.ReactElement<SelectOptionProps, typeof SelectOption>;

interface SelectProps extends InputProps {
    children: OptionElement[];
}

const Select = forwardRef<HTMLInputElement, SelectProps>(
    (
        { children, className, value, onChange, onFocus, onBlur, ...rest },
        ref,
    ) => {
        const [open, setOpen] = useState(false);
        const [filter, setFilter] = useState('');
        const innerRef = useRef<HTMLInputElement>(null);
        const inputRef = ref || innerRef;

        const options = useMemo(
            () =>
                (React.Children.toArray(children) as OptionElement[]).map(
                    (child) => ({
                        value: child.props.value,
                        label: child.props.children || child.props.value,
                    }),
                ),
            [children],
        );

        const filtered = useMemo(() => {
            if (!filter) return options;
            const lower = filter.toLowerCase();
            return options
                .filter(({ label }) => label.toLowerCase().includes(lower))
                .sort(
                    ({ label: a }, { label: b }) =>
                        a.indexOf(lower) - b.indexOf(lower),
                );
        }, [options, filter]);

        const handleFocus = useCallback(
            (e: React.FocusEvent<HTMLInputElement>) => {
                setOpen(true);
                setFilter('');
                onFocus?.(e);
            },
            [onFocus],
        );

        const handleBlur = useCallback(
            (e: React.FocusEvent<HTMLInputElement>) => {
                if (e.relatedTarget?.closest(`.${b()}`)) return;
                setOpen(false);
                setFilter('');
                onBlur?.(e);
            },
            [onBlur],
        );

        const handleInput = useCallback(
            (e: React.ChangeEvent<HTMLInputElement>) => {
                setFilter(e.target.value);
            },
            [],
        );

        const handleSelect = useCallback(
            (option: string) => {
                setOpen(false);
                setFilter('');
                innerRef.current?.blur();
                if (onChange) {
                    const nativeEvent = new Event('change', { bubbles: true });
                    Object.defineProperty(nativeEvent, 'target', {
                        value: { value: option },
                    });
                    onChange(
                        nativeEvent as unknown as React.ChangeEvent<HTMLInputElement>,
                    );
                }
            },
            [onChange],
        );

        const displayValue = open ? filter : String(value || '');

        return (
            <div
                className={b(null, className)}
                tabIndex={-1}
                onBlur={handleBlur}
            >
                <Input
                    {...rest}
                    ref={inputRef}
                    value={displayValue}
                    onChange={handleInput}
                    onFocus={handleFocus}
                    placeholder={
                        open
                            ? String(value || '') || rest.placeholder
                            : rest.placeholder
                    }
                />
                {open && filtered.length > 0 && (
                    <ul className={b('dropdown')}>
                        {filtered.map(({ value: option, label }) => (
                            <li
                                key={option}
                                className={b('option', {
                                    selected: option === value,
                                })}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => handleSelect(option)}
                            >
                                {label}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        );
    },
) as React.ForwardRefExoticComponent<
    SelectProps & React.RefAttributes<HTMLInputElement>
> & { Option: typeof SelectOption };

Select.displayName = 'Select';
Select.Option = SelectOption;

export default Select;
