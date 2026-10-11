import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAcademyPageData } from '@/lib/academy-data';
import { prisma } from '@/lib/prisma';
import GA4Script from '@/components/academy/GA4Script';
import JsonLd from '@/components/academy/JsonLd';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getAcademyPageData(slug);
  if (!data) return {};

  const { tenant } = data;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://growweb.me';
  // 연결된 학원 도메인이 있으면 그 주소를 대표 주소로 삼아 검색 중복을 막는다
  const domain = await prisma.tenant.findUnique({
    where: { slug },
    select: { customDomain: true, customDomainStatus: true },
  });
  const pageUrl =
    domain?.customDomain && domain.customDomainStatus === 'verified' ? `https://${domain.customDomain}` : `${baseUrl}/${slug}`;
  const description = [
    tenant.name,
    tenant.subjects,
    tenant.targetGrades,
    tenant.address,
  ]
    .filter(Boolean)
    .join(' · ');

  const ogImage = `${baseUrl}/api/${slug}/og-image`;

  return {
    title: tenant.name,
    description,
    openGraph: {
      title: tenant.name,
      description,
      url: pageUrl,
      type: 'website',
      locale: 'ko_KR',
      images: [{ url: ogImage, width: 1200, height: 630, alt: tenant.name }],
    },
    twitter: { card: 'summary_large_image', title: tenant.name, description, images: [ogImage] },
    alternates: { canonical: pageUrl },
    ...(tenant.naverSiteVerification
      ? { other: { 'naver-site-verification': tenant.naverSiteVerification } }
      : {}),
  };
}

export default async function AcademyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getAcademyPageData(slug);
  if (!data) notFound();

  const theme = data.tenant.theme;

  return (
    <div data-theme={theme} className="min-h-screen bg-bg text-ink font-sans">
      {data.tenant.ga4MeasurementId && (
        <GA4Script measurementId={data.tenant.ga4MeasurementId} />
      )}
      <JsonLd tenant={data.tenant} />
      {children}
    </div>
  );
}
