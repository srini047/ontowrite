import { NextRequest, NextResponse } from "next/server";
import { tablesDB, DATABASE_ID } from "@/lib/appwrite-server";

const TABLE_ID = "appwrite_connections";

type StoredProject = {
  id: string;
  name: string;
  region?: string;
  endpoint?: string;
};

export async function GET(request: NextRequest) {
  const connectionId = request.cookies.get("appwrite_connection_id")?.value;

  if (!connectionId) {
    return NextResponse.json(
      {
        connected: false,
        projects: [],
        scopes: [],
        selectedProjectId: null,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const row = await tablesDB.getRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_ID,
      rowId: connectionId,
    });

    const projects = JSON.parse(
      String(row.projects ?? "[]"),
    ) as StoredProject[];

    const scopes = JSON.parse(String(row.scopes ?? "[]")) as string[];

    const storedSelection = String(row.selectedProjectId ?? "");

    const selectedProjectId = projects.some(
      (project) => project.id === storedSelection,
    )
      ? storedSelection
      : null;

    return NextResponse.json(
      {
        connected: true,
        projects: projects.map(({ id, name, region }) => ({
          id,
          name,
          ...(region ? { region } : {}),
        })),
        scopes,
        selectedProjectId,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error(
      "[OAuth] Connection lookup failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return NextResponse.json(
      { error: "Unable to retrieve the Appwrite connection." },
      {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
