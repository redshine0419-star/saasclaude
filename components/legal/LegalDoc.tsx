import type { LegalSection } from '@/lib/legal/documents';

/** 약관·처리방침 본문 — 서비스 사이트와 학원 홈페이지가 같이 쓴다 */
export function LegalDoc({ title, version, intro, sections }: { title: string; version: string; intro?: string; sections: LegalSection[] }) {
  return (
    <article style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(32px, 6vw, 72px) 20px', color: '#1B2430', lineHeight: 1.8, fontSize: 15 }}>
      <h1 style={{ margin: 0, fontSize: 'clamp(26px, 4vw, 34px)', fontWeight: 700 }}>{title}</h1>
      <div style={{ fontSize: 13, color: '#5A6270', marginTop: 6 }}>시행일 {version}</div>
      {intro && <p style={{ margin: '20px 0 0', color: '#3E4652' }}>{intro}</p>}
      {sections.map((s) => (
        <section key={s.title} style={{ marginTop: 28 }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 700 }}>{s.title}</h2>
          {s.body.map((line, i) => (
            <p key={i} style={{ margin: '4px 0', color: line.startsWith('[TODO') ? '#B42318' : '#3E4652', fontSize: line.startsWith('[TODO') ? 13 : 15 }}>{line}</p>
          ))}
        </section>
      ))}
    </article>
  );
}
