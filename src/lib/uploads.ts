import path from "node:path";

export function getUploadDir(): string {
  return process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
}
