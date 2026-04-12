import { useTabs } from '@/shared/lib';
import { cn } from '@/shared/lib/cn';
import { ElementEditor } from './ElementEditor';
import { ElementCreator } from './ElementCreator';

import './ControlPanel.scss';

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
}

export const ControlPanel = ({
    selectedElementId,
    setSelectedElementId,
}: ControlPanelProps) => {
    const { TabControls, TabPanel, setActiveTab } = useTabs({
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
    });

    return (
        <div className={b()}>
            <TabControls />
            <div className={b('content')}>
                <TabPanel />
            </div>
        </div>
    );
};
