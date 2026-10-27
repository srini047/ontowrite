import { NextResponse } from "next/server";
import { DATABASE_ID, tablesDB } from "@/lib/appwrite-server";
import {
  isOntologyItemKind,
  ontologyTables,
  validateOntologyItem,
} from "@/lib/ontology-items";

type Context = {
  params: Promise<{ id: string }>;
};

function getKind(request: Request) {
  const value = new URL(request.url).searchParams.get("kind");
  return value && isOntologyItemKind(value) ? value : null;
}

export async function PATCH(request: Request, context: Context) {
  try {
    const kind = getKind(request);
    const { id } = await context.params;

    if (!kind || !id) {
      return NextResponse.json(
        { error: "A valid kind and ID are required." },
        { status: 400 },
      );
    }

    const input: unknown = await request.json();
    const validated = validateOntologyItem(kind, input);

    if (validated.error || !validated.data) {
      return NextResponse.json(
        { error: validated.error ?? "Invalid data." },
        { status: 400 },
      );
    }

    const row = await tablesDB.updateRow({
      databaseId: DATABASE_ID,
      tableId: ontologyTables[kind].tableId,
      rowId: id,
      data: validated.data,
    });

    return NextResponse.json({ row });
  } catch (error) {
    console.error("Update ontology item failed:", error);

    return NextResponse.json(
      { error: "Could not update ontology item." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    const kind = getKind(request);
    const { id } = await context.params;

    if (!kind || !id) {
      return NextResponse.json(
        { error: "A valid kind and ID are required." },
        { status: 400 },
      );
    }

    await tablesDB.deleteRow({
      databaseId: DATABASE_ID,
      tableId: ontologyTables[kind].tableId,
      rowId: id,
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Delete ontology item failed:", error);

    return NextResponse.json(
      { error: "Could not delete ontology item." },
      { status: 500 },
    );
  }
}
