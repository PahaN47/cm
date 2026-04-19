import React, { useCallback, useEffect } from 'react';

import { Radio } from '@/shared/ui/Radio';

export interface TabDefinition<T extends string = string> {
    id: T;
    label: React.ReactNode;
    component: React.ReactNode;
}

export interface UseTabOptions<T extends string = string> {
    onSelect?: (tabId: T) => void;
    activeTab?: T;
    setActiveTab?: (tabId: T) => void;
}

interface UseTabsParams<T extends string = string> {
    tabs: TabDefinition<T>[];
    defaultTab?: T;
    options?: UseTabOptions<T>;
}

export interface TabControlsProps {
    size?: 's' | 'm' | 'l';
    color?: 'default' | 'accent';
    disabled?: boolean;
    className?: string;
}

export const useTabs = <T extends string>({
    tabs,
    defaultTab,
    options,
}: UseTabsParams<T>) => {
    const {
        onSelect,
        activeTab: propsActiveTab,
        setActiveTab: propsSetActiveTab,
    } = options ?? {};

    const [activeTab, setActiveTab] = React.useState<T>(
        propsActiveTab ?? defaultTab ?? tabs[0]?.id,
    );

    useEffect(() => {
        if (propsActiveTab) {
            setActiveTab(propsActiveTab);
        }
    }, [propsActiveTab]);

    useEffect(() => {
        propsSetActiveTab?.(activeTab);
    }, [activeTab, propsSetActiveTab]);

    const handleSelect = useCallback(
        (tabId: T) => {
            setActiveTab(tabId);
            onSelect?.(tabId);
        },
        [onSelect],
    );

    const tabsRef = React.useRef(tabs);
    tabsRef.current = tabs;

    const activeTabRef = React.useRef(activeTab);
    activeTabRef.current = activeTab;

    const TabControls = React.useMemo<React.FC<TabControlsProps>>(() => {
        return function TabControls(props) {
            return (
                <Radio
                    value={activeTabRef.current}
                    onChange={handleSelect}
                    {...props}
                >
                    {tabsRef.current.map((tab) => (
                        <Radio.Option key={tab.id} value={tab.id}>
                            {tab.label}
                        </Radio.Option>
                    ))}
                </Radio>
            );
        };
    }, [handleSelect]);

    const TabPanel = React.useMemo<React.FC>(() => {
        return function TabPanel() {
            const active = tabsRef.current.find(
                (t) => t.id === activeTabRef.current,
            );
            return <>{active?.component ?? null}</>;
        };
    }, []);

    return { TabControls, TabPanel, activeTab, setActiveTab };
};
