import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

// Public endpoint for application file uploads (unauthenticated)
export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null);
  const file = formData?.get('file') as File | null;

  if (!file) return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: '파일 크기는 5MB 이하여야 합니다.' }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: 'PDF, JPG, PNG, WebP만 업로드할 수 있습니다.' }, { status: 400 });

  const blob = await put(`apply/${Date.now()}-${file.name}`, file, { access: 'public' });

  return NextResponse.json({ url: blob.url });
}
