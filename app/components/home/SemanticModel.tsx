"use client";

import { useState } from "react";
import SectionHeading from "./SectionHeading";

type Tone = "text" | "accent" | "muted" | "subtle";
type Token = [text: string, tone: Tone];

const toneClass: Record<Tone, string> = {
  text: "text-ow-text",
  accent: "text-ow-accent",
  muted: "text-ow-muted",
  subtle: "text-ow-subtle",
};

function CodeBlock({ lines, label }: { lines: Token[][]; label: string }) {
  return (
    <pre
      aria-label={label}
      className="overflow-x-auto rounded-xl border border-ow-border bg-ow-bg p-4 font-mono text-[13px] leading-7"
    >
      <code>
        {lines.map((line, lineIndex) => (
          <span key={lineIndex} className="block whitespace-pre">
            {line.map(([text, tone], tokenIndex) => (
              <span key={tokenIndex} className={toneClass[tone]}>
                {text}
              </span>
            ))}
          </span>
        ))}
      </code>
    </pre>
  );
}

const relationalLines: Token[][] = [
  [["employees", "accent"]],
  [
    ["  id      ", "text"],
    ["text  ", "muted"],
    ["primary key", "subtle"],
  ],
  [
    ["  name    ", "text"],
    ["text", "muted"],
  ],
  [
    ["  org_id  ", "text"],
    ["text  ", "muted"],
    ["foreign key → organizations.id", "subtle"],
  ],
  [[" ", "text"]],
  [
    ["alex  ", "text"],
    ["Alex Morgan  ", "muted"],
    ["acme", "text"],
  ],
];

const ontologyLines: Token[][] = [
  [
    ["relationship  ", "subtle"],
    ["worksFor", "accent"],
    [" : Person → Organization", "text"],
  ],
  [[" ", "text"]],
  [
    ["person:alex  ", "text"],
    ["→ ", "subtle"],
    ["rdf:type  ", "accent"],
    ["→ ", "subtle"],
    ["class:Person", "text"],
  ],
  [
    ["person:alex  ", "text"],
    ["→ ", "subtle"],
    ["worksFor  ", "accent"],
    ["→ ", "subtle"],
    ["org:acme", "text"],
  ],
  [
    ["org:acme     ", "text"],
    ["→ ", "subtle"],
    ["rdf:type  ", "accent"],
    ["→ ", "subtle"],
    ["class:Organization", "text"],
  ],
];

/* ---------- Comparison table ---------- */

const comparison: { topic: string; keys: string; ontology: string }[] = [
  {
    topic: "What a link means",
    keys: "org_id points at a row in organizations. Whether that means employed by, owned by or founded by lives in the column name and the team's memory.",
    ontology:
      "The link is a named relationship such as worksFor, stored as data with a direction.",
  },
  {
    topic: "Several links between the same things",
    keys: "Each one needs its own column or join table, and nothing records how manager_id differs from mentor_id beyond the name.",
    ontology:
      "Each is its own relationship type with declared source and target classes.",
  },
  {
    topic: "What kind of thing a row is",
    keys: "Implied by the table it sits in.",
    ontology:
      "Stated with rdf:type, so an entity's class is a fact you can query and validate.",
  },
  {
    topic: "Adding a new kind of connection",
    keys: "A schema change: a new column or join table, a migration, and updated queries.",
    ontology: "Declare a relationship type. It is a new row, not a migration.",
  },
  {
    topic: "Following connections",
    keys: "A different join for each relationship you want to traverse.",
    ontology:
      "Every fact has the same subject, predicate, object shape, so one traversal covers all of them. The graph view is exactly that.",
  },
  {
    topic: "Where the meaning lives",
    keys: "In application code, documentation and naming conventions.",
    ontology:
      "In the data itself, where people, queries and AI can all read it.",
  },
];

/* ---------- AI demo ---------- */

const aiPoints = [
  {
    title: "Less guessing",
    body: "A model reading owner_id has to infer what it refers to. A model reading ownedBy: Project → Organization is told.",
  },
  {
    title: "A map of what is possible",
    body: "Declared source and target classes tell an agent which questions make sense and which relationships can exist at all.",
  },
  {
    title: "Honest gaps and checkable writes",
    body: "If the model defines no such relationship, an agent can say so instead of inventing one. If it proposes a new fact, the same validation that protects your data checks it.",
  },
  {
    title: "Small, traceable context",
    body: "Triples around one entity fit in a prompt far more easily than whole tables, and each answer can point back to the facts it used.",
  },
];

const demo = {
  schema: {
    label: "Table schema only",
    lines: [
      [
        ["projects", "accent"],
        ["(id, name, ", "text"],
        ["owner_id", "text"],
        [", org_id, dept_id)", "text"],
      ],
      [
        ["people", "accent"],
        ["(id, name, dept_id)", "text"],
      ],
      [
        ["departments", "accent"],
        ["(id, name, org_id)", "text"],
      ],
    ] as Token[][],
    heading: "What the model has to guess",
    items: [
      "Whether owner_id points to a person or a department.",
      "Whether org_id means who owns the project or just where it sits.",
      "Which of the three links counts as responsible.",
    ],
  },
  ontology: {
    label: "With the ontology",
    lines: [
      [
        ["ownedBy        ", "accent"],
        ["Project ", "text"],
        ["→ ", "subtle"],
        ["Organization", "text"],
      ],
      [
        ["contributesTo  ", "accent"],
        ["Person ", "text"],
        ["→ ", "subtle"],
        ["Project", "text"],
      ],
      [
        ["manages        ", "accent"],
        ["Person ", "text"],
        ["→ ", "subtle"],
        ["Department", "text"],
      ],
      [
        ["dependsOn      ", "accent"],
        ["Project ", "text"],
        ["→ ", "subtle"],
        ["Project", "text"],
      ],
    ] as Token[][],
    heading: "What the model is told",
    items: [
      "A project is owned by an organization, never by a person.",
      "People relate to projects through contributesTo.",
      "Nothing defines who is responsible, so the model can say that instead of making up an answer.",
    ],
  },
};

type DemoKey = keyof typeof demo;

export default function SemanticModel() {
  const [view, setView] = useState<DemoKey>("schema");
  const active = demo[view];

  return (
    <section
      aria-labelledby="model-heading"
      className="border-t border-ow-border"
    >
      <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
        <SectionHeading
          id="model-heading"
          title="A foreign key says two rows are linked. An ontology says why."
          description="Keys are excellent at integrity: this row exists, and that row points to it. What they cannot hold is what the connection means. OntoWrite stores that meaning as data, right next to your tables."
        />

        {/* Same fact, two ways */}
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <div className="ow-card-muted flex min-w-0 flex-col gap-4 p-5 sm:p-6">
            <h3 className="text-base font-semibold text-ow-text">
              In a relational schema
            </h3>
            <CodeBlock
              label="Relational schema with a foreign key"
              lines={relationalLines}
            />
            <p className="text-sm leading-6 text-ow-muted">
              The database guarantees that{" "}
              <code className="font-mono text-ow-text">org_id</code> matches a
              real organization. It has no idea what the link is called or what
              it means.
            </p>
          </div>

          <div className="ow-card flex min-w-0 flex-col gap-4 p-5 sm:p-6">
            <h3 className="text-base font-semibold text-ow-text">
              As an ontology
            </h3>
            <CodeBlock
              label="Ontology with a relationship type and assertions"
              lines={ontologyLines}
            />
            <p className="text-sm leading-6 text-ow-muted">
              The same fact now has a named relationship, a direction, and
              declared endpoints. It can be read, validated and drawn as a
              graph.
            </p>
          </div>
        </div>

        {/* Comparison */}
        <div className="mt-14 overflow-x-auto rounded-xl border border-ow-border">
          <table className="w-full min-w-180 text-left text-sm">
            <caption className="sr-only">
              Primary and foreign keys compared with an ontology
            </caption>
            <thead className="bg-ow-surface text-xs text-ow-subtle">
              <tr>
                <th scope="col" className="w-56 px-5 py-3 font-semibold" />
                <th scope="col" className="px-5 py-3 font-semibold">
                  Primary and foreign keys
                </th>
                <th
                  scope="col"
                  className="px-5 py-3 font-semibold text-ow-accent"
                >
                  Ontology
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ow-border">
              {comparison.map((row) => (
                <tr key={row.topic} className="align-top">
                  <th
                    scope="row"
                    className="px-5 py-5 text-sm font-semibold text-ow-text"
                  >
                    {row.topic}
                  </th>
                  <td className="px-5 py-5 leading-6 text-ow-muted">
                    {row.keys}
                  </td>
                  <td className="bg-ow-accent/[0.04] px-5 py-5 leading-6 text-ow-text">
                    {row.ontology}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-5 max-w-3xl text-sm leading-6 text-ow-subtle">
          This is not either-or. Keep your keys for integrity inside your
          tables. The ontology adds meaning across them, and it is stored in the
          same Appwrite project.
        </p>

        {/* AI */}
        <div className="mt-24 grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <div>
            <h3 className="text-2xl font-semibold leading-tight tracking-tight text-ow-text sm:text-3xl">
              Why that matters when AI reads your data
            </h3>
            <p className="mt-4 text-base leading-7 text-ow-muted">
              Language models are good at reasoning, and bad at knowing what
              your column names were supposed to mean. An ontology gives them
              the meaning up front.
            </p>

            <dl className="mt-8 divide-y divide-ow-border border-y border-ow-border">
              {aiPoints.map((point) => (
                <div key={point.title} className="py-5">
                  <dt className="text-sm font-semibold text-ow-text">
                    {point.title}
                  </dt>
                  <dd className="mt-1.5 text-sm leading-6 text-ow-muted">
                    {point.body}
                  </dd>
                </div>
              ))}
            </dl>

            <p className="mt-6 text-sm leading-6 text-ow-subtle">
              OntoWrite stores the model and the facts in your Appwrite tables,
              so your own agents and prompts can read them.
            </p>
          </div>

          {/* Illustration: same question, two contexts */}
          <div className="ow-card flex min-w-0 flex-col p-5 sm:p-6">
            <p className="text-sm text-ow-muted">Question an agent is asked</p>
            <p className="mt-1 text-lg font-semibold text-ow-text">
              Who is responsible for Project Nova?
            </p>

            <div
              role="group"
              aria-label="Context given to the model"
              className="mt-5 inline-flex w-fit rounded-lg border border-ow-border bg-ow-bg p-1"
            >
              {(Object.keys(demo) as DemoKey[]).map((key) => {
                const isActive = key === view;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setView(key)}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ow-accent ${
                      isActive
                        ? "bg-ow-accent/10 text-ow-accent"
                        : "text-ow-muted hover:text-ow-text"
                    }`}
                  >
                    {demo[key].label}
                  </button>
                );
              })}
            </div>

            <div className="mt-4">
              <CodeBlock label={active.label} lines={active.lines} />
            </div>

            <div aria-live="polite" className="mt-5">
              <p className="text-sm font-semibold text-ow-text">
                {active.heading}
              </p>
              <ul className="mt-2 space-y-2 text-sm leading-6 text-ow-muted">
                {active.items.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className={`mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                        view === "ontology" ? "bg-ow-accent" : "bg-ow-subtle"
                      }`}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-6 text-xs leading-5 text-ow-subtle">
              Illustration with sample data. It shows what each context states,
              not the output of a model.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
