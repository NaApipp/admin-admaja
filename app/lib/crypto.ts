import crypto from "crypto";

/**
 * Mendapatkan encryption key 32-byte untuk AES-256.
 * Mengutamakan process.env.ENCRYPTION_KEY atau process.env.PASSWORD_SAVER_KEY.
 */
function getEncryptionKey(): Buffer {
  const key =
    process.env.ENCRYPTION_KEY ||
    process.env.PASSWORD_SAVER_KEY ||
    "default_vault_encryption_key_admaja_2026";

  // Jika berupa hex string 64-karakter (32 bytes)
  if (/^[0-9a-fA-F]{64}$/.test(key)) {
    return Buffer.from(key, "hex");
  }

  // Jika string biasa, hash dengan SHA-256 untuk mendapatkan buffer tepat 32 bytes
  return crypto.createHash("sha256").update(key).digest();
}

/**
 * Enkripsi string menggunakan AES-256-GCM.
 * Output format: iv_hex:auth_tag_hex:encrypted_hex
 */
export function encryptPassword(plainText: string): string {
  if (!plainText) return "";

  const key = getEncryptionKey();
  // Standard recommended IV size untuk GCM adalah 12 bytes (96 bits)
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Dekripsi string terenkripsi AES-256-GCM.
 * Format yang diterima: iv_hex:auth_tag_hex:encrypted_hex
 */
export function decryptPassword(cipherText: string): string {
  if (!cipherText) return "";

  try {
    const parts = cipherText.split(":");
    if (parts.length !== 3) {
      throw new Error("Format cipher text tidak valid");
    }

    const [ivHex, authTagHex, encryptedHex] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Gagal mendekripsi password:", error);
    return "[Gagal mendekripsi]";
  }
}
