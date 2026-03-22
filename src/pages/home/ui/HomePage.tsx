import { Layout } from '@/shared/ui/Layout';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';

export const HomePage = () => {
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
                <Input size="s" placeholder="Normal S" />
                <Input size="m" placeholder="Normal M" />
                <Input size="l" placeholder="Normal L" />
                <Input variant="clear" size="s" placeholder="Clear S" />
                <Input variant="clear" size="m" placeholder="Clear M" />
                <Input variant="clear" size="l" placeholder="Clear L" />
                <Input color="accent" size="s" placeholder="Accent S" />
                <Input color="accent" size="m" placeholder="Accent M" />
                <Input color="accent" size="l" placeholder="Accent L" />
                <Input color="accent" variant="clear" size="s" placeholder="Accent Clear S" />
                <Input color="accent" variant="clear" size="m" placeholder="Accent Clear M" />
                <Input color="accent" variant="clear" size="l" placeholder="Accent Clear L" />
                <Input error size="m" placeholder="Error" />
            </Layout.Panel>
            <Layout.Panel row={[1, 10]} col={[9, 12]}></Layout.Panel>
            <Layout.Panel row={[11, 12]} col={[1, 12]}></Layout.Panel>
        </Layout>
    );
};
