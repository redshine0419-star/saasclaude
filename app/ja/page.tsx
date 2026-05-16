import { auth } from '@/auth';
import LandingPage from '@/components/LandingPage';

export default async function JaPage() {
  const session = await auth();
  return <LandingPage lang="ja" isLoggedIn={!!session?.user} />;
}
