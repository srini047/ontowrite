import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { getSelectedProjectTablesDB } from "@/lib/appwrite-project";

const TABLES = [
  "ontologies",
  "ontology_classes",
  "ontology_properties",
  "relationship_types",
  "assertions",
] as const;

const PAGE_SIZE = 100;

async function listAllRows(
  db: Awaited<ReturnType<typeof getSelectedProjectTablesDB>>["tablesDB"],
  databaseId: string,
  tableId: string,
) {
  const rows: Record<string, unknown>[] = [];
  let cursor: string | undefined;

  while (true) {
    const queries = [Query.limit(PAGE_SIZE)];

    if (cursor) {
      queries.push(Query.cursorAfter(cursor));
    }

    let page;

    try {
      page = await db.listRows({
        databaseId,
        tableId,
        queries,
        total: false,
      });
    } catch (error) {
      const err = error as {
        message?: string;
        code?: number;
        type?: string;
        cause?: {
          message?: string;
          code?: string;
          name?: string;
        };
      };

      console.error("[OntoWrite] Table read failed", {
        tableId,
        databaseId,
        cursor: cursor ?? null,
        message: err.message ?? "Unknown error",
        code: err.code ?? null,
        type: err.type ?? null,
        cause: err.cause
          ? {
              name: err.cause.name,
              message: err.cause.message,
              code: err.cause.code,
            }
          : null,
      });

      throw error;
    }

    rows.push(...(page.rows as Record<string, unknown>[]));

    if (page.rows.length < PAGE_SIZE) break;

    const nextCursor = page.rows[page.rows.length - 1]?.$id;
    if (!nextCursor || nextCursor === cursor) break;

    cursor = nextCursor;
  }

  return rows;
}

export async function GET() {
  try {
    const { tablesDB, databaseId } = await getSelectedProjectTablesDB();

    const ontologies = await listAllRows(tablesDB, databaseId, TABLES[0]);
    const classes = await listAllRows(tablesDB, databaseId, TABLES[1]);
    const properties = await listAllRows(tablesDB, databaseId, TABLES[2]);
    const relationships = await listAllRows(tablesDB, databaseId, TABLES[3]);
    const assertions = await listAllRows(tablesDB, databaseId, TABLES[4]);

    return NextResponse.json({
      ontologies,
      classes,
      properties,
      relationships,
      assertions,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

    if (message === "APPWRITE_CONNECTION_REQUIRED") {
      return NextResponse.json(
        {
          error: "Connect your Appwrite account to access ontology data.",
          code: message,
        },
        { status: 401 },
      );
    }

    if (
      message === "APPWRITE_PROJECT_NOT_SELECTED" ||
      message === "APPWRITE_SELECTED_PROJECT_INVALID"
    ) {
      return NextResponse.json(
        {
          error:
            "Select a valid Appwrite project before accessing ontology data.",
          code: message,
        },
        { status: 409 },
      );
    }

    if (
      message === "APPWRITE_REAUTHORIZATION_REQUIRED" ||
      message === "APPWRITE_TOKEN_REFRESH_FAILED"
    ) {
      return NextResponse.json(
        {
          error: "Your Appwrite connection needs to be renewed.",
          code: message,
        },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { error: "Failed to load ontology data for the selected project." },
      { status: 500 },
    );
  }
}
