"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import OntologyEditor from "@/app/components/OntologyEditor";
import AssertionEditor from "@/app/components/AssertionEditor";

type Row = {
  $id: string;
  [key: string]: unknown;
};

type OntologyData = {
  ontologies: Row[];
  classes: Row[];
  properties: Row[];
  relationships: Row[];
  assertions: Row[];
};

function field(row: Row, key: string): string {
  const value = row[key];
  return value == null ? "" : String(value);
}

export default function Home() {
  const [data, setData] = useState<OntologyData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const refreshOntology = useCallback(
    async (showLoader = false): Promise<void> => {
      if (showLoader) {
        setLoading(true);
      }

      setError("");

      try {
        const response = await fetch("/api/ontologies", {
          cache: "no-store",
        });

        const result: unknown = await response.json();

        if (!response.ok) {
          throw new Error("Failed to load ontology data.");
        }

        if (typeof result !== "object" || result === null) {
          throw new Error("Invalid ontology API response.");
        }

        const payload = result as Record<string, unknown>;

        const keys = [
          "ontologies",
          "classes",
          "properties",
          "relationships",
          "assertions",
        ] as const;

        for (const key of keys) {
          if (!Array.isArray(payload[key])) {
            throw new Error(`Missing "${key}" in API response.`);
          }
        }

        setData(payload as OntologyData);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not refresh ontology data.",
        );
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    void refreshOntology(true);
  }, [refreshOntology]);

  const stats = [
    { label: "Ontologies", value: data?.ontologies.length ?? 0 },
    { label: "Classes", value: data?.classes.length ?? 0 },
    { label: "Properties", value: data?.properties.length ?? 0 },
    { label: "Relationships", value: data?.relationships.length ?? 0 },
    { label: "Assertions", value: data?.assertions.length ?? 0 },
  ];

  const graph = useMemo(() => {
    if (!data) return { entities: [] as string[], edges: [] as Row[] };

    const assertions = data.assertions;

    const subjects = new Set(
      assertions.map((item) => field(item, "subjectRef")).filter(Boolean),
    );

    const edges = assertions.filter((item) => {
      const predicate = field(item, "predicate");
      const objectRef = field(item, "objectRef");

      return (
        predicate !== "name" &&
        predicate !== "rdf:type" &&
        subjects.has(objectRef)
      );
    });

    const entities = [
      ...new Set([
        ...edges.map((item) => field(item, "subjectRef")),
        ...edges.map((item) => field(item, "objectRef")),
        ...assertions
          .filter((item) => field(item, "predicate") === "rdf:type")
          .map((item) => field(item, "subjectRef")),
      ]),
    ].filter(Boolean);

    return { entities, edges };
  }, [data]);

  function entityName(id: string) {
    const assertion = data?.assertions.find(
      (item) =>
        field(item, "subjectRef") === id && field(item, "predicate") === "name",
    );

    return assertion ? field(assertion, "objectRef") : id;
  }

  function entityType(id: string) {
    const assertion = data?.assertions.find(
      (item) =>
        field(item, "subjectRef") === id &&
        field(item, "predicate") === "rdf:type",
    );

    const typeRef = assertion ? field(assertion, "objectRef") : "";
    const className = data?.classes.find(
      (item) =>
        field(item, "$id") === typeRef ||
        `class:${field(item, "name")}` === typeRef,
    );

    return className ? field(className, "name") : typeRef || "Entity";
  }

  return (
    <main className="min-h-screen bg-ow-bg text-ow-text">
      <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
        <section className="mb-10 max-w-3xl">
          <p className="mb-4 text-xs font-semibold tracking-[0.2em] text-ow-accent">
            KNOWLEDGE GRAPH WORKSPACE
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Make your data{" "}
            <span className="text-ow-accent">understandable.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-ow-muted sm:text-base">
            Define concepts, connect entities, and explore the meaning behind
            your Appwrite data.
          </p>
        </section>

        {loading && (
          <p className="py-10 text-sm text-ow-muted">Loading your ontology…</p>
        )}

        {error && (
          <div
            role="alert"
            className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--ow-danger)]/20 bg-[var(--ow-danger-bg)] p-4 text-sm text-[var(--ow-danger)]"
          >
            <span>{error}</span>
            <button
              onClick={() => {
                setLoading(true);
                void refreshOntology()
                  .catch((err) =>
                    setError(
                      err instanceof Error
                        ? err.message
                        : "Failed to refresh ontology.",
                    ),
                  )
                  .finally(() => setLoading(false));
              }}
              className="rounded-lg border border-[var(--ow-danger)]/20 px-3 py-2 hover:bg-[var(--ow-danger-bg)]"
            >
              Retry
            </button>
          </div>
        )}

        {data && (
          <>
            <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {stats.map((stat) => (
                <article
                  key={stat.label}
                  className="rounded-xl border border-ow-border bg-[var(--ow-surface-muted)] p-5"
                >
                  <p className="text-xs text-ow-muted">{stat.label}</p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight">
                    {stat.value}
                  </p>
                </article>
              ))}
            </section>

            {/* Existing ontology and graph section remains unchanged and commented out. */}

            <section className="mt-5 rounded-2xl border border-ow-border bg-ow-surface p-5 sm:p-7">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="mb-2 text-[10px] font-semibold tracking-[0.2em] text-ow-accent">
                    SEMANTIC STATEMENTS
                  </p>
                  <h2 className="text-xl font-semibold">Assertions</h2>
                </div>
                <span className="text-xs text-ow-subtle">
                  Subject · Predicate · Object
                </span>
              </div>

              {/* Scrollable assertions list */}
              <div className="max-h-[420px] overflow-auto overscroll-contain rounded-lg sm:max-h-[480px]">
                <div className="min-w-[540px]">
                  <div className="sticky top-0 z-10 grid grid-cols-3 gap-4 border-b border-ow-border bg-ow-surface pb-3 pt-1 text-[10px] tracking-widest text-ow-subtle">
                    <span>SUBJECT</span>
                    <span>PREDICATE</span>
                    <span>OBJECT</span>
                  </div>

                  {data.assertions.map((item) => (
                    <div
                      key={item.$id}
                      className="grid grid-cols-3 gap-4 border-b border-ow-border py-4 text-xs"
                    >
                      <span className="break-all text-ow-muted">
                        {field(item, "subjectRef")}
                      </span>
                      <span className="break-all text-ow-accent">
                        {field(item, "predicate")}
                      </span>
                      <span className="break-all text-ow-muted">
                        {field(item, "objectRef")}
                      </span>
                    </div>
                  ))}

                  {data.assertions.length === 0 && (
                    <p className="py-6 text-sm text-ow-subtle">
                      No assertions yet.
                    </p>
                  )}
                </div>
              </div>

              {data.ontologies[0] && (
                <div className="mt-6">
                  <AssertionEditor
                    ontologyId={data.ontologies[0].$id}
                    assertions={data.assertions}
                    relationships={data.relationships}
                    onSaved={refreshOntology}
                  />
                </div>
              )}
            </section>

            {data.ontologies[0] && (
              <OntologyEditor
                ontologyId={data.ontologies[0].$id}
                classes={data.classes}
                onSaved={refreshOntology}
              />
            )}
          </>
        )}

        <footer className="py-10 text-center text-[10px] tracking-[0.2em] text-ow-subtle">
          ONTO × APPWRITE · SEMANTIC DATA INFRASTRUCTURE
        </footer>
      </div>
    </main>
  );
}
