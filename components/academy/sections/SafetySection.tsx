import type { AcademyReview, AcademyShuttleStop } from '@/lib/academy-data';

type Props = {
  reviews: AcademyReview[];
  shuttle?: AcademyShuttleStop[];
};

const SAFETY_ITEMS = [
  { title: '셔틀 동승 선생님', detail: '모든 노선 동승' },
  { title: '등·하원 알림', detail: '도착·출발 즉시 카톡 발송' },
  { title: '교실 CCTV', detail: '실시간 녹화 운영' },
  { title: '선생님 자격', detail: '성범죄 경력 조회 완료' },
];

const REVIEW_COLORS = ['#FFF3C4', '#FFE3EC'];

export default function SafetySection({ reviews, shuttle = [] }: Props) {
  const reviewCards = reviews.filter((r) => r.kind === 'review').slice(0, 2);

  return (
    <section id="safe" className="px-5 md:px-16 pt-24 md:pt-28 flex flex-col md:flex-row gap-5">
      {/* 안심 패널 */}
      <div className="flex-1 p-8 md:p-10 rounded-[28px] md:rounded-[32px] bg-accent-soft flex flex-col gap-5">
        <h2 className="m-0 font-round text-[28px] md:text-[36px] text-ink">안심하고 보내세요</h2>
        <div className="grid grid-cols-2 gap-3">
          {SAFETY_ITEMS.map((item) => (
            <div key={item.title} className="p-4 md:p-[18px] rounded-[16px] md:rounded-[18px] bg-surface">
              <b className="text-[15px]">{item.title}</b>
              <br />
              <span className="text-[13px] md:text-[14px] text-body">{item.detail}</span>
            </div>
          ))}
        </div>
        {shuttle.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="text-[13px] font-semibold text-body">셔틀 노선</div>
            {shuttle.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-4 py-2.5 rounded-[12px] bg-surface text-[14px]">
                <span className="font-medium">{s.stop}</span>
                <span className="text-body text-[13px]">{s.pickup && `승차 ${s.pickup}`}{s.pickup && s.dropoff && ' · '}{s.dropoff && `하차 ${s.dropoff}`}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 학부모 후기 */}
      {reviewCards.length > 0 && (
        <div className="md:w-[520px] flex flex-col gap-4">
          {reviewCards.map((r, i) => (
            <div key={r.id} className="flex-1 p-7 md:p-8 rounded-[28px] md:rounded-[32px] flex flex-col gap-4 min-h-[120px]"
              style={{ background: REVIEW_COLORS[i % REVIEW_COLORS.length] }}>
              <p className="m-0 text-[16px] md:text-[18px] leading-[1.7] text-ink">
                &ldquo;{r.body}&rdquo;
              </p>
              <div className="mt-auto text-[14px] text-body">
                {r.authorLabel}{r.source ? ` · ${r.source}` : ''}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
