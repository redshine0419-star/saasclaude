'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { classifyPath } from '@/lib/analytics';

type W = Window & { dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void } & Record<string, unknown>;

/**
 * 더클 통합 GA4. 분석 대상 페이지에 처음 들어올 때만 스크립트를 불러오고,
 * 페이지 조회는 직접 보낸다(주소의 쿼리는 빼고). 관리자·비밀 링크 페이지에서는 GA를 끈다.
 */
export function SiteAnalytics({ id }: { id: string }) {
  const pathname = usePathname();

  useEffect(() => {
    const w = window as unknown as W;
    // 내 PC에서 띄운 화면은 통계에 넣지 않는다
    if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname)) return;
    const kind = classifyPath(pathname, window.location.search);
    w[`ga-disable-${id}`] = !kind;
    if (!kind) return;

    if (!w.gtag) {
      w.dataLayer = w.dataLayer || [];
      w.gtag = function gtag() {
        // eslint-disable-next-line prefer-rest-params
        w.dataLayer!.push(arguments);
      };
      w.gtag('js', new Date());
      w.gtag('config', id, { send_page_view: false });
      const s = document.createElement('script');
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
      document.head.appendChild(s);
    }

    // 제목이 바뀐 뒤에 보내도록 한 박자 늦춘다
    const t = window.setTimeout(() => {
      w.gtag?.('event', 'page_view', {
        page_location: window.location.origin + pathname,
        page_path: pathname,
        page_title: document.title,
        content_group: kind.group,
        ...(kind.slug && { academy_slug: kind.slug }),
      });
    }, 50);
    return () => window.clearTimeout(t);
  }, [pathname, id]);

  return null;
}
