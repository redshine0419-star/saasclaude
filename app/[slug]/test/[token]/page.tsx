import { notFound, redirect } from 'next/navigation';
import { findAttemptByToken, isPastDeadline, submitAttempt } from '@/lib/level-test/attempt';
import { TestTakeClient, type TakeQuestion } from './TestTakeClient';

export const metadata = { title: '레벨테스트', robots: { index: false, follow: false } };

type Props = { params: Promise<{ slug: string; token: string }> };

export default async function TakeTestPage({ params }: Props) {
  const { slug, token } = await params;
  const attempt = await findAttemptByToken(slug, token);
  if (!attempt) notFound();

  if (attempt.status === 'in_progress' && isPastDeadline(attempt.startedAt, attempt.test.timeLimitMin, new Date())) {
    await submitAttempt(attempt.id);
  }
  if (attempt.status === 'submitted' || (attempt.status === 'in_progress' && isPastDeadline(attempt.startedAt, attempt.test.timeLimitMin, new Date()))) {
    redirect(`/${slug}/test/${token}/result`);
  }

  // 정답·해설은 절대 브라우저로 보내지 않는다
  const questions: TakeQuestion[] = attempt.test.items.map((i) => ({
    id: i.questionId,
    type: i.question.type,
    body: i.question.body,
    imageUrl: i.question.imageUrl,
    choices: Array.isArray(i.question.choices) ? (i.question.choices as string[]) : null,
    points: i.points,
  }));

  return (
    <TestTakeClient
      slug={slug}
      token={token}
      academyName={attempt.tenant.name}
      title={attempt.test.title}
      description={attempt.test.description}
      timeLimitMin={attempt.test.timeLimitMin}
      startedAt={attempt.startedAt?.toISOString() ?? null}
      questions={questions}
      saved={Object.fromEntries(attempt.responses.map((r) => [r.questionId, r.answer]))}
      savedPhotos={Object.fromEntries(attempt.responses.map((r) => [r.questionId, r.photos]))}
    />
  );
}
