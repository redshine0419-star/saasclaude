const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://growweb.me';

interface MediumResult {
  url: string;
  id: string;
}

export async function publishToMedium(params: {
  title: string;
  content: string;
  tags: string[];
  lang: string;
  slug: string;
}): Promise<MediumResult> {
  const token = process.env.MEDIUM_TOKEN;
  if (!token) throw new Error('MEDIUM_TOKEN 환경변수가 설정되지 않았습니다.');

  const meRes = await fetch('https://api.medium.com/v1/me', {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!meRes.ok) throw new Error('Medium 인증 실패. 토큰을 확인하세요.');
  const meData = await meRes.json();
  const authorId: string = meData.data.id;

  const canonicalUrl = `${SITE_URL}/blog/${params.lang}/${params.slug}`;
  const footer =
    params.lang === 'ja'
      ? `\n\n---\n\n*原文: [${canonicalUrl}](${canonicalUrl})*\n*GrowWeb.me — 無料AIマーケティング診断ツール*`
      : params.lang === 'en'
      ? `\n\n---\n\n*Originally published at [GrowWeb.me](${canonicalUrl})*`
      : `\n\n---\n\n*원문: [${canonicalUrl}](${canonicalUrl})*\n*GrowWeb.me — AI 마케팅 무료 진단 도구*`;

  const postRes = await fetch(`https://api.medium.com/v1/users/${authorId}/posts`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: params.title,
      contentFormat: 'markdown',
      content: params.content + footer,
      tags: params.tags.slice(0, 5),
      canonicalUrl,
      publishStatus: 'public',
    }),
  });

  if (!postRes.ok) {
    const err = await postRes.json();
    throw new Error(err.errors?.[0]?.message ?? 'Medium 발행 실패');
  }

  const postData = await postRes.json();
  return { url: postData.data.url, id: postData.data.id };
}
