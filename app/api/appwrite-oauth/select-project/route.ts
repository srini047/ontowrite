import { NextRequest, NextResponse } from "next/server";
import { DATABASE_ID, tablesDB } from "@/lib/appwrite-server";

const TABLE_ID = "appwrite_connections";

type StoredProject = {
  id: string;
  name: string;
  region?: string;
  endpoint?: string;
};

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (origin !== request.nextUrl.origin) {
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 },
    );
  }

  const connectionId = request.cookies.get("appwrite_connection_id")?.value;

  if (!connectionId) {
    return NextResponse.json(
      { error: "Connect an Appwrite account first." },
      { status: 401 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("projectId" in body) ||
    typeof body.projectId !== "string" ||
    !body.projectId.trim()
  ) {
    return NextResponse.json(
      { error: "A valid projectId is required." },
      { status: 400 },
    );
  }

  try {
    const connection = await tablesDB.getRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_ID,
      rowId: connectionId,
    });

    const projects = JSON.parse(
      String(connection.projects ?? "[]"),
    ) as StoredProject[];

    const selectedProject = projects.find(
      (project) => project.id === body.projectId,
    );

    if (!selectedProject) {
      return NextResponse.json(
        { error: "That project is not authorized by this connection." },
        { status: 403 },
      );
    }

    await tablesDB.updateRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_ID,
      rowId: connectionId,
      data: {
        selectedProjectId: selectedProject.id,
        updatedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        selectedProjectId: selectedProject.id,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error(
      "[OAuth] Project selection failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return NextResponse.json(
      { error: "Unable to save the selected project." },
      { status: 500 },
    );
  }
}
