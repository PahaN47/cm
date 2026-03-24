import { ControlPanel } from '@/widgets/control-panel';

import { Layout } from '@/shared/ui/Layout';

export const HomePage = () => {
    return (
        <Layout>
            <Layout.Panel row={[1, 10]} col={[1, 8]}>
                The visuals go here
            </Layout.Panel>
            <Layout.Panel row={[1, 10]} col={[9, 12]}>
                <ControlPanel />
            </Layout.Panel>
            <Layout.Panel row={[11, 12]} col={[1, 12]}></Layout.Panel>
        </Layout>
    );
};
