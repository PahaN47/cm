import { useCallback, useEffect, useMemo, useState } from 'react';

import {
    GraphStore,
    GraphStateProvider,
    parseMetagraphXml,
} from '@/entities/graph';
import { fetchGraph } from '@/shared/api/fetchGraph';
import { GraphStub } from '@/widgets/graph-stub';
import { ControlPanel } from '@/widgets/control-panel';
import { Layout } from '@/shared/ui/Layout';
import {
    HistoryFormApplierProvider,
    useHistory,
    useHistoryShortcuts,
} from '@/features/history';
import { ActivityLogProvider } from '@/features/activity-log';
import { Theme, useTheme } from '@/app/theme';
import { Button } from '@/shared/ui/Button';

// Inner component so the shortcuts hook can sit inside both providers
// (GraphStateProvider for the store, HistoryFormApplierProvider for the form
// applier) while sharing the page-level selection state.
const HomeContent = ({
    selectedElementId,
    setSelectedElementId,
}: {
    selectedElementId: string | null;
    setSelectedElementId: (id: string | null) => void;
}) => {
    const { clearPendingFormHistory } = useHistory();
    const { theme, setTheme } = useTheme();

    useHistoryShortcuts({ selectedElementId, setSelectedElementId });

    const [activeTab, setActiveTab] = useState<'edit' | 'create'>('edit');

    const onSelectElement = useCallback(
        (id: string | null) => {
            setSelectedElementId(id);
            setActiveTab('edit');
        },
        [setSelectedElementId],
    );

    // Switching to a different element discards any uncommitted form edits in
    // the active form, so their corresponding `update-form` history entries
    // become unactionable. Drop them so undo doesn't try to apply them to a
    // form that no longer exists.
    useEffect(() => {
        clearPendingFormHistory();
    }, [selectedElementId, clearPendingFormHistory]);

    return (
        <Layout>
            <Layout.Panel row={[1, 10]} col={[1, 8]}>
                <GraphStub
                    selectedElementId={selectedElementId}
                    onSelectElement={onSelectElement}
                />
            </Layout.Panel>
            <Layout.Panel row={[1, 10]} col={[9, 12]}>
                <ControlPanel
                    selectedElementId={selectedElementId}
                    setSelectedElementId={setSelectedElementId}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                />
            </Layout.Panel>
            <Layout.Panel
                row={[11, 12]}
                col={[1, 12]}
                style={{ display: 'flex', alignItems: 'center', padding: 16 }}
            >
                <Button
                    onClick={() =>
                        setTheme(
                            theme === Theme.Light ? Theme.Dark : Theme.Light,
                        )
                    }
                >
                    Тема
                </Button>
            </Layout.Panel>
        </Layout>
    );
};

export const HomePage = () => {
    const [selectedElementId, setSelectedElementId] = useState<string | null>(
        null,
    );
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
            <HistoryFormApplierProvider>
                <ActivityLogProvider>
                    <HomeContent
                        selectedElementId={selectedElementId}
                        setSelectedElementId={setSelectedElementId}
                    />
                </ActivityLogProvider>
            </HistoryFormApplierProvider>
        </GraphStateProvider>
    );
};
