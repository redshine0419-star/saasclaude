import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import fs from 'fs';
import path from 'path';

function safePath(filePath: string): string | null {
  const root = process.cwd();
  const resolved = path.resolve(root, filePath);
  if (!resolved.startsWith(root + path.sep) && resolved !== root) return null;
  return resolved;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const filePath = req.nextUrl.searchParams.get('path');
  if (!filePath) return NextResponse.json({ error: 'path required' }, { status: 400 });

  const abs = safePath(filePath);
  if (!abs) return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  if (!fs.existsSync(abs)) return NextResponse.json({ error: 'File not found' }, { status: 404 });

  const content = fs.readFileSync(abs, 'utf-8');
  return NextResponse.json({ content });
}
