# OntoWrite

**A semantic ontology layer on top of Appwrite.** Define concepts, describe their properties, model relationships between classes, and explore entity connections as a knowledge graph. Appwrite stores the ontology model and semantic assertions; OntoWrite provides a UI and API for working with that model.

## What it does

- **Ontology model:** organize classes such as `Person`, `Organization`, `Department`, and `Project`.
- **Property definitions:** associate properties with a class, including a value type and whether the property is required.
- **Relationship types:** declare connections between source and target classes, such as `worksFor: Person → Organization`.
- **Semantic assertions:** store facts as subject–predicate–object triples, for example `person:alex → worksFor → org:acme`.
- **Assertion validation:** validate class references for `rdf:type` assertions and check the source and target classes for declared relationship types.
- **Knowledge graph:** explore entities and declared relationships on a dedicated, interactive graph page.

## Tech stack

- [Next.js](https://nextjs.org/) App Router
- [Appwrite](https://appwrite.io/) TablesDB for persistence
- [React Flow](https://reactflow.dev/) (`@xyflow/react`) for graph interaction
- [ELK.js](https://github.com/kieler/elkjs) for automatic graph layout
- Tailwind CSS

## Getting started

### Prerequisites

- Node.js and npm installed
- An Appwrite project with permission to create databases, tables, and rows

### Install dependencies

```bash
npm install
```

### Configure environment variables

Create a `.env` file in the project root. Do not commit real credentials.

```dotenv
# Server-side Appwrite credentials
APPWRITE_API_KEY=<your-server-api-key>

# Browser SDK configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://<your-appwrite-endpoint>/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=<your-appwrite-project-id>
```

### Create the Appwrite database and tables

```bash
npm run db:setup
```

The setup script creates the `onto_main` database and these tables:

| Table | Purpose |
|---|---|
| `ontologies` | Ontology name, namespace, version, and description |
| `ontology_classes` | Class definitions, ontology association, optional parent class, and description |
| `ontology_properties` | Property definitions: class ID, property name, value type, and required flag |
| `relationship_types` | Relationship name and its source/target classes |
| `assertions` | Semantic facts represented by ontology ID, subject, predicate, and object |

### Seed the starter ontology

```bash
npx tsx scripts/seed.ts
```

The starter seed creates the Organization Ontology with `Person` and `Organization` classes, initial properties, a `worksFor` relationship, and example assertions for Alex Morgan and Acme Corporation.

The seed script is designed to skip rows that already exist. If a row fails, inspect the terminal output before rerunning it.

### Start the application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- `/` — ontology dashboard, schema editor, and semantic assertions
- `/graph` — interactive knowledge graph with entity search, focus, fit-to-graph, and entity inspection

## Semantic model

OntoWrite uses four main concepts:

### Classes

Classes define concepts such as `Person`, `Organization`, `Department`, or `Project`. A class row has an Appwrite `$id` and an associated `ontologyId`.

### Properties

Properties define attributes associated with a class. For example:

| Class | Property | Type | Required |
|---|---|---|---|
| Person | `name` | `string` | Yes |
| Person | `email` | `string` | No |
| Department | `location` | `string` | No |
| Project | `status` | `string` | Yes |
| Project | `deadline` | `date` | No |

### Relationship types

A relationship type defines which classes can participate in a relationship. For example:

```bash
worksFor: Person → Organization
belongsTo: Department → Organization
contributesTo: Person → Project
```

### Assertions

An assertion stores a semantic statement as a subject, predicate, and object, along with the ontology ID.

```bash
person:alex  → rdf:type  → class:Person
person:alex  → name      → Alex Morgan
person:alex  → worksFor  → org:acme
org:acme     → rdf:type  → class:Organization
```

`rdf:type` identifies the class an entity belongs to. Relationship predicates such as `worksFor` describe how two entities are connected. Literal-valued assertions such as `name` and `status` store attribute values.

## Development commands

```bash
npm run dev       # Start the development server
npm run build     # Build for production
npm run start     # Start the production server
npm run lint      # Run linting (if configured in package.json)
npm run db:setup  # Create Appwrite database and tables
npm run db:seed   # Sample data seeded to the DB
```
