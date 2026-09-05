import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

const UPLOADS_ROOT = path.join(__dirname, "..", "..", "uploads");
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL ?? `http://localhost:${process.env.PORT ?? 4000}`;

/**
 * Saves a profile photo to local disk under uploads/profile-photos and returns
 * its publicly reachable URL. Fine for local dev; for production, swap this for
 * an object store (S3, Cloudflare R2, Firebase Storage, etc.) since most hosts'
 * filesystems aren't persistent across deploys.
 */
export async function saveProfilePhoto(buffer: Buffer, mimeType: string, userId: number): Promise<string> {
  const extension = mimeType === "image/png" ? "png" : "jpg";
  const filename = `${userId}-${randomUUID()}.${extension}`;
  const dir = path.join(UPLOADS_ROOT, "profile-photos");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), buffer);
  return `${PUBLIC_BASE_URL}/uploads/profile-photos/${filename}`;
}
