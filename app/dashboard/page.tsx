"use client";

import { account } from "@/lib/appwrite";
import { useCallback, useEffect, useState } from "react";

type AppwriteUser = {
  name: string;
  email: string;
};

type AuthorizedProject = {
  id: string;
  name: string;
  region?: string;
};

type ConnectionStatus = {
  connected: boolean;
  projects: AuthorizedProject[];
  scopes: string[];
  selectedProjectId?: string | null;
};

export default function DashboardPage() {
  const [user, setUser] = useState<AppwriteUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  const [connection, setConnection] = useState<ConnectionStatus | null>(null);
  const [connectionLoading, setConnectionLoading] = useState(true);
  const [connectionError, setConnectionError] = useState("");

  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [showScopes, setShowScopes] = useState(false);

  const loadConnection = useCallback(async () => {
    setConnectionLoading(true);
    setConnectionError("");

    try {
      const response = await fetch("/api/appwrite-oauth/status", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Unable to load connection (${response.status}).`);
      }

      const data: ConnectionStatus = await response.json();

      if (
        typeof data.connected !== "boolean" ||
        !Array.isArray(data.projects) ||
        !Array.isArray(data.scopes)
      ) {
        throw new Error("Unexpected connection response.");
      }

      setConnection(data);
      setSelectedProjectId((current) =>
        data.projects.some((project) => project.id === current)
          ? current
          : (data.projects[0]?.id ?? ""),
      );
    } catch (error) {
      console.error("[OntoWrite] Connection status failed:", error);
      setConnectionError(
        error instanceof Error
          ? error.message
          : "Unable to load your Appwrite connection.",
      );
    } finally {
      setConnectionLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    account
      .get()
      .then((currentUser) => {
        if (active) {
          setUser({
            name: currentUser.name,
            email: currentUser.email,
          });
        }
      })
      .catch(() => {
        if (active) window.location.assign("/auth");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    void loadConnection();

    if (new URLSearchParams(window.location.search).get("connected") === "1") {
      window.history.replaceState({}, "", "/dashboard");
    }
  }, [loadConnection]);

  async function signOut() {
    setSigningOut(true);

    try {
      await account.deleteSession({ sessionId: "current" });
      window.location.assign("/auth");
    } catch (error) {
      console.error("Sign out failed:", error);
      setSigningOut(false);
    }
  }

  async function saveProjectSelection(projectId: string) {
    setSelectedProjectId(projectId);

    try {
      const response = await fetch("/api/appwrite-oauth/select-project", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({ projectId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to save project selection.");
      }

      await loadConnection();
    } catch (error) {
      console.error("[OntoWrite] Project selection failed:", error);
      setConnectionError(
        error instanceof Error
          ? error.message
          : "Unable to save project selection.",
      );
      await loadConnection();
    }
  }

  if (loading || !user) {
    return (
      <main className="ow-page grid place-items-center px-4">
        <p className="ow-muted" role="status">
          Loading your workspace...
        </p>
      </main>
    );
  }

  const selectedProject = connection?.projects.find(
    (project) => project.id === selectedProjectId,
  );

  return (
    <main className="ow-page">
      <div className="ow-container">
        <header className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div className="min-w-0">
            <p className="ow-eyebrow">Your workspace</p>
            <h1 className="mt-3 break-words text-3xl font-semibold tracking-tight sm:text-4xl">
              Welcome, {user.name || user.email}
            </h1>
            <p className="ow-muted mt-3 max-w-2xl text-sm leading-6 sm:text-base">
              Manage your Appwrite connection and choose the project you want to
              work with in OntoWrite.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => void loadConnection()}
              disabled={connectionLoading}
              className="ow-button"
            >
              {connectionLoading ? "Refreshing..." : "Refresh"}
            </button>
            <button
              onClick={signOut}
              disabled={signingOut}
              className="ow-button"
            >
              {signingOut ? "Signing out..." : "Sign out"}
            </button>
          </div>
        </header>

        {connectionError && (
          <div
            role="alert"
            className="ow-alert-error mb-6 flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center"
          >
            <p className="break-words text-sm">{connectionError}</p>
            <button
              onClick={() => void loadConnection()}
              className="ow-button w-fit"
            >
              Try again
            </button>
          </div>
        )}

        <section className="ow-card overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-[var(--ow-border)] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="ow-eyebrow">Integration</p>
              <h2 className="mt-2 text-xl font-semibold">
                Appwrite connection
              </h2>
              <p className="ow-muted mt-1 text-sm">
                Projects and permissions granted to OntoWrite.
              </p>
            </div>

            {!connectionLoading &&
              !connectionError &&
              connection?.connected && (
                <span className="ow-status">
                  <span className="ow-status-dot" />
                  Connected
                </span>
              )}
          </div>

          <div className="p-5 sm:p-6">
            {connectionLoading ? (
              <div className="space-y-3 py-4" role="status">
                <div className="h-4 w-40 animate-pulse rounded bg-[var(--ow-surface-raised)]" />
                <div className="h-20 animate-pulse rounded-xl bg-[var(--ow-surface-muted)]" />
                <p className="ow-muted text-sm">
                  Loading connection details...
                </p>
              </div>
            ) : !connectionError && !connection?.connected ? (
              <div className="rounded-xl border border-dashed border-[var(--ow-border)] px-5 py-10 text-center">
                <h3 className="text-lg font-semibold">
                  Connect your Appwrite account
                </h3>
                <p className="ow-muted mx-auto mt-2 max-w-md text-sm leading-6">
                  Authorize OntoWrite to discover your projects and work with
                  ontology resources on your behalf.
                </p>
                <a
                  href="/api/appwrite-oauth/start"
                  className="ow-button ow-button-primary mt-5"
                >
                  Connect Appwrite
                </a>
              </div>
            ) : !connectionError && connection?.connected ? (
              <>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="ow-card-muted p-4 sm:p-5">
                    <p className="ow-muted text-sm">Authorized projects</p>
                    <p className="mt-2 text-3xl font-semibold">
                      {connection.projects.length}
                    </p>
                  </div>
                  <div className="ow-card-muted p-4 sm:p-5">
                    <p className="ow-muted text-sm">Granted permissions</p>
                    <p className="mt-2 text-3xl font-semibold">
                      {connection.scopes.length}
                    </p>
                  </div>
                </div>

                <section className="mt-8">
                  <div className="flex flex-wrap items-end justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-semibold">
                        Choose a project
                      </h3>
                      <p className="ow-muted mt-1 text-sm">
                        Select the Appwrite project you intend to use.
                      </p>
                    </div>
                    <span className="ow-muted text-xs">
                      {connection.projects.length} available
                    </span>
                  </div>

                  {connection.projects.length === 0 ? (
                    <p className="ow-muted mt-4 rounded-lg border border-[var(--ow-border)] p-4 text-sm">
                      No authorized projects were returned. Check your Appwrite
                      permissions and reconnect if needed.
                    </p>
                  ) : (
                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                      {connection.projects.map((project) => {
                        const selected = selectedProjectId === project.id;

                        return (
                          <button
                            key={project.id}
                            type="button"
                            aria-pressed={selected}
                            data-selected={selected}
                            onClick={() => void saveProjectSelection(project.id)}
                            className="ow-project"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="break-words font-semibold">
                                  {project.name || "Untitled project"}
                                </p>
                                <p className="ow-muted mt-2 break-all font-mono text-xs leading-5">
                                  {project.id}
                                </p>
                              </div>
                              <span
                                aria-hidden="true"
                                className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border text-xs ${
                                  selected
                                    ? "border-[var(--ow-accent)] bg-[var(--ow-accent)] text-[var(--ow-accent-contrast)]"
                                    : "border-[var(--ow-border)] text-transparent"
                                }`}
                              >
                                ✓
                              </span>
                            </div>

                            <div className="ow-muted mt-4 flex justify-between gap-3 border-t border-[var(--ow-border-subtle)] pt-3 text-xs">
                              <span>Region</span>
                              <span className="text-[var(--ow-text)]">
                                {project.region || "Not available"}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {selectedProject && (
                    <div className="mt-4 rounded-lg border border-[var(--ow-accent-border)] bg-[var(--ow-accent-soft)] p-4">
                      <p className="ow-eyebrow">Current selection</p>
                      <p className="mt-2 break-words font-semibold">
                        {selectedProject.name}
                      </p>
                      <p className="ow-muted mt-1 break-all font-mono text-xs">
                        {selectedProject.id}
                      </p>
                      <p className="ow-muted mt-3 text-xs leading-5">
                        This selection is currently local to this page. It
                        hasn't been saved or applied to ontology operations yet.
                      </p>
                    </div>
                  )}
                </section>

                <hr className="ow-divider my-7" />

                <section>
                  <button
                    type="button"
                    aria-expanded={showScopes}
                    onClick={() => setShowScopes((value) => !value)}
                    className="ow-scope-toggle flex w-full items-center justify-between gap-3 rounded-lg py-2 text-left"
                  >
                    <span>
                      <span className="block font-semibold">
                        Granted permissions
                      </span>
                      <span className="ow-muted mt-1 block text-sm">
                        Review the scopes you authorized
                      </span>
                    </span>
                    <span className="ow-accent-text shrink-0 text-sm cursor-pointer">
                      {showScopes ? "Hide −" : "Show +"}
                    </span>
                  </button>

                  {showScopes && (
                    <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {connection.scopes.map((scope) => (
                        <li key={scope} className="ow-scope">
                          {scope}
                        </li>
                      ))}
                      {connection.scopes.length === 0 && (
                        <li className="ow-muted text-sm">
                          No scope details are available.
                        </li>
                      )}
                    </ul>
                  )}
                </section>

                <hr className="ow-divider my-7" />

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="ow-muted text-sm leading-6">
                    Need to update your authorization?
                  </p>
                  <a
                    href="/api/appwrite-oauth/start"
                    className="ow-button ow-button-primary w-full sm:w-auto"
                  >
                    Reconnect Appwrite
                  </a>
                </div>
              </>
            ) : null}
          </div>
        </section>

        <footer className="ow-subtle py-8 text-center text-xs">
          OntoWrite · Semantic data infrastructure
        </footer>
      </div>
    </main>
  );
}
