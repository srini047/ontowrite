import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { DATABASE_ID, tablesDB } from "@/lib/appwrite-server";

const TABLES = [
  "ontologies",
  "ontology_classes",
  "ontology_properties",
  "relationship_types",
  "assertions",
] as const;

const PAGE_SIZE = 100;

async function listAllRows(tableId: string) {
  const rows: Record<string, unknown>[] = [];
  let cursor: string | undefined;

  while (true) {
    const queries = [Query.limit(PAGE_SIZE)];

    if (cursor) {
      queries.push(Query.cursorAfter(cursor));
    }

    const page = await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId,
      queries,
      total: false,
    });

    rows.push(...(page.rows as Record<string, unknown>[]));

    if (page.rows.length < PAGE_SIZE) break;

    const lastRow = page.rows[page.rows.length - 1];
    const nextCursor = lastRow?.$id;

    if (!nextCursor || nextCursor === cursor) break;

    cursor = nextCursor;
  }

  return rows;
}

export async function GET() {
  try {
    const [ontologies, classes, properties, relationships, assertions] =
      await Promise.all(TABLES.map(listAllRows));

    return NextResponse.json({
      ontologies,
      classes,
      properties,
      relationships,
      assertions,
    });
  } catch (error) {
    console.error("Failed to load ontology:", error);

    return NextResponse.json(
      { error: "Failed to load ontology data." },
      { status: 500 },
    );
  }
}
