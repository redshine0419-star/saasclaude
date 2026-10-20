import katex from 'katex';

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * 문항 본문을 HTML로. 일반 글자는 모두 이스케이프하고, $...$(줄 안)·$$...$$(별도 줄)만 KaTeX로 그린다.
 * KaTeX는 trust:false라 \href 등 위험한 명령을 실행하지 않는다. 결과는 dangerouslySetInnerHTML로 넣어도 안전하다.
 */
export function renderMathText(text: string): string {
  const out: string[] = [];
  const re = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
  let last = 0;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    out.push(escapeHtml(text.slice(last, m.index)).replace(/\n/g, '<br>'));
    const tex = m[1] ?? m[2];
    out.push(katex.renderToString(tex, { displayMode: m[1] !== undefined, throwOnError: false, trust: false, strict: 'ignore', output: 'html' }));
    last = m.index + m[0].length;
  }
  out.push(escapeHtml(text.slice(last)).replace(/\n/g, '<br>'));
  return out.join('');
}
