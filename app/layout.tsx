import type { Metadata } from 'next';
import './globals.css';
import { SiteAnalytics } from '@/components/analytics/SiteAnalytics';
import { ga4MeasurementId } from '@/lib/analytics';

export const metadata: Metadata = {
  title: '첫등원',
  description: '동네 학원·교습소를 위한 홈페이지 & 상담 관리 솔루션',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  const ga4 = ga4MeasurementId();
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full flex flex-col">
        {children}
        {ga4 && <SiteAnalytics id={ga4} />}
      </body>
    </html>
  );
}
