"use client";

import { useMemo, useState, type FormEvent } from "react";

type Row = {
  $id: string;
  [key: string]: unknown;
};

type Props = {
  ontologyId: string;
  assertions: Row[];
  relationships: Row[];
  onSaved: () => Promise<void>;
};

function value(row: Row, key: string): string {
  const item = row[key];
  return typeof item === "string" ? item : "";
}

export default function AssertionEditor({
  ontologyId,
  assertions,
  relationships,
  onSaved,
}: Props) {
  const [subject, setSubject] = useState("");
  const [predicate, setPredicate] = useState("");
  const [objectRef, setObjectRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const entities = useMemo(() => {
    const refs = new Set(
      assertions
        .filter((row) => value(row, "predicate") === "rdf:type")
        .map((row) => value(row, "subjectRef"))
        .filter(Boolean),
    );

    return Array.from(refs).map((ref) => {
      const nameAssertion = assertions.find(
        (row) =>
          value(row, "subjectRef") === ref &&
          value(row, "predicate") === "name",
      );

      return {
        ref,
        name: nameAssertion ? value(nameAssertion, "objectRef") : ref,
      };
    });
  }, [assertions]);

  const predicates = useMemo(
    () =>
      Array.from(
        new Set(relationships.map((row) => value(row, "name")).filter(Boolean)),
      ),
    [relationships],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/assertions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ontologyId,
          subjectRef: subject,
          predicate,
          objectRef,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not create assertion.");
      }

      await onSaved();
      setMessage("Assertion saved and ontology refreshed.");
      setIsError(false);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Something went wrong.",
      );
      setIsError(true);
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-lime-400";

  return (
    <section className="rounded-2xl border border-white/10 bg-[#11151d] p-6">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-lime-400">
        Knowledge builder
      </p>

      <h2 className="mt-2 text-lg font-semibold text-white">
        Add semantic assertion
      </h2>

      <p className="mt-1 text-sm text-slate-400">
        Connect two entities using a relationship defined in your ontology.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 grid gap-4 md:grid-cols-3">
        <label className="text-sm text-slate-300">
          Subject
          <select
            className={inputClass}
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            required
          >
            <option value="">Select subject</option>
            {entities.map((entity) => (
              <option key={entity.ref} value={entity.ref}>
                {entity.name} ({entity.ref})
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-slate-300">
          Predicate
          <select
            className={inputClass}
            value={predicate}
            onChange={(event) => setPredicate(event.target.value)}
            required
          >
            <option value="">Select relationship</option>
            {predicates.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-slate-300">
          Object
          <select
            className={inputClass}
            value={objectRef}
            onChange={(event) => setObjectRef(event.target.value)}
            required
          >
            <option value="">Select object</option>
            {entities.map((entity) => (
              <option key={entity.ref} value={entity.ref}>
                {entity.name} ({entity.ref})
              </option>
            ))}
          </select>
        </label>

        <div className="md:col-span-3 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={busy || !entities.length || !predicates.length}
            className="rounded-lg bg-lime-400 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Validating..." : "Validate and save"}
          </button>

          <span className="text-sm text-slate-400">
            {entities.length} entities · {predicates.length} relationship types
          </span>
        </div>

        {message && (
          <p
            role="status"
            className={`md:col-span-3 rounded-lg border p-3 text-sm ${
              isError
                ? "border-red-400/30 bg-red-400/10 text-red-300"
                : "border-lime-400/30 bg-lime-400/10 text-lime-300"
            }`}
          >
            {message}
          </p>
        )}
      </form>
    </section>
  );
}
