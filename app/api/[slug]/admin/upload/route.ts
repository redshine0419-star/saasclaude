import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getAdminMembership } from '@/lib/admin-auth';
import { storeFile, StorageUnavailableError } from '@/lib/storage';

type Params = Promise<{ slug: string }>;

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const EXT_BY_TYPE: Record<string, string> = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' } });
  if (!tenant) return NextResponse.json({ error: '학원을 찾을 수 없습니다.' }, { status: 404 });

  const membership = await getAdminMembership(tenant.id, session.user.email!);
  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: '파일을 찾을 수 없습니다.' }, { status: 400 });

  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: '파일을 찾을 수 없습니다.' }, { status: 400 });

  if (file.size > MAX_SIZE) return NextResponse.json({ error: '파일 크기는 5MB 이하여야 합니다.' }, { status: 400 });
  const ext = EXT_BY_TYPE[file.type];
  if (!ext) return NextResponse.json({ error: 'PDF, JPG, PNG, WebP만 업로드 가능합니다.' }, { status: 400 });

  try {
    const url = await storeFile(`${slug}/admin`, file, ext, file.type);
    return NextResponse.json({ url });
  } catch (e) {
    if (e instanceof StorageUnavailableError) {
      return NextResponse.json({ error: '파일 저장소가 아직 연결되지 않아 사진을 올릴 수 없습니다. 첫등원 운영팀에 문의해 주세요.' }, { status: 503 });
    }
    console.error('[admin/upload] store failed', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: '파일을 올리지 못했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 502 });
  }
}
