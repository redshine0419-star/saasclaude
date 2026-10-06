import type { AcademyPost } from '@/lib/academy-data';

type Props = {
  posts: AcademyPost[];
  slug: string;
};

export default function GallerySection({ posts, slug }: Props) {
  const galleryPosts = posts.filter((p) => p.category === 'gallery').slice(0, 4);
  if (galleryPosts.length === 0) return null;

  return (
    <section id="gallery" className="px-5 md:px-16 pt-24 md:pt-28 flex flex-col gap-8">
      <div className="flex justify-between items-end">
        <h2 className="m-0 font-round text-[32px] md:text-[42px] text-ink">이번 달 수업 모습</h2>
        <a href={`/${slug}/news`} className="text-[16px] font-bold text-accent no-underline">더 보기 →</a>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {galleryPosts.map((p) => (
          <div key={p.id} className="aspect-square rounded-[20px] md:rounded-[24px] bg-subtle overflow-hidden">
            {p.imageUrl ? (
              <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[14px] text-body text-center p-4">
                {p.title}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="text-[13px] text-body">얼굴이 나온 사진은 보호자 동의를 받은 경우에만 올립니다.</div>
    </section>
  );
}
