import { fileTypeFromFile } from 'file-type';
import * as path from 'path';


export const ALLOWED_MIME = new Set<string>([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

export const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

export async function detectMimeFromPath(
  filePath: string,
): Promise<string | undefined> {
  const t = await fileTypeFromFile(filePath).catch(() => undefined);
  return t?.mime;
}

export function isAllowedMime(mime?: string): boolean {
  return !!mime && ALLOWED_MIME.has(mime);
}

export function extFromMime(mime: string): string | undefined {
  return MIME_TO_EXT[mime];
}

export function isSubPath(baseDir: string, targetPath: string) {
  const base = path.resolve(baseDir);
  const target = path.resolve(targetPath);
  return target.startsWith(base + path.sep);
}

