import { headers } from 'next/headers';
import { auth } from '@/auth';
import LandingPage from '@/components/LandingPage';

export default async function Home() {
  const session = await auth();
  const headersList = await headers();
  const lang = (headersList.get('x-lang') ?? 'ko') as 'ko' | 'en' | 'ja';
  return <LandingPage lang={lang} isLoggedIn={!!session?.user} />;
}
