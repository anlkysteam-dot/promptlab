import crypto from "crypto";

export function createRawResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashResetToken(raw: string): string {
  return crypto.createHash("sha256").update(raw, "utf8").digest("hex");
}
