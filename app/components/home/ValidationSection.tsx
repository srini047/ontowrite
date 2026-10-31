import SectionHeading from "./SectionHeading";

const outcomes = [
  {
    verdict: "Saved",
    tone: "ok" as const,
    triple: ["person:alex", "worksFor", "org:acme"],
    reason:
      "worksFor is declared as Person → Organization, and these entities have exactly those classes.",
  },
  {
    verdict: "Rejected",
    tone: "error" as const,
    triple: ["person:alex", "worksFor", "dept:sales"],
    reason:
      'worksFor expects an object of class "Organization", but dept:sales is a Department.',
  },
  {
    verdict: "Rejected",
    tone: "error" as const,
    triple: ["org:acme", "rdf:type", "class:Spaceship"],
    reason: "The referenced class does not exist in this ontology.",
  },
];

export default function ValidationSection() {
  return (
    <section
      aria-labelledby="validation-heading"
      className="border-t border-ow-border"
    >
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16 lg:py-28">
        <div>
          <SectionHeading
            id="validation-heading"
            title="Facts are checked against your schema"
            description="A graph is only useful if you can trust it. When you add an assertion, OntoWrite compares it with the classes and relationship types you defined and tells you exactly what does not fit."
          />
          <ul className="mt-8 space-y-3 text-sm leading-6 text-ow-muted">
            <li>
              <span className="font-semibold text-ow-text">
                Type assertions
              </span>{" "}
              must point to a class that exists in the same ontology.
            </li>
            <li>
              <span className="font-semibold text-ow-text">Relationships</span>{" "}
              must connect the source and target classes declared for that
              relationship type.
            </li>
          </ul>
        </div>

        <ul className="flex flex-col gap-3">
          {outcomes.map((outcome) => {
            const ok = outcome.tone === "ok";
            return (
              <li
                key={outcome.triple.join("-")}
                className="ow-card-muted flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:gap-5"
              >
                <span
                  className={`inline-flex w-24 shrink-0 items-center justify-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                    ok
                      ? "ow-status"
                      : "border-red-400/25 bg-red-400/10 text-red-300"
                  }`}
                >
                  {outcome.verdict}
                </span>
                <div className="min-w-0">
                  <p className="wrap-break-word font-mono text-[13px] leading-6 text-ow-text">
                    {outcome.triple[0]}
                    <span className="text-ow-subtle"> → </span>
                    <span className="text-ow-accent">{outcome.triple[1]}</span>
                    <span className="text-ow-subtle"> → </span>
                    {outcome.triple[2]}
                  </p>
                  <p className="mt-1.5 text-sm leading-6 text-ow-muted">
                    {outcome.reason}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
