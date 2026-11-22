'use client';

/**
 * 시작 체크리스트의 '관리자 앱 설치' 줄 — 같은 화면 안에서 설치 안내 창을 바로 연다.
 * (주소만 ?install=1로 바뀌면 화면이 다시 그려지지 않아 창이 안 열리므로 이벤트로 연다. 창이 없는 화면에서는 주소로 이동)
 */
export const OPEN_INSTALL_EVENT = 'adm:open-install';

export function OpenInstallLink({ href, className, style, children }: { href: string; className?: string; style?: React.CSSProperties; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className={className}
      style={style}
      onClick={(e) => {
        if ((window as unknown as { __admInstallReady?: boolean }).__admInstallReady) {
          e.preventDefault();
          window.dispatchEvent(new Event(OPEN_INSTALL_EVENT));
        }
      }}
    >
      {children}
    </a>
  );
}
