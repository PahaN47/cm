import { useCallback, useEffect, useMemo, useState } from 'react';

import {
    EMPTY_METAGRAPH_XML,
    GraphStore,
    GraphStateProvider,
    parseMetagraphXml,
} from '@/entities/graph';
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
import { ThemeToggleButton } from '@/shared/ui/ThemeToggleButton';
import { DownloadGraphStateButton } from './DownloadGraphStateButton';
import { useAuth } from '@/app/auth';
import { useNavigate } from 'react-router-dom';

// Inner component so the shortcuts hook can sit inside all providers
// (GraphStateProvider, HistoryFormApplierProvider, SelectedElementProvider)
// while the page-level effects (clearing pending form history on selection
// change, switching tabs on graph click) can read the shared selection.
const HomeContent = () => {
    const navigate = useNavigate();

    const { login } = useAuth();
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
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: 16,
                }}
            >
                <ThemeToggleButton />
                <DownloadGraphStateButton />
            </Layout.Panel>
        </Layout>
    );
};

export const HomePage = () => {
    const store = useMemo(
        () => new GraphStore(parseMetagraphXml(EMPTY_METAGRAPH_XML)),
        [],
    );

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
