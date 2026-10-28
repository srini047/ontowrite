import { NextResponse } from "next/server";
import { ID } from "node-appwrite";
import { getSelectedProjectTablesDB } from "@/lib/appwrite-project";
import {
  isOntologyItemKind,
  ontologyTables,
  validateOntologyItem,
} from "@/lib/ontology-items";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (
      typeof body !== "object" ||
      body === null ||
      !("kind" in body) ||
      typeof body.kind !== "string" ||
      !isOntologyItemKind(body.kind) ||
      !("data" in body)
    ) {
      return NextResponse.json(
        { error: "Invalid kind or request body." },
        { status: 400 },
      );
    }

    const { kind, data: input } = body;
    const validated = validateOntologyItem(kind, input);

    if (validated.error || !validated.data) {
      return NextResponse.json(
        { error: validated.error ?? "Invalid data." },
        { status: 400 },
      );
    }

    const { tablesDB, databaseId } = await getSelectedProjectTablesDB();

    const row = await tablesDB.createRow({
      databaseId: databaseId,
      tableId: ontologyTables[kind].tableId,
      rowId: ID.unique(),
      data: validated.data,
    });

    return NextResponse.json({ row }, { status: 201 });
  } catch (error) {
    console.error("Create ontology item failed:", error);

    return NextResponse.json(
      { error: "Could not create ontology item." },
      { status: 500 },
    );
  }
}
