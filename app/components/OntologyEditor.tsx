"use client";

import { useState } from "react";

type Row = {
  $id: string;
  [key: string]: unknown;
};

type Props = {
  ontologyId: string;
  classes: Row[];
  onSaved: () => Promise<void>;
};

export default function OntologyEditor({
  ontologyId,
  classes,
  onSaved,
}: Props) {
  const [selectedId, setSelectedId] = useState("");
  const selected = classes.find((item) => item.$id === selectedId);

  const [className, setClassName] = useState("");
  const [classDescription, setClassDescription] = useState("");
  const [propertyClass, setPropertyClass] = useState("");
  const [propertyName, setPropertyName] = useState("");
  const [valueType, setValueType] = useState("string");
  const [isRequired, setIsRequired] = useState(false);
  const [sourceClassId, setSourceClassId] = useState("");
  const [targetClassId, setTargetClassId] = useState("");
  const [relationshipName, setRelationshipName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(url: string, method: string, body?: unknown) {
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });

      const result = response.status === 204 ? null : await response.json();

      if (!response.ok) {
        throw new Error(result?.error ?? "Request failed.");
      }

      await onSaved();
      setMessage("Saved successfully.");
      return true;
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Something went wrong.",
      );
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function saveClass(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const data = {
      ontologyId,
      name: className,
      description: classDescription,
      parentClassId: "",
    };

    const ok = await send(
      selected
        ? `/api/ontology-items/${selected.$id}?kind=classes`
        : "/api/ontology-items",
      selected ? "PATCH" : "POST",
      selected ? data : { kind: "classes", data },
    );

    if (ok) {
      setSelectedId("");
      setClassName("");
      setClassDescription("");
    }
  }

  function editClass(item: Row) {
    setSelectedId(item.$id);
    setClassName(String(item.name ?? ""));
    setClassDescription(String(item.description ?? ""));
  }

  async function deleteClass(item: Row) {
    if (!window.confirm(`Delete class "${String(item.name)}"?`)) return;

    const ok = await send(
      `/api/ontology-items/${item.$id}?kind=classes`,
      "DELETE",
    );

    if (ok && selectedId === item.$id) {
      setSelectedId("");
      setClassName("");
      setClassDescription("");
    }
  }

  async function saveProperty(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const ok = await send("/api/ontology-items", "POST", {
      kind: "properties",
      data: {
        classId: propertyClass,
        name: propertyName,
        valueType,
        isRequired,
      },
    });

    if (ok) {
      setPropertyName("");
      setIsRequired(false);
    }
  }

  async function saveRelationship(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const ok = await send("/api/ontology-items", "POST", {
      kind: "relationships",
      data: {
        ontologyId,
        name: relationshipName,
        sourceClassId,
        targetClassId,
        description: "",
      },
    });

    if (ok) setRelationshipName("");
  }

  const fieldClass =
    "mt-1 w-full rounded-lg border border-white/10 bg-[#0b0d12] px-3 py-2.5 text-sm text-white outline-none focus:border-lime-300/60";

  const labelClass = "block text-xs text-slate-400";

  return (
    <section className="mt-6 rounded-2xl border border-white/10 bg-[#11151d] p-5 sm:p-7">
      <div className="mb-6">
        <p className="mb-2 text-[10px] font-semibold tracking-[0.2em] text-lime-300">
          SCHEMA EDITOR
        </p>
        <h2 className="text-xl font-semibold">Shape your ontology</h2>
        <p className="mt-2 text-sm text-slate-400">
          Create classes, define properties, and connect concepts.
        </p>
      </div>

      {message && (
        <p
          role="status"
          className="mb-5 rounded-lg border border-white/10 p-3 text-sm text-slate-300"
        >
          {message}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div>
          <h3 className="mb-3 font-medium">Classes</h3>

          <div className="mb-4 space-y-2">
            {classes.map((item) => (
              <div
                key={item.$id}
                className="flex items-center gap-2 rounded-lg border border-white/10 p-3"
              >
                <button
                  type="button"
                  onClick={() => editClass(item)}
                  className="min-w-0 flex-1 truncate text-left text-sm hover:text-lime-300"
                >
                  {String(item.name)}
                </button>
                <button
                  type="button"
                  onClick={() => void deleteClass(item)}
                  disabled={busy}
                  aria-label={`Delete ${String(item.name)}`}
                  className="text-xs text-red-300 hover:text-red-200 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={saveClass} className="space-y-3">
            <label className={labelClass}>
              Class name
              <input
                required
                maxLength={255}
                value={className}
                onChange={(event) => setClassName(event.target.value)}
                className={fieldClass}
                placeholder="e.g. Department"
              />
            </label>
            <label className={labelClass}>
              Description
              <textarea
                maxLength={2000}
                value={classDescription}
                onChange={(event) => setClassDescription(event.target.value)}
                className={fieldClass}
                rows={3}
                placeholder="What does this class represent?"
              />
            </label>
            <button
              disabled={busy}
              className="w-full rounded-lg bg-lime-300 px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
            >
              {busy ? "Saving…" : selected ? "Update class" : "Create class"}
            </button>
            {selected && (
              <button
                type="button"
                onClick={() => {
                  setSelectedId("");
                  setClassName("");
                  setClassDescription("");
                }}
                className="w-full rounded-lg border border-white/10 px-4 py-2 text-sm"
              >
                Cancel editing
              </button>
            )}
          </form>
        </div>

        <form onSubmit={saveProperty} className="space-y-4">
          <h3 className="font-medium">Add property</h3>
          <label className={labelClass}>
            Belongs to class
            <select
              required
              value={propertyClass}
              onChange={(event) => setPropertyClass(event.target.value)}
              className={fieldClass}
            >
              <option value="">Select a class</option>
              {classes.map((item) => (
                <option key={item.$id} value={item.$id}>
                  {String(item.name)}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Property name
            <input
              required
              maxLength={255}
              value={propertyName}
              onChange={(event) => setPropertyName(event.target.value)}
              className={fieldClass}
              placeholder="e.g. departmentCode"
            />
          </label>
          <label className={labelClass}>
            Value type
            <select
              value={valueType}
              onChange={(event) => setValueType(event.target.value)}
              className={fieldClass}
            >
              {["string", "number", "integer", "boolean", "date"].map(
                (type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ),
              )}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={isRequired}
              onChange={(event) => setIsRequired(event.target.checked)}
              className="accent-lime-300"
            />
            Required property
          </label>
          <button
            disabled={busy || classes.length === 0}
            className="w-full rounded-lg border border-white/10 px-4 py-2.5 text-sm hover:border-lime-300/40 disabled:opacity-50"
          >
            Add property
          </button>
        </form>

        <form onSubmit={saveRelationship} className="space-y-4">
          <h3 className="font-medium">Add relationship type</h3>
          <label className={labelClass}>
            Relationship name
            <input
              required
              maxLength={255}
              value={relationshipName}
              onChange={(event) => setRelationshipName(event.target.value)}
              className={fieldClass}
              placeholder="e.g. manages"
            />
          </label>
          <label className={labelClass}>
            Source class
            <select
              required
              value={sourceClassId}
              onChange={(event) => setSourceClassId(event.target.value)}
              className={fieldClass}
            >
              <option value="">Select source</option>
              {classes.map((item) => (
                <option key={item.$id} value={item.$id}>
                  {String(item.name)}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Target class
            <select
              required
              value={targetClassId}
              onChange={(event) => setTargetClassId(event.target.value)}
              className={fieldClass}
            >
              <option value="">Select target</option>
              {classes.map((item) => (
                <option key={item.$id} value={item.$id}>
                  {String(item.name)}
                </option>
              ))}
            </select>
          </label>
          <button
            disabled={busy || classes.length === 0}
            className="w-full rounded-lg border border-white/10 px-4 py-2.5 text-sm hover:border-lime-300/40 disabled:opacity-50"
          >
            Add relationship
          </button>
        </form>
      </div>
    </section>
  );
}
