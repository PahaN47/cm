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
    children: string;
}

const SelectOption = ({ children }: SelectOptionProps) => {
    return <option value={children}>{children}</option>;
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
                    (child) => child.props.children,
                ),
            [children],
        );

        const filtered = useMemo(() => {
            if (!filter) return options;
            const lower = filter.toLowerCase();
            return options
                .filter((o) => o.toLowerCase().includes(lower))
                .sort((a, b) => a.indexOf(lower) - b.indexOf(lower));
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
                        {filtered.map((option) => (
                            <li
                                key={option}
                                className={b('option', {
                                    selected: option === value,
                                })}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => handleSelect(option)}
                            >
                                {option}
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
