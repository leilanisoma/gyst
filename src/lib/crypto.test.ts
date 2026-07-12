import { beforeAll, describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret } from "./crypto";

beforeAll(() => {
  process.env.ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
});

describe("encryptSecret/decryptSecret", () => {
  it("round-trips a plaintext secret", () => {
    const plaintext = "ya29.fake-access-token";
    const encrypted = encryptSecret(plaintext);
    expect(encrypted).not.toContain(plaintext);
    expect(decryptSecret(encrypted)).toBe(plaintext);
  });

  it("produces a different ciphertext each time (random IV)", () => {
    const a = encryptSecret("same-input");
    const b = encryptSecret("same-input");
    expect(a).not.toBe(b);
  });

  it("throws on a tampered ciphertext", () => {
    const encrypted = encryptSecret("secret-value");
    const [iv, authTag, ciphertext] = encrypted.split(":");
    const tampered = [iv, authTag, ciphertext.slice(0, -4) + "abcd"].join(":");
    expect(() => decryptSecret(tampered)).toThrow();
  });
});
