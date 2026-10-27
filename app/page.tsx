"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
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

  // useEffect(() => {
  //   let active = true;

  //   async function load() {
  //     try {
  //       const response = await fetch("/api/ontologies", {
  //         cache: "no-store",
  //       });

  //       if (!response.ok) {
  //         throw new Error("Failed to load ontology data.");
  //       }

  //       const result: OntologyData = await response.json();

  //       if (
  //         !Array.isArray(result.ontologies) ||
  //         !Array.isArray(result.classes) ||
  //         !Array.isArray(result.properties) ||
  //         !Array.isArray(result.relationships) ||
  //         !Array.isArray(result.assertions)
  //       ) {
  //         throw new Error("The ontology API returned an unexpected response.");
  //       }

  //       if (active) {
  //         setData(result);
  //         setError("");
  //       }
  //     } catch (err) {
  //       if (active) {
  //         setError(
  //           err instanceof Error ? err.message : "Something went wrong.",
  //         );
  //       }
  //     } finally {
  //       if (active) setLoading(false);
  //     }
  //   }

  //   void load();

  //   return () => {
  //     active = false;
  //   };
  // }, []);

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

    // Only treat an object as an entity if it also appears as a subject.
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
    <main className="min-h-screen bg-[#0b0d12] text-[#f1f4fa]">
      <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
        <section className="mb-10 max-w-3xl">
          <p className="mb-4 text-xs font-semibold tracking-[0.2em] text-lime-300">
            KNOWLEDGE GRAPH WORKSPACE
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Make your data{" "}
            <span className="text-lime-300">understandable.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
            Define concepts, connect entities, and explore the meaning behind
            your Appwrite data.
          </p>
        </section>

        {loading && (
          <p className="py-10 text-sm text-slate-400">Loading your ontology…</p>
        )}

        {error && (
          <div
            role="alert"
            className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-300"
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
              className="rounded-lg border border-red-300/20 px-3 py-2 hover:bg-red-300/10"
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
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-5"
                >
                  <p className="text-xs text-slate-400">{stat.label}</p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight">
                    {stat.value}
                  </p>
                </article>
              ))}
            </section>

            {/* <section className="grid gap-5 lg:grid-cols-2">
              <article className="rounded-2xl border border-white/10 bg-[#11151d] p-5 sm:p-7">
                <div className="mb-6 flex items-center justify-between gap-3">
                  <div>
                    <p className="mb-2 text-[10px] font-semibold tracking-[0.2em] text-lime-300">
                      YOUR MODEL
                    </p>
                    <h2 className="text-xl font-semibold">Ontology</h2>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-400">
                    {data.ontologies.length} model
                    {data.ontologies.length === 1 ? "" : "s"}
                  </span>
                </div>

                {data.ontologies.length === 0 && (
                  <p className="text-sm text-slate-400">
                    No ontology found. Seed or create an ontology first.
                  </p>
                )}

                {data.ontologies.map((item) => (
                  <div
                    key={item.$id}
                    className="flex gap-4 border-b border-white/10 py-5"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime-300/10 text-xl text-lime-300">
                      ◎
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium">{field(item, "name")}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        {field(item, "description")}
                      </p>
                      <code className="mt-2 block break-all text-xs text-slate-500">
                        {field(item, "namespace")}
                      </code>
                    </div>
                  </div>
                ))}

                <p className="mb-3 mt-7 text-[10px] font-semibold tracking-[0.2em] text-slate-500">
                  CLASSES
                </p>

                <div className="divide-y divide-white/5">
                  {data.classes.map((item) => (
                    <div
                      key={item.$id}
                      className="flex min-h-12 items-center gap-3 py-3"
                    >
                      <span className="h-2 w-2 rounded-sm bg-lime-300" />
                      <span className="text-sm">{field(item, "name")}</span>
                      <code className="ml-auto break-all text-right text-xs text-slate-500">
                        {item.$id}
                      </code>
                    </div>
                  ))}

                  {data.classes.length === 0 && (
                    <p className="py-4 text-sm text-slate-500">
                      No classes defined yet.
                    </p>
                  )}
                </div>
              </article>

              <article className="rounded-2xl border border-white/10 bg-[#11151d] p-5 sm:p-7">
                <div className="mb-6 flex items-center justify-between gap-3">
                  <div>
                    <p className="mb-2 text-[10px] font-semibold tracking-[0.2em] text-lime-300">
                      CONNECTED KNOWLEDGE
                    </p>
                    <h2 className="text-xl font-semibold">Graph explorer</h2>
                  </div>
                  <span className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-400">
                    {graph.edges.length} edges
                  </span>
                </div>

                {graph.entities.length === 0 ? (
                  <p className="py-10 text-center text-sm text-slate-500">
                    No entity connections yet. Add assertions linking entities
                    to see your graph here.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {graph.entities.map((id) => (
                      <div
                        key={id}
                        className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
                      >
                        <p className="text-[10px] tracking-widest text-lime-300">
                          {entityType(id).toUpperCase()}
                        </p>
                        <h3 className="mt-2 font-medium">{entityName(id)}</h3>
                        <p className="mt-1 break-all text-xs text-slate-500">
                          {id}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <p className="mb-3 mt-6 text-[10px] font-semibold tracking-[0.2em] text-slate-500">
                  ASSERTED RELATIONSHIPS
                </p>

                <div className="space-y-2">
                  {graph.edges.map((edge) => (
                    <div
                      key={edge.$id}
                      className="flex flex-wrap items-center gap-2 rounded-lg border border-white/5 p-3 text-sm"
                    >
                      <span>{entityName(field(edge, "subjectRef"))}</span>
                      <span className="text-lime-300">
                        — {field(edge, "predicate")} →
                      </span>
                      <span>{entityName(field(edge, "objectRef"))}</span>
                    </div>
                  ))}
                </div>

                <p className="mb-3 mt-6 text-[10px] font-semibold tracking-[0.2em] text-slate-500">
                  RELATIONSHIP TYPES
                </p>

                {data.relationships.map((item) => (
                  <div
                    key={item.$id}
                    className="flex items-center gap-3 border-b border-white/5 py-3 text-sm"
                  >
                    <span className="text-lime-300">↗</span>
                    <span>{field(item, "name")}</span>
                    <span className="ml-auto text-xs text-slate-500">
                      Directed
                    </span>
                  </div>
                ))}
              </article>
            </section> */}

            <section className="mt-5 rounded-2xl border border-white/10 bg-[#11151d] p-5 sm:p-7">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="mb-2 text-[10px] font-semibold tracking-[0.2em] text-lime-300">
                    SEMANTIC STATEMENTS
                  </p>
                  <h2 className="text-xl font-semibold">Assertions</h2>
                </div>
                <span className="text-xs text-slate-500">
                  Subject · Predicate · Object
                </span>
              </div>

              {/* Scrollable assertions list */}
              <div className="max-h-[420px] overflow-auto overscroll-contain rounded-lg sm:max-h-[480px]">
                <div className="min-w-[540px]">
                  <div className="sticky top-0 z-10 grid grid-cols-3 gap-4 border-b border-white/10 bg-[#11151d] pb-3 pt-1 text-[10px] tracking-widest text-slate-500">
                    <span>SUBJECT</span>
                    <span>PREDICATE</span>
                    <span>OBJECT</span>
                  </div>

                  {data.assertions.map((item) => (
                    <div
                      key={item.$id}
                      className="grid grid-cols-3 gap-4 border-b border-white/5 py-4 text-xs"
                    >
                      <span className="break-all text-slate-300">
                        {field(item, "subjectRef")}
                      </span>
                      <span className="break-all text-lime-300">
                        {field(item, "predicate")}
                      </span>
                      <span className="break-all text-slate-300">
                        {field(item, "objectRef")}
                      </span>
                    </div>
                  ))}

                  {data.assertions.length === 0 && (
                    <p className="py-6 text-sm text-slate-500">
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

        <footer className="py-10 text-center text-[10px] tracking-[0.2em] text-slate-600">
          ONTO × APPWRITE · SEMANTIC DATA INFRASTRUCTURE
        </footer>
      </div>
    </main>
  );
}
