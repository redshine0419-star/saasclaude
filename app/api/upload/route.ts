import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

// 제작 대행 신청(F-06) 자료 업로드 — 로그인 없이 사용
export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null);
  const file = formData?.get('file');

  if (!(file instanceof File)) return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: '파일 크기는 5MB 이하여야 합니다.' }, { status: 400 });
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) return NextResponse.json({ error: 'PDF, JPG, PNG, WebP만 업로드할 수 있습니다.' }, { status: 400 });

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('[upload] BLOB_READ_WRITE_TOKEN is not set');
    return NextResponse.json(
      { error: '지금은 파일을 첨부할 수 없습니다. 자료 없이 먼저 신청해 주시면 담당자가 따로 받겠습니다.' },
      { status: 503 },
    );
  }

  try {
    // 원래 파일명은 경로에 쓰지 않는다 (특수문자·개인정보 포함 가능)
    const blob = await put(`apply/${Date.now()}.${ext}`, file, {
      access: 'public',
      addRandomSuffix: true,
      contentType: file.type,
    });
    return NextResponse.json({ url: blob.url, name: file.name });
  } catch (e) {
    console.error('[upload] blob put failed:', e instanceof Error ? e.message : e);
    return NextResponse.json(
      { error: '파일을 올리지 못했습니다. 자료 없이 먼저 신청해 주시면 담당자가 따로 받겠습니다.' },
      { status: 502 },
    );
  }
}
