import type { AcademyPost } from '@/lib/academy-data';
import { TitleLines } from '@/components/academy/TitleLines';
import { SECTION_COPY_SPEC } from '@/lib/section-copy';

type Props = {
  title?: string;
  eyebrow?: string;
  posts: AcademyPost[];
  slug: string;
};

export default function GallerySection({ posts, slug, eyebrow = 'CLASS GALLERY', title = SECTION_COPY_SPEC.gallery.title }: Props) {
  const galleryPosts = posts.filter((p) => p.category === 'gallery' && p.imageUrl).slice(0, 3);
  if (galleryPosts.length === 0) return null;

  return (
    <section id="gallery" className="acad-section" style={{ background: '#fffaf7' }}>
      <div className="acad-wrap">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6 md:mb-9">
          <div className="min-w-0">
            <p className="acad-eyebrow">{eyebrow}</p>
            <h2 className="acad-h2"><TitleLines text={title} /></h2>
          </div>
          <a href={`/${slug}/news`} className="acad-more">더 보기 →</a>
        </div>

        <div className={`grid gap-[14px] ${galleryPosts.length >= 3 ? 'grid-cols-2 md:grid-cols-[1.2fr_0.8fr_0.8fr] grid-rows-[190px_150px] md:grid-rows-[210px_210px]' : 'grid-cols-2 grid-rows-[220px]'}`}>
          {galleryPosts.map((p, i) => (
            <a
              key={p.id}
              href={`/${slug}/news/${p.id}`}
              className={`relative overflow-hidden rounded-[22px] bg-subtle ${i === 0 && galleryPosts.length >= 3 ? 'row-span-2' : ''} ${i > 0 && galleryPosts.length >= 3 ? 'md:row-span-2' : ''}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.imageUrl!} alt={p.title} className="block w-full h-full object-cover" />
              <span className="absolute left-[15px] bottom-[15px] max-w-[calc(100%-30px)] truncate rounded-full px-3 py-2 text-[12px] font-bold text-ink" style={{ background: 'rgba(255,255,255,.92)' }}>{p.title}</span>
            </a>
          ))}
        </div>
        <p className="mt-[15px] mb-0 text-[12px] text-muted">얼굴이 나온 사진은 보호자 동의를 받은 경우에만 올립니다.</p>
      </div>
    </section>
  );
}
