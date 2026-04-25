import { useCallback, useEffect, useMemo, useState } from 'react';

import {
    GraphStore,
    GraphStateProvider,
    parseMetagraphXml,
} from '@/entities/graph';
import { fetchGraph } from '@/shared/api/fetchGraph';
import { Graph } from '@/widgets/graph';
import { ControlPanel } from '@/widgets/control-panel';
import { Layout } from '@/shared/ui/Layout';
import {
    HistoryFormApplierProvider,
    useHistory,
    useHistoryShortcuts,
} from '@/features/history';
import {
    SelectedElementProvider,
    useSelectedElementActions,
    useSelectedElementId,
} from '@/features/element-selection';
import { Theme, useTheme } from '@/app/theme';
import { Button } from '@/shared/ui/Button';
import { useAuth } from '@/app/auth';
import { useNavigate } from 'react-router-dom';

// Inner component so the shortcuts hook can sit inside all providers
// (GraphStateProvider, HistoryFormApplierProvider, SelectedElementProvider)
// while the page-level effects (clearing pending form history on selection
// change, switching tabs on graph click) can read the shared selection.
const HomeContent = () => {
    const navigate = useNavigate();

    const { login } = useAuth();
    const { theme, setTheme } = useTheme();

    const { clearPendingFormHistory } = useHistory();

    const selectedElementId = useSelectedElementId();
    const { setSelectedElementId } = useSelectedElementActions();

    useHistoryShortcuts();

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

    useEffect(() => {
        if (!login) {
            navigate('/auth');
        }
    }, [login, navigate]);

    return (
        <Layout>
            <Layout.Panel row={[1, 10]} col={[1, 8]}>
                <Graph onSelectElement={onSelectElement} />
            </Layout.Panel>
            <Layout.Panel row={[1, 10]} col={[9, 12]}>
                <ControlPanel
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
                <SelectedElementProvider>
                    <HomeContent />
                </SelectedElementProvider>
            </HistoryFormApplierProvider>
        </GraphStateProvider>
    );
};
