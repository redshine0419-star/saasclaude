import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { generateText } from '@/lib/ai';

interface MemberStats {
  userId: string;
  name: string;
  email: string;
  jobTitle: string | null;
  responsibilities: string | null;
  workStyle: string | null;
  total: number;
  inProgress: number;
  done: number;
  overdue: number;
  urgent: number;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const isCron = req.headers.get('x-cron-source') === 'internal';
  const role = (session?.user as { role?: string })?.role;
  if (!isCron && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const projects = await prisma.project.findMany({
      where: { status: 'active' },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true, name: true, email: true,
                jobTitle: true, responsibilities: true, workStyle: true,
              },
            },
          },
        },
        tasks: {
          select: {
            assigneeId: true, status: true, priority: true,
            dueDate: true,
          },
        },
      },
    });

    if (projects.length === 0) {
      return NextResponse.json({ ok: true, message: '활성 프로젝트 없음' });
    }

    const now = new Date();
    const memberMap = new Map<string, MemberStats>();

    for (const project of projects) {
      for (const pm of project.members) {
        const u = pm.user;
        if (!memberMap.has(u.id)) {
          memberMap.set(u.id, {
            userId: u.id, name: u.name ?? u.email, email: u.email,
            jobTitle: u.jobTitle, responsibilities: u.responsibilities, workStyle: u.workStyle,
            total: 0, inProgress: 0, done: 0, overdue: 0, urgent: 0,
          });
        }
      }

      for (const task of project.tasks) {
        if (!task.assigneeId) continue;
        const stats = memberMap.get(task.assigneeId);
        if (!stats) continue;
        stats.total++;
        if (task.status === '완료') stats.done++;
        else {
          stats.inProgress++;
          if (task.dueDate && new Date(task.dueDate) < now) stats.overdue++;
          if (task.priority === '긴급') stats.urgent++;
        }
      }
    }

    const members = Array.from(memberMap.values());
    if (members.length === 0) {
      return NextResponse.json({ ok: true, message: '팀원 데이터 없음' });
    }

    const memberInfoLines = members.map((m) =>
      `- 이름: ${m.name} / 직책: ${m.jobTitle ?? '미등록'} / 담당: ${m.responsibilities ?? '미등록'} / 성향: ${m.workStyle ?? '미등록'}`
    ).join('\n');

    const memberStatusLines = members.map((m) =>
      `- ${m.name}: 전체 ${m.total}건, 진행중 ${m.inProgress}건, 완료 ${m.done}건, 기한초과 ${m.overdue}건, 긴급 ${m.urgent}건`
    ).join('\n');

    const prompt = `당신은 전문 PM입니다. 아래 팀 현황을 분석해 JSON으로 응답하세요.

[팀원 정보]
${memberInfoLines}

[업무 현황]
${memberStatusLines}

응답 형식 (JSON만, 설명 없이):
{
  "teamSummary": "전체 팀 현황 2-3줄 요약",
  "members": [
    { "name": "홍길동", "status": "과부하|적정|여유", "insight": "개인 인사이트 2줄" }
  ],
  "recommendations": ["제안사항 1", "제안사항 2", "제안사항 3"]
}`;

    const { text } = await generateText(prompt);

    let parsed: { teamSummary: string; members: { name: string; status: string; insight: string }[]; recommendations: string[] } | null = null;
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    } catch {
      return NextResponse.json({ error: 'AI 응답 파싱 실패' }, { status: 500 });
    }
    if (!parsed) return NextResponse.json({ error: 'AI 응답 없음' }, { status: 500 });

    const adminUsers = await prisma.workUser.findMany({
      where: { email: (session.user as { email: string }).email },
      select: { id: true },
    });

    const notifications: { userId: string; title: string; body: string; type: string }[] = [];

    for (const adminUser of adminUsers) {
      notifications.push({
        userId: adminUser.id,
        title: 'AI PM 팀 리포트',
        body: `📊 팀 현황\n${parsed.teamSummary}\n\n👥 멤버별 인사이트\n${parsed.members.map((m) => `• ${m.name} (${m.status}): ${m.insight}`).join('\n')}\n\n💡 제안사항\n${parsed.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}`,
        type: 'ai-pm',
      });
    }

    for (const m of members) {
      const memberInsight = parsed.members.find((pm) => pm.name === m.name);
      if (!memberInsight) continue;
      notifications.push({
        userId: m.userId,
        title: 'AI PM 개인 인사이트',
        body: `안녕하세요, ${m.name}님! 이번 주 업무 현황 분석입니다.\n\n상태: ${memberInsight.status}\n\n${memberInsight.insight}`,
        type: 'ai-pm',
      });
    }

    await prisma.notification.createMany({ data: notifications });

    return NextResponse.json({ ok: true, notificationsCreated: notifications.length });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
