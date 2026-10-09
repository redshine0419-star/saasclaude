'use client';

import { useState } from 'react';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export default function FaqSection({
  items,
  accentColor = '#1E5645',
}: {
  items: FaqItem[];
  accentColor?: string;
}) {
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
    <section
      style={{
        padding: '64px 20px',
        background: '#FAFAF8',
        fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif",
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <h2
          style={{
            fontSize: 24,
            fontWeight: 700,
            marginBottom: 32,
            color: '#1B2430',
          }}
        >
          자주 묻는 질문
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div
                key={item.id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 12,
                  border: `1px solid ${isOpen ? accentColor : '#E5E0D8'}`,
                  overflow: 'hidden',
                  transition: 'border-color 0.15s',
                }}
              >
                <button
                  onClick={() => setOpenId(isOpen ? null : item.id)}
                  aria-expanded={isOpen}
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '18px 20px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    gap: 12,
                  }}
                >
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#1B2430', flex: 1 }}>
                    Q. {item.question}
                  </span>
                  <span
                    style={{
                      color: accentColor,
                      fontSize: 18,
                      fontWeight: 700,
                      flexShrink: 0,
                      transform: isOpen ? 'rotate(45deg)' : 'none',
                      transition: 'transform 0.2s',
                    }}
                  >
                    +
                  </span>
                </button>
                {isOpen && (
                  <div
                    style={{
                      padding: '0 20px 18px',
                      fontSize: 14,
                      lineHeight: 1.7,
                      color: '#3A4250',
                      borderTop: `1px solid ${accentColor}20`,
                    }}
                  >
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
