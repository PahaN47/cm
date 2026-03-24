import React from 'react';

import { Radio } from '@/shared/ui/Radio';

export interface TabDefinition {
    id: string;
    label: React.ReactNode;
    component: React.ReactNode;
}

interface UseTabsOptions {
    tabs: TabDefinition[];
    defaultTab?: string;
}

export interface TabControlsProps {
    size?: 's' | 'm' | 'l';
    color?: 'default' | 'accent';
    disabled?: boolean;
    className?: string;
}

export const useTabs = ({ tabs, defaultTab }: UseTabsOptions) => {
    const [activeTab, setActiveTab] = React.useState(defaultTab ?? tabs[0]?.id);

    const tabsRef = React.useRef(tabs);
    tabsRef.current = tabs;

    const activeTabRef = React.useRef(activeTab);
    activeTabRef.current = activeTab;

    const TabControls = React.useMemo<React.FC<TabControlsProps>>(() => {
        return function TabControls(props) {
            return (
                <Radio value={activeTabRef.current} onChange={setActiveTab} {...props}>
                    {tabsRef.current.map((tab) => (
                        <Radio.Option key={tab.id} value={tab.id}>
                            {tab.label}
                        </Radio.Option>
                    ))}
                </Radio>
            );
        };
    }, []);

    const TabPanel = React.useMemo<React.FC>(() => {
        return function TabPanel() {
            const active = tabsRef.current.find((t) => t.id === activeTabRef.current);
            return <>{active?.component ?? null}</>;
        };
    }, []);

    return { TabControls, TabPanel, activeTab, setActiveTab };
};
