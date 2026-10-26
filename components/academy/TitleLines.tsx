/** 섹션 제목 — 원장이 넣은 줄바꿈(최대 2줄)을 <br />로 */
export function TitleLines({ text }: { text: string }) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 2);
  return (
    <>
      {lines.map((l, i) => (
        <span key={i}>{i > 0 && <br />}{l}</span>
      ))}
    </>
  );
}
