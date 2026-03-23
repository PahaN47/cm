import { useState } from 'react';

import { Layout } from '@/shared/ui/Layout';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Checkbox } from '@/shared/ui/Checkbox';
import { Radio } from '@/shared/ui/Radio';

export const HomePage = () => {
    const [radioValue, setRadioValue] = useState('one');

    return (
        <Layout>
            <Layout.Panel row={[1, 10]} col={[1, 8]}>
                <Button size="s">Normal S</Button>
                <Button size="m">Normal M</Button>
                <Button size="l">Normal L</Button>
                <Button variant="clear" size="s">Clear S</Button>
                <Button variant="clear" size="m">Clear M</Button>
                <Button variant="clear" size="l">Clear L</Button>
                <Button color="accent" size="s">Accent S</Button>
                <Button color="accent" size="m">Accent M</Button>
                <Button color="accent" size="l">Accent L</Button>
                <Button color="accent" variant="clear" size="s">Accent Clear S</Button>
                <Button color="accent" variant="clear" size="m">Accent Clear M</Button>
                <Button color="accent" variant="clear" size="l">Accent Clear L</Button>
                <Input size="s" placeholder="Default S" />
                <Input size="m" placeholder="Default M" />
                <Input size="l" placeholder="Default L" />
                <Input color="accent" size="s" placeholder="Accent S" />
                <Input color="accent" size="m" placeholder="Accent M" />
                <Input color="accent" size="l" placeholder="Accent L" />
                <Input error size="m" placeholder="Error" />
                <Checkbox size="s" />
                <Checkbox size="m" />
                <Checkbox size="l" />
                <Checkbox color="accent" size="s" />
                <Checkbox color="accent" size="m" />
                <Checkbox color="accent" size="l" />
                <Radio value={radioValue} onChange={setRadioValue} size="s">
                    <Radio.Option value="one">One</Radio.Option>
                    <Radio.Option value="two">Two</Radio.Option>
                    <Radio.Option value="three">Three</Radio.Option>
                </Radio>
                <Radio value={radioValue} onChange={setRadioValue} size="m">
                    <Radio.Option value="one">One</Radio.Option>
                    <Radio.Option value="two">Two</Radio.Option>
                    <Radio.Option value="three">Three</Radio.Option>
                </Radio>
                <Radio value={radioValue} onChange={setRadioValue} size="l">
                    <Radio.Option value="one">One</Radio.Option>
                    <Radio.Option value="two">Two</Radio.Option>
                    <Radio.Option value="three">Three</Radio.Option>
                </Radio>
                <Radio value={radioValue} onChange={setRadioValue} color="accent" size="s">
                    <Radio.Option value="one">One</Radio.Option>
                    <Radio.Option value="two">Two</Radio.Option>
                    <Radio.Option value="three">Three</Radio.Option>
                </Radio>
                <Radio value={radioValue} onChange={setRadioValue} color="accent" size="m">
                    <Radio.Option value="one">One</Radio.Option>
                    <Radio.Option value="two">Two</Radio.Option>
                    <Radio.Option value="three">Three</Radio.Option>
                </Radio>
                <Radio value={radioValue} onChange={setRadioValue} color="accent" size="l">
                    <Radio.Option value="one">One</Radio.Option>
                    <Radio.Option value="two">Two</Radio.Option>
                    <Radio.Option value="three">Three</Radio.Option>
                </Radio>
            </Layout.Panel>
            <Layout.Panel row={[1, 10]} col={[9, 12]}></Layout.Panel>
            <Layout.Panel row={[11, 12]} col={[1, 12]}></Layout.Panel>
        </Layout>
    );
};
