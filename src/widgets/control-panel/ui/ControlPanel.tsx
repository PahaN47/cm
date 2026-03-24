import { Controller, useForm } from 'react-hook-form';

import { useTabs } from '@/shared/lib';
import { cn } from '@/shared/lib/cn';
import { Form } from '@/shared/ui/Form';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';
import { Checkbox } from '@/shared/ui/Checkbox';
import { Radio } from '@/shared/ui/Radio';

import './ControlPanel.scss';

const b = cn('ControlPanel');

const FirstTab = () => {
    const { register, control, handleSubmit } = useForm({
        defaultValues: {
            width: '',
            height: '',
            scale: '',
            lock: false,
            fit: 'fill',
        },
    });

    const onSubmit = (data: Record<string, unknown>) => {
        console.log(data);
    };

    return (
        <Form onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
            <Form.Group>
                <Form.Field label="Width" component={Input} size="s" {...register('width')} />
                <Form.Field label="Height" component={Input} size="s" {...register('height')} />
                <Form.Field label="Scale" component={Input} size="s" {...register('scale')} />
            </Form.Group>
            <Form.Group>
                <Form.Field label="Lock" component={Checkbox} size="s" {...register('lock')} />
            </Form.Group>
            <Form.Group>
                <Controller
                    name="fit"
                    control={control}
                    render={({ field }) => (
                        <Form.Field
                            label="Fit"
                            component={Radio}
                            size="s"
                            value={field.value}
                            onChange={field.onChange}
                        >
                            <Radio.Option value="fill">Fill</Radio.Option>
                            <Radio.Option value="contain">Contain</Radio.Option>
                            <Radio.Option value="cover">Cover</Radio.Option>
                        </Form.Field>
                    )}
                />
            </Form.Group>
            <Form.Group>
                <Button type="submit" size="s">
                    Apply
                </Button>
            </Form.Group>
        </Form>
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
                <Form.Field label="Name" component={Input} size="s" {...register('name')} />
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
                            <Radio.Option value="multiply">Multiply</Radio.Option>
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

export const ControlPanel = () => {
    const { TabControls, TabPanel } = useTabs({
        tabs: [
            { id: 'first', label: 'First', component: <FirstTab /> },
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
