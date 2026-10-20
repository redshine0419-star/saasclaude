import 'katex/dist/katex.min.css';
import { renderMathText } from '@/lib/level-test/math';

/** 문항 본문·보기 표시. 수식 외 글자는 renderMathText에서 이스케이프된다. */
export function MathText({ text, as = 'div', style }: { text: string; as?: 'div' | 'span'; style?: React.CSSProperties }) {
  const Tag = as;
  return <Tag style={style} dangerouslySetInnerHTML={{ __html: renderMathText(text) }} />;
}
