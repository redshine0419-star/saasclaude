import { NextRequest, NextResponse } from 'next/server';
import { studentAccess } from '@/lib/students/access';
import { prisma } from '@/lib/prisma';
import { storeFile, StorageUnavailableError } from '@/lib/storage';
import { MAX_FILE_SIZE, RESOURCE_FILE_TYPES, fileExt, safeFileName } from '@/lib/resources';

type Params = Promise<{ slug: string }>;

// POST — 자료실 첨부 파일 올리기 (원장·직원). PDF·이미지·한글·워드·엑셀·파워포인트, 10MB까지
export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;
  const a = await studentAccess(slug);
  if (a instanceof NextResponse) return a;
  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: '파일을 찾을 수 없습니다.' }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: '파일은 10MB 이하만 올릴 수 있습니다.' }, { status: 400 });
  const name = safeFileName(file.name);
  const ext = fileExt(name);
  const type = RESOURCE_FILE_TYPES[ext];
  if (!type) return NextResponse.json({ error: 'PDF·사진·한글(hwp)·워드·엑셀·파워포인트 파일만 올릴 수 있습니다.' }, { status: 400 });
  const tenant = await prisma.tenant.findUnique({ where: { id: a.tenantId }, select: { slug: true } });
  try {
    const url = await storeFile(`${tenant?.slug ?? slug}/resources`, file, ext, type);
    return NextResponse.json({ url, name, size: file.size, type });
  } catch (e) {
    if (e instanceof StorageUnavailableError) {
      return NextResponse.json({ error: '파일 저장소가 아직 연결되지 않아 파일을 올릴 수 없습니다. 더클 운영팀에 문의해 주세요.' }, { status: 503 });
    }
    return NextResponse.json({ error: '파일을 올리지 못했습니다.' }, { status: 500 });
  }
}
