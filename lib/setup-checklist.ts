import { isSamplePhoto } from '@/lib/sample-photos';
import { prisma } from '@/lib/prisma';

export type ChecklistItem = {
  key: string;
  label: string;
  why: string;
  href: string;
  done: boolean;
};

/** 원장이 직접 채워야 할 항목. 운영자가 독촉하지 않아도 대시보드가 다음 할 일을 알려준다. */
/** 첫 화면 큰 사진(0번)을 샘플이 아닌 학원 사진으로 바꿨는지 — 나머지 섹션 옆 사진은 샘플이어도 된다 */
export function mainPhotoReplaced(photos: string[] | null | undefined): boolean {
  const first = (photos ?? [])[0];
  return !!first && !isSamplePhoto(first);
}

export async function getSetupChecklist(tenant: {
  id: string;
  slug: string;
  theme: string;
  hours: string | null;
  kakaoChannelUrl: string | null;
  heroPhotos?: string[];
}): Promise<ChecklistItem[]> {
  const tenantId = tenant.id;
  const [director, classes, fees, refund, slots, recipients, staff, stats, posts] = await Promise.all([
    prisma.directorProfile.findUnique({ where: { tenantId }, select: { headline: true } }),
    prisma.classItem.count({ where: { tenantId } }),
    prisma.fee.count({ where: { tenantId } }),
    prisma.refundPolicyText.findUnique({ where: { tenantId }, select: { body: true } }),
    prisma.levelTestSlot.count({ where: { tenantId, active: true } }),
    prisma.pushDevice.count({ where: { tenantId } }),
    tenant.theme === 'result' ? prisma.staffProfile.count({ where: { tenantId } }) : Promise.resolve(0),
    tenant.theme === 'result' ? prisma.resultStat.count({ where: { tenantId, published: true } }) : Promise.resolve(0),
    tenant.theme === 'bright' ? prisma.post.count({ where: { tenantId, status: 'published' } }) : Promise.resolve(0),
  ]);

  const base = `/${tenant.slug}/admin`;
  const items: ChecklistItem[] = [
    { key: 'notify', label: '휴대폰에 관리자 앱 설치·알림 켜기', why: '홈 화면에 설치하면 새 상담이 들어올 때 바로 휴대폰으로 알려드립니다', href: `${base}?install=1`, done: recipients > 0 },
    { key: 'photos', label: '메인 사진을 우리 학원 사진으로', why: '첫 화면 큰 사진이 아직 샘플 사진입니다. 교실·수업 사진으로 바꿔 주세요', href: `${base}/sections`, done: mainPhotoReplaced(tenant.heroPhotos) },
    { key: 'slots', label: '레벨테스트·상담 가능 시간', why: '학부모가 신청할 때 시간을 고릅니다', href: `${base}/classes`, done: slots > 0 },
    { key: 'director', label: '원장 소개', why: '학부모가 가장 먼저 보는 신뢰 요소입니다', href: `${base}/info`, done: !!director?.headline?.trim() },
    { key: 'classes', label: '수업·반 안내', why: '어떤 반이 있는지 보여줍니다', href: `${base}/classes`, done: classes > 0 },
    { key: 'fees', label: '교습비', why: '교육청 신고 금액과 같게 입력해야 합니다', href: `${base}/info`, done: fees > 0 },
    { key: 'refund', label: '환불 기준', why: '교습비와 함께 표시해야 하는 항목입니다', href: `${base}/info`, done: !!refund?.body?.trim() },
    { key: 'hours', label: '운영 시간', why: '홈페이지와 검색 결과에 표시됩니다', href: `${base}/info`, done: !!tenant.hours?.trim() },
    { key: 'kakao', label: '카카오톡 채널 연결', why: '하단 고정 바의 카톡 상담 버튼이 켜집니다', href: `${base}/info`, done: !!tenant.kakaoChannelUrl?.trim() },
  ];

  if (tenant.theme === 'result') {
    items.push(
      { key: 'staff', label: '강사진', why: '성과 중심형 테마의 핵심 섹션입니다', href: `${base}/staff`, done: staff > 0 },
      { key: 'stats', label: '성과 통계 (근거 포함)', why: '근거 문구가 있어야 공개됩니다', href: `${base}/result-stats`, done: stats > 0 },
    );
  }
  if (tenant.theme === 'bright') {
    items.push({ key: 'gallery', label: '수업 사진 소식', why: '갤러리 섹션에 사진이 나타납니다', href: `${base}/news`, done: posts > 0 });
  }

  return items;
}
