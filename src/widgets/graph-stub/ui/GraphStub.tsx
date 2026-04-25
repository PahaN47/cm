import { useGraphState } from '@/entities/graph';
import { useSelectedElementId } from '@/features/element-selection';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/Button';

import './GraphStub.scss';
import { ActionNames, useActivityLog } from '@/features/activity-log';
import { useCallback } from 'react';

const b = cn('GraphStub');

interface GraphStubProps {
    onSelectElement: (id: string | null) => void;
}

export const GraphStub = ({ onSelectElement }: GraphStubProps) => {
    const elements = useGraphState();
    const log = useActivityLog();
    const selectedElementId = useSelectedElementId();

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
