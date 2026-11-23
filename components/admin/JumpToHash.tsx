'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * 주소 뒤 #아이디로 들어오면 그 카드·입력칸으로 내려가 잠깐 강조한다 (대시보드 '홈페이지 완성도'에서 누를 때).
 * 화면 위 고정 바에 가리지 않게 조금 위로 띄우고, PC에서는 입력칸에 바로 커서를 둔다(휴대폰은 키보드가 뜨므로 두지 않는다).
 */
export function JumpToHash() {
  const pathname = usePathname();
  useEffect(() => {
    const go = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      let tries = 0;
      const find = () => {
        const el = document.getElementById(id);
        if (!el) {
          if (tries++ < 20) window.setTimeout(find, 100); // 화면이 다 그려질 때까지 잠깐 기다린다
          return;
        }
        const top = el.getBoundingClientRect().top + window.scrollY - 88;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
        el.classList.remove('adm-jump-flash');
        void el.offsetWidth; // 같은 곳을 다시 눌러도 강조가 다시 보이게
        el.classList.add('adm-jump-flash');
        window.setTimeout(() => el.classList.remove('adm-jump-flash'), 2200);
        const touch = window.matchMedia('(pointer: coarse)').matches;
        if (!touch) {
          const input = el.matches('input, textarea, select') ? (el as HTMLElement) : el.querySelector<HTMLElement>('input:not([type=hidden]):not([type=file]), textarea, select');
          window.setTimeout(() => input?.focus({ preventScroll: true }), 400);
        }
      };
      find();
    };
    go();
    window.addEventListener('hashchange', go);
    return () => window.removeEventListener('hashchange', go);
  }, [pathname]);
  return null;
}
