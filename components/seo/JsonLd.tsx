import { ldJson } from '@/lib/seo/jsonld';

/** 서비스 사이트 구조화 데이터 — 노드들을 @graph 하나로 넣는다 */
export function JsonLd({ nodes }: { nodes: object | object[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(nodes) }} />;
}
