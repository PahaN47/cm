import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import type {
    Core,
    EdgeSingular,
    ElementDefinition,
    EventObject,
    EventObjectEdge,
    EventObjectNode,
    NodeSingular,
    StylesheetJson,
} from 'cytoscape';
import fcose from 'cytoscape-fcose';
import { debounce } from 'lodash';

import {
    useGetGraphElementById,
    useGraphState,
} from '@/entities/graph/model/GraphStateContext';
import { ActionNames, useActivityLog } from '@/features/activity-log';
import { useSelectedElementId } from '@/features/element-selection';
import { Theme, useTheme } from '@/app/theme';
import { cn } from '@/shared/lib/cn';

import {
    buildCytoscapeElements,
    isMembershipEdgeId,
    metaedgeIdFromSyntheticEdgeId,
    metaedgeSourceEdgeId,
    metaedgeTargetEdgeId,
} from '../lib/buildCytoscapeElements';
import './Graph.scss';
import { Button } from '@/shared/ui/Button';

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
            // Leaf nodes (no children) are lifted above any compound parent
            // they might spatially overlap. Without this, fcose can route
            // a leaf through an unrelated container's bounding box and the
            // container's body swallows the tap.
            selector: 'node:childless',
            style: {
                'z-compound-depth': 'top',
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
            // Leaf (no-children) metaedge rendered as a compact dashed pill.
            // When it actually has children the `:parent.metaedge` rule below
            // reshapes it into a container.
            selector: 'node.metaedge',
            style: {
                shape: 'round-rectangle',
                'border-width': 1,
                'border-color': edgeColor,
                'border-style': 'dashed',
                'background-color': isDark ? '#262626' : '#ffffff',
                'background-opacity': 0.85,
                color: nodeText,
                'font-size': 11,
                padding: '4px',
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
            selector: ':parent.metaedge',
            style: {
                'border-style': 'dashed',
                'border-color': edgeColor,
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
                // Keep edges above compound parents' bodies so taps on
                // edges that cross a container aren't stolen by the
                // container. Metaedge endpoint edges and membership
                // overlays cross compound boundaries by design.
                'z-compound-depth': 'top',
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
            // Synthetic endpoint edges never carry their own label; the label
            // lives on the metaedge-node between them.
            selector: 'edge.metaedge-endpoint',
            style: {
                label: '',
                'text-background-opacity': 0,
            },
        },
        {
            // Source half of a metaedge is always undirected regardless of
            // the metaedge's own `directed` flag.
            selector: 'edge.metaedge-source',
            style: {
                'target-arrow-shape': 'none',
            },
        },
        {
            selector: 'edge.membership',
            style: {
                width: 1,
                'line-style': 'dotted',
                'line-color': parentBg,
                opacity: 0.5,
                label: '',
                'target-arrow-shape': 'none',
                'curve-style': 'bezier',
                'text-background-opacity': 0,
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
        {
            // Membership edges are normally dimmed so they don't compete with
            // real graph edges; when selected along with their parent, bring
            // them fully forward so the parenthood link reads clearly.
            selector: 'edge.membership.selected',
            style: {
                opacity: 1,
                width: 2,
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
// An element's "identity" for Cytoscape purposes: its group, and for edges
// its endpoints. None of these can be mutated in place, so when any of them
// changes we must remove and re-add the element.
function identityChanged(
    prev: ElementSnapshot,
    next: ElementSnapshot,
): boolean {
    if (prev.group !== next.group) return true;
    if (next.group === 'edges') {
        if (prev.source !== next.source) return true;
        if (prev.target !== next.target) return true;
    }
    return false;
}

function patchGraph(
    cy: Core,
    prev: Map<string, ElementSnapshot>,
    next: ElementDefinition[],
): { addedNodeIds: string[]; structureChanged: boolean } {
    const nextMap = new Map<string, ElementDefinition>();
    const nextSnapshots = new Map<string, ElementSnapshot>();
    for (const el of next) {
        const id = el.data.id;
        if (typeof id !== 'string') continue;
        nextMap.set(id, el);
        nextSnapshots.set(id, snapshot(el));
    }

    const addedNodes: ElementDefinition[] = [];
    const addedEdges: ElementDefinition[] = [];
    const removedIds: string[] = [];
    // Elements that survived by id but whose group/endpoints changed. They
    // need a full remove + re-add so Cytoscape rebuilds them correctly
    // (e.g. when a vertex is re-typed as an edge).
    const replacedIds = new Set<string>();

    for (const id of prev.keys()) {
        if (!nextMap.has(id)) removedIds.push(id);
    }

    for (const [id, nextSnap] of nextSnapshots) {
        const prevSnap = prev.get(id);
        if (!prevSnap) continue;
        if (identityChanged(prevSnap, nextSnap)) replacedIds.add(id);
    }

    const idsToRemove = [...removedIds, ...replacedIds];

    // Detach children from any parent that's about to be removed; otherwise
    // Cytoscape would cascade-remove the children with the parent.
    for (const id of idsToRemove) {
        const prevSnap = prev.get(id);
        if (prevSnap?.group !== 'nodes') continue;
        const node = cy.getElementById(id);
        if (node.empty() || !node.isParent()) continue;
        node.children().forEach((child) => {
            child.move({ parent: null });
        });
    }

    if (idsToRemove.length > 0) {
        const selector = idsToRemove
            .map((id) => `#${CSS.escape(id)}`)
            .join(', ');
        cy.remove(selector);
    }

    for (const [id, def] of nextMap) {
        if (prev.has(id) && !replacedIds.has(id)) continue;
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
        if (replacedIds.has(id)) continue;
        const cyEl = cy.getElementById(id);
        if (cyEl.empty()) continue;

        const nextSnap = nextSnapshots.get(id) ?? snapshot(def);

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
        removedIds.length > 0 ||
        replacedIds.size > 0;

    return {
        addedNodeIds: addedNodes.map((n) => n.data.id!),
        structureChanged,
    };
}

interface GraphProps {
    onSelectElement: (id: string | null) => void;
}

const EVENT_DEBOUNCE_TIME = 100;

const GraphDisplay = ({ onSelectElement }: GraphProps) => {
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

    const trackElementClick = useCallback((_logicalElementId: string) => {
        logRef.current(ActionNames.CLICK_GRAPH_ELEMENT, {
            id: _logicalElementId,
        });
    }, []);
    const trackUserZoom = useMemo(
        () =>
            debounce((_zoom: number) => {
                logRef.current(ActionNames.ZOOM_GRAPH, { zoom: _zoom });
            }, EVENT_DEBOUNCE_TIME),
        [],
    );
    const trackElementDrag = useMemo(
        () =>
            debounce(
                (_elementId: string, _position: { x: number; y: number }) => {
                    logRef.current(ActionNames.DRAG_GRAPH_ELEMENT, {
                        id: _elementId,
                        position: _position,
                    });
                },
                EVENT_DEBOUNCE_TIME,
            ),
        [],
    );
    const trackViewportPan = useMemo(
        () =>
            debounce((_pan: { x: number; y: number }) => {
                logRef.current(ActionNames.PAN_GRAPH, { pan: _pan });
            }, EVENT_DEBOUNCE_TIME),
        [],
    );

    const trackElementClickRef = useRef(trackElementClick);
    trackElementClickRef.current = trackElementClick;
    const trackUserZoomRef = useRef(trackUserZoom);
    trackUserZoomRef.current = trackUserZoom;
    const trackElementDragRef = useRef(trackElementDrag);
    trackElementDragRef.current = trackElementDrag;
    const trackViewportPanRef = useRef(trackViewportPan);
    trackViewportPanRef.current = trackViewportPan;

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
                const el = event.target;
                const id: string = el.id();
                // Membership edges are synthetic overlays for extra parent
                // links; a tap should resolve to the container (parent) the
                // link points to, not the link itself.
                if (isMembershipEdgeId(id)) {
                    const parentId: unknown = el.data('target');
                    const resolved =
                        typeof parentId === 'string' ? parentId : null;
                    handleSelectElement(resolved);
                    if (resolved !== null) {
                        trackElementClickRef.current(resolved);
                    }
                    return;
                }
                // Metaedge endpoint edges are synthetic halves of a metaedge;
                // a tap on either should select the metaedge itself.
                const metaedgeId = metaedgeIdFromSyntheticEdgeId(id);
                if (metaedgeId !== null) {
                    handleSelectElement(metaedgeId);
                    trackElementClickRef.current(metaedgeId);
                    return;
                }
                handleSelectElement(id);
                trackElementClickRef.current(id);
            },
        );

        const notifyUserZoom = () => {
            trackUserZoomRef.current(cy.zoom());
        };
        cy.on('scrollzoom', notifyUserZoom);
        cy.on('pinchzoom', notifyUserZoom);

        cy.on(
            'drag',
            'node, edge',
            (event: EventObjectNode | EventObjectEdge) => {
                const target = event.target;
                let position: { x: number; y: number };
                if (target.group() === 'nodes') {
                    const p = (target as NodeSingular).position();
                    position = { x: p.x, y: p.y };
                } else {
                    const e = target as EdgeSingular;
                    const sp = e.source().position();
                    const tp = e.target().position();
                    position = {
                        x: (sp.x + tp.x) / 2,
                        y: (sp.y + tp.y) / 2,
                    };
                }
                trackElementDragRef.current(target.id(), position);
            },
        );

        // Pan also fires for incidental viewport updates (e.g. around element
        // clicks). Only forward pans that belong to a gesture that started on
        // the graph background, not on a node or edge.
        let viewportPanTrackingEnabled = false;
        cy.on('tapstart', (event: EventObject) => {
            viewportPanTrackingEnabled = event.target === cy;
        });
        cy.on('tapend', () => {
            viewportPanTrackingEnabled = false;
        });
        cy.on('pan', () => {
            if (!viewportPanTrackingEnabled) return;
            const p = cy.pan();
            // `cy.pan()` is a frozen object; Redux/Immer must receive a plain
            // mutable snapshot or nested writes fail during logging.
            trackViewportPanRef.current({ x: p.x, y: p.y });
        });

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

        // If the selected element is a metaedge, its two endpoint edges are
        // part of the same visual unit and should be highlighted and framed
        // together. `getElementById` on a non-existent id returns an empty
        // collection, so for non-metaedges these are harmless no-ops.
        const srcEndpoint = cy.getElementById(
            metaedgeSourceEdgeId(selectedElementId),
        );
        const tgtEndpoint = cy.getElementById(
            metaedgeTargetEdgeId(selectedElementId),
        );
        srcEndpoint.addClass('selected');
        tgtEndpoint.addClass('selected');

        // Membership edges are the dotted overlay links from children to
        // their extra parents. When a container (metavertex/metaedge) is
        // selected, light up every membership edge that points at it so the
        // extra-parent relationships it participates in are visible too.
        const membershipEdges = cy
            .edges('.membership')
            .filter((e) => e.data('target') === selectedElementId);
        membershipEdges.addClass('selected');

        let boundsEles = target;
        if (srcEndpoint.nonempty()) boundsEles = boundsEles.union(srcEndpoint);
        if (tgtEndpoint.nonempty()) boundsEles = boundsEles.union(tgtEndpoint);

        // Compute a zoom that keeps the element visible without zooming all
        // the way in if it's already a comfortable size on screen.
        const bb = boundsEles.boundingBox({});
        const padding = 80;
        const viewport = cy.extent();
        const viewportW = viewport.w;
        const viewportH = viewport.h;
        const fitZoom = Math.min(
            cy.width() / (bb.w + padding * 2),
            cy.height() / (bb.h + padding * 2),
        );
        const elementFitsInView =
            bb.w + padding * 2 <= viewportW && bb.h + padding * 2 <= viewportH;
        const targetZoom = elementFitsInView
            ? cy.zoom()
            : Math.min(fitZoom, cy.zoom());

        cy.stop(true, true);
        cy.animate(
            {
                center: { eles: boundsEles },
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
        <div className={b('display')}>
            <div ref={containerRef} className={b('display-canvas')} />
        </div>
    );
};

export const Graph = ({ onSelectElement }: GraphProps) => {
    const [shouldReconstruct, setShouldReconstruct] = useState(false);

    useEffect(() => {
        if (shouldReconstruct) {
            setShouldReconstruct(false);
        }
    }, [shouldReconstruct]);

    return (
        <div className={b()}>
            {shouldReconstruct ? null : (
                <GraphDisplay onSelectElement={onSelectElement} />
            )}
            <Button
                className={b('reconstruct')}
                variant="normal"
                color="accent"
                size="s"
                onClick={() => setShouldReconstruct(true)}
            >
                Перестроить граф
            </Button>
        </div>
    );
};
