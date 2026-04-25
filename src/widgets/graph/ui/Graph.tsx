import { useCallback, useEffect, useMemo, useRef } from 'react';
import cytoscape from 'cytoscape';
import type {
    Core,
    ElementDefinition,
    EventObject,
    EventObjectEdge,
    EventObjectNode,
    NodeSingular,
    StylesheetJson,
} from 'cytoscape';
import fcose from 'cytoscape-fcose';

import {
    useGetGraphElementById,
    useGraphState,
} from '@/entities/graph/model/GraphStateContext';
import { ActionNames, useActivityLog } from '@/features/activity-log';
import { useSelectedElementId } from '@/features/element-selection';
import { Theme, useTheme } from '@/app/theme';
import { cn } from '@/shared/lib/cn';

import { buildCytoscapeElements } from '../lib/buildCytoscapeElements';
import './Graph.scss';

cytoscape.use(fcose);

const b = cn('Graph');

type FcoseLayoutOptions = {
    name: 'fcose';
    animationDuration?: number;
    nodeDimensionsIncludeLabels?: boolean;
    idealEdgeLength?: number;
    nodeSeparation?: number;
    gravity?: number;
    numIter?: number;
    randomize?: boolean;
    fit?: boolean;
    padding?: number;
    quality?: 'draft' | 'default' | 'proof';
};

const BASE_LAYOUT: FcoseLayoutOptions = {
    name: 'fcose',
    animationDuration: 600,
    nodeDimensionsIncludeLabels: true,
    idealEdgeLength: 150,
    nodeSeparation: 75,
    gravity: 0.25,
    numIter: 2000,
    quality: 'proof',
};

// Initial layout: random starting positions so fcose can find a good arrangement.
const INITIAL_LAYOUT: FcoseLayoutOptions = { ...BASE_LAYOUT, randomize: true };

// Incremental layout: keep existing node positions stable when new nodes appear.
const INCREMENTAL_LAYOUT: FcoseLayoutOptions = {
    ...BASE_LAYOUT,
    randomize: false,
    fit: false,
    animationDuration: 300,
    numIter: 1500,
};

function makeStylesheet(theme: Theme): StylesheetJson {
    const isDark = theme === Theme.Dark;
    const nodeBg = isDark ? '#3a6fa8' : '#00BCD4';
    const nodeText = isDark ? '#e4e4e4' : '#1c1c1c';
    const edgeColor = isDark ? '#5eaeff' : '#009688';
    const parentBg = isDark ? '#5eaeff' : '#009688';
    const selectedColor = isDark ? '#ff9f43' : '#ff6b00';

    return [
        {
            selector: 'node',
            style: {
                'background-color': nodeBg,
                shape: 'round-rectangle',
                'text-wrap': 'wrap',
                'text-valign': 'center',
                'text-halign': 'center',
                width: 'label',
                height: 'label',
                padding: '8px',
                color: nodeText,
                'font-size': 12,
                label: 'data(label)',
            },
        },
        {
            selector: 'node.metavertex',
            style: {
                shape: 'round-rectangle',
                'border-width': 1,
                'border-color': parentBg,
            },
        },
        {
            selector: ':parent',
            style: {
                'background-color': parentBg,
                'background-opacity': 0.15,
                'text-valign': 'top',
                'text-halign': 'center',
                'border-width': 1,
                'border-color': parentBg,
            },
        },
        {
            selector: 'edge',
            style: {
                width: 2,
                'line-color': edgeColor,
                'text-wrap': 'wrap',
                label: 'data(label)',
                color: nodeText,
                'font-size': 11,
                'text-background-color': isDark ? '#262626' : '#ffffff',
                'text-background-opacity': 0.85,
                'text-background-padding': '2px',
                'curve-style': 'bezier',
            },
        },
        {
            selector: 'edge.directed',
            style: {
                'target-arrow-shape': 'triangle',
                'target-arrow-color': edgeColor,
            },
        },
        {
            selector: 'edge.metaedge',
            style: {
                'line-style': 'dashed',
            },
        },
        {
            selector: '.selected',
            style: {
                'background-color': selectedColor,
                'line-color': selectedColor,
                'target-arrow-color': selectedColor,
                'border-width': 3,
                'border-color': selectedColor,
            },
        },
    ];
}

interface ElementSnapshot {
    group: 'nodes' | 'edges';
    label: string;
    parent?: string;
    classes: string;
    source?: string;
    target?: string;
}

function snapshot(def: ElementDefinition): ElementSnapshot {
    const data = def.data as {
        label?: string;
        parent?: string;
        source?: string;
        target?: string;
    };
    return {
        group: def.group ?? 'nodes',
        label: data.label ?? '',
        parent: data.parent,
        classes:
            typeof def.classes === 'string'
                ? def.classes
                : Array.isArray(def.classes)
                  ? def.classes.join(' ')
                  : '',
        source: data.source,
        target: data.target,
    };
}

/**
 * Apply a minimal diff between the previous and next set of element
 * definitions to an existing Cytoscape instance.
 *
 * Returns the ids of nodes that were added, so the caller can run an
 * incremental layout that only positions the new content.
 */
function patchGraph(
    cy: Core,
    prev: Map<string, ElementSnapshot>,
    next: ElementDefinition[],
): { addedNodeIds: string[]; structureChanged: boolean } {
    const nextMap = new Map<string, ElementDefinition>();
    for (const el of next) {
        const id = el.data.id;
        if (typeof id === 'string') nextMap.set(id, el);
    }

    const addedNodes: ElementDefinition[] = [];
    const addedEdges: ElementDefinition[] = [];
    const removedIds: string[] = [];

    for (const id of prev.keys()) {
        if (!nextMap.has(id)) removedIds.push(id);
    }

    // Detach children from any parent that's about to be removed; otherwise
    // Cytoscape would cascade-remove the children with the parent.
    for (const id of removedIds) {
        const prevSnap = prev.get(id);
        if (prevSnap?.group !== 'nodes') continue;
        const node = cy.getElementById(id);
        if (node.empty() || !node.isParent()) continue;
        node.children().forEach((child) => {
            child.move({ parent: null });
        });
    }

    if (removedIds.length > 0) {
        const selector = removedIds
            .map((id) => `#${CSS.escape(id)}`)
            .join(', ');
        cy.remove(selector);
    }

    for (const [id, def] of nextMap) {
        if (prev.has(id)) continue;
        if (def.group === 'edges') addedEdges.push(def);
        else addedNodes.push(def);
    }

    // Add nodes first so edges can reference them when added.
    if (addedNodes.length > 0) cy.add(addedNodes);
    if (addedEdges.length > 0) cy.add(addedEdges);

    // Patch surviving elements: parent move, data, and classes.
    for (const [id, def] of nextMap) {
        const prevSnap = prev.get(id);
        if (!prevSnap) continue;
        const cyEl = cy.getElementById(id);
        if (cyEl.empty()) continue;

        const nextSnap = snapshot(def);

        if (nextSnap.group === 'nodes' && nextSnap.parent !== prevSnap.parent) {
            (cyEl as NodeSingular).move({ parent: nextSnap.parent ?? null });
        }

        if (nextSnap.label !== prevSnap.label) {
            cyEl.data('label', nextSnap.label);
        }

        if (nextSnap.classes !== prevSnap.classes) {
            cyEl.classes(nextSnap.classes);
        }
    }

    const structureChanged =
        addedNodes.length > 0 ||
        addedEdges.length > 0 ||
        removedIds.length > 0;

    return { addedNodeIds: addedNodes.map((n) => n.data.id!), structureChanged };
}

interface GraphProps {
    onSelectElement: (id: string | null) => void;
}

export const Graph = ({ onSelectElement }: GraphProps) => {
    const elements = useGraphState();
    const log = useActivityLog();
    const { theme } = useTheme();
    const selectedElementId = useSelectedElementId();

    const getElementById = useGetGraphElementById();

    const cyElements = useMemo(
        () => buildCytoscapeElements(elements, getElementById),
        [elements, getElementById],
    );

    const stylesheet = useMemo(() => makeStylesheet(theme), [theme]);

    const containerRef = useRef<HTMLDivElement>(null);
    const cyRef = useRef<Core | null>(null);
    const prevSnapshotRef = useRef<Map<string, ElementSnapshot>>(new Map());
    const initializedRef = useRef(false);

    // Stable callback so the click listener installed on mount always sees
    // the latest props without rebinding.
    const onSelectElementRef = useRef(onSelectElement);
    onSelectElementRef.current = onSelectElement;
    const logRef = useRef(log);
    logRef.current = log;

    const handleSelectElement = useCallback((id: string | null) => {
        logRef.current(ActionNames.SELECT_ELEMENT, { id });
        onSelectElementRef.current(id);
    }, []);

    // Mount: create the Cytoscape instance once.
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const cy = cytoscape({
            container,
            elements: [],
            style: stylesheet,
            wheelSensitivity: 0.2,
        });
        cyRef.current = cy;

        cy.on('tap', (event: EventObject) => {
            if (event.target === cy) handleSelectElement(null);
        });
        cy.on(
            'tap',
            'node, edge',
            (event: EventObjectNode | EventObjectEdge) => {
                handleSelectElement(event.target.id());
            },
        );

        return () => {
            cy.destroy();
            cyRef.current = null;
            prevSnapshotRef.current = new Map();
            initializedRef.current = false;
        };
        // Stylesheet is applied in a separate effect; only mount once.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [handleSelectElement]);

    // Sync the graph elements with Cytoscape using a minimal diff.
    useEffect(() => {
        const cy = cyRef.current;
        if (!cy) return;

        // Defer initialization until the first non-empty payload, otherwise
        // we'd "initialize" the graph against the empty fetch placeholder and
        // then have to incrementally seed every real node from origin.
        if (!initializedRef.current) {
            if (cyElements.length === 0) return;
            cy.add(cyElements);
            cy.layout(INITIAL_LAYOUT).run();
            const next = new Map<string, ElementSnapshot>();
            for (const el of cyElements) {
                const id = el.data.id;
                if (typeof id === 'string') next.set(id, snapshot(el));
            }
            prevSnapshotRef.current = next;
            initializedRef.current = true;
            return;
        }

        const { addedNodeIds, structureChanged } = patchGraph(
            cy,
            prevSnapshotRef.current,
            cyElements,
        );

        const nextSnap = new Map<string, ElementSnapshot>();
        for (const el of cyElements) {
            const id = el.data.id;
            if (typeof id === 'string') nextSnap.set(id, snapshot(el));
        }
        prevSnapshotRef.current = nextSnap;

        if (!structureChanged) return;

        // Seed any newly added nodes near the centroid of their connected
        // neighbours so the incremental fcose pass has a sensible starting
        // point and existing nodes barely move.
        if (addedNodeIds.length > 0) {
            for (const id of addedNodeIds) {
                const node = cy.getElementById(id);
                if (node.empty()) continue;
                const neighborhood = node
                    .neighborhood('node')
                    .filter((n) => !addedNodeIds.includes(n.id()));
                if (neighborhood.nonempty()) {
                    const bb = neighborhood.boundingBox({});
                    node.position({
                        x: (bb.x1 + bb.x2) / 2,
                        y: (bb.y1 + bb.y2) / 2,
                    });
                } else {
                    const ext = cy.extent();
                    node.position({
                        x: (ext.x1 + ext.x2) / 2,
                        y: (ext.y1 + ext.y2) / 2,
                    });
                }
            }
            cy.layout(INCREMENTAL_LAYOUT).run();
        }
    }, [cyElements]);

    // Reflect external selection changes via a `.selected` class and pan the
    // viewport so the selected element is comfortably in view.
    useEffect(() => {
        const cy = cyRef.current;
        if (!cy) return;

        cy.elements('.selected').removeClass('selected');
        if (!selectedElementId) return;

        const target = cy.getElementById(selectedElementId);
        if (target.empty()) return;

        target.addClass('selected');

        // Compute a zoom that keeps the element visible without zooming all
        // the way in if it's already a comfortable size on screen.
        const bb = target.boundingBox({});
        const padding = 80;
        const viewport = cy.extent();
        const viewportW = viewport.w;
        const viewportH = viewport.h;
        const fitZoom = Math.min(
            cy.width() / (bb.w + padding * 2),
            cy.height() / (bb.h + padding * 2),
        );
        const elementFitsInView =
            bb.w + padding * 2 <= viewportW &&
            bb.h + padding * 2 <= viewportH;
        const targetZoom = elementFitsInView
            ? cy.zoom()
            : Math.min(fitZoom, cy.zoom());

        cy.stop(true, true);
        cy.animate(
            {
                center: { eles: target },
                zoom: targetZoom,
            },
            { duration: 350, easing: 'ease-in-out' },
        );
    }, [selectedElementId, cyElements]);

    // Apply stylesheet updates (theme changes).
    useEffect(() => {
        const cy = cyRef.current;
        if (!cy) return;
        cy.style(stylesheet);
    }, [stylesheet]);

    return (
        <div className={b()}>
            <div ref={containerRef} className={b('canvas')} />
        </div>
    );
};
