/** 페이지에 넣을 JSON-LD 문자열 — </script> 같은 글자를 막는다 (다른 모듈을 가져오지 않아 클라이언트 컴포넌트에서도 쓴다) */
export function ldJson(nodes: object | object[]): string {
  const graph = Array.isArray(nodes) ? nodes : [nodes];
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
