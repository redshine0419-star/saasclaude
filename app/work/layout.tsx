import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export default async function WorkLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/work');
  }
  return <>{children}</>;
}
