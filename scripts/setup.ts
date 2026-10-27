import { loadEnvConfig } from "@next/env";
import { Client, TablesDB } from "node-appwrite";

loadEnvConfig(process.cwd());

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;

if (!endpoint || !projectId || !apiKey) {
  throw new Error(
    "Missing APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, or APPWRITE_API_KEY. Check .env.local.",
  );
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const db = new TablesDB(client);

const DATABASE_ID = "onto_main";

type Column = {
  key: string;
  type: "varchar" | "text" | "boolean";
  required: boolean;
  size?: number;
};

const schema: {
  id: string;
  name: string;
  columns: Column[];
}[] = [
  {
    id: "ontologies",
    name: "Ontologies",
    columns: [
      { key: "name", type: "varchar", size: 255, required: true },
      { key: "namespace", type: "varchar", size: 512, required: true },
      { key: "version", type: "varchar", size: 50, required: true },
      { key: "description", type: "text", required: false },
    ],
  },
  {
    id: "ontology_classes",
    name: "Ontology Classes",
    columns: [
      { key: "ontologyId", type: "varchar", size: 36, required: true },
      { key: "name", type: "varchar", size: 255, required: true },
      { key: "parentClassId", type: "varchar", size: 36, required: false },
      { key: "description", type: "text", required: false },
    ],
  },
  {
    id: "ontology_properties",
    name: "Ontology Properties",
    columns: [
      { key: "classId", type: "varchar", size: 36, required: true },
      { key: "name", type: "varchar", size: 255, required: true },
      { key: "valueType", type: "varchar", size: 50, required: true },
      { key: "isRequired", type: "boolean", required: true },
    ],
  },
  {
    id: "relationship_types",
    name: "Relationship Types",
    columns: [
      { key: "ontologyId", type: "varchar", size: 36, required: true },
      { key: "name", type: "varchar", size: 255, required: true },
      { key: "sourceClassId", type: "varchar", size: 36, required: true },
      { key: "targetClassId", type: "varchar", size: 36, required: true },
      { key: "description", type: "text", required: false },
    ],
  },
  {
    id: "assertions",
    name: "Assertions",
    columns: [
      { key: "ontologyId", type: "varchar", size: 36, required: true },
      { key: "subjectRef", type: "varchar", size: 255, required: true },
      { key: "predicate", type: "varchar", size: 255, required: true },
      { key: "objectRef", type: "varchar", size: 255, required: true },
    ],
  },
  {
    id: "appwrite_connections",
    name: "Appwrite Connections",
    columns: [
      { key: "ownerUserId", type: "varchar", size: 36, required: true },
      { key: "appwriteUserId", type: "varchar", size: 36, required: true },
      { key: "accessTokenEncrypted", type: "text", required: true },
      { key: "refreshTokenEncrypted", type: "text", required: false },
      { key: "tokenExpiresAt", type: "varchar", size: 40, required: false },
      { key: "scopes", type: "text", required: true },
      { key: "projects", type: "text", required: true },
      { key: "createdAt", type: "varchar", size: 40, required: true },
      { key: "updatedAt", type: "varchar", size: 40, required: true },
    ],
  },
];

function errorCode(error: unknown): number | undefined {
  return (error as { code?: number })?.code;
}

async function ensureDatabase() {
  try {
    await db.get({ databaseId: DATABASE_ID });
    console.log(`Database exists: ${DATABASE_ID}`);
  } catch (error) {
    if (errorCode(error) !== 404) throw error;

    await db.create({
      databaseId: DATABASE_ID,
      name: "Onto",
    });

    console.log(`Created database: ${DATABASE_ID}`);
  }
}

async function ensureTable(table: (typeof schema)[number]) {
  try {
    await db.getTable({
      databaseId: DATABASE_ID,
      tableId: table.id,
    });
    console.log(`Table exists: ${table.id}`);
  } catch (error) {
    if (errorCode(error) !== 404) throw error;

    await db.createTable({
      databaseId: DATABASE_ID,
      tableId: table.id,
      name: table.name,
    });

    console.log(`Created table: ${table.id}`);
  }

  const result = await db.listColumns({
    databaseId: DATABASE_ID,
    tableId: table.id,
  });

  const existing = new Set(result.columns.map((column) => column.key));

  for (const column of table.columns) {
    if (existing.has(column.key)) {
      console.log(`  Column exists: ${column.key}`);
      continue;
    }

    const common = {
      databaseId: DATABASE_ID,
      tableId: table.id,
      key: column.key,
      required: column.required,
    };

    if (column.type === "varchar") {
      await db.createVarcharColumn({
        ...common,
        size: column.size!,
      });
    } else if (column.type === "text") {
      await db.createTextColumn(common);
    } else {
      await db.createBooleanColumn(common);
    }

    console.log(`  Created column: ${column.key}`);
  }
}

async function main() {
  console.log("Setting up Onto in Appwrite...");

  await ensureDatabase();

  for (const table of schema) {
    await ensureTable(table);
  }

  console.log("\nOnto database setup complete!");
}

main().catch((error) => {
  console.error("Database setup failed:", error);
  process.exitCode = 1;
});
