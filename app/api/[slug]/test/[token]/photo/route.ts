import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findAttemptByToken, isPastDeadline } from '@/lib/level-test/attempt';
import { IMAGE_TYPES, StorageUnavailableError, storeFile } from '@/lib/storage';
import { MAX_ESSAY_PHOTOS } from '@/lib/level-test/grading';

type Params = Promise<{ slug: string; token: string }>;

const MAX_BYTES = 5 * 1024 * 1024;

async function openAttempt(slug: string, token: string) {
  const attempt = await findAttemptByToken(slug, token);
  if (!attempt) return { error: NextResponse.json({ error: '시험을 찾을 수 없습니다.' }, { status: 404 }) } as const;
  if (attempt.status !== 'in_progress') return { error: NextResponse.json({ error: '진행 중인 시험이 아닙니다.' }, { status: 409 }) } as const;
  if (isPastDeadline(attempt.startedAt, attempt.test.timeLimitMin, new Date())) {
    return { error: NextResponse.json({ error: '제한 시간이 지났습니다.', expired: true }, { status: 409 }) } as const;
  }
  return { attempt } as const;
}

// 서술형 풀이 사진 올리기 (휴대폰에서 줄여 JPEG로 보낸다)
export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { slug, token } = await params;
  const o = await openAttempt(slug, token);
  if ('error' in o) return o.error;
  const { attempt } = o;

  const fd = await req.formData().catch(() => null);
  const questionId = String(fd?.get('questionId') ?? '');
  const file = fd?.get('file');
  const item = attempt.test.items.find((i) => i.questionId === questionId);
  if (!item || item.question.type !== 'essay') return NextResponse.json({ error: '사진을 올릴 수 없는 문항입니다.' }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ error: '사진을 선택해 주세요.' }, { status: 400 });
  const ext = IMAGE_TYPES[file.type];
  if (!ext) return NextResponse.json({ error: 'JPG, PNG, WebP 사진만 올릴 수 있습니다.' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: '사진이 너무 큽니다 (5MB 이하).' }, { status: 400 });

  const existing = attempt.responses.find((r) => r.questionId === questionId);
  if ((existing?.photos.length ?? 0) >= MAX_ESSAY_PHOTOS) return NextResponse.json({ error: `사진은 ${MAX_ESSAY_PHOTOS}장까지 올릴 수 있습니다.` }, { status: 400 });

  let url: string;
  try {
    url = await storeFile(`${slug}/level-test/${attempt.id}`, file, ext, file.type);
  } catch (e) {
    if (e instanceof StorageUnavailableError) {
      return NextResponse.json({ error: '지금은 사진을 올릴 수 없습니다. 풀이를 글로 적어 주세요.' }, { status: 503 });
    }
    console.error('[level-test photo] store failed:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: '사진을 올리지 못했습니다. 다시 시도해 주세요.' }, { status: 502 });
  }

  const saved = await prisma.testResponse.upsert({
    where: { attemptId_questionId: { attemptId: attempt.id, questionId } },
    update: { photos: { push: url } },
    create: { tenantId: attempt.tenantId, attemptId: attempt.id, questionId, answer: '', photos: [url] },
  });
  return NextResponse.json({ ok: true, photos: saved.photos });
}

// 올린 사진 빼기
export async function DELETE(req: NextRequest, { params }: { params: Params }) {
  const { slug, token } = await params;
  const o = await openAttempt(slug, token);
  if ('error' in o) return o.error;
  const { attempt } = o;
  const b = await req.json().catch(() => ({}));
  const questionId = String(b.questionId ?? '');
  const existing = attempt.responses.find((r) => r.questionId === questionId);
  if (!existing) return NextResponse.json({ ok: true, photos: [] });
  const photos = existing.photos.filter((p) => p !== b.url);
  if (!photos.length && !existing.answer.trim()) {
    await prisma.testResponse.delete({ where: { id: existing.id } });
  } else {
    await prisma.testResponse.update({ where: { id: existing.id }, data: { photos } });
  }
  return NextResponse.json({ ok: true, photos });
}
