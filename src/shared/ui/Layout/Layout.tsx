import React from 'react';

import { cn } from '@/shared/lib/cn';

import './Layout.scss';

const b = cn('Layout');

export interface LayoutPanelProps {
    className?: string;
    style?: React.CSSProperties;
    row?: number | [start: number, end: number];
    col?: number | [start: number, end: number];
}

const LayoutPanel = ({
    className,
    style,
    row = 1,
    col = 1,
    children,
}: React.PropsWithChildren<LayoutPanelProps>) => {
    const rowStart = Array.isArray(row) ? row[0] : row;
    const rowEnd = Array.isArray(row) ? row[1] : row;

    const colStart = Array.isArray(col) ? col[0] : col;
    const colEnd = Array.isArray(col) ? col[1] : col;

    return (
        <div
            className={b('panel', className)}
            style={{
                gridArea: `${rowStart} / ${colStart} / ${rowEnd + 1} / ${colEnd + 1}`,
                ...style,
            }}
        >
            {children}
        </div>
    );
};

type PanelElement = React.ReactElement<LayoutPanelProps, typeof LayoutPanel>;

interface LayoutProps {
    children: PanelElement | PanelElement[];
}

const Layout = ({ children }: LayoutProps) => {
    const panels = React.Children.toArray(children) as PanelElement[];

    const sorted = panels.slice().sort((a, c) => {
        const aRow = a.props.row ?? 1;
        const cRow = c.props.row ?? 1;
        const aRowStart = Array.isArray(aRow) ? aRow[0] : aRow;
        const cRowStart = Array.isArray(cRow) ? cRow[0] : cRow;

        if (aRowStart !== cRowStart) return aRowStart - cRowStart;

        const aCol = a.props.col ?? 1;
        const cCol = c.props.col ?? 1;
        const aColStart = Array.isArray(aCol) ? aCol[0] : aCol;
        const cColStart = Array.isArray(cCol) ? cCol[0] : cCol;

        return aColStart - cColStart;
    });

    return <div className={b()}>{sorted}</div>;
};

Layout.Panel = LayoutPanel;

export default Layout;
