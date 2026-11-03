import { FdHeader } from '@/components/fd/FdHeader';
import { FdFooter } from '@/components/fd/FdFooter';
import { LegalDoc } from '@/components/legal/LegalDoc';
import { OPERATOR, PRIVACY, PRIVACY_VERSION } from '@/lib/legal/documents';

export const metadata = { title: '개인정보처리방침 — 첫등원' };

export default function PrivacyPage() {
  return (
    <div data-theme="fd" style={{ fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo','Malgun Gothic',sans-serif", background: '#FFFFFF' }}>
      <FdHeader />
      <LegalDoc
        title="개인정보처리방침"
        version={PRIVACY_VERSION}
        intro={`${OPERATOR.name}(이하 "운영자")는 개인정보 보호법 등 관련 법령을 지키며, 첫등원 서비스 이용자의 개인정보를 다음과 같이 처리합니다.`}
        sections={PRIVACY}
      />
      <FdFooter />
    </div>
  );
}
