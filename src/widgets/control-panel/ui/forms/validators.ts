export const validateString = (value: unknown) =>
    typeof value === 'string' ? true : 'Invalid string';
export const validateInt = (value: unknown) =>
    Number(value) == value && Number.isInteger(Number(value))
        ? true
        : 'Invalid int';
export const validateFloat = (value: unknown) =>
    Number(value) == value ? true : 'Invalid float';
export const validateRequired = (value: unknown) =>
    value !== undefined && value !== null && value !== '' ? true : 'Required';
