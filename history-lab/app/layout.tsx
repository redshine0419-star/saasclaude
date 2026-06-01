import type { Metadata } from "next";
import { Noto_Serif_KR } from "next/font/google";
import "./globals.css";

const notoSerifKR = Noto_Serif_KR({
  variable: "--font-noto-serif",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "히스토리 랩 | 이야기로 배우는 세계사 × 세능검 퀴즈",
  description: "흥미진진한 비하인드 역사 이야기와 세계사능력검정시험 합격 기출 퀴즈 플랫폼. 마리 앙투아네트의 억울한 비밀부터 조선시대 나의 직업 찾기까지.",
  keywords: ["세계사능력검정시험", "세능검", "역사 퀴즈", "마리 앙투아네트", "프랑스 혁명"],
  openGraph: {
    title: "히스토리 랩 — 이야기로 시작해 스펙으로 완성",
    description: "스낵형 역사 콘텐츠와 기출 퀴즈의 하이브리드 플랫폼",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={`${notoSerifKR.variable} h-full`}>
      <body className="min-h-full flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--cream)" }}>
        {children}
      </body>
    </html>
  );
}
