"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ELK from "elkjs/lib/elk.bundled.js";

import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Panel,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";

import type { Edge, Node, NodeProps, ReactFlowInstance } from "@xyflow/react";

const elk = new ELK();

type LayoutDirection = "RIGHT" | "DOWN";

type Row = {
  $id: string;
  [key: string]: unknown;
};

type OntologyData = {
  ontologies: Row[];
  classes: Row[];
  properties: Row[];
  relationships: Row[];
  assertions: Row[];
};

type EntityData = {
  label: string;
  ref: string;
  entityType: string;
  direction: LayoutDirection;
};

type EntityNode = Node<EntityData, "entity">;

function field(row: Row, key: string): string {
  const value = row[key];
  return typeof value === "string" ? value : "";
}

function getEntityType(typeRef: string, classes: Row[]) {
  const classRow = classes.find(
    (row) =>
      field(row, "$id") === typeRef ||
      `class:${field(row, "name")}` === typeRef,
  );

  return classRow
    ? field(classRow, "name")
    : typeRef.replace(/^class:/, "") || "Entity";
}

function EntityCardNode({ data, selected }: NodeProps<EntityNode>) {
  const vertical = data.direction === "DOWN";

  return (
    <div
      className={`relative flex h-[96px] w-[240px] flex-col justify-center overflow-hidden rounded-xl border px-4 py-3 shadow-xl transition ${
        selected
          ? "border-ow-accent bg-ow-accent/20 shadow-lg shadow-[var(--ow-accent-soft)]"
          : "border-ow-border bg-ow-raised"
      }`}
    >
      <Handle
        type="target"
        position={vertical ? Position.Top : Position.Left}
        className="!h-3 !w-3 !border-2 !border-ow-raised !bg-ow-accent"
      />

      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-ow-accent">
        {data.entityType}
      </p>

      <p className="truncate text-sm font-semibold text-ow-text">
        {data.label}
      </p>

      <p className="mt-1 truncate font-mono text-[10px] text-ow-subtle">
        {data.ref}
      </p>

      <Handle
        type="source"
        position={vertical ? Position.Bottom : Position.Right}
        className="!h-3 !w-3 !border-2 !border-ow-raised !bg-ow-accent"
      />
    </div>
  );
}

const nodeTypes = {
  entity: EntityCardNode,
};

function buildGraph(
  data: OntologyData,
  direction: LayoutDirection,
): { nodes: EntityNode[]; edges: Edge[] } {
  const typeAssertions = data.assertions.filter(
    (row) => field(row, "predicate") === "rdf:type",
  );

  const nameAssertions = data.assertions.filter(
    (row) => field(row, "predicate") === "name",
  );

  const typeByEntity = new Map<string, string>();

  for (const row of typeAssertions) {
    const subject = field(row, "subjectRef");
    const typeRef = field(row, "objectRef");

    if (subject && typeRef && !typeByEntity.has(subject)) {
      typeByEntity.set(subject, typeRef);
    }
  }

  const nameByEntity = new Map<string, string>();

  for (const row of nameAssertions) {
    const subject = field(row, "subjectRef");
    const name = field(row, "objectRef");

    if (subject && name && !nameByEntity.has(subject)) {
      nameByEntity.set(subject, name);
    }
  }

  const relationshipNames = new Set(
    data.relationships.map((row) => field(row, "name")).filter(Boolean),
  );

  const relationshipAssertions = data.assertions.filter((row) =>
    relationshipNames.has(field(row, "predicate")),
  );

  const entityRefs = new Set(typeByEntity.keys());

  for (const row of relationshipAssertions) {
    const subject = field(row, "subjectRef");
    const object = field(row, "objectRef");

    if (subject) entityRefs.add(subject);
    if (object) entityRefs.add(object);
  }

  const nodes: EntityNode[] = Array.from(entityRefs).map((ref) => {
    const typeRef = typeByEntity.get(ref) ?? "";

    return {
      id: ref,
      type: "entity",
      position: { x: 0, y: 0 },
      data: {
        label: nameByEntity.get(ref) || ref,
        ref,
        entityType: getEntityType(typeRef, data.classes),
        direction,
      },
    };
  });

  const seen = new Set<string>();
  const edges: Edge[] = [];

  for (const row of relationshipAssertions) {
    const source = field(row, "subjectRef");
    const target = field(row, "objectRef");
    const predicate = field(row, "predicate");

    if (!source || !target || !predicate) continue;
    if (!entityRefs.has(source) || !entityRefs.has(target)) continue;

    // One visual edge for each unique semantic triple.
    const key = JSON.stringify([source, predicate, target]);

    if (seen.has(key)) continue;
    seen.add(key);

    edges.push({
      id: key,
      source,
      target,
      type: "smoothstep",
      label: predicate,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "var(--ow-accent)",
      },
      style: {
        stroke: "var(--ow-accent)",
        strokeWidth: 1.8,
      },
      labelStyle: {
        fill: "var(--ow-accent-hover)",
        fontSize: 12,
        fontWeight: 600,
      },
      labelBgStyle: {
        fill: "var(--ow-surface)",
        fillOpacity: 0.95,
      },
    });
  }

  return { nodes, edges };
}

export default function GraphPage() {
  const [data, setData] = useState<OntologyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [layouting, setLayouting] = useState(false);
  const [error, setError] = useState("");
  const [selectedNode, setSelectedNode] = useState<EntityNode | null>(null);
  const [focusId, setFocusId] = useState("");
  const [layoutDirection, setLayoutDirection] =
    useState<LayoutDirection>("RIGHT");

  const flowInstanceRef = useRef<ReactFlowInstance<EntityNode, Edge> | null>(
    null,
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<EntityNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/ontologies", {
        cache: "no-store",
      });

      const result: unknown = await response.json();

      if (!response.ok) {
        const message =
          typeof result === "object" &&
          result !== null &&
          "error" in result &&
          typeof result.error === "string"
            ? result.error
            : "Failed to load ontology data.";

        throw new Error(message);
      }

      if (typeof result !== "object" || result === null) {
        throw new Error("The API returned an invalid response.");
      }

      const payload = result as Record<string, unknown>;

      const keys = [
        "ontologies",
        "classes",
        "properties",
        "relationships",
        "assertions",
      ] as const;

      for (const key of keys) {
        if (!Array.isArray(payload[key])) {
          throw new Error(`The API response is missing "${key}".`);
        }
      }

      setData(payload as OntologyData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load ontology data.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Automatically switch graph orientation for narrow viewports.
  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");

    const updateDirection = () => {
      setLayoutDirection(media.matches ? "DOWN" : "RIGHT");
    };

    updateDirection();
    media.addEventListener("change", updateDirection);

    return () => {
      media.removeEventListener("change", updateDirection);
    };
  }, []);

  // Calculate node positions from the actual graph structure.
  useEffect(() => {
    if (!data) return;

    let cancelled = false;

    async function arrangeGraph() {
      setLayouting(true);

      try {
        const graph = buildGraph(data!, layoutDirection);

        if (graph.nodes.length === 0) {
          if (!cancelled) {
            setNodes([]);
            setEdges([]);
            setSelectedNode(null);
            setFocusId("");
          }
          return;
        }

        const layout = await elk.layout({
          id: "root",
          layoutOptions: {
            "elk.algorithm": "layered",
            "elk.direction": layoutDirection,
            "elk.edgeRouting": "ORTHOGONAL",
            "elk.spacing.nodeNode": "55",
            "elk.layered.spacing.nodeNodeBetweenLayers": "110",
            "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
            "elk.separateConnectedComponents": "true",
            "elk.padding": "[top=48,left=48,bottom=48,right=48]",
          },
          children: graph.nodes.map((node) => ({
            id: node.id,
            width: 240,
            height: 96,
          })),
          edges: graph.edges.map((edge) => ({
            id: edge.id,
            sources: [edge.source],
            targets: [edge.target],
          })),
        });

        if (cancelled) return;

        const positions = new Map(
          (layout.children ?? []).map((child) => [
            child.id,
            {
              x: child.x ?? 0,
              y: child.y ?? 0,
            },
          ]),
        );

        const arrangedNodes = graph.nodes.map((node) => ({
          ...node,
          position: positions.get(node.id) ?? { x: 0, y: 0 },
        }));

        setNodes(arrangedNodes);
        setEdges(graph.edges);

        setSelectedNode((current) => {
          if (!current) return arrangedNodes[0] ?? null;

          return (
            arrangedNodes.find((node) => node.id === current.id) ??
            arrangedNodes[0] ??
            null
          );
        });

        setFocusId((current) =>
          arrangedNodes.some((node) => node.id === current) ? current : "",
        );
      } catch (err) {
        console.error("Graph layout failed:", err);

        if (!cancelled) {
          setError("Could not arrange the knowledge graph. Please refresh.");
        }
      } finally {
        if (!cancelled) {
          setLayouting(false);
        }
      }
    }

    void arrangeGraph();

    return () => {
      cancelled = true;
    };
  }, [data, layoutDirection, setNodes, setEdges]);

  // Frame the graph when its layout changes.
  useEffect(() => {
    if (loading || layouting || nodes.length === 0) return;

    const frame = requestAnimationFrame(() => {
      void flowInstanceRef.current?.fitView({
        padding: 0.2,
        duration: 450,
        maxZoom: 1,
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [loading, layouting, nodes.length, edges.length]);

  const ontology = data?.ontologies[0];

  const selectedConnections = useMemo(() => {
    if (!selectedNode) return [];

    return edges.filter(
      (edge) =>
        edge.source === selectedNode.id || edge.target === selectedNode.id,
    );
  }, [edges, selectedNode]);

  const nodeNameById = useMemo(
    () => new Map(nodes.map((node) => [node.id, node.data.label])),
    [nodes],
  );

  const focusEntity = useCallback(
    (id: string) => {
      setFocusId(id);

      const node = nodes.find((item) => item.id === id);

      if (!node) {
        setSelectedNode(null);
        setNodes((currentNodes) =>
          currentNodes.map((item) => ({ ...item, selected: false })),
        );
        return;
      }

      setSelectedNode(node);
      setNodes((currentNodes) =>
        currentNodes.map((item) => ({
          ...item,
          selected: item.id === id,
        })),
      );

      void flowInstanceRef.current?.fitView({
        nodes: [{ id }],
        padding: 0.6,
        duration: 450,
        maxZoom: 1.2,
      });
    },
    [nodes, setNodes],
  );

  const fitGraph = useCallback(() => {
    void flowInstanceRef.current?.fitView({
      padding: 0.2,
      duration: 450,
      maxZoom: 1,
    });
  }, []);

  const refreshGraph = useCallback(async () => {
    await loadData();
  }, [loadData]);

  return (
    <main className="min-h-screen min-w-0 bg-ow-bg px-3 py-5 text-ow-text sm:px-6 sm:py-7 lg:px-8">
      <div className="mx-auto max-w-[1800px]">
        {/* Page heading and controls */}
        <section className="mb-6 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-ow-accent">
              Ontology visualization
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Knowledge graph
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-ow-muted">
              Explore entities, inspect their semantic relationships, and
              navigate your Appwrite knowledge model.
            </p>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto] xl:w-auto">
            <select
              aria-label="Find an entity"
              value={focusId}
              onChange={(event) => focusEntity(event.target.value)}
              className="min-w-0 rounded-lg border border-ow-border bg-ow-surface px-3 py-2.5 text-sm text-ow-text outline-none focus:border-ow-accent sm:w-64"
            >
              <option value="">Find an entity...</option>
              {nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.data.label} — {node.data.entityType}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => void refreshGraph()}
              disabled={loading}
              className="rounded-lg bg-ow-accent px-4 py-2.5 text-sm font-semibold text-[var(--ow-accent-contrast)] transition hover:bg-ow-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </section>

        {/* Ontology summary */}
        {ontology && (
          <section className="mb-5 flex flex-col gap-4 rounded-xl border border-ow-border bg-ow-surface px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="min-w-0">
              <p className="text-xs font-bold tracking-widest text-ow-subtle">
                ACTIVE ONTOLOGY
              </p>

              <h2 className="mt-1 break-words font-semibold">
                {field(ontology, "name")}
              </h2>

              <p className="mt-1 break-all text-xs text-ow-subtle">
                {field(ontology, "namespace")}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-5 sm:gap-8">
              <div>
                <p className="text-xs text-ow-subtle">Entities</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {nodes.length}
                </p>
              </div>

              <div>
                <p className="text-xs text-ow-subtle">Connections</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {edges.length}
                </p>
              </div>

              <div>
                <p className="text-xs text-ow-subtle">Classes</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {data?.classes.length ?? 0}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Errors */}
        {error && (
          <div
            role="alert"
            className="mb-5 flex flex-col gap-3 rounded-xl border border-[var(--ow-danger)]/20 bg-[var(--ow-danger-bg)] p-4 text-sm text-[var(--ow-danger)] sm:flex-row sm:items-center sm:justify-between"
          >
            <p>{error}</p>

            <button
              type="button"
              onClick={() => void refreshGraph()}
              className="shrink-0 underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        )}

        {/* Main graph and entity inspector */}
        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="min-w-0 overflow-hidden rounded-2xl border border-ow-border bg-ow-surface">
            <div className="flex flex-col gap-3 border-b border-ow-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div>
                <h2 className="font-semibold">Entity connections</h2>
                <p className="mt-1 text-xs leading-5 text-ow-subtle">
                  Drag nodes · Scroll to zoom · Select a node to inspect it
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-ow-muted">
                <span className="h-2 w-2 rounded-full bg-ow-accent" />
                Declared ontology relationships
              </div>
            </div>

            <div className="relative h-[65dvh] min-h-[420px] max-h-[1000px] w-full sm:h-[72dvh]">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onInit={(instance) => {
                  flowInstanceRef.current = instance;
                }}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={(_, node) => {
                  const entityNode = node as EntityNode;
                  setSelectedNode(entityNode);
                  setFocusId(entityNode.id);
                }}
                onPaneClick={() => {
                  setSelectedNode(null);
                  setFocusId("");
                  setNodes((currentNodes) =>
                    currentNodes.map((node) => ({ ...node, selected: false })),
                  );
                }}
                fitView
                fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
                minZoom={0.04}
                maxZoom={1.8}
                colorMode="dark"
                nodesConnectable={false}
                elementsSelectable
                deleteKeyCode={null}
                proOptions={{ hideAttribution: true }}
                onlyRenderVisibleElements
              >
                <Background
                  variant={BackgroundVariant.Dots}
                  gap={22}
                  size={1}
                  color="var(--ow-border-subtle)"
                />

                <Controls
                  showInteractive={false}
                  className="!overflow-hidden !rounded-lg !border !border-ow-border !bg-ow-raised [&>button]:!border-ow-border [&>button]:!fill-ow-text"
                />

                <MiniMap
                  pannable
                  zoomable
                  nodeColor={(node) =>
                    node.id === selectedNode?.id
                      ? "var(--ow-accent-hover)"
                      : "var(--ow-accent)"
                  }
                  maskColor="var(--ow-minimap-mask, rgba(5, 8, 12, 0.72))"
                  className="!hidden !border !border-ow-border !bg-ow-surface sm:!block"
                />

                <Panel position="top-right">
                  <button
                    type="button"
                    onClick={fitGraph}
                    className="rounded-lg border border-ow-border bg-ow-raised px-3 py-2 text-xs font-medium text-ow-text shadow-lg backdrop-blur hover:border-ow-accent/50 hover:text-ow-accent"
                  >
                    Fit to view
                  </button>
                </Panel>
              </ReactFlow>

              {(loading || layouting) && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-ow-surface/75 backdrop-blur-[2px]">
                  <div className="flex items-center gap-3 rounded-xl border border-ow-border bg-ow-raised px-4 py-3 shadow-xl">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-ow-accent/30 border-t-ow-accent" />
                    <span className="text-sm text-ow-muted">
                      {loading ? "Loading ontology..." : "Organizing graph..."}
                    </span>
                  </div>
                </div>
              )}

              {!loading && !error && !layouting && nodes.length === 0 && (
                <div className="absolute inset-0 z-10 flex items-center justify-center px-5">
                  <div className="max-w-sm rounded-2xl border border-ow-border bg-ow-raised p-6 text-center shadow-xl">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-ow-accent/10 text-ow-accent">
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <g clipPath="url(#a)">
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M10.27 14.1a6.5 6.5 0 0 0 3.67-3.45q-1.24.21-2.7.34-.31 1.83-.97 3.1M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m.48-1.52a7 7 0 0 1-.96 0H7.5a4 4 0 0 1-.84-1.32q-.38-.89-.63-2.08a40 40 0 0 0 3.92 0q-.25 1.2-.63 2.08a4 4 0 0 1-.84 1.31zm2.94-4.76q1.66-.15 2.95-.43a7 7 0 0 0 0-2.58q-1.3-.27-2.95-.43a18 18 0 0 1 0 3.44m-1.27-3.54a17 17 0 0 1 0 3.64 39 39 0 0 1-4.3 0 17 17 0 0 1 0-3.64 39 39 0 0 1 4.3 0m1.1-1.17q1.45.13 2.69.34a6.5 6.5 0 0 0-3.67-3.44q.65 1.26.98 3.1M8.48 1.5l.01.02q.41.37.84 1.31.38.89.63 2.08a40 40 0 0 0-3.92 0q.25-1.2.63-2.08a4 4 0 0 1 .85-1.32 7 7 0 0 1 .96 0m-2.75.4a6.5 6.5 0 0 0-3.67 3.44 29 29 0 0 1 2.7-.34q.31-1.83.97-3.1M4.58 6.28q-1.66.16-2.95.43a7 7 0 0 0 0 2.58q1.3.27 2.95.43a18 18 0 0 1 0-3.44m.17 4.71q-1.45-.12-2.69-.34a6.5 6.5 0 0 0 3.67 3.44q-.65-1.27-.98-3.1"
                            fill="#666"
                          />
                        </g>
                        <defs>
                          <clipPath id="a">
                            <rect width="16" height="16" fill="white" />
                          </clipPath>
                        </defs>
                      </svg>
                    </div>

                    <h3 className="mt-4 font-semibold">Your graph is empty</h3>

                    <p className="mt-2 text-sm leading-6 text-ow-muted">
                      Create typed entities using rdf:type assertions and
                      connect them with declared relationship types.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ow-border px-4 py-3 text-xs text-ow-subtle sm:px-5">
              <span>
                {layoutDirection === "RIGHT"
                  ? "Horizontal layout"
                  : "Vertical layout"}
              </span>

              <span>
                {nodes.length} nodes · {edges.length} unique connections
              </span>
            </div>
          </section>

          {/* Inspector */}
          <aside className="flex min-w-0 flex-col gap-5">
            <section className="rounded-2xl border border-ow-border bg-ow-surface p-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-ow-accent">
                Entity inspector
              </p>

              {selectedNode ? (
                <>
                  <h2 className="mt-4 break-words text-xl font-semibold">
                    {selectedNode.data.label}
                  </h2>

                  <span className="mt-2 inline-block max-w-full break-words rounded-full border border-ow-accent/20 bg-ow-accent/10 px-2.5 py-1 text-xs text-ow-accent">
                    {selectedNode.data.entityType}
                  </span>

                  <p className="mt-5 text-xs font-medium tracking-wider text-ow-subtle">
                    ENTITY REFERENCE
                  </p>

                  <p className="mt-1 break-all font-mono text-xs leading-5 text-ow-muted">
                    {selectedNode.data.ref}
                  </p>

                  <div className="my-5 border-t border-ow-border" />

                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold">Connections</h3>
                    <span className="text-xs tabular-nums text-ow-subtle">
                      {selectedConnections.length}
                    </span>
                  </div>

                  <div className="mt-3 space-y-3">
                    {selectedConnections.map((edge) => {
                      const outgoing = edge.source === selectedNode.id;
                      const otherId = outgoing ? edge.target : edge.source;

                      return (
                        <button
                          key={edge.id}
                          type="button"
                          onClick={() => focusEntity(otherId)}
                          className="w-full rounded-xl border border-ow-border bg-ow-surface-muted p-3 text-left transition hover:border-ow-accent/30 hover:bg-ow-accent/5"
                        >
                          <p className="text-[10px] font-semibold tracking-wider text-ow-subtle">
                            {outgoing ? "OUTGOING" : "INCOMING"}
                          </p>

                          <p className="my-1 break-words text-sm font-semibold text-ow-accent">
                            {String(edge.label ?? "relatedTo")}
                          </p>

                          <p className="break-words text-sm text-ow-muted">
                            {nodeNameById.get(otherId) || otherId}
                          </p>

                          <p className="mt-2 text-xs text-ow-subtle">
                            View connected entity →
                          </p>
                        </button>
                      );
                    })}

                    {selectedConnections.length === 0 && (
                      <p className="rounded-lg border border-dashed border-ow-border p-3 text-sm leading-6 text-ow-subtle">
                        No declared relationship connections for this entity.
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <p className="mt-4 text-sm leading-6 text-ow-muted">
                  Select a node to inspect its type, reference, and incoming or
                  outgoing relationships.
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-ow-border bg-ow-surface p-5">
              <h2 className="font-semibold">How to read the graph</h2>

              <div className="mt-4 space-y-3 text-sm leading-6 text-ow-muted">
                <p>
                  <span className="font-semibold text-ow-accent">Nodes</span>{" "}
                  represent entities identified by your assertions.
                </p>

                <p>
                  <span className="font-semibold text-ow-accent">Arrows</span>{" "}
                  represent assertions with predicates defined as relationship
                  types.
                </p>

                <p>
                  <span className="font-semibold text-ow-accent">
                    Direction
                  </span>{" "}
                  follows the subject-to-object relationship.
                </p>

                <p>
                  <span className="font-semibold text-ow-accent">Layout</span>{" "}
                  is recalculated when the ontology data or screen orientation
                  changes.
                </p>
              </div>
            </section>

            <div className="rounded-xl border border-ow-border bg-ow-surface p-4">
              <p className="text-sm font-medium">Navigation tips</p>
              <p className="mt-2 text-xs leading-5 text-ow-subtle">
                Drag to reposition nodes, scroll or pinch to zoom, and use the
                entity search to focus on a specific part of a large graph.
              </p>

              <button
                type="button"
                onClick={fitGraph}
                disabled={nodes.length === 0}
                className="mt-4 w-full rounded-lg bg-ow-accent px-4 py-2.5 text-sm font-semibold text-[var(--ow-accent-contrast)] transition hover:bg-ow-accent-hover disabled:opacity-50"
              >
                Reset graph view
              </button>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
