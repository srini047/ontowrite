import SectionHeading from "./SectionHeading";

const steps = [
  {
    title: "Connect your project",
    body: "Sign in with Appwrite and choose which project OntoWrite should work in. The scopes you granted stay visible on your dashboard.",
    sample: "Appwrite OAuth → your project",
  },
  {
    title: "Model your domain",
    body: "Create an ontology, add classes such as Person or Project, give them typed properties, and declare which classes each relationship can connect.",
    sample: "worksFor: Person → Organization",
  },
  {
    title: "Record facts",
    body: "Write assertions as subject, predicate and object. Class references and relationship endpoints are checked before anything is saved.",
    sample: "person:alex → worksFor → org:acme",
  },
  {
    title: "Explore the graph",
    body: "Open the knowledge graph, search for an entity, focus on its neighbourhood, and inspect every connection it has.",
    sample: "search · focus · fit · inspect",
  },
];

export default function PipelineSection() {
  return (
    <section
      aria-labelledby="pipeline-heading"
      className="border-t border-ow-border"
    >
      <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
        <SectionHeading
          id="pipeline-heading"
          title="From an empty project to a connected graph"
          description="Run the setup script once to create the tables. After that, modelling and exploring both happen in the app."
        />

        <ol className="mt-14 grid gap-10 lg:grid-cols-4 lg:gap-6">
          {steps.map((step, index) => (
            <li key={step.title} className="relative flex flex-col">

              {index < steps.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="absolute left-12 top-5 hidden h-px w-[calc(100%-2rem)] bg-gradient-to-r from-ow-accent/60 to-transparent lg:block"
                />
              ) : null}

              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-ow-accent/40 bg-ow-accent/10 text-sm font-semibold text-ow-accent">
                {index + 1}
              </span>

              <h3 className="mt-5 text-lg font-semibold text-ow-text">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-ow-muted">
                {step.body}
              </p>
              <p className="ow-scope mt-4 w-fit max-w-full">{step.sample}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
