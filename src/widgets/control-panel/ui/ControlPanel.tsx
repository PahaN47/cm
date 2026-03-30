import { useEffect, useMemo, useRef } from 'react';
import { Controller, useForm, useFieldArray } from 'react-hook-form';

import { useGraphElement } from '@/entities/graph';
import type {
    AttributeType,
    AttributeValue,
    GraphElement,
} from '@/entities/graph';
import { useTabs } from '@/shared/lib';
import { cn } from '@/shared/lib/cn';
import { Form } from '@/shared/ui/Form';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';
import { Checkbox } from '@/shared/ui/Checkbox';
import { Radio } from '@/shared/ui/Radio';

import './ControlPanel.scss';

const b = cn('ControlPanel');

interface ElementFormValues {
    source: string;
    target: string;
    directed: boolean;
    attributes: {
        label: string;
        type: AttributeType;
        system: boolean;
        value: string;
    }[];
}

function buildDefaultValues(
    element:
        | {
              source?: string;
              target?: string;
              directed?: boolean;
              attributes: Record<string, AttributeValue>;
          }
        | undefined,
): ElementFormValues {
    if (!element)
        return { source: '', target: '', directed: false, attributes: [] };

    const attributes: ElementFormValues['attributes'] = [];
    for (const [key, attr] of Object.entries(element.attributes)) {
        attributes.push({
            label: key,
            type: attr.type,
            system: attr.system,
            value: String(attr.value),
        });
    }

    return {
        source: element.source ?? '',
        target: element.target ?? '',
        directed: element.directed ?? false,
        attributes,
    };
}

const ElementEditor = ({ elementId }: { elementId: string }) => {
    const { element, update } = useGraphElement(elementId);
    const isEdge = element?.type === 'edge' || element?.type === 'metaedge';

    const defaultValues = useMemo(() => buildDefaultValues(element), [element]);

    const { register, control, handleSubmit, reset } =
        useForm<ElementFormValues>({
            defaultValues,
        });

    const { fields } = useFieldArray({
        control,
        name: 'attributes',
    });

    const hasInitializedRef = useRef<boolean | null>(false);
    useEffect(() => {
        if (!hasInitializedRef.current) {
            hasInitializedRef.current = true;
        }

        reset(buildDefaultValues(element));
    }, [element, reset]);

    const onSubmit = useMemo(
        () =>
            element &&
            handleSubmit((data: ElementFormValues) => {
                console.log(data);

                const attributes: Record<string, AttributeValue> = {};
                for (const [key, attr] of Object.entries(element.attributes)) {
                    const raw = data.attributes.find(
                        (attr) => attr.label === key,
                    )?.value;
                    if (!raw) continue;

                    let value: string | number = raw;
                    if (attr.type === 'int') value = parseInt(raw, 10);
                    else if (attr.type === 'float') value = parseFloat(raw);
                    attributes[key] = { ...attr, value };
                }

                if (isEdge) {
                    update({
                        source: data.source,
                        target: data.target,
                        directed: data.directed,
                        attributes,
                    } as Partial<GraphElement>);
                } else {
                    update({ attributes });
                }
            }),
        [element, handleSubmit, isEdge, update],
    );

    if (!element) return null;

    return (
        <Form onSubmit={onSubmit}>
            <Form.Group>
                <Form.Field
                    label="ID"
                    component={Input}
                    size="s"
                    value={element.id}
                    disabled
                />
                <Form.Field
                    label="Type"
                    component={Input}
                    size="s"
                    value={element.type}
                    disabled
                />
            </Form.Group>
            {isEdge && (
                <Form.Group>
                    <Form.Field
                        label="Source"
                        component={Input}
                        size="s"
                        {...register('source')}
                    />
                    <Form.Field
                        label="Target"
                        component={Input}
                        size="s"
                        {...register('target')}
                    />
                    <Controller
                        name="directed"
                        control={control}
                        render={({ field }) => (
                            <Form.Field
                                label="Directed"
                                component={Checkbox}
                                size="s"
                                checked={field.value}
                                onChange={field.onChange}
                                disabled={element.type === 'metaedge'}
                            />
                        )}
                    />
                </Form.Group>
            )}
            {fields.length && (
                <Form.Group>
                    {fields.map((field, index) => (
                        <Form.Field
                            key={index}
                            label={field.label}
                            component={Input}
                            size="s"
                            placeholder={field.type}
                            disabled={field.system}
                            {...register(`attributes.${index}.value`)}
                        />
                    ))}
                </Form.Group>
            )}
            <Form.Group>
                <Button type="submit" size="s">
                    Apply
                </Button>
            </Form.Group>
        </Form>
    );
};

const FirstTab = ({
    selectedElementId,
}: {
    selectedElementId: string | null;
}) => {
    if (!selectedElementId) {
        return <div className={b('empty')}>Select an element to edit</div>;
    }
    return (
        <ElementEditor key={selectedElementId} elementId={selectedElementId} />
    );
};

const SecondTab = () => {
    const { register, control, handleSubmit } = useForm({
        defaultValues: {
            name: '',
            opacity: '',
            visible: true,
            blend: 'normal',
        },
    });

    const onSubmit = (data: Record<string, unknown>) => {
        console.log(data);
    };

    return (
        <Form onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
            <Form.Group>
                <Form.Field
                    label="Name"
                    component={Input}
                    size="s"
                    {...register('name')}
                />
                <Form.Field
                    label="Opacity"
                    component={Input}
                    size="s"
                    type="number"
                    {...register('opacity')}
                />
            </Form.Group>
            <Form.Group>
                <Form.Field
                    label="Visible"
                    component={Checkbox}
                    size="s"
                    {...register('visible')}
                />
            </Form.Group>
            <Form.Group>
                <Controller
                    name="blend"
                    control={control}
                    render={({ field }) => (
                        <Form.Field
                            label="Blend"
                            component={Radio}
                            size="s"
                            value={field.value}
                            onChange={field.onChange}
                        >
                            <Radio.Option value="normal">Normal</Radio.Option>
                            <Radio.Option value="multiply">
                                Multiply
                            </Radio.Option>
                            <Radio.Option value="screen">Screen</Radio.Option>
                        </Form.Field>
                    )}
                />
            </Form.Group>
            <Form.Group>
                <Button type="submit" size="s">
                    Save
                </Button>
            </Form.Group>
        </Form>
    );
};

interface ControlPanelProps {
    selectedElementId: string | null;
}

export const ControlPanel = ({ selectedElementId }: ControlPanelProps) => {
    const { TabControls, TabPanel } = useTabs({
        tabs: [
            {
                id: 'element',
                label: 'Element',
                component: <FirstTab selectedElementId={selectedElementId} />,
            },
            { id: 'second', label: 'Second', component: <SecondTab /> },
        ],
    });

    return (
        <div className={b()}>
            <TabControls />
            <TabPanel />
        </div>
    );
};
