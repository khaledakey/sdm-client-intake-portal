import { randomBytes, createHash } from 'crypto';

/** Generates a URL-safe token and returns both the raw value (sent to the
 * user once) and its SHA-256 hash (stored in the database). Only the hash
 * is ever persisted, mirroring how passwords are handled. */
export function generateToken() {
  const raw = randomBytes(32).toString('hex');
  return { raw, hash: hashToken(raw) };
}

export function hashToken(raw: string) {
  return createHash('sha256').update(raw).digest('hex');
}
