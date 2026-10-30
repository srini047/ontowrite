import "server-only";

import { cookies } from "next/headers";
import { Client, TablesDB } from "node-appwrite";
import { DATABASE_ID, tablesDB as connectionsDB } from "@/lib/appwrite-server";
import {
  decryptOAuthToken,
  encryptOAuthToken,
} from "@/lib/appwrite-oauth-crypto";

const CONNECTIONS_TABLE = "appwrite_connections";
const TOKEN_URL = "https://cloud.appwrite.io/v1/oauth2/console/token";

type StoredProject = {
  id: string;
  name: string;
  endpoint?: string;
  region?: string;
};

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
};

export async function getSelectedProjectTablesDB() {
  const cookieStore = await cookies();
  const connectionId = cookieStore.get("appwrite_connection_id")?.value;

  if (!connectionId) {
    throw new Error("APPWRITE_CONNECTION_REQUIRED");
  }

  const row = await connectionsDB.getRow({
    databaseId: DATABASE_ID,
    tableId: CONNECTIONS_TABLE,
    rowId: connectionId,
  });

  const selectedProjectId = String(row.selectedProjectId ?? "");

  if (!selectedProjectId) {
    throw new Error("APPWRITE_PROJECT_NOT_SELECTED");
  }

  const projects = JSON.parse(String(row.projects ?? "[]")) as StoredProject[];

  const project = projects.find((item) => item.id === selectedProjectId);

  if (!project?.id || !project.endpoint) {
    throw new Error("APPWRITE_SELECTED_PROJECT_INVALID");
  }

  const clientId = process.env.APPWRITE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.APPWRITE_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("APPWRITE_OAUTH_NOT_CONFIGURED");
  }

  let accessToken = decryptOAuthToken(String(row.accessTokenEncrypted ?? ""));

  const expiresAt = Date.parse(String(row.tokenExpiresAt ?? ""));
  const needsRefresh =
    !Number.isFinite(expiresAt) || expiresAt <= Date.now() + 60_000;

  if (needsRefresh) {
    const encryptedRefreshToken = String(row.refreshTokenEncrypted ?? "");

    if (!encryptedRefreshToken) {
      throw new Error("APPWRITE_REAUTHORIZATION_REQUIRED");
    }

    const refreshToken = decryptOAuthToken(encryptedRefreshToken);

    const refreshResponse = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!refreshResponse.ok) {
      throw new Error("APPWRITE_TOKEN_REFRESH_FAILED");
    }

    const refreshed = (await refreshResponse.json()) as TokenResponse;

    if (!refreshed.access_token) {
      throw new Error("APPWRITE_TOKEN_REFRESH_FAILED");
    }

    accessToken = refreshed.access_token;

    await connectionsDB.updateRow({
      databaseId: DATABASE_ID,
      tableId: CONNECTIONS_TABLE,
      rowId: connectionId,
      data: {
        accessTokenEncrypted: encryptOAuthToken(refreshed.access_token),
        ...(refreshed.refresh_token
          ? {
              refreshTokenEncrypted: encryptOAuthToken(refreshed.refresh_token),
            }
          : {}),
        tokenExpiresAt: refreshed.expires_in
          ? new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
          : "",
        ...(refreshed.scope
          ? {
              scopes: JSON.stringify(
                refreshed.scope.split(/\s+/).filter(Boolean),
              ),
            }
          : {}),
        updatedAt: new Date().toISOString(),
      },
    });
  }

  const client = new Client()
    .setEndpoint(project.endpoint)
    .setProject(project.id)
    .setBearer(accessToken);

  return {
    tablesDB: new TablesDB(client),
    databaseId: "onto_main",
    projectId: project.id,
  };
}
