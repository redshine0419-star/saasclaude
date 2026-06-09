import { NextRequest, NextResponse } from 'next/server'
import { put, list } from '@vercel/blob'

export const dynamic = 'force-dynamic'

const AB_BLOB_KEY = 'blog-ab-tests.json'

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
    const blobs = await list({ prefix: AB_BLOB_KEY })
    if (!blobs.blobs.length) return []
    const res = await fetch(blobs.blobs[0].url, { cache: 'no-store' })
    if (!res.ok) return []
    return await res.json() as ABTest[]
  } catch {
    return []
  }
}

async function saveTests(tests: ABTest[]) {
  await put(AB_BLOB_KEY, JSON.stringify(tests), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
  })
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const slug = searchParams.get('slug')
  const lang = searchParams.get('lang') || 'ko'
  const variant = searchParams.get('variant') as 'A' | 'B' | null
  const type = searchParams.get('type')

  const tests = await getTests()

  if (!slug || !variant || !type) {
    return NextResponse.json({ tests })
  }

  const idx = tests.findIndex((t) => t.slug === slug && t.lang === lang && !t.resolved)
  if (idx === -1) return NextResponse.json({ ok: false, reason: 'no active test' })

  if (type === 'impression') {
    if (variant === 'A') tests[idx].impressionsA++
    else tests[idx].impressionsB++
  } else if (type === 'click') {
    if (variant === 'A') tests[idx].clicksA++
    else tests[idx].clicksB++
  }

  await saveTests(tests)
  return NextResponse.json({ ok: true })
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('x-admin')
  if (auth !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json() as { slug: string; lang: string; variantA: string; variantB: string }
  const tests = await getTests()

  if (tests.some((t) => t.slug === body.slug && t.lang === body.lang && !t.resolved)) {
    return NextResponse.json({ ok: false, reason: 'active test already exists' })
  }

  tests.push({
    slug: body.slug,
    lang: body.lang,
    variantA: body.variantA,
    variantB: body.variantB,
    clicksA: 0, clicksB: 0,
    impressionsA: 0, impressionsB: 0,
    createdAt: new Date().toISOString(),
    resolved: false,
    winner: null,
  })
  await saveTests(tests)
  return NextResponse.json({ ok: true })
}
