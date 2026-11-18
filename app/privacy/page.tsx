import { FdHeader } from '@/components/fd/FdHeader';
import { FdFooter } from '@/components/fd/FdFooter';
import { LegalDoc } from '@/components/legal/LegalDoc';
import { OPERATOR, PRIVACY, PRIVACY_VERSION } from '@/lib/legal/documents';

import { JsonLd } from '@/components/seo/JsonLd';
import { SITE_URL, breadcrumb, webPage } from '@/lib/seo/jsonld';

export const metadata = { title: '개인정보처리방침 — 더클', alternates: { canonical: `${SITE_URL}/privacy` } };

export default function PrivacyPage() {
  return (
    <div data-theme="fd" style={{ fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo','Malgun Gothic',sans-serif", background: '#FFFFFF' }}>
      <JsonLd nodes={[webPage({ path: '/privacy', name: '개인정보처리방침 — 더클' }), breadcrumb([{ name: '개인정보처리방침', path: '/privacy' }])]} />
      <FdHeader />
      <LegalDoc
        title="개인정보처리방침"
        version={PRIVACY_VERSION}
        intro={`${OPERATOR.name}(이하 "운영자")는 개인정보 보호법 등 관련 법령을 지키며, 더클 서비스 이용자의 개인정보를 다음과 같이 처리합니다.`}
        sections={PRIVACY}
      />
      <FdFooter />
    </div>
  );
}
