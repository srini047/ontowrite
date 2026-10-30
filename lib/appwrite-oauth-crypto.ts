import "server-only";
import { createCipheriv, randomBytes, createDecipheriv } from "node:crypto";

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

export function decryptOAuthToken(value: string): string {
  const [ivEncoded, tagEncoded, encryptedEncoded] = value.split(".");

  if (!ivEncoded || !tagEncoded || !encryptedEncoded) {
    throw new Error("Invalid encrypted token format.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivEncoded, "base64"),
  );

  decipher.setAuthTag(Buffer.from(tagEncoded, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedEncoded, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
