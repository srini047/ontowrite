import Link from "next/link";

const REPO_URL = "https://github.com/srini047/ontowrite";

export default function ClosingSection() {
  return (
    <>
      <section
        aria-labelledby="cta-heading"
        className="border-t border-ow-border"
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-20 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:py-28">
          <div className="max-w-2xl">
            <h2
              id="cta-heading"
              className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl"
            >
              Model your first ontology in an afternoon
            </h2>
            <p className="mt-4 text-base leading-7 text-ow-muted sm:text-lg sm:leading-8">
              Connect a project, define two classes and a relationship, add a
              few facts, and watch them appear in the graph.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/auth" className="ow-button ow-button-primary min-w-48">
              Connect Appwrite
            </Link>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="ow-button min-w-40"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-ow-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-ow-subtle sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>
            OntoWrite is an ontology layer for Appwrite TablesDB. Apache-2.0
            licensed.
          </p>
          <nav aria-label="Footer" className="flex gap-6">
            <Link href="/graph" className="transition hover:text-ow-text">
              Knowledge graph
            </Link>
            <Link href="/dashboard" className="transition hover:text-ow-text">
              Dashboard
            </Link>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-ow-text"
            >
              GitHub
            </a>
          </nav>
        </div>
      </footer>
    </>
  );
}
