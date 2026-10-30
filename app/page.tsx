import Link from "next/link";

export default function Home() {
  return (
    <main className="relative flex min-h-[calc(100vh-4rem)] flex-1 overflow-hidden bg-ow-bg text-ow-text">
      {/* Subtle background accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-ow-accent/[0.06] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-48 -left-40 h-[420px] w-[420px] rounded-full bg-ow-accent/[0.04] blur-3xl"
      />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col justify-center px-5 py-20 sm:px-8 lg:py-28">
        <section className="max-w-3xl">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-ow-accent/20 bg-ow-accent/5 px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-ow-accent" />
            <span className="text-[11px] font-semibold tracking-[0.16em] text-ow-accent">
              SEMANTIC DATA WORKSPACE
            </span>
          </div>

          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
            Give your data
            <br />
            <span className="text-ow-accent">meaning.</span>
          </h1>

          <p className="mt-7 max-w-xl text-base leading-8 text-ow-muted sm:text-lg">
            OntoWrite helps you model concepts, define relationships, and turn
            your Appwrite data into knowledge you can explore.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="ow-button ow-button-primary min-w-40"
            >
              Get started
              <span aria-hidden="true">→</span>
            </Link>

            <Link href="/graph" className="ow-button min-w-40">
              Explore graph
            </Link>
          </div>
        </section>

        <section className="mt-24 grid max-w-4xl gap-4 border-t border-ow-border pt-8 sm:grid-cols-3">
          <div>
            <p className="text-sm font-semibold text-ow-text">
              Model concepts
            </p>
            <p className="mt-2 text-sm leading-6 text-ow-muted">
              Organize your domain into ontologies, classes, and properties.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-ow-text">
              Define relationships
            </p>
            <p className="mt-2 text-sm leading-6 text-ow-muted">
              Describe how entities connect through meaningful relationships.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-ow-text">
              Explore knowledge
            </p>
            <p className="mt-2 text-sm leading-6 text-ow-muted">
              Visualize your semantic data as an interactive knowledge graph.
            </p>
          </div>
        </section>

        <footer className="mt-20 border-t border-ow-border pt-6 text-xs text-ow-subtle">
          ONTOWRITE · BUILT FOR APPWRITE
        </footer>
      </div>
    </main>
  );
}
