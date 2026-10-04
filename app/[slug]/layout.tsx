import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAcademyPageData } from '@/lib/academy-data';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getAcademyPageData(slug);
  if (!data) return {};
  return {
    title: data.tenant.name,
    description: `${data.tenant.name} — ${data.tenant.subjects ?? ''} ${data.tenant.targetGrades ?? ''}`,
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

  const theme = data.tenant.accentColor ? data.tenant.theme : data.tenant.theme;

  return (
    <div data-theme={theme} className="min-h-screen bg-bg text-ink font-sans">
      {children}
    </div>
  );
}
