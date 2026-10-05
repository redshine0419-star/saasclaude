import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAcademyPageData } from '@/lib/academy-data';
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
  const pageUrl = `${baseUrl}/${slug}`;
  const description = [
    tenant.name,
    tenant.subjects,
    tenant.targetGrades,
    tenant.address,
  ]
    .filter(Boolean)
    .join(' · ');

  return {
    title: tenant.name,
    description,
    openGraph: {
      title: tenant.name,
      description,
      url: pageUrl,
      type: 'website',
      locale: 'ko_KR',
    },
    alternates: { canonical: pageUrl },
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
