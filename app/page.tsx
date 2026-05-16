import { auth } from '@/auth';
import LandingPage from '@/components/LandingPage';

export default async function Home() {
  const session = await auth();
  return <LandingPage lang="ko" isLoggedIn={!!session?.user} />;
}
