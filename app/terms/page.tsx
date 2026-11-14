import { FdHeader } from '@/components/fd/FdHeader';
import { FdFooter } from '@/components/fd/FdFooter';
import { LegalDoc } from '@/components/legal/LegalDoc';
import { TERMS, TERMS_VERSION } from '@/lib/legal/documents';

export const metadata = { title: '이용약관 — 더클' };

export default function TermsPage() {
  return (
    <div data-theme="fd" style={{ fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo','Malgun Gothic',sans-serif", background: '#FFFFFF' }}>
      <FdHeader />
      <LegalDoc title="더클 이용약관" version={TERMS_VERSION} sections={TERMS} />
      <FdFooter />
    </div>
  );
}
