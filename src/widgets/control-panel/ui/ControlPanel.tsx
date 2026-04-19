import { useCallback, useEffect } from 'react';

import { useTabs } from '@/shared/lib';
import { cn } from '@/shared/lib/cn';
import { useHistory } from '@/features/history';
import { ElementEditor } from './ElementEditor';
import { ElementCreator } from './ElementCreator';

import './ControlPanel.scss';
import { ActionNames, useActivityLog } from '@/features/activity-log';

const b = cn('ControlPanel');

const EditTab = ({
    selectedElementId,
    setSelectedElementId,
}: {
    selectedElementId: string | null;
    setSelectedElementId: (elementId: string | null) => void;
}) => {
    if (!selectedElementId) {
        return <div className={b('empty')}>Select an element to edit</div>;
    }
    return (
        <ElementEditor
            key={selectedElementId}
            elementId={selectedElementId}
            resetSelectedElement={() => setSelectedElementId(null)}
        />
    );
};

interface CreateTabProps {
    onSubmit?: (elementId: string) => void;
}
const CreateTab = ({ onSubmit }: CreateTabProps) => {
    return <ElementCreator onSubmit={onSubmit} />;
};

interface ControlPanelProps {
    selectedElementId: string | null;
    setSelectedElementId: (elementId: string | null) => void;
    activeTab: 'edit' | 'create';
    setActiveTab: (tabId: 'edit' | 'create') => void;
}

export const ControlPanel = ({
    selectedElementId,
    setSelectedElementId,
    activeTab: propsActiveTab,
    setActiveTab: propsSetActiveTab,
}: ControlPanelProps) => {
    const { clearPendingFormHistory } = useHistory();
    const log = useActivityLog();

    const { TabControls, TabPanel, activeTab, setActiveTab } = useTabs({
        tabs: [
            {
                id: 'edit',
                label: 'Element',
                component: (
                    <EditTab
                        selectedElementId={selectedElementId}
                        setSelectedElementId={setSelectedElementId}
                    />
                ),
            },
            {
                id: 'create',
                label: 'Create',
                component: (
                    <CreateTab
                        onSubmit={(createdId) => {
                            setSelectedElementId(createdId);
                            setActiveTab('edit');
                        }}
                    />
                ),
            },
        ],
        options: {
            activeTab: propsActiveTab,
            setActiveTab: propsSetActiveTab,
            onSelect: useCallback(
                (tabId: 'edit' | 'create') => {
                    log(ActionNames.SELECT_EDITOR_TAB, { tabId });

                    if (tabId === 'create') {
                        setSelectedElementId(null);
                    }
                },
                [log, setSelectedElementId],
            ),
        },
    });

    // Switching tabs unmounts the previously active form, which leaves any
    // pending `update-form` entries pointing at a form that no longer exists.
    // Drop them so undo doesn't try to apply them to a stale target.
    useEffect(() => {
        clearPendingFormHistory();
    }, [activeTab, clearPendingFormHistory]);

    return (
        <div className={b()}>
            <TabControls />
            <div className={b('content')}>
                <TabPanel />
            </div>
        </div>
    );
};
