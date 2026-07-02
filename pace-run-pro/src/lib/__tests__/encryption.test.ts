import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { encrypt, decrypt } from "@/lib/encryption";

describe("encryption", () => {
  const VALID_KEY = "a".repeat(64); // 64 hex chars = 32 bytes

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = VALID_KEY;
  });

  afterEach(() => {
    delete process.env.ENCRYPTION_KEY;
  });

  it("encrypts and decrypts round-trip correctly", () => {
    const plain = "access_token_abc123";
    const enc = encrypt(plain);
    expect(enc).toMatch(/^enc:/);
    expect(decrypt(enc)).toBe(plain);
  });

  it("produces different ciphertext each time (random IV)", () => {
    const plain = "same_token";
    const enc1 = encrypt(plain);
    const enc2 = encrypt(plain);
    expect(enc1).not.toBe(enc2);
    expect(decrypt(enc1)).toBe(plain);
    expect(decrypt(enc2)).toBe(plain);
  });

  it("decrypts legacy plain: prefix gracefully", () => {
    const result = decrypt("plain:my_token");
    expect(result).toBe("my_token");
  });

  it("decrypts legacy plaintext without prefix", () => {
    const result = decrypt("bare_token");
    expect(result).toBe("bare_token");
  });

  it("returns plain: prefix when ENCRYPTION_KEY is not set", () => {
    delete process.env.ENCRYPTION_KEY;
    const result = encrypt("token123");
    expect(result).toBe("plain:token123");
  });

  it("throws when decrypting enc: without ENCRYPTION_KEY", () => {
    const enc = encrypt("secret"); // still works with key set
    delete process.env.ENCRYPTION_KEY;
    expect(() => decrypt(enc)).toThrow(/ENCRYPTION_KEY required/);
  });

  it("throws on corrupted ciphertext", () => {
    expect(() => decrypt("enc:dG9vc2hvcnQ=")).toThrow(); // 'tooshort' in base64
  });

  it("handles empty string encryption", () => {
    const enc = encrypt("");
    expect(enc).toMatch(/^enc:/);
    expect(decrypt(enc)).toBe("");
  });

  it("handles unicode plaintext", () => {
    const plain = "token com acentuação: ção";
    expect(decrypt(encrypt(plain))).toBe(plain);
  });

  it("handles long tokens", () => {
    const plain = "a".repeat(1024);
    expect(decrypt(encrypt(plain))).toBe(plain);
  });
});
