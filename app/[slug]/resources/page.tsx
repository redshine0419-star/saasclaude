import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getAcademyPageData } from '@/lib/academy-data';
import ThemeHeader from '@/components/academy/ThemeHeader';
import SiteFooter from '@/components/academy/SiteFooter';
import { asFiles } from '@/lib/resources';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getAcademyPageData(slug);
  return data ? { title: `자료실 — ${data.tenant.name}` } : {};
}

const fmt = (d: Date) => new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);

export default async function ResourcesPage({ params }: Props) {
  const { slug } = await params;
  const data = await getAcademyPageData(slug);
  if (!data) notFound();
  const { tenant } = data;
  // 홈페이지 공개 자료만 (링크 공유 자료는 목록에 나오지 않는다)
  const items = await prisma.resource.findMany({
    where: { tenant: { slug, status: 'active', published: true }, visibility: 'public' },
    orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    take: 200,
    select: { id: true, title: true, files: true, pinned: true, createdAt: true },
  }).catch(() => []);

  return (
    <>
      <ThemeHeader theme={tenant.theme ?? 'warm'} name={tenant.name} slug={slug} activePage="resources" phone={tenant.phone} kakaoChannelUrl={tenant.kakaoChannelUrl} address={tenant.address} hours={tenant.hours} accentColor={tenant.accentColor} />
      <main className="bg-bg min-h-screen">
        <section className="acad-section">
          <div className="acad-wrap max-w-[960px]">
            <p className="acad-eyebrow">자료실</p>
            <h1 className="acad-h2 mb-6 md:mb-8">수업 자료와 안내문</h1>
            {items.length === 0 ? (
              <div className="acad-card p-10 text-center text-muted text-[15px]">아직 올라온 자료가 없습니다.</div>
            ) : (
              <ul className="acad-card list-none m-0 p-0 overflow-hidden">
                {items.map((r, i) => {
                  const n = asFiles(r.files).length;
                  return (
                    <li key={r.id} className={i ? 'border-t border-line' : ''}>
                      <Link href={`/${slug}/resources/${r.id}`} className="flex items-center gap-3 px-5 py-4 no-underline text-ink hover:bg-subtle">
                        {r.pinned && <span className="px-2 py-0.5 rounded-md bg-highlight-soft text-highlight-ink text-[12px] font-bold flex-shrink-0">고정</span>}
                        <span className="flex-1 min-w-0 text-[15px] font-semibold break-keep">{r.title}</span>
                        {n > 0 && <span className="text-[12px] text-muted flex-shrink-0">첨부 {n}</span>}
                        <span className="text-[13px] text-muted flex-shrink-0 hidden sm:inline">{fmt(r.createdAt)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </main>
      <SiteFooter tenant={tenant} slug={slug} />
    </>
  );
}
