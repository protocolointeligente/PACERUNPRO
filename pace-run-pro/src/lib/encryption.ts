/**
 * AES-256-GCM symmetric encryption for sensitive at-rest data (OAuth tokens).
 *
 * Setup:
 *   ENCRYPTION_KEY=<64-hex-char string>   # openssl rand -hex 32
 *
 * If the env var is absent, encrypt() returns the plaintext prefixed with
 * "plain:" so decrypt() can still serve existing unencrypted rows during
 * a gradual migration. Warn loudly in this case.
 *
 * Encrypted format: "enc:<base64(12-byte-iv + ciphertext + 16-byte-authTag)>"
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LEN    = 12; // 96-bit IV recommended for GCM
const TAG_LEN   = 16; // 128-bit auth tag

function getKey(): Buffer | null {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) return null;
  return Buffer.from(hex, "hex");
}

export function encrypt(plaintext: string): string {
  const key = getKey();
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      console.warn("[encryption] ENCRYPTION_KEY not set — storing token without encryption");
    }
    return `plain:${plaintext}`;
  }

  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  const combined = Buffer.concat([iv, ciphertext, tag]);
  return `enc:${combined.toString("base64")}`;
}

export function decrypt(stored: string): string {
  if (!stored) return stored;

  if (stored.startsWith("plain:")) {
    return stored.slice(6);
  }

  if (!stored.startsWith("enc:")) {
    // Legacy plaintext row — no prefix at all
    return stored;
  }

  const key = getKey();
  if (!key) {
    throw new Error("[encryption] ENCRYPTION_KEY required to decrypt stored token");
  }

  const combined = Buffer.from(stored.slice(4), "base64");
  if (combined.length < IV_LEN + TAG_LEN) {
    throw new Error("[encryption] Corrupted ciphertext: too short");
  }

  const iv         = combined.subarray(0, IV_LEN);
  const tag        = combined.subarray(combined.length - TAG_LEN);
  const ciphertext = combined.subarray(IV_LEN, combined.length - TAG_LEN);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
