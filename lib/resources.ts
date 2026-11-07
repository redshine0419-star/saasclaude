import { randomBytes } from 'node:crypto';

/**
 * 학원 자료실 — 학원(원장·직원)이 자료를 올리고 학부모는 본다.
 * visibility: public(홈페이지 자료실 목록에 공개) · link(목록에 안 보이고 공유 링크를 아는 사람만)
 */

export const MAX_FILES = 5;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/** 확장자 → 저장할 MIME. 한글(hwp·hwpx)은 브라우저가 MIME을 제대로 안 주므로 확장자로 판단한다 */
export const RESOURCE_FILE_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  hwp: 'application/x-hwp',
  hwpx: 'application/hwp+zip',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

export function fileExt(name: string): string {
  const m = /\.([a-z0-9]{2,5})$/i.exec(name.trim());
  return m ? m[1].toLowerCase() : '';
}

export type ResourceFile = { url: string; name: string; size: number; type: string };
export type ResourceInput = { title: string; body: string | null; files: ResourceFile[]; visibility: 'public' | 'link'; pinned: boolean };
type Result<T> = { ok: true; data: T } | { ok: false; error: string };

/** 표시용 파일 이름 — 경로·제어 문자를 빼고 길이를 줄인다 */
export function safeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? 'file';
  return base.replace(/[\u0000-\u001f<>"]/g, '').trim().slice(0, 120) || 'file';
}

export function parseResource(body: Record<string, unknown>, isStoredUrl: (u: string) => boolean): Result<ResourceInput> {
  const title = typeof body.title === 'string' ? body.title.trim().slice(0, 100) : '';
  if (!title) return { ok: false, error: '제목을 입력해 주세요.' };
  const text = typeof body.body === 'string' ? body.body.trim().slice(0, 5000) : '';
  const visibility = body.visibility === 'link' ? 'link' : 'public';
  const raw = Array.isArray(body.files) ? body.files : [];
  if (raw.length > MAX_FILES) return { ok: false, error: `첨부 파일은 ${MAX_FILES}개까지 올릴 수 있습니다.` };
  const files: ResourceFile[] = [];
  for (const f of raw as Record<string, unknown>[]) {
    const url = typeof f?.url === 'string' ? f.url : '';
    const name = safeFileName(typeof f?.name === 'string' ? f.name : '');
    const ext = fileExt(name);
    if (!url || !isStoredUrl(url)) return { ok: false, error: '첨부 파일 주소가 올바르지 않습니다. 다시 올려 주세요.' };
    if (!RESOURCE_FILE_TYPES[ext]) return { ok: false, error: `${name}: 올릴 수 없는 파일 형식입니다.` };
    const size = typeof f?.size === 'number' && f.size > 0 ? Math.min(f.size, MAX_FILE_SIZE) : 0;
    files.push({ url, name, size, type: RESOURCE_FILE_TYPES[ext] });
  }
  if (!text && files.length === 0) return { ok: false, error: '내용을 쓰거나 파일을 하나 이상 올려 주세요.' };
  return { ok: true, data: { title, body: text || null, files, visibility, pinned: body.pinned === true } };
}

export function newShareToken(): string {
  return randomBytes(18).toString('base64url');
}

export function formatSize(bytes: number): string {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

export function asFiles(json: unknown): ResourceFile[] {
  return Array.isArray(json) ? (json as ResourceFile[]).filter((f) => f && typeof f.url === 'string') : [];
}
