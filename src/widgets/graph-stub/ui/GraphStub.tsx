import { useGraphState } from '@/entities/graph';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/Button';

import './GraphStub.scss';
import { ActionNames, useActivityLog } from '@/features/activity-log';
import { useCallback } from 'react';

const b = cn('GraphStub');

interface GraphStubProps {
    selectedElementId: string | null;
    onSelectElement: (id: string | null) => void;
}

export const GraphStub = ({
    selectedElementId,
    onSelectElement,
}: GraphStubProps) => {
    const elements = useGraphState();
    const log = useActivityLog();

    const handleSelectElement = useCallback(
        (id: string | null) => {
            log(ActionNames.SELECT_ELEMENT, { id });

            onSelectElement(id);
        },
        [log, onSelectElement],
    );

    return (
        <div className={b()}>
            {elements.map((el) => (
                <Button
                    key={el.id}
                    size="s"
                    variant="normal"
                    color={el.id === selectedElementId ? 'accent' : 'default'}
                    onClick={() =>
                        handleSelectElement(
                            el.id === selectedElementId ? null : el.id,
                        )
                    }
                >
                    {el.id}
                </Button>
            ))}
        </div>
    );
};
