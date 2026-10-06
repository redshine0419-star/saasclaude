import type { AcademyPost } from '@/lib/academy-data';

type Props = { posts: AcademyPost[]; slug: string };

function formatDate(date: Date | string | null) {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

const CATEGORY_LABEL: Record<string, string> = {
  recruit: '모집',
  notice: '공지',
  news: '소식',
};

export default function NewsSection({ posts, slug }: Props) {
  if (posts.length === 0) return null;

  const featured = posts[0];
  const rest = posts.slice(1, 4);

  return (
    <section id="news" className="px-5 md:px-20 pt-16 md:pt-[120px]">
      <div className="flex flex-col gap-6 md:gap-8">
        {/* 헤더 */}
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-2.5 md:gap-3">
            <div className="text-[14px] md:text-[15px] font-bold text-label">학원 소식</div>
            <h2 className="m-0 font-serif text-[28px] md:text-[40px] font-bold text-ink">새 소식</h2>
          </div>
          <a href={`/${slug}/news`} className="text-[14px] text-accent font-semibold hover:underline hidden md:block">전체 보기 →</a>
        </div>

        {/* 피처드 + 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* 큰 카드 */}
          <div className="bg-surface rounded-2xl overflow-hidden flex flex-col">
            <div className="w-full h-[200px] md:h-[220px] bg-subtle flex items-center justify-center text-muted">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
                <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2z"/>
                <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
                <path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>
              </svg>
            </div>
            <div className="p-5 md:p-6 flex flex-col gap-2 flex-1">
              <div className="flex items-center gap-2">
                {featured.category && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-accent/10 text-accent">
                    {CATEGORY_LABEL[featured.category] ?? featured.category}
                  </span>
                )}
                <span className="text-[12px] text-muted">{formatDate(featured.publishedAt)}</span>
              </div>
              <h3 className="m-0 font-serif text-[18px] md:text-[20px] font-bold text-ink leading-snug">{featured.title}</h3>
            </div>
          </div>

          {/* 작은 목록 */}
          <div className="flex flex-col gap-3">
            {rest.map((post) => (
              <div key={post.id} className="p-5 bg-surface rounded-2xl flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  {post.category && (
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-accent/10 text-accent">
                      {CATEGORY_LABEL[post.category] ?? post.category}
                    </span>
                  )}
                  <span className="text-[12px] text-muted">{formatDate(post.publishedAt)}</span>
                </div>
                <div className="font-bold text-ink text-[15px] leading-snug">{post.title}</div>
              </div>
            ))}
          </div>
        </div>

        <a href={`/${slug}/news`} className="text-[14px] text-accent font-semibold hover:underline md:hidden self-start">전체 보기 →</a>
      </div>
    </section>
  );
}
