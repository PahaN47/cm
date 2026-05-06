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
        const inputDomRef = useRef<HTMLInputElement | null>(null);

        const setInputRef = useCallback(
            (node: HTMLInputElement | null) => {
                inputDomRef.current = node;
                if (typeof ref === 'function') {
                    ref(node);
                } else if (ref != null) {
                    ref.current = node;
                }
            },
            [ref],
        );

        const options = useMemo(
            () =>
                (React.Children.toArray(children) as OptionElement[]).map(
                    (child) => ({
                        value: child.props.value,
                        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-conversion
                        label: String(
                            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                            child.props.children ?? child.props.value ?? '',
                        ),
                    }),
                ),
            [children],
        );

        const filtered = useMemo(() => {
            const trimmed = filter.trim();
            if (!trimmed) return options;
            const lower = trimmed.toLowerCase();
            return options
                .filter(({ label }) => label.toLowerCase().includes(lower))
                .sort((a, b) => {
                    const ia = a.label.toLowerCase().indexOf(lower);
                    const ib = b.label.toLowerCase().indexOf(lower);
                    return ia - ib;
                });
        }, [options, filter]);

        const displayTextForValue = useMemo(() => {
            const raw = String(value ?? '');
            if (!raw) return '';
            const row = options.find((o) => o.value === raw);
            return row?.label ?? raw;
        }, [options, value]);

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
                inputDomRef.current?.blur();
                onChange?.({
                    target: { value: option },
                    currentTarget: { value: option },
                } as React.ChangeEvent<HTMLInputElement>);
            },
            [onChange],
        );

        const displayValue = open ? filter : displayTextForValue;

        return (
            <div
                className={b(null, className)}
                tabIndex={-1}
                onBlur={handleBlur}
            >
                <Input
                    {...rest}
                    ref={setInputRef}
                    value={displayValue}
                    onChange={handleInput}
                    onFocus={handleFocus}
                    placeholder={
                        open
                            ? displayTextForValue || rest.placeholder
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
