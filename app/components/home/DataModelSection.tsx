import SectionHeading from "./SectionHeading";

const tables = [
  ["ontologies", "Name, namespace, version and description of each ontology"],
  [
    "ontology_classes",
    "Class definitions, their ontology and an optional parent class",
  ],
  [
    "ontology_properties",
    "Class, property name, value type and whether it is required",
  ],
  [
    "relationship_types",
    "Relationship name with its source and target classes",
  ],
  ["assertions", "Facts stored as ontology, subject, predicate and object"],
];

const stack = [
  ["Next.js App Router", "The app and its API routes"],
  ["Appwrite TablesDB", "Persistence, in your project"],
  ["React Flow", "Graph interaction"],
  ["ELK.js", "Automatic layered layout"],
  ["Tailwind CSS", "Styling"],
];

export default function DataModelSection() {
  return (
    <section
      aria-labelledby="data-heading"
      className="border-t border-ow-border"
    >
      <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
        <SectionHeading
          id="data-heading"
          title="An ontology is just five tables"
          description="OntoWrite creates a database called onto_main in your Appwrite project. There is no separate service to run and nothing to export, because the model and the facts sit next to the rest of your data."
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
          <div className="overflow-x-auto rounded-xl border border-ow-border">
            <table className="w-full min-w-120 text-left text-sm">
              <caption className="sr-only">
                Tables created in the onto_main database
              </caption>
              <thead className="bg-ow-surface text-xs text-ow-subtle">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    Table
                  </th>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    What it holds
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ow-border">
                {tables.map(([name, purpose]) => (
                  <tr key={name}>
                    <th
                      scope="row"
                      className="whitespace-nowrap px-5 py-4 font-mono text-[13px] font-medium text-ow-accent"
                    >
                      {name}
                    </th>
                    <td className="px-5 py-4 leading-6 text-ow-muted">
                      {purpose}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="text-base font-semibold text-ow-text">Built with</h3>
            <ul className="mt-4 divide-y divide-ow-border border-y border-ow-border">
              {stack.map(([name, role]) => (
                <li
                  key={name}
                  className="flex items-baseline justify-between gap-4 py-3 text-sm"
                >
                  <span className="font-medium text-ow-text">{name}</span>
                  <span className="text-right text-ow-subtle">{role}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
