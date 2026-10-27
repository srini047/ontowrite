import { loadEnvConfig } from "@next/env";
import { Client, TablesDB } from "node-appwrite";

loadEnvConfig(process.cwd(), true);

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;

if (!endpoint || !projectId || !apiKey) {
  throw new Error("Missing Appwrite environment variables in .env");
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const db = new TablesDB(client);

const DATABASE_ID = "onto_main";

async function createRow(
  tableId: string,
  rowId: string,
  data: Record<string, string | boolean>,
) {
  try {
    await db.createRow({
      databaseId: DATABASE_ID,
      tableId,
      rowId,
      data,
    });

    console.log(`Created ${tableId}/${rowId}`);
  } catch (error) {
    const code = (error as { code?: number }).code;

    if (code === 409) {
      console.log(`Already exists: ${tableId}/${rowId}`);
      return;
    }

    throw error;
  }
}

async function main() {
  console.log("Seeding Organization Ontology...");

  // Ontology
  await createRow("ontologies", "org_ontology", {
    name: "Organization Ontology",
    namespace: "https://example.org/ontology/organization#",
    version: "1.0.0",
    description:
      "A starter ontology describing people, organizations, and employment relationships.",
  });

  // Classes
  await createRow("ontology_classes", "class_person", {
    ontologyId: "org_ontology",
    name: "Person",
    parentClassId: "",
    description: "A person in the organization graph.",
  });

  await createRow("ontology_classes", "class_organization", {
    ontologyId: "org_ontology",
    name: "Organization",
    parentClassId: "",
    description: "An organization or company.",
  });

  // Properties
  await createRow("ontology_properties", "prop_person_name", {
    classId: "class_person",
    name: "name",
    valueType: "string",
    isRequired: true,
  });

  await createRow("ontology_properties", "prop_person_email", {
    classId: "class_person",
    name: "email",
    valueType: "string",
    isRequired: false,
  });

  await createRow("ontology_properties", "prop_org_name", {
    classId: "class_organization",
    name: "name",
    valueType: "string",
    isRequired: true,
  });

  // Relationship type
  await createRow("relationship_types", "rel_works_for", {
    ontologyId: "org_ontology",
    name: "worksFor",
    sourceClassId: "class_person",
    targetClassId: "class_organization",
    description: "Connects a person to the organization they work for.",
  });

  // RDF-style assertions: subject -> predicate -> object
  await createRow("assertions", "assert_alex_type", {
    ontologyId: "org_ontology",
    subjectRef: "person:alex",
    predicate: "rdf:type",
    objectRef: "class:Person",
  });

  await createRow("assertions", "assert_alex_name", {
    ontologyId: "org_ontology",
    subjectRef: "person:alex",
    predicate: "name",
    objectRef: "Alex Morgan",
  });

  await createRow("assertions", "assert_alex_works", {
    ontologyId: "org_ontology",
    subjectRef: "person:alex",
    predicate: "worksFor",
    objectRef: "org:acme",
  });

  await createRow("assertions", "assert_acme_type", {
    ontologyId: "org_ontology",
    subjectRef: "org:acme",
    predicate: "rdf:type",
    objectRef: "class:Organization",
  });

  await createRow("assertions", "assert_acme_name", {
    ontologyId: "org_ontology",
    subjectRef: "org:acme",
    predicate: "name",
    objectRef: "Acme Corporation",
  });

  console.log("\nOrganization Ontology seeded successfully!");
}

main().catch((error) => {
  console.error("Seeding failed:", error);
  process.exitCode = 1;
});
