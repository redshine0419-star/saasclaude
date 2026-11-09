import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getAcademyPageData, dbSlugOf } from '@/lib/academy-data';
import ThemeHeader from '@/components/academy/ThemeHeader';
import SiteFooter from '@/components/academy/SiteFooter';
import { asFiles, fileExt, formatSize } from '@/lib/resources';

type Props = { params: Promise<{ slug: string; id: string }>; searchParams: Promise<{ k?: string }> };

async function load(slug: string, id: string, k: string | undefined) {
  const data = await getAcademyPageData(slug);
  if (!data) return null;
  const r = await prisma.resource.findFirst({ where: { id, tenant: { slug: dbSlugOf(slug), status: 'active', published: true } } }).catch(() => null);
  // 링크 공유 자료는 공유 키가 맞아야 열린다
  if (!r || (r.visibility === 'link' && r.shareToken !== k)) return null;
  return { data, r };
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug, id } = await params;
  const { k } = await searchParams;
  const got = await load(slug, id, k);
  if (!got) return {};
  return {
    title: `${got.r.title} — ${got.data.tenant.name}`,
    // 링크 공유 자료는 검색에 나오지 않게
    ...(got.r.visibility === 'link' && { robots: { index: false, follow: false } }),
  };
}

const fmt = (d: Date) => new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric' }).format(d);
const IMAGE = new Set(['jpg', 'jpeg', 'png', 'webp']);

export default async function ResourceDetailPage({ params, searchParams }: Props) {
  const { slug, id } = await params;
  const { k } = await searchParams;
  const got = await load(slug, id, k);
  if (!got) notFound();
  const { data, r } = got;
  const { tenant } = data;
  const files = asFiles(r.files);

  return (
    <>
      <ThemeHeader theme={tenant.theme ?? 'warm'} name={tenant.name} hasResources={tenant.hasResources} slug={slug} activePage="resources" phone={tenant.phone} kakaoChannelUrl={tenant.kakaoChannelUrl} address={tenant.address} hours={tenant.hours} accentColor={tenant.accentColor} />
      <main className="bg-bg min-h-screen">
        <section className="acad-section">
          <div className="acad-wrap max-w-[860px] flex flex-col gap-6">
            {r.visibility === 'public' && <Link href={`/${slug}/resources`} className="acad-more self-start">← 자료실 목록</Link>}
            <div>
              <p className="acad-eyebrow">{r.visibility === 'link' ? '공유받은 자료' : '자료실'}</p>
              <h1 className="acad-h2">{r.title}</h1>
              <p className="m-0 mt-2 text-[13px] text-muted">{fmt(r.createdAt)}</p>
            </div>
            {r.body && <div className="acad-card p-5 md:p-6 text-[15px] leading-[1.8] text-ink whitespace-pre-line break-keep">{r.body}</div>}
            {files.length > 0 && (
              <div className="flex flex-col gap-3">
                <h2 className="m-0 text-[16px] font-bold text-ink">첨부 파일</h2>
                {files.map((f) => (
                  <div key={f.url} className="acad-card overflow-hidden">
                    {IMAGE.has(fileExt(f.name)) && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={f.url} alt={f.name} className="block w-full max-h-[520px] object-contain bg-subtle" />
                    )}
                    <a href={f.url} target="_blank" rel="noopener noreferrer" download={f.name} className="flex items-center gap-3 px-5 py-4 no-underline text-ink hover:bg-subtle">
                      <span className="px-2 py-0.5 rounded-md bg-accent-soft text-accent-ink text-[12px] font-bold uppercase flex-shrink-0">{fileExt(f.name)}</span>
                      <span className="flex-1 min-w-0 text-[15px] font-semibold truncate">{f.name}</span>
                      <span className="text-[12px] text-muted flex-shrink-0">{formatSize(f.size)}</span>
                      <span className="text-[13px] font-bold text-accent flex-shrink-0">내려받기</span>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter tenant={tenant} slug={slug} />
    </>
  );
}
