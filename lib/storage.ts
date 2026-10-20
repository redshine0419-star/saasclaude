import { put } from '@vercel/blob';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';

export class StorageUnavailableError extends Error {}

/**
 * 파일 저장. Vercel Blob(BLOB_READ_WRITE_TOKEN)이 있으면 Blob에, 개발 환경에서는 public/dev-uploads에 저장한다.
 * 운영에서 Blob이 없으면 StorageUnavailableError — 호출하는 쪽에서 안내 메시지로 바꾼다.
 * 파일명은 항상 무작위로 만든다(원래 파일명에 학생 이름 등이 있을 수 있음).
 */
export async function storeFile(prefix: string, data: Blob, ext: string, contentType: string): Promise<string> {
  const name = `${prefix}/${Date.now()}-${randomBytes(8).toString('hex')}.${ext}`;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(name, data, { access: 'public', contentType, addRandomSuffix: true });
    return blob.url;
  }
  if (process.env.NODE_ENV !== 'production') {
    const file = path.join(process.cwd(), 'public', 'dev-uploads', name);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, Buffer.from(await data.arrayBuffer()));
    return `/dev-uploads/${name}`;
  }
  throw new StorageUnavailableError('storage not configured');
}

export const IMAGE_TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

/** 저장된 파일 주소인지 (Blob 또는 개발용 경로) — 클라이언트가 보낸 URL을 그대로 믿지 않기 위해 쓴다 */
export function isStoredUrl(url: string): boolean {
  return /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//.test(url) || (process.env.NODE_ENV !== 'production' && url.startsWith('/dev-uploads/'));
}
