import { NextRequest, NextResponse } from 'next/server'
import { put, list } from '@vercel/blob'
import { generateText } from '@/lib/ai'

export const dynamic = 'force-dynamic'

interface ABTest {
  slug: string
  lang: string
  variantA: string
  variantB: string
  clicksA: number
  clicksB: number
  impressionsA: number
  impressionsB: number
  createdAt: string
  resolved: boolean
  winner: 'A' | 'B' | null
}

async function getTests(): Promise<ABTest[]> {
  try {
    const blobs = await list({ prefix: 'blog-ab-tests.json' })
    if (!blobs.blobs.length) return []
    const res = await fetch(blobs.blobs[0].url, { cache: 'no-store' })
    if (!res.ok) return []
    return await res.json() as ABTest[]
  } catch {
    return []
  }
}

async function saveTests(tests: ABTest[]) {
  await put('blog-ab-tests.json', JSON.stringify(tests), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
  })
}

async function updatePostTitle(slug: string, lang: string, newTitle: string) {
  try {
    const blobs = await list({ prefix: `posts/${lang}/${slug}.json` })
    if (!blobs.blobs.length) return
    const res = await fetch(blobs.blobs[0].url, { cache: 'no-store' })
    if (!res.ok) return
    const post = await res.json() as Record<string, unknown>
    post.title = newTitle
    await put(`posts/${lang}/${slug}.json`, JSON.stringify(post), {
      access: 'public', contentType: 'application/json', addRandomSuffix: false,
    })
    const indexBlobs = await list({ prefix: `posts-index-${lang}.json` })
    if (!indexBlobs.blobs.length) return
    const idxRes = await fetch(indexBlobs.blobs[0].url, { cache: 'no-store' })
    if (!idxRes.ok) return
    const index = await idxRes.json() as { slug: string; title: string }[]
    const idx = index.findIndex((p) => p.slug === slug)
    if (idx !== -1) {
      index[idx].title = newTitle
      await put(`posts-index-${lang}.json`, JSON.stringify(index), {
        access: 'public', contentType: 'application/json', addRandomSuffix: false,
      })
    }
  } catch {
    // ignore
  }
}

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

  const tests = await getTests()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const resolved: string[] = []

  for (const test of tests) {
    if (test.resolved) continue
    if (new Date(test.createdAt) > sevenDaysAgo) continue

    const ctrA = test.impressionsA > 0 ? test.clicksA / test.impressionsA : 0
    const ctrB = test.impressionsB > 0 ? test.clicksB / test.impressionsB : 0
    const winner: 'A' | 'B' = ctrA >= ctrB ? 'A' : 'B'
    const winningTitle = winner === 'A' ? test.variantA : test.variantB
    const losingTitle = winner === 'A' ? test.variantB : test.variantA

    await updatePostTitle(test.slug, test.lang, winningTitle)
    test.resolved = true
    test.winner = winner
    resolved.push(test.slug)

    await notifySlack(
      `🔬 [MarketerOps] A/B 테스트 결과\n` +
      `슬러그: ${test.slug} (${test.lang})\n` +
      `승자 (${winner}): "${winningTitle}" — CTR ${((winner === 'A' ? ctrA : ctrB) * 100).toFixed(1)}%\n` +
      `패자: "${losingTitle}" — CTR ${((winner === 'A' ? ctrB : ctrA) * 100).toFixed(1)}%\n` +
      `제목 자동 업데이트 완료`
    )
  }

  // Generate new A/B tests for recent posts
  try {
    for (const lang of ['ko', 'en', 'ja']) {
      const blobs = await list({ prefix: `posts-index-${lang}.json` })
      if (!blobs.blobs.length) continue
      const res = await fetch(blobs.blobs[0].url, { cache: 'no-store' })
      if (!res.ok) continue
      const index = await res.json() as { slug: string; title: string; createdAt?: string }[]
      const recentPosts = index
        .filter((p) => p.createdAt && new Date(p.createdAt) > sevenDaysAgo)
        .slice(0, 3)

      for (const post of recentPosts) {
        if (tests.some((t) => t.slug === post.slug && t.lang === lang)) continue
        const result = await generateText(
          `다음 블로그 제목의 클릭률을 높이기 위한 대안 제목 1개를 만들어줘. 원래 제목과 비슷한 길이, 같은 언어, 같은 주제. JSON 배열로만 응답: ["대안제목"]\n\n원래 제목: "${post.title}"`
        ).catch(() => null)
        if (!result?.text) continue
        try {
          const cleaned = result.text.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim()
          const alts = JSON.parse(cleaned) as string[]
          if (alts[0]) {
            tests.push({
              slug: post.slug, lang,
              variantA: post.title, variantB: alts[0],
              clicksA: 0, clicksB: 0, impressionsA: 0, impressionsB: 0,
              createdAt: new Date().toISOString(),
              resolved: false, winner: null,
            })
          }
        } catch {
          // skip
        }
      }
    }
  } catch {
    // non-critical
  }

  await saveTests(tests)
  return NextResponse.json({
    ok: true,
    resolved: resolved.length,
    activeTests: tests.filter((t) => !t.resolved).length,
  })
}
