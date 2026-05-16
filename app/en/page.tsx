import { auth } from '@/auth';
import LandingPage from '@/components/LandingPage';

export default async function EnglishHome() {
  const session = await auth();
  return <LandingPage lang="en" isLoggedIn={!!session?.user} />;
}
