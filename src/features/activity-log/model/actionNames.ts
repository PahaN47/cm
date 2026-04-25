// Canonical set of activity action names. Add entries here as you wire up new
// tracked interactions, then reference them via `ActionNames.X` at the call
// site of `useActivityLog().log(...)`. Keeping them centralised makes it easy
// to grep for usages and avoid typos.
//
// The activity slice doesn't constrain `name` to this set, so this file is
// purely organisational — feel free to extend it freely.
export const ActionNames = {
    SELECT_ELEMENT: 'select-element',
    SELECT_ELEMENT_FROM_PARENT: 'select-element-from-parent',
    SELECT_ELEMENT_FROM_CHILD: 'select-element-from-child',
    SELECT_EDITOR_TAB: 'select-editor-tab',
    APPLY_ELEMENT: 'apply-element',
    CREATE_ELEMENT: 'create-element',
    DELETE_ELEMENT: 'delete-element',
    ADD_ATTRIBUTE: 'add-attribute',
    UNDO: 'undo',
    REDO: 'redo',
    UPDATE_FORM: 'update-form',
    UPDATE_FIELD: 'update-field',
    FOCUS_FIELD: 'focus-field',
} as const;

export type ActionName = (typeof ActionNames)[keyof typeof ActionNames];
