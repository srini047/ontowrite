import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { tablesDB, DATABASE_ID } from "@/lib/appwrite-server";
import { encryptOAuthToken } from "@/lib/appwrite-oauth-crypto";

const TABLE_ID = "appwrite_connections";
const TOKEN_URL = "https://cloud.appwrite.io/v1/oauth2/console/token";
const USERINFO_URL = "https://cloud.appwrite.io/v1/oauth2/console/userinfo";
const PROJECTS_URL = "https://cloud.appwrite.io/v1/oauth2/console/projects";

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
};

type UserInfo = {
  sub: string;
  name?: string;
  email?: string;
};

type ProjectResponse = {
  projects?: Array<{
    $id: string;
    name?: string;
    region?: string;
    endpoint?: string;
  }>;
};

function dashboardRedirect(request: NextRequest, error?: string) {
  const url = new URL("/dashboard", request.url);

  if (error) {
    url.searchParams.set("oauth_error", error);
  }

  const response = NextResponse.redirect(url);
  response.headers.set("Cache-Control", "no-store");
  response.cookies.delete("appwrite_oauth_state");

  return response;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const issuer = searchParams.get("iss");
  const oauthError = searchParams.get("error");

  const expectedState = request.cookies.get("appwrite_oauth_state")?.value;

  if (oauthError) {
    return dashboardRedirect(request, "authorization_failed");
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    return dashboardRedirect(request, "invalid_state");
  }

  // Validate the issuer shape, but use Appwrite's documented
  // central Console OAuth endpoints for token and resource requests.
  try {
    const issuerUrl = new URL(issuer ?? "");

    if (
      !issuerUrl.hostname.endsWith(".cloud.appwrite.io") ||
      issuerUrl.pathname !== "/v1/oauth2/console"
    ) {
      return dashboardRedirect(request, "invalid_issuer");
    }
  } catch {
    return dashboardRedirect(request, "invalid_issuer");
  }

  const clientId = process.env.APPWRITE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.APPWRITE_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.APPWRITE_OAUTH_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    console.error("[OAuth] Missing client configuration.");
    return dashboardRedirect(request, "server_configuration");
  }

  try {
    const tokenResponse = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!tokenResponse.ok) {
      console.error("[OAuth] Token exchange failed:", tokenResponse.status);
      return dashboardRedirect(request, "token_exchange_failed");
    }

    const tokens = (await tokenResponse.json()) as TokenResponse;

    if (!tokens.access_token) {
      return dashboardRedirect(request, "missing_access_token");
    }

    const userResponse = await fetch(USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
      cache: "no-store",
    });

    if (!userResponse.ok) {
      console.error("[OAuth] Userinfo failed:", userResponse.status);
      return dashboardRedirect(request, "userinfo_failed");
    }

    const user = (await userResponse.json()) as UserInfo;

    if (!user.sub) {
      return dashboardRedirect(request, "missing_identity");
    }

    const projectsResponse = await fetch(PROJECTS_URL, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
      cache: "no-store",
    });

    if (!projectsResponse.ok) {
      console.error("[OAuth] Project listing failed:", projectsResponse.status);
      return dashboardRedirect(request, "project_listing_failed");
    }

    const projectResult = (await projectsResponse.json()) as ProjectResponse;

    const projects = (projectResult.projects ?? []).map((project) => ({
      id: project.$id,
      name: project.name || project.$id,
      region: project.region,
      endpoint: project.endpoint,
    }));

    const scopes = (tokens.scope ?? "").split(/\s+/).filter(Boolean);

    // A random row ID also acts as an opaque browser connection handle.
    const connectionId = randomUUID();
    const now = new Date().toISOString();

    await tablesDB.createRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_ID,
      rowId: connectionId,
      data: {
        // This is the Appwrite Console OAuth subject, not a verified
        // OntoWrite application-session identity.
        ownerUserId: user.sub,
        appwriteUserId: user.sub,
        accessTokenEncrypted: encryptOAuthToken(tokens.access_token),
        refreshTokenEncrypted: tokens.refresh_token
          ? encryptOAuthToken(tokens.refresh_token)
          : "",
        tokenExpiresAt: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
          : "",
        scopes: JSON.stringify(scopes),
        projects: JSON.stringify(projects),
        createdAt: now,
        updatedAt: now,
      },
    });

    const response = NextResponse.redirect(
      new URL("/dashboard?connected=1", request.url),
    );

    response.headers.set("Cache-Control", "no-store");

    response.cookies.set("appwrite_connection_id", connectionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    response.cookies.delete("appwrite_oauth_state");

    return response;
  } catch (error) {
    // Do not log authorization codes, tokens, or database row contents.
    console.error(
      "[OAuth] Callback processing failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return dashboardRedirect(request, "callback_failed");
  }
}
