import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const ENC_PREFIX = "$9r$";

function deriveKey(secret) {
  return crypto.scryptSync(secret, "9router-encryption-salt", KEY_LENGTH);
}

function getEncryptionKey() {
  const key = process.env.STORAGE_ENCRYPTION_KEY || process.env.MACHINE_ID_SALT || "";
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      console.error("[ENCRYPTION] WARNING: No STORAGE_ENCRYPTION_KEY or MACHINE_ID_SALT set — provider secrets stored in plaintext. Set STORAGE_ENCRYPTION_KEY to a long random value.");
    }
    return null;
  }
  return deriveKey(key);
}

export function encryptField(plaintext) {
  if (plaintext == null || plaintext === "") return plaintext;
  const key = getEncryptionKey();
  if (!key) return plaintext;

  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(String(plaintext), "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    const payload = `${iv.toString("base64")}.${tag.toString("base64")}.${encrypted.toString("base64")}`;
    return ENC_PREFIX + payload;
  } catch (err) {
    console.error("[ENCRYPTION] encryptField failed:", err.message);
    return plaintext;
  }
}

export function decryptField(ciphertext) {
  if (ciphertext == null || typeof ciphertext !== "string" || !ciphertext.startsWith(ENC_PREFIX)) {
    return ciphertext;
  }

  const key = getEncryptionKey();
  if (!key) return ciphertext;

  try {
    const payload = ciphertext.slice(ENC_PREFIX.length);
    const parts = payload.split(".");
    if (parts.length !== 3) return ciphertext;
    const [ivB64, tagB64, dataB64] = parts;
    const iv = Buffer.from(ivB64, "base64");
    const tag = Buffer.from(tagB64, "base64");
    const data = Buffer.from(dataB64, "base64");
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return decrypted.toString("utf8");
  } catch (err) {
    console.error("[ENCRYPTION] decryptField failed:", err.message);
    return null;
  }
}

export function encryptObjectFields(obj, sensitiveKeys) {
  if (!obj || typeof obj !== "object") return obj;
  for (const key of sensitiveKeys) {
    if (obj[key] !== undefined && obj[key] !== null) {
      obj[key] = encryptField(obj[key]);
    }
  }
  if (obj.providerSpecificData && typeof obj.providerSpecificData === "object") {
    obj.providerSpecificData = encryptField(JSON.stringify(obj.providerSpecificData));
  }
  return obj;
}

export function decryptObjectFields(obj, sensitiveKeys) {
  if (!obj || typeof obj !== "object") return obj;
  for (const key of sensitiveKeys) {
    if (obj[key] !== undefined && obj[key] !== null) {
      obj[key] = decryptField(obj[key]);
    }
  }
  if (obj.providerSpecificData && typeof obj.providerSpecificData === "string" && obj.providerSpecificData.startsWith(ENC_PREFIX)) {
    const decrypted = decryptField(obj.providerSpecificData);
    if (decrypted) {
      try { obj.providerSpecificData = JSON.parse(decrypted); } catch {}
    }
  }
  return obj;
}

export const SENSITIVE_CONNECTION_FIELDS = [
  "accessToken", "refreshToken", "apiKey", "idToken", "copilotToken",
];
