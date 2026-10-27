import "server-only";

export const ontologyTables = {
  classes: {
    tableId: "ontology_classes",
    fields: ["name", "ontologyId", "parentClassId", "description"],
    required: ["name", "ontologyId"],
  },
  properties: {
    tableId: "ontology_properties",
    fields: ["classId", "name", "valueType", "isRequired"],
    required: ["classId", "name", "valueType", "isRequired"],
  },
  relationships: {
    tableId: "relationship_types",
    fields: [
      "ontologyId",
      "name",
      "sourceClassId",
      "targetClassId",
      "description",
    ],
    required: ["ontologyId", "name", "sourceClassId", "targetClassId"],
  },
} as const;

export type OntologyItemKind = keyof typeof ontologyTables;

export function isOntologyItemKind(value: string): value is OntologyItemKind {
  return Object.hasOwn(ontologyTables, value);
}

export function validateOntologyItem(kind: OntologyItemKind, input: unknown) {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { error: "Request body must be an object." };
  }

  const config = ontologyTables[kind];
  const source = input as Record<string, unknown>;
  const data: Record<string, string | boolean> = {};

  for (const key of config.fields) {
    const value = source[key];

    if (value === undefined) continue;

    if (key === "isRequired") {
      if (typeof value !== "boolean") {
        return { error: "isRequired must be a boolean." };
      }
      data[key] = value;
      continue;
    }

    if (typeof value !== "string") {
      return { error: `${key} must be a string.` };
    }

    const normalized = value.trim();

    // Root classes can have an empty parentClassId.
    if (key === "parentClassId" && normalized === "") {
      data[key] = "";
      continue;
    }

    if (!normalized && config.required.some((field) => field === key)) {
      return { error: `${key} is required.` };
    }

    data[key] = normalized;
  }

  for (const key of config.required) {
    if (data[key] === undefined) {
      return { error: `${key} is required.` };
    }
  }

  if (
    kind === "properties" &&
    typeof data.valueType === "string" &&
    !["string", "number", "boolean", "date", "integer"].includes(data.valueType)
  ) {
    return { error: "Unsupported property value type." };
  }

  return { data };
}
