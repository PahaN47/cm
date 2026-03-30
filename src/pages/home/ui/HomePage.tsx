import { useEffect, useMemo, useState } from 'react';

import { GraphStore, GraphStateProvider, parseMetagraphXml } from '@/entities/graph';
import { fetchGraph } from '@/shared/api/fetchGraph';
import { GraphStub } from '@/widgets/graph-stub';
import { ControlPanel } from '@/widgets/control-panel';
import { Layout } from '@/shared/ui/Layout';

export const HomePage = () => {
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
    const store = useMemo(() => new GraphStore(), []);

    useEffect(() => {
        const load = async () => {
            const xml = await fetchGraph();
            store.load(parseMetagraphXml(xml));
        };
        load().catch(console.error);
    }, [store]);

    return (
        <GraphStateProvider store={store}>
            <Layout>
                <Layout.Panel row={[1, 10]} col={[1, 8]}>
                    <GraphStub
                        selectedElementId={selectedElementId}
                        onSelectElement={setSelectedElementId}
                    />
                </Layout.Panel>
                <Layout.Panel row={[1, 10]} col={[9, 12]}>
                    <ControlPanel selectedElementId={selectedElementId} />
                </Layout.Panel>
                <Layout.Panel row={[11, 12]} col={[1, 12]}></Layout.Panel>
            </Layout>
        </GraphStateProvider>
    );
};
