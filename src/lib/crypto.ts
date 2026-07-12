import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { getEncryptionEnv } from "./env";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

/**
 * Encrypts a secret (provider OAuth token) at rest with AES-256-GCM.
 * Output is `iv:authTag:ciphertext`, all base64 — never store the raw
 * secret. Server-only: never call from client code (CLAUDE.md security
 * boundaries).
 */
export function encryptSecret(plaintext: string): string {
  const key = Buffer.from(getEncryptionEnv().ENCRYPTION_KEY, "base64");
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [iv, authTag, ciphertext]
    .map((buf) => buf.toString("base64"))
    .join(":");
}

export function decryptSecret(encrypted: string): string {
  const key = Buffer.from(getEncryptionEnv().ENCRYPTION_KEY, "base64");
  const [ivB64, authTagB64, ciphertextB64] = encrypted.split(":");
  if (!ivB64 || !authTagB64 || !ciphertextB64) {
    throw new Error("Malformed encrypted secret.");
  }
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const ciphertext = Buffer.from(ciphertextB64, "base64");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
}
