import Link from "next/link";
import GraphPreview from "./GraphPreview";

export default function HeroSection() {
  return (
    <section className="relative">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[640px]"
        style={{
          backgroundImage:
            "radial-gradient(rgb(255 255 255 / 8%) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          maskImage:
            "radial-gradient(ellipse 80% 70% at 30% 0%, black 20%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 70% at 30% 0%, black 20%, transparent 75%)",
        }}
      />

      <div className="relative mx-auto w-full max-w-6xl px-5 pb-16 pt-16 sm:px-8 sm:pt-24 lg:pb-24">
        <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-[4.25rem]">
          Give your Appwrite data meaning.
        </h1>

        <p className="mt-7 max-w-2xl text-base leading-8 text-ow-muted sm:text-lg">
          OntoWrite adds a semantic layer to Appwrite TablesDB. Describe your
          domain with classes and typed relationships, record facts as validated
          triples, and see how everything connects in an interactive knowledge
          graph.
        </p>

        <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/auth"
            className="ow-button ow-button-primary sm:min-w-52"
          >
            Connect your Appwrite project
          </Link>
          <Link href="/graph" className="ow-button sm:min-w-40">
            Open the knowledge graph
          </Link>
        </div>

        <p className="mt-5 text-sm text-ow-subtle">
          Open source under Apache-2.0. Your ontology lives in your own Appwrite
          project.
        </p>

        <div className="mt-14 sm:mt-16">
          <GraphPreview />
        </div>
      </div>
    </section>
  );
}
