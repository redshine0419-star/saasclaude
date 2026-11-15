import { NextResponse } from 'next/server';
import { studentAccess } from '@/lib/students/access';
import { unreadCount } from '@/lib/notify/owner';
import { dueSmsCount } from '@/lib/sms/tasks';

type Params = Promise<{ slug: string }>;

// GET — 관리자 메뉴 배지: 안 읽은 알림 수, 지금 보낼 문자 수 (원장·직원)
export async function GET(_req: Request, { params }: { params: Params }) {
  const { slug } = await params;
  const a = await studentAccess(slug);
  if (a instanceof NextResponse) return a;
  const [unread, smsDue] = await Promise.all([unreadCount(a.tenantId), dueSmsCount(a.tenantId)]);
  return NextResponse.json({ unread, smsDue }, { headers: { 'Cache-Control': 'no-store' } });
}
