import type { ReactNode } from "react";
import SectionHeading from "./SectionHeading";

type Feature = {
  title: string;
  body: string;
  detail: string;
  icon: ReactNode;
};

const iconProps = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const features: Feature[] = [
  {
    title: "Ontologies and classes",
    body: "Group your concepts into an ontology with its own namespace and version, then define classes like Person, Organization, Department and Project. A class can point to a parent class.",
    detail: "Organization Ontology · 4 classes",
    icon: (
      <svg {...iconProps}>
        <path d="M12 3 3 8l9 5 9-5-9-5Z" />
        <path d="m3 13 9 5 9-5" />
      </svg>
    ),
  },
  {
    title: "Typed properties",
    body: "Attach attributes to a class with a value type and a required flag, so a Project always has a status and a Person always has a name.",
    detail: "Project.status · string · required",
    icon: (
      <svg {...iconProps}>
        <path d="M4 6h16M4 12h10M4 18h6" />
      </svg>
    ),
  },
  {
    title: "Relationship types",
    body: "Declare which classes a relationship can connect. The schema becomes the contract that every fact in your graph has to follow.",
    detail: "contributesTo: Person → Project",
    icon: (
      <svg {...iconProps}>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </svg>
    ),
  },
  {
    title: "Validated assertions",
    body: "Store facts as subject, predicate and object. An rdf:type must reference a real class, and a relationship must join the source and target classes you declared.",
    detail: "person:alex → rdf:type → class:Person",
    icon: (
      <svg {...iconProps}>
        <path d="M12 3 4 6v6c0 4.5 3.2 8 8 9 4.8-1 8-4.5 8-9V6l-8-3Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Interactive knowledge graph",
    body: "See entities and their declared relationships on a React Flow canvas, laid out automatically with ELK. Search for an entity, focus on it, fit the whole graph, and inspect any node.",
    detail: "Search · focus · minimap · inspector",
    icon: (
      <svg {...iconProps}>
        <circle cx="6" cy="6" r="2.2" />
        <circle cx="18" cy="8" r="2.2" />
        <circle cx="12" cy="18" r="2.2" />
        <path d="m8 6.4 7.8 1.2M7.2 7.9l3.6 8M16.8 10l-3.6 6.2" />
      </svg>
    ),
  },
  {
    title: "Your project, your data",
    body: "Everything is stored in Appwrite TablesDB inside a project you own. OntoWrite connects with OAuth, and you decide which project it can use.",
    detail: "Database onto_main · 5 tables",
    icon: (
      <svg {...iconProps}>
        <ellipse cx="12" cy="6" rx="7" ry="3" />
        <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
        <path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
      </svg>
    ),
  },
];

export default function FeatureList() {
  return (
    <section
      aria-labelledby="features-heading"
      className="border-t border-ow-border"
    >
      <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
        <SectionHeading
          id="features-heading"
          title="Semantic modelling that stays inside Appwrite"
          description="Everything you need to describe a domain precisely, keep your data consistent with that description, and make the connections visible."
        />

        <dl className="mt-12 divide-y divide-ow-border border-y border-ow-border">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="grid gap-4 py-8 lg:grid-cols-[18rem_minmax(0,1fr)_17rem] lg:gap-10"
            >
              <dt className="flex items-center gap-3 text-base font-semibold text-ow-text">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-ow-border bg-ow-surface text-ow-accent">
                  {feature.icon}
                </span>
                {feature.title}
              </dt>
              <dd className="text-sm leading-7 text-ow-muted sm:text-base">
                {feature.body}
              </dd>
              <dd className="font-mono text-xs leading-6 text-ow-subtle lg:text-right">
                {feature.detail}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
