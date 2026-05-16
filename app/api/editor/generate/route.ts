import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { generateText } from '@/lib/ai';

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { elementHTML, fileContent, filePath, prompt } = await req.json();
  if (!fileContent || !prompt) {
    return NextResponse.json({ error: 'fileContent and prompt required' }, { status: 400 });
  }

  const aiPrompt = `You are a Next.js 16, TypeScript, and Tailwind CSS v4 expert developer.
The user wants to modify a React component file.

${elementHTML ? `## Selected Element (from live preview)\n\`\`\`html\n${elementHTML.slice(0, 2000)}\n\`\`\`` : ''}

## File: ${filePath}
\`\`\`tsx
${fileContent}
\`\`\`

## User Request
${prompt}

## Instructions
- Return ONLY the complete modified file content with no explanation, no markdown code fences, no preamble.
- Preserve all imports, exports, types, and logic that are not related to the change.
- Use existing Tailwind classes and color conventions already present in the file.
- Do not add comments explaining your changes.`;

  try {
    const result = await generateText(aiPrompt);
    // Strip markdown fences if AI wrapped the response
    let code = result.text.trim();
    if (code.startsWith('```')) {
      code = code.replace(/^```(?:tsx?|javascript|jsx?)?\n?/, '').replace(/\n?```$/, '').trim();
    }
    return NextResponse.json({ modifiedCode: code, usage: result.usage });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
