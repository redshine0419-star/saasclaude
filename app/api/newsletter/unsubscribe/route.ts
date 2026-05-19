import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) {
    return new NextResponse('<html><body><h2>잘못된 요청입니다.</h2></body></html>', {
      status: 400, headers: { 'Content-Type': 'text/html' },
    });
  }

  try {
    await prisma.newsletterSubscriber.delete({ where: { token } });
  } catch {
    // already deleted or not found — treat as success
  }

  return new NextResponse(
    `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>구독 취소 완료</title>
    <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f8fafc}
    .box{text-align:center;padding:40px;background:#fff;border-radius:16px;box-shadow:0 2px 8px rgba(0,0,0,.1)}
    h2{color:#1e293b;margin-bottom:8px}p{color:#64748b;font-size:14px}
    a{color:#4f46e5;font-weight:700}</style></head>
    <body><div class="box"><h2>✅ 구독이 취소되었습니다.</h2>
    <p>GrowWeb.me 뉴스레터 구독이 취소됐습니다.<br>언제든지 다시 구독하실 수 있습니다.</p>
    <p style="margin-top:20px"><a href="https://growweb.me">홈으로 돌아가기</a></p>
    </div></body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html' } }
  );
}
