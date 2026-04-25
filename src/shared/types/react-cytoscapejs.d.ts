declare module 'cytoscape-fcose' {
    import type { Ext } from 'cytoscape';
    const fcose: Ext;
    export default fcose;
}

declare module 'react-cytoscapejs' {
    import type { Component, CSSProperties } from 'react';
    import type {
        Core,
        ElementDefinition,
        LayoutOptions,
        StylesheetJson,
    } from 'cytoscape';

    export interface CytoscapeComponentProps {
        id?: string;
        className?: string;
        style?: CSSProperties;
        elements: ElementDefinition[];
        layout?: LayoutOptions;
        stylesheet?: StylesheetJson;
        cy?: (cy: Core) => void;
        pan?: { x: number; y: number };
        zoom?: number;
        panningEnabled?: boolean;
        userPanningEnabled?: boolean;
        minZoom?: number;
        maxZoom?: number;
        zoomingEnabled?: boolean;
        userZoomingEnabled?: boolean;
        boxSelectionEnabled?: boolean;
        autoungrabify?: boolean;
        autolock?: boolean;
        autounselectify?: boolean;
        wheelSensitivity?: number;
        headless?: boolean;
        styleEnabled?: boolean;
        hideEdgesOnViewport?: boolean;
        textureOnViewport?: boolean;
        motionBlur?: boolean;
        motionBlurOpacity?: number;
        pixelRatio?: number | 'auto';
    }

    export default class CytoscapeComponent extends Component<CytoscapeComponentProps> {
        static normalizeElements(
            elements:
                | ElementDefinition[]
                | { nodes?: ElementDefinition[]; edges?: ElementDefinition[] },
        ): ElementDefinition[];
    }
}
