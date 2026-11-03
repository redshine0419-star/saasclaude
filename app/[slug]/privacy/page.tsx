import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAcademyPageData } from '@/lib/academy-data';
import { LegalDoc } from '@/components/legal/LegalDoc';
import { ACADEMY_PRIVACY_VERSION, academyPrivacy } from '@/lib/legal/academy-privacy';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const data = await getAcademyPageData((await params).slug);
  return { title: data ? `개인정보처리방침 — ${data.tenant.name}` : '개인정보처리방침' };
}

export default async function AcademyPrivacyPage({ params }: Props) {
  const { slug } = await params;
  const data = await getAcademyPageData(slug);
  if (!data) notFound();
  const t = data.tenant;
  return (
    <div style={{ background: '#FFFFFF' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '20px 20px 0' }}>
        <Link href={`/${slug}`} style={{ fontSize: 14, color: '#5A6270', textDecoration: 'none' }}>← {t.name} 홈페이지</Link>
      </div>
      <LegalDoc
        title={`${t.name} 개인정보처리방침`}
        version={ACADEMY_PRIVACY_VERSION}
        intro={`${t.name}은(는) 개인정보 보호법에 따라 학부모·학생의 개인정보를 다음과 같이 처리합니다.`}
        sections={academyPrivacy(t)}
      />
    </div>
  );
}
