'use client';

import { useState } from 'react';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export default function FaqSection({ items }: { items: FaqItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (items.length === 0) return null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };

  return (
    <section id="faq" className="py-14 md:py-[76px]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="acad-wrap">
        <div className="max-w-[850px] mx-auto">
          <h2 className="acad-h2 text-center mb-[30px]">자주 묻는 질문</h2>
          <div className="flex flex-col gap-[9px]">
            {items.map((item) => {
              const isOpen = openId === item.id;
              return (
                <div key={item.id} className={`bg-surface rounded-[13px] border overflow-hidden ${isOpen ? 'border-accent' : 'border-line'}`}>
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : item.id)}
                    aria-expanded={isOpen}
                    className="w-full flex justify-between items-center gap-3 px-[22px] py-[19px] bg-transparent border-0 text-left cursor-pointer font-bold text-[15px] text-ink"
                  >
                    <span className="flex-1">Q. {item.question}</span>
                    <span aria-hidden="true" className={`text-accent text-[18px] flex-shrink-0 transition-transform ${isOpen ? 'rotate-45' : ''}`}>＋</span>
                  </button>
                  {isOpen && (
                    <div className="px-[22px] pb-5 text-[14px] leading-[1.7] text-body whitespace-pre-line">{item.answer}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
