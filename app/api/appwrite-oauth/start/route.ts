import { NextRequest, NextResponse } from "next/server";

const SCOPES = [
  "project:databases.read",
  "project:databases.write",
  "project:tables.read",
  "project:tables.write",
  "project:columns.read",
  "project:columns.write",
  "project:indexes.read",
  "project:indexes.write",
  "project:rows.read",
  "project:rows.write",
];

export async function GET(request: NextRequest) {
  const clientId = process.env.APPWRITE_OAUTH_CLIENT_ID;
  const redirectUri = process.env.APPWRITE_OAUTH_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "Appwrite OAuth is not configured." },
      { status: 500 },
    );
  }

  let callbackUrl: URL;

  try {
    callbackUrl = new URL(redirectUri);
  } catch {
    return NextResponse.json(
      { error: "APPWRITE_OAUTH_REDIRECT_URI must be a valid URL." },
      { status: 500 },
    );
  }

  if (
    callbackUrl.pathname !== "/api/appwrite-oauth/callback" ||
    (callbackUrl.protocol !== "https:" && callbackUrl.hostname !== "localhost")
  ) {
    return NextResponse.json(
      { error: "Invalid OAuth callback URL configuration." },
      { status: 500 },
    );
  }

  const state = crypto.randomUUID();

  const authorizeUrl = new URL(
    "https://cloud.appwrite.io/v1/oauth2/console/authorize",
  );

  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set(
    "scope",
    `openid profile email ${SCOPES.join(" ")}`,
  );
  authorizeUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authorizeUrl);

  response.headers.set("Cache-Control", "no-store");

  response.cookies.set("appwrite_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return response;
}
