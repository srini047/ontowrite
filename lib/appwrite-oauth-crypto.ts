import "server-only";
import { createCipheriv, randomBytes } from "node:crypto";

function getEncryptionKey(): Buffer {
  const encoded = process.env.APPWRITE_OAUTH_TOKEN_ENCRYPTION_KEY;

  if (!encoded) {
    throw new Error("Missing APPWRITE_OAUTH_TOKEN_ENCRYPTION_KEY.");
  }

  const key = Buffer.from(encoded, "base64");

  if (key.length !== 32) {
    throw new Error("OAuth encryption key must decode to 32 bytes.");
  }

  return key;
}

export function encryptOAuthToken(token: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);

  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    tag.toString("base64"),
    encrypted.toString("base64"),
  ].join(".");
}
