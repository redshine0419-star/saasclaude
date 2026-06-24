import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateText } from '@/lib/ai'
import { list } from '@vercel/blob'

export const dynamic = 'force-dynamic'

async function notifySlack(msg: string) {
  if (!process.env.SLACK_WEBHOOK_URL) return
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: msg }),
  }).catch(() => {})
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    const monthLabel = `${lastMonth.getFullYear()}년 ${lastMonth.getMonth() + 1}월`

    // Count email subscribers
    const subscriberResult = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM email_subscribers WHERE service = 'marketerops'
    `.catch(() => [{ count: BigInt(0) }])
    const totalSubscribers = Number(subscriberResult[0]?.count || 0)

    // Count new subscribers last month
    const newSubResult = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM email_subscribers
      WHERE service = 'marketerops'
        AND created_at >= ${lastMonth}
        AND created_at <= ${lastMonthEnd}
    `.catch(() => [{ count: BigInt(0) }])
    const newSubscribers = Number(newSubResult[0]?.count || 0)

    // Count blog posts published last month (from Vercel Blob index)
    let blogPostCount = 0
    try {
      const langList = ['ko', 'en', 'ja']
      for (const lang of langList) {
        const blobs = await list({ prefix: `posts-index-${lang}.json` })
        if (!blobs.blobs.length) continue
        const res = await fetch(blobs.blobs[0].url, { cache: 'no-store' })
        if (!res.ok) continue
        const index = await res.json() as { createdAt?: string }[]
        blogPostCount += index.filter((p) => {
          if (!p.createdAt) return false
          const d = new Date(p.createdAt)
          return d >= lastMonth && d <= lastMonthEnd
        }).length
      }
    } catch {
      // ignore
    }

    // Generate AI review
    const prompt = `당신은 마케팅 성과 분석 전문가입니다. 다음 데이터를 바탕으로 ${monthLabel} 마케팅 성과 요약과 다음 달 액션 플랜을 작성해주세요.

서비스: MarketerOps.ai (SEO/GEO 마케팅 도구)

이번 달 데이터:
- 신규 이메일 구독자: ${newSubscribers}명
- 총 이메일 구독자: ${totalSubscribers}명
- 발행된 블로그 포스트: ${blogPostCount}개

다음 형식으로 작성:
1. 이번 달 성과 요약 (2-3줄)
2. 잘된 점 (1-2가지)
3. 개선 필요 사항 (1-2가지)
4. 다음 달 핵심 액션 플랜 (3가지, 구체적으로)

200자 이내로 간결하게.`

    const result = await generateText(prompt).catch(() => null)
    const aiSummary = result?.text || '(AI 분석 불가)'

    const slackMsg = `📅 [MarketerOps] ${monthLabel} 마케팅 월간 리뷰\n\n` +
      `📊 핵심 지표:\n` +
      `• 신규 구독자: ${newSubscribers}명 (누적 ${totalSubscribers}명)\n` +
      `• 발행 블로그: ${blogPostCount}개\n\n` +
      `🤖 AI 분석:\n${aiSummary}`

    await notifySlack(slackMsg)

    return NextResponse.json({ ok: true, month: monthLabel, newSubscribers, totalSubscribers, blogPostCount })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
