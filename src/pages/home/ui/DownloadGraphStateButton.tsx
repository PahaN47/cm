import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import type { RootState } from '@/app/store';
import { useGraphState } from '@/entities/graph';
import { Button } from '@/shared/ui/Button';
import { useAuth } from '@/app/auth';

export const DownloadGraphStateButton = () => {
    const { login } = useAuth();
    const graphState = useGraphState();
    const actionLog = useSelector((state: RootState) => state.activity.log);

    const onClick = useCallback(() => {
        const payload = { login, graphState, actionLog };
        const blob = new Blob([JSON.stringify(payload, null, 2)], {
            type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `graph-state-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }, [login, graphState, actionLog]);

    return <Button onClick={onClick}>Скачать JSON</Button>;
};
