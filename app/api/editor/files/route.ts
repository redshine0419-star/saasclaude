import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import fs from 'fs';
import path from 'path';

function walk(dir: string, root: string, results: string[] = []): string[] {
  const skip = new Set(['node_modules', '.next', '.git', 'dist', 'out', '.turbo']);
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, root, results);
    } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
      results.push(path.relative(root, full));
    }
  }
  return results;
}

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const root = process.cwd();
  const dirs = ['components', 'app', 'lib'];
  const files: string[] = [];
  for (const d of dirs) {
    const abs = path.join(root, d);
    if (fs.existsSync(abs)) walk(abs, root, files);
  }

  return NextResponse.json(files.sort());
}
