import { NextRequest, NextResponse } from 'next/server';
import { storeFile, StorageUnavailableError, IMAGE_TYPES } from '@/lib/storage';
import { blogAdmin } from '@/lib/blog/access';

const MAX = 5 * 1024 * 1024;

// POST — 블로그 사진 올리기 (운영자). JPG·PNG·WEBP, 5MB까지
export async function POST(req: NextRequest) {
  const email = await blogAdmin();
  if (email instanceof NextResponse) return email;
  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: '파일을 찾을 수 없습니다.' }, { status: 400 });
  const ext = IMAGE_TYPES[file.type];
  if (!ext) return NextResponse.json({ error: 'JPG·PNG·WEBP 사진만 올릴 수 있습니다.' }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: '사진은 5MB 이하만 올릴 수 있습니다.' }, { status: 400 });
  try {
    const url = await storeFile('blog', file, ext, file.type);
    return NextResponse.json({ url });
  } catch (e) {
    if (e instanceof StorageUnavailableError) return NextResponse.json({ error: '파일 저장소가 연결되지 않았습니다 (BLOB_READ_WRITE_TOKEN).' }, { status: 503 });
    return NextResponse.json({ error: '사진을 올리지 못했습니다.' }, { status: 500 });
  }
}
