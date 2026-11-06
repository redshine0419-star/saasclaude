import type { AcademyPost } from '@/lib/academy-data';
import { TitleLines } from '@/components/academy/TitleLines';
import { SECTION_COPY_SPEC } from '@/lib/section-copy';

type Props = { posts: AcademyPost[]; slug: string; title?: string };

function formatDate(date: Date | string | null) {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Seoul' });
}

const CATEGORY_LABEL: Record<string, string> = {
  recruit: '모집',
  notice: '공지',
  exam: '시험',
  gallery: '갤러리',
  news: '소식',
};

export default function NewsSection({ posts, slug, title = SECTION_COPY_SPEC.news.title }: Props) {
  if (posts.length === 0) return null;
  const items = posts.slice(0, 3);

  return (
    <section id="news" className="acad-section bg-surface">
      <div className="acad-wrap">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6 md:mb-8">
          <div className="min-w-0">
            <p className="acad-eyebrow">학원 소식</p>
            <h2 className="acad-h2"><TitleLines text={title} /></h2>
          </div>
          <a href={`/${slug}/news`} className="acad-more">전체 보기 →</a>
        </div>

        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-[18px] ${items.length >= 3 ? 'md:grid-cols-[1.2fr_1fr_1fr]' : ''}`}>
          {items.map((post, i) => (
            <a
              key={post.id}
              href={`/${slug}/news/${post.id}`}
              className={`bg-surface border border-line rounded-[16px] overflow-hidden no-underline text-ink flex flex-col min-w-0 transition-shadow hover:[box-shadow:var(--section-shadow)] ${i === 0 && items.length >= 3 ? 'sm:col-span-2 md:col-span-1' : ''}`}
            >
              <div className="w-full h-[190px] bg-subtle flex items-center justify-center text-muted overflow-hidden">
                {post.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.imageUrl} alt="" className="block w-full h-full object-cover" />
                ) : (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="opacity-40" aria-hidden="true">
                    <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2z"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>
                  </svg>
                )}
              </div>
              <div className="p-[18px]">
                <small className="text-[13px] text-muted">
                  {[CATEGORY_LABEL[post.category] ?? post.category, formatDate(post.publishedAt)].filter(Boolean).join(' · ')}
                </small>
                <h3 className="m-0 mt-[7px] text-[17px] leading-[1.5] font-bold">{post.title}</h3>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
