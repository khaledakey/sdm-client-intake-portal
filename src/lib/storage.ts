/**
 * File storage abstraction. The default implementation writes to local
 * disk under UPLOAD_DIR — fine for a single-instance deployment or local
 * dev. Swap this module's implementation for S3 / GCS / Azure Blob when
 * moving to production infrastructure; callers only depend on the
 * `saveFile` / `readFile` / `deleteFile` contract below, keyed by the
 * opaque `storageReference` string persisted on the Document row.
 */
import { mkdir, writeFile, readFile as fsReadFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

function uploadRoot() {
  return path.resolve(process.cwd(), process.env.UPLOAD_DIR || './uploads');
}

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20MB

const ALLOWED_EXTENSIONS = new Set([
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp',
  '.zip', '.csv', '.txt', '.ai', '.eps', '.psd', '.fig',
]);

export function isExtensionAllowed(fileName: string) {
  const ext = path.extname(fileName).toLowerCase();
  return ALLOWED_EXTENSIONS.has(ext);
}

/** Saves a file under a random, non-guessable path and returns the opaque
 * storageReference to persist alongside the document metadata. */
export async function saveFile(businessId: string, originalName: string, buffer: Buffer) {
  const dir = path.join(uploadRoot(), businessId);
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
  const ext = path.extname(originalName);
  const key = `${randomUUID()}${ext}`;
  await writeFile(path.join(dir, key), buffer);
  return `${businessId}/${key}`;
}

export async function readStoredFile(storageReference: string) {
  return fsReadFile(path.join(uploadRoot(), storageReference));
}

export async function deleteStoredFile(storageReference: string) {
  const target = path.join(uploadRoot(), storageReference);
  if (existsSync(target)) await unlink(target);
}
