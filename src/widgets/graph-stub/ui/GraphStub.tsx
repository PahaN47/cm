import { useGraphState } from '@/entities/graph';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/Button';

import './GraphStub.scss';

const b = cn('GraphStub');

interface GraphStubProps {
    selectedElementId: string | null;
    onSelectElement: (id: string | null) => void;
}

export const GraphStub = ({ selectedElementId, onSelectElement }: GraphStubProps) => {
    const elements = useGraphState();

    return (
        <div className={b()}>
            {elements.map((el) => (
                <Button
                    key={el.id}
                    size="s"
                    variant="normal"
                    color={el.id === selectedElementId ? 'accent' : 'default'}
                    onClick={() =>
                        onSelectElement(el.id === selectedElementId ? null : el.id)
                    }
                >
                    {el.id}
                </Button>
            ))}
        </div>
    );
};
