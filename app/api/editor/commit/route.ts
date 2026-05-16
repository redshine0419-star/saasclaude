import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? '';
const GITHUB_OWNER = process.env.GITHUB_OWNER ?? '';
const GITHUB_REPO = process.env.GITHUB_REPO ?? '';
const GITHUB_BRANCH = process.env.GITHUB_BRANCH ?? 'main';

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    return NextResponse.json({ error: 'GitHub 환경변수(GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO)가 설정되지 않았습니다.' }, { status: 500 });
  }

  const { filePath, content, message } = await req.json();
  if (!filePath || !content) {
    return NextResponse.json({ error: 'filePath and content required' }, { status: 400 });
  }

  const apiBase = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`;
  const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };

  // Get current file SHA
  const getRes = await fetch(`${apiBase}?ref=${GITHUB_BRANCH}`, { headers });
  if (!getRes.ok) {
    const err = await getRes.json();
    return NextResponse.json({ error: `GitHub 파일 조회 실패: ${err.message}` }, { status: 502 });
  }
  const fileData = await getRes.json();
  const sha = fileData.sha as string;

  // Commit updated file
  const commitMessage = message || `feat: AI 편집기로 ${filePath} 수정`;
  const putRes = await fetch(apiBase, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: commitMessage,
      content: Buffer.from(content, 'utf-8').toString('base64'),
      sha,
      branch: GITHUB_BRANCH,
    }),
  });

  if (!putRes.ok) {
    const err = await putRes.json();
    return NextResponse.json({ error: `GitHub 커밋 실패: ${err.message}` }, { status: 502 });
  }

  const putData = await putRes.json();
  return NextResponse.json({
    commitUrl: putData.commit?.html_url,
    sha: putData.commit?.sha,
  });
}
