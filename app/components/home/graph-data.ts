export type EntityClass = "Person" | "Department" | "Organization" | "Project";

export type GraphNode = {
  id: string;
  cls: EntityClass;
  label: string;
  ref: string;
  x: number;
  y: number;
};

export type GraphEdge = {
  id: string;
  source: string;
  target: string;
  predicate: string;
};

export const NODE_W = 200;
export const NODE_H = 76;
export const VIEW_W = 880;
export const VIEW_H = 396;

// Dummy "Organization Ontology" data, laid out in three layers the way ELK's
// layered algorithm arranges the real graph (sources left, targets right).
export const NODES: GraphNode[] = [
  { id: "sara", cls: "Person", label: "Sara Kim", ref: "person:sara", x: 10, y: 28 },
  { id: "ivan", cls: "Person", label: "Ivan Petrov", ref: "person:ivan", x: 10, y: 292 },

  { id: "data", cls: "Department", label: "Data Science", ref: "dept:data", x: 340, y: 28 },
  { id: "priya", cls: "Person", label: "Priya Rao", ref: "person:priya", x: 340, y: 160 },
  { id: "nova", cls: "Project", label: "Project Nova", ref: "project:nova", x: 340, y: 292 },

  { id: "acme", cls: "Organization", label: "Acme Corporation", ref: "org:acme", x: 670, y: 28 },
  { id: "globex", cls: "Organization", label: "Globex Corporation", ref: "org:globex", x: 670, y: 160 },
  { id: "apollo", cls: "Project", label: "Project Apollo", ref: "project:apollo", x: 670, y: 292 },
];

export const EDGES: GraphEdge[] = [
  { id: "e1", source: "sara", target: "data", predicate: "manages" },
  { id: "e2", source: "sara", target: "priya", predicate: "reportsTo" },
  { id: "e3", source: "ivan", target: "priya", predicate: "reportsTo" },
  { id: "e4", source: "ivan", target: "nova", predicate: "contributesTo" },
  { id: "e5", source: "data", target: "acme", predicate: "belongsTo" },
  { id: "e6", source: "priya", target: "acme", predicate: "worksFor" },
  { id: "e7", source: "nova", target: "globex", predicate: "ownedBy" },
  { id: "e8", source: "nova", target: "apollo", predicate: "dependsOn" },
];
