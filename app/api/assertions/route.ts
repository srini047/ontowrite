
import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import { getSelectedProjectTablesDB } from "@/lib/appwrite-project";

type Row = {
  $id: string;
  [key: string]: unknown;
};

type TablesDBClient = Awaited<
  ReturnType<typeof getSelectedProjectTablesDB>
>["tablesDB"];

async function listRows(
  db: TablesDBClient,
  databaseId: string,
  tableId: string,
  queries: string[] = [],
) {
  const result = await db.listRows({
    databaseId,
    tableId,
    queries,
  });

  return result.rows as Row[];
}

async function listAllRows(
  db: TablesDBClient,
  databaseId: string,
  tableId: string,
  baseQueries: string[] = [],
): Promise<Row[]> {
  const rows: Row[] = [];
  let cursor: string | undefined;

  while (true) {
    const queries = [...baseQueries, Query.limit(100)];

    if (cursor) {
      queries.push(Query.cursorAfter(cursor));
    }

    const page = await db.listRows({
      databaseId,
      tableId,
      queries,
      total: false,
    });

    const pageRows = page.rows as Row[];
    rows.push(...pageRows);

    if (pageRows.length < 100) break;

    const lastId = pageRows[pageRows.length - 1]?.$id;

    if (!lastId || lastId === cursor) break;

    cursor = lastId;
  }

  return rows;
}

function text(row: Row, key: string): string {
  const value = row[key];
  return typeof value === "string" ? value : "";
}

async function getEntityClass(
  entityRef: string,
  assertions: Row[],
  classes: Row[],
) {
  const typeAssertion = assertions.find(
    (row) =>
      text(row, "subjectRef") === entityRef &&
      text(row, "predicate") === "rdf:type",
  );

  if (!typeAssertion) return null;

  const typeRef = text(typeAssertion, "objectRef");

  return (
    classes.find((row) => {
      const className = text(row, "name");
      return text(row, "$id") === typeRef || `class:${className}` === typeRef;
    }) ?? null
  );
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        { error: "Request body must be an object." },
        { status: 400 },
      );
    }

    const input = body as Record<string, unknown>;
    const subjectRef = input.subjectRef;
    const predicate = input.predicate;
    const objectRef = input.objectRef;
    const ontologyId = input.ontologyId;

    if (
      typeof subjectRef !== "string" ||
      typeof predicate !== "string" ||
      typeof objectRef !== "string" ||
      typeof ontologyId !== "string" ||
      !subjectRef.trim() ||
      !predicate.trim() ||
      !objectRef.trim() ||
      !ontologyId.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "ontologyId, subjectRef, predicate, and objectRef are required.",
        },
        { status: 400 },
      );
    }

    const { tablesDB, databaseId } = await getSelectedProjectTablesDB();

    const [ontologies, classes, relationships, assertions] = await Promise.all([
      listRows(tablesDB, databaseId, "ontologies", [
        Query.equal("$id", ontologyId),
        Query.limit(1),
      ]),
      listRows(tablesDB, databaseId, "ontology_classes", [
        Query.equal("ontologyId", ontologyId),
      ]),
      listRows(tablesDB, databaseId, "relationship_types", [
        Query.equal("ontologyId", ontologyId),
      ]),
      listAllRows(tablesDB, databaseId, "assertions", [
        Query.equal("ontologyId", ontologyId),
      ]),
    ]);

    if (!ontologies.length) {
      return NextResponse.json(
        { error: "Ontology not found." },
        { status: 404 },
      );
    }

    // Validate rdf:type assertions against an existing class.
    if (predicate === "rdf:type") {
      const className = objectRef.startsWith("class:")
        ? objectRef.slice("class:".length)
        : "";

      const targetClass = classes.find(
        (row) =>
          text(row, "$id") === objectRef || text(row, "name") === className,
      );

      if (!targetClass) {
        return NextResponse.json(
          { error: "The referenced class does not exist in this ontology." },
          { status: 422 },
        );
      }
    } else {
      // For named relationships, validate both endpoint classes.
      const relationship = relationships.find(
        (row) => text(row, "name") === predicate,
      );

      if (relationship) {
        const subjectClass = await getEntityClass(
          subjectRef,
          assertions,
          classes,
        );

        const objectClass = await getEntityClass(
          objectRef,
          assertions,
          classes,
        );

        if (!subjectClass || !objectClass) {
          return NextResponse.json(
            {
              error:
                "Both entities must have an rdf:type assertion before this relationship can be created.",
            },
            { status: 422 },
          );
        }

        if (text(subjectClass, "$id") !== text(relationship, "sourceClassId")) {
          const expectedClass = classes.find(
            (row) =>
              text(row, "$id") === text(relationship, "sourceClassId"),
          );

          return NextResponse.json(
            {
              error: `${predicate} expects a subject of class "${text(
                expectedClass ?? { $id: "", name: "unknown" },
                "name",
              )}".`,
            },
            { status: 422 },
          );
        }

        if (text(objectClass, "$id") !== text(relationship, "targetClassId")) {
          const expectedClass = classes.find(
            (row) =>
              text(row, "$id") === text(relationship, "targetClassId"),
          );

          return NextResponse.json(
            {
              error: `${predicate} expects an object of class "${text(
                expectedClass ?? { $id: "", name: "unknown" },
                "name",
              )}".`,
            },
            { status: 422 },
          );
        }
      }
    }

    const created = await tablesDB.createRow({
      databaseId,
      tableId: "assertions",
      rowId: ID.unique(),
      data: {
        ontologyId,
        subjectRef: subjectRef.trim(),
        predicate: predicate.trim(),
        objectRef: objectRef.trim(),
      },
    });

    return NextResponse.json({ assertion: created }, { status: 201 });
  } catch (error) {
    console.error(
      "[OntoWrite] Create assertion failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return NextResponse.json(
      { error: "Could not create assertion." },
      { status: 500 },
    );
  }
}
