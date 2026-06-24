import { NextRequest, NextResponse } from 'next/server'
import { getValidAccessToken } from '@/lib/ga4-tokens'

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

  const propertyId = process.env.GA4_PROPERTY_ID
  if (!propertyId) {
    return NextResponse.json({ skipped: true, reason: 'GA4_PROPERTY_ID not set' })
  }

  const adminEmail = (process.env.ADMIN_EMAILS || '').split(',')[0]?.trim()
  if (!adminEmail) {
    return NextResponse.json({ skipped: true, reason: 'ADMIN_EMAILS not set' })
  }

  try {
    const token = await getValidAccessToken(adminEmail)
    if (!token) {
      return NextResponse.json({ skipped: true, reason: 'No GA4 token for admin' })
    }

    const ga4Res = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dimensions: [{ name: 'pagePath' }],
          metrics: [
            { name: 'averageSessionDuration' },
            { name: 'bounceRate' },
            { name: 'sessions' },
          ],
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          orderBys: [{ metric: { metricName: 'averageSessionDuration' }, desc: true }],
          limit: 50,
        }),
      }
    )

    if (!ga4Res.ok) {
      const err = await ga4Res.text()
      return NextResponse.json({ error: 'GA4 API error', detail: err }, { status: 500 })
    }

    interface GA4Row {
      dimensionValues: { value: string }[]
      metricValues: { value: string }[]
    }
    const ga4Data = await ga4Res.json() as { rows?: GA4Row[] }
    const rows = ga4Data.rows || []

    const pages = rows.map((row) => ({
      path: row.dimensionValues[0]?.value || '',
      avgDuration: parseFloat(row.metricValues[0]?.value || '0'),
      bounceRate: parseFloat(row.metricValues[1]?.value || '0'),
      sessions: parseInt(row.metricValues[2]?.value || '0', 10),
    }))

    const top20Pct = pages.slice(0, Math.max(1, Math.ceil(pages.length * 0.2)))
    const highBounce = pages.filter((p) => p.bounceRate > 0.8)

    const topLines = top20Pct
      .slice(0, 5)
      .map((p, i) => `${i + 1}. ${p.path} - 평균 체류시간 ${Math.round(p.avgDuration)}초`)
      .join('\n')

    const bounceLines = highBounce
      .slice(0, 5)
      .map((p, i) => `${i + 1}. ${p.path} - 이탈률 ${Math.round(p.bounceRate * 100)}%`)
      .join('\n')

    let adsenseSection = ''
    const publisherId = process.env.ADSENSE_PUBLISHER_ID
    const adsenseToken = process.env.ADSENSE_ACCESS_TOKEN
    if (publisherId && adsenseToken) {
      const now = new Date()
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
      const fmt = (d: Date) => ({ year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() })
      const start = fmt(lastMonth)
      const end = fmt(lastMonthEnd)
      const adsRes = await fetch(
        `https://adsense.googleapis.com/v2/accounts/${publisherId}/reports:generate?` +
        `startDate.year=${start.year}&startDate.month=${start.month}&startDate.day=${start.day}` +
        `&endDate.year=${end.year}&endDate.month=${end.month}&endDate.day=${end.day}` +
        `&metrics=ESTIMATED_EARNINGS&metrics=PAGE_VIEWS&metrics=PAGE_VIEWS_RPM`,
        { headers: { Authorization: `Bearer ${adsenseToken}` } }
      ).catch(() => null)
      if (adsRes?.ok) {
        const adsData = await adsRes.json() as { totals?: { cells?: { value: string }[] } }
        const cells = adsData.totals?.cells || []
        const earnings = parseFloat(cells[0]?.value || '0').toFixed(2)
        const pageViews = cells[1]?.value || '0'
        const rpm = parseFloat(cells[2]?.value || '0').toFixed(2)
        adsenseSection = `\n\n💰 AdSense 지난달 실적:\n수익: $${earnings} | PV: ${pageViews} | RPM: $${rpm}`
      }
    }

    const slackMsg =
      `📊 [MarketerOps] 월간 AdSense 최적화 리포트\n\n` +
      `📈 광고 추가 추천 (체류시간 상위):\n${topLines || '데이터 없음'}\n\n` +
      `📉 광고 줄이고 CTA 권장 (이탈률 80%+):\n${bounceLines || '없음'}` +
      adsenseSection

    await notifySlack(slackMsg)

    return NextResponse.json({ ok: true, topPages: top20Pct.length, highBouncePages: highBounce.length })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
