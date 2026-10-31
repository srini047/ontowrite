"use client";

import { useMemo, useState } from "react";
import {
  EDGES,
  NODES,
  NODE_H,
  NODE_W,
  VIEW_H,
  VIEW_W,
  type GraphEdge,
  type GraphNode,
} from "./graph-data";

const nodeById = new Map(NODES.map((node) => [node.id, node]));

function edgeGeometry(edge: GraphEdge) {
  const source = nodeById.get(edge.source)!;
  const target = nodeById.get(edge.target)!;

  const x1 = source.x + NODE_W;
  const y1 = source.y + NODE_H / 2;
  const x2 = target.x;
  const y2 = target.y + NODE_H / 2;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;

  const path =
    y1 === y2 ? `M${x1} ${y1} L${x2} ${y2}` : `M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`;

  return { x1, y1, x2, y2, mx, my, path };
}

const geometry = new Map(EDGES.map((edge) => [edge.id, edgeGeometry(edge)]));

type Triple = {
  subject: string;
  predicate: string;
  object: string;
  /** The entity to focus when the other end of the triple is clicked. */
  otherId?: string;
  otherSide?: "subject" | "object";
};

function triplesFor(node: GraphNode): Triple[] {
  const rows: Triple[] = [
    {
      subject: node.ref,
      predicate: "rdf:type",
      object: `class:${node.cls}`,
    },
  ];

  for (const edge of EDGES) {
    if (edge.source === node.id) {
      const other = nodeById.get(edge.target)!;
      rows.push({
        subject: node.ref,
        predicate: edge.predicate,
        object: other.ref,
        otherId: other.id,
        otherSide: "object",
      });
    } else if (edge.target === node.id) {
      const other = nodeById.get(edge.source)!;
      rows.push({
        subject: other.ref,
        predicate: edge.predicate,
        object: node.ref,
        otherId: other.id,
        otherSide: "subject",
      });
    }
  }

  return rows;
}

export default function GraphPreview() {
  const [selectedId, setSelectedId] = useState("priya");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const activeId = hoveredId ?? selectedId;
  const activeNode = nodeById.get(activeId)!;

  const neighbours = useMemo(() => {
    const ids = new Set<string>([activeId]);
    for (const edge of EDGES) {
      if (edge.source === activeId) ids.add(edge.target);
      if (edge.target === activeId) ids.add(edge.source);
    }
    return ids;
  }, [activeId]);

  const triples = useMemo(() => triplesFor(activeNode), [activeNode]);

  return (
    <figure className="overflow-hidden rounded-2xl border border-ow-border bg-ow-surface shadow-[0_24px_80px_rgb(0_0_0/35%)]">
      <style>{`
        @keyframes ow-draw { from { stroke-dashoffset: 700; } to { stroke-dashoffset: 0; } }
        @keyframes ow-flow { to { stroke-dashoffset: -20; } }
        .ow-edge-draw { stroke-dasharray: 700; animation: ow-draw 1.1s ease-out both; }
        .ow-edge-flow { stroke-dasharray: 3 17; animation: ow-flow 0.8s linear infinite; }
      `}</style>

      {/* Toolbar, mirroring the real /graph page controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ow-border px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="ow-status">
            <span className="ow-status-dot" />
            Organization Ontology
          </span>
          <span className="hidden text-xs text-ow-subtle sm:inline">
            {NODES.length} entities, {EDGES.length} relationships
          </span>
        </div>

        <label className="flex items-center gap-2 text-xs text-ow-subtle">
          <span>Focus entity</span>
          <select
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
            className="rounded-lg border border-ow-border bg-ow-bg px-3 py-1.5 text-sm text-ow-text outline-none focus:border-ow-accent"
          >
            {NODES.map((node) => (
              <option key={node.id} value={node.id}>
                {node.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* Graph canvas */}
        <div
          className="overflow-x-auto border-b border-ow-border lg:border-b-0 lg:border-r"
          style={{
            backgroundImage:
              "radial-gradient(rgb(255 255 255 / 6%) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        >
          <svg
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            className="block h-auto w-full min-w-[720px] p-2"
            role="group"
            aria-label="Sample knowledge graph of people, departments, projects and organizations. Select an entity to inspect its relationships."
            onMouseLeave={() => setHoveredId(null)}
          >
            <defs>
              <marker
                id="ow-arrow"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="9"
                markerHeight="9"
                markerUnits="userSpaceOnUse"
                orient="auto"
              >
                <path d="M0 1 L10 5 L0 9 z" className="fill-ow-accent" />
              </marker>
            </defs>

            {/* Edges sit under the nodes */}
            {EDGES.map((edge) => {
              const g = geometry.get(edge.id)!;
              const isActive = edge.source === activeId || edge.target === activeId;
              const labelWidth = edge.predicate.length * 6.6 + 16;

              return (
                <g
                  key={edge.id}
                  style={{
                    opacity: isActive ? 1 : 0.18,
                    transition: "opacity 180ms ease",
                  }}
                >
                  <path
                    d={g.path}
                    fill="none"
                    strokeWidth={isActive ? 2 : 1.5}
                    className="stroke-ow-accent ow-edge-draw"
                    markerEnd="url(#ow-arrow)"
                  />
                  {isActive ? (
                    <path
                      d={g.path}
                      fill="none"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      className="stroke-ow-accent-hover ow-edge-flow"
                    />
                  ) : null}
                  <circle cx={g.x1} cy={g.y1} r={3.5} className="fill-ow-accent" />
                  <rect
                    x={g.mx - labelWidth / 2}
                    y={g.my - 11}
                    width={labelWidth}
                    height={22}
                    rx={6}
                    className="fill-ow-surface"
                  />
                  <text
                    x={g.mx}
                    y={g.my + 4}
                    textAnchor="middle"
                    fontSize={12}
                    fontWeight={600}
                    className="fill-ow-text"
                  >
                    {edge.predicate}
                  </text>
                </g>
              );
            })}

            {NODES.map((node) => {
              const isSelected = node.id === selectedId;
              const isActive = node.id === activeId;
              const isNeighbour = neighbours.has(node.id);

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x} ${node.y})`}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  aria-label={`${node.cls}: ${node.label}`}
                  onClick={() => setSelectedId(node.id)}
                  onMouseEnter={() => setHoveredId(node.id)}
                  onFocus={() => setHoveredId(node.id)}
                  onBlur={() => setHoveredId(null)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedId(node.id);
                    }
                  }}
                  className="cursor-pointer outline-none [&:focus-visible>rect]:stroke-ow-accent"
                  style={{
                    opacity: isNeighbour ? 1 : 0.4,
                    transition: "opacity 180ms ease",
                  }}
                >
                  <rect
                    width={NODE_W}
                    height={NODE_H}
                    rx={14}
                    strokeWidth={isActive ? 1.5 : 1}
                    className={`fill-ow-raised ${
                      isActive ? "stroke-ow-accent" : "stroke-ow-border"
                    }`}
                  />
                  <text
                    x={20}
                    y={26}
                    fontSize={10}
                    fontWeight={700}
                    letterSpacing={2}
                    className="fill-ow-accent"
                  >
                    {node.cls.toUpperCase()}
                  </text>
                  <text
                    x={20}
                    y={48}
                    fontSize={16}
                    fontWeight={600}
                    className="fill-ow-text"
                  >
                    {node.label}
                  </text>
                  <text
                    x={20}
                    y={66}
                    fontSize={11}
                    className="fill-ow-subtle font-mono"
                  >
                    {node.ref}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Entity inspector */}
        <figcaption className="flex min-w-0 flex-col p-5">
          <p className="text-xs font-semibold text-ow-subtle">Entity inspector</p>
          <p className="mt-2 text-lg font-semibold text-ow-text">
            {activeNode.label}
          </p>
          <p className="mt-0.5 font-mono text-xs text-ow-accent">
            {activeNode.ref}
          </p>

          <ul className="mt-5 flex flex-col gap-2" aria-live="polite">
            {triples.map((triple) => (
              <li
                key={`${triple.subject}-${triple.predicate}-${triple.object}`}
                className="ow-scope flex flex-wrap items-center gap-x-1.5 gap-y-1"
              >
                <TripleTerm
                  value={triple.subject}
                  onSelect={
                    triple.otherSide === "subject" && triple.otherId
                      ? () => setSelectedId(triple.otherId!)
                      : undefined
                  }
                />
                <span className="text-ow-subtle">→</span>
                <span className="text-ow-accent">{triple.predicate}</span>
                <span className="text-ow-subtle">→</span>
                <TripleTerm
                  value={triple.object}
                  onSelect={
                    triple.otherSide === "object" && triple.otherId
                      ? () => setSelectedId(triple.otherId!)
                      : undefined
                  }
                />
              </li>
            ))}
          </ul>

          <p className="mt-auto pt-5 text-xs leading-5 text-ow-subtle">
            Sample data. Hover or select an entity, then follow a link to move
            along the graph.
          </p>
        </figcaption>
      </div>
    </figure>
  );
}

function TripleTerm({
  value,
  onSelect,
}: {
  value: string;
  onSelect?: () => void;
}) {
  if (!onSelect) return <span className="text-ow-text">{value}</span>;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="rounded text-ow-text underline decoration-ow-border underline-offset-4 transition hover:text-ow-accent hover:decoration-ow-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-ow-accent"
    >
      {value}
    </button>
  );
}
