import { useCallback, useEffect } from 'react';

import { useTabs } from '@/shared/lib';
import { cn } from '@/shared/lib/cn';
import { useHistory } from '@/features/history';
import {
    useSelectedElementActions,
    useSelectedElementId,
} from '@/features/element-selection';
import { ElementEditor } from './ElementEditor';
import { ElementCreator } from './ElementCreator';

import './ControlPanel.scss';
import { ActionNames, useActivityLog } from '@/features/activity-log';

const b = cn('ControlPanel');

const EditTab = () => {
    const selectedElementId = useSelectedElementId();
    const { resetSelectedElement } = useSelectedElementActions();

    if (!selectedElementId) {
        return (
            <div className={b('empty')}>
                Выберите элемент для редактирования
            </div>
        );
    }
    return (
        <ElementEditor
            key={selectedElementId}
            elementId={selectedElementId}
            resetSelectedElement={resetSelectedElement}
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
    activeTab: 'edit' | 'create';
    setActiveTab: (tabId: 'edit' | 'create') => void;
}

export const ControlPanel = ({
    activeTab: propsActiveTab,
    setActiveTab: propsSetActiveTab,
}: ControlPanelProps) => {
    const { clearPendingFormHistory } = useHistory();
    const log = useActivityLog();
    const { setSelectedElementId, resetSelectedElement } =
        useSelectedElementActions();

    const { TabControls, TabPanel, activeTab, setActiveTab } = useTabs({
        tabs: [
            {
                id: 'edit',
                label: 'Элемент',
                component: <EditTab />,
            },
            {
                id: 'create',
                label: 'Создать',
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
                        resetSelectedElement();
                    }
                },
                [log, resetSelectedElement],
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
