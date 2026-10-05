import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { put } from '@vercel/blob';

type Params = Promise<{ id: string }>;

export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { id } = await params;

  const application = await prisma.application.findUnique({ where: { id } });
  if (!application) return NextResponse.json({ error: '신청을 찾을 수 없습니다.' }, { status: 404 });

  // 신청 후 2주 이내만 업로드 허용
  const twoWeeksAfter = new Date(application.createdAt.getTime() + 14 * 24 * 60 * 60 * 1000);
  if (new Date() > twoWeeksAfter) {
    return NextResponse.json({ error: '자료 제출 기한(2주)이 지났습니다.' }, { status: 403 });
  }

  const contentType = req.headers.get('content-type') ?? '';
  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json({ error: 'multipart/form-data 형식으로 전송해주세요.' }, { status: 400 });
  }

  const fd = await req.formData();
  const files = fd.getAll('files') as File[];

  if (files.length === 0) return NextResponse.json({ error: '파일을 선택해주세요.' }, { status: 400 });
  if (files.length > 10) return NextResponse.json({ error: '파일은 최대 10개까지 업로드 가능합니다.' }, { status: 400 });

  const uploadedUrls: string[] = [];

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    for (const file of files) {
      if (!(file instanceof File)) continue;
      if (file.size > 20 * 1024 * 1024) continue; // 20MB per file
      const ext = file.name.split('.').pop() ?? 'bin';
      const blob = await put(
        `applications/${id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}.${ext}`,
        file,
        { access: 'public', contentType: file.type },
      );
      uploadedUrls.push(blob.url);
    }
  } else {
    // No Blob token: record filenames only
    for (const file of files) {
      if (file instanceof File) uploadedUrls.push(file.name);
    }
  }

  // Append to existing uploadedFiles
  const updated = await prisma.application.update({
    where: { id },
    data: {
      uploadedFiles: { push: uploadedUrls },
      status: 'waiting_docs',
    },
  });

  return NextResponse.json({ ok: true, count: uploadedUrls.length, total: updated.uploadedFiles.length });
}
