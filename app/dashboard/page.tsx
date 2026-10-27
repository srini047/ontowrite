"use client";

import { account } from "@/lib/appwrite";
import { useEffect, useState } from "react";

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
};

export default function DashboardPage() {
  const [user, setUser] = useState<AppwriteUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [connection, setConnection] = useState<ConnectionStatus | null>(null);
  const [connectionLoading, setConnectionLoading] = useState(true);
  const [connectionError, setConnectionError] = useState("");

  async function loadConnection() {
    setConnectionLoading(true);
    setConnectionError("");

    try {
      const response = await fetch("/api/appwrite-oauth/status", {
        cache: "no-store",
      });

      const body = await response.text();

      console.log("[OntoWrite] Connection status:", response.status);
      console.log("[OntoWrite] Status response:", body);

      if (!response.ok) {
        throw new Error(`Status API returned ${response.status}: ${body}`);
      }

      const data: ConnectionStatus = JSON.parse(body);

      if (
        typeof data.connected !== "boolean" ||
        !Array.isArray(data.projects) ||
        !Array.isArray(data.scopes)
      ) {
        throw new Error("Status API returned an unexpected response shape.");
      }

      setConnection(data);
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
  }

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
        window.location.assign("/auth");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    loadConnection();

    if (new URLSearchParams(window.location.search).get("connected") === "1") {
      window.history.replaceState({}, "", "/dashboard");
    }
  }, []);

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

  if (loading || !user) {
    return <main className="p-8">Loading...</main>;
  }

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col p-6">
      <h1 className="text-3xl font-bold">Welcome, {user.name || user.email}</h1>

      <p className="mt-2 text-gray-500">
        Manage your Appwrite connections and ontology projects.
      </p>

      <section className="mt-8 rounded-xl border p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Appwrite connection</h2>
            <p className="mt-1 text-sm text-gray-500">
              Projects and permissions granted to OntoWrite.
            </p>
          </div>

          <button
            onClick={loadConnection}
            disabled={connectionLoading}
            className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50"
          >
            {connectionLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {connectionLoading ? (
          <p className="mt-5 text-gray-500">Loading connection details...</p>
        ) : connectionError ? (
          <p className="mt-5 text-sm text-red-600">{connectionError}</p>
        ) : !connection?.connected ? (
          <div className="mt-5">
            <p className="text-red-600">
              No Appwrite project connection found.
            </p>

            <a
              href="/api/appwrite-oauth/start"
              className="mt-4 inline-flex rounded-lg bg-[#15141f] px-5 py-3 font-medium text-white hover:bg-[#292738]"
            >
              Connect Appwrite project
            </a>
          </div>
        ) : (
          <div className="mt-5">
            <p className="font-medium text-green-700">Connected to Appwrite</p>

            <h3 className="mt-5 font-semibold">
              Authorized projects ({connection.projects.length})
            </h3>

            {connection.projects.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">
                No authorized projects were returned.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                {connection.projects.map((project) => (
                  <div key={project.id} className="rounded-lg border p-4">
                    <p className="font-medium">{project.name}</p>
                    <p className="mt-1 break-all text-sm text-gray-500">
                      Project ID: {project.id}
                    </p>
                    {project.region && (
                      <p className="mt-1 text-sm text-gray-500">
                        Region: {project.region}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <h3 className="mt-6 font-semibold">
              Granted permissions ({connection.scopes.length})
            </h3>

            {connection.scopes.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">
                No scope details are available.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {connection.scopes.map((scope) => (
                  <li
                    key={scope}
                    className="break-all rounded-md bg-gray-100 px-3 py-2 font-mono text-sm text-gray-800"
                  >
                    {scope}
                  </li>
                ))}
              </ul>
            )}

            <a
              href="/api/appwrite-oauth/start"
              className="mt-5 inline-flex rounded-lg bg-[#15141f] px-5 py-3 font-medium text-white hover:bg-[#292738]"
            >
              Reconnect Appwrite
            </a>
          </div>
        )}
      </section>

      <button
        onClick={signOut}
        disabled={signingOut}
        className="mt-6 w-fit rounded-lg border px-5 py-2 disabled:opacity-50"
      >
        {signingOut ? "Signing out..." : "Sign out"}
      </button>
    </main>
  );
}
