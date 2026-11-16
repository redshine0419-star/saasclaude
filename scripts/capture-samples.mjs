/**
 * 서비스 사이트 메인 슬라이드용 데모 화면 찍기
 *
 *   BASE_URL=http://localhost:3000 node scripts/capture-samples.mjs
 *
 * - 데모 학원(demo-warm / demo-result / demo-bright)이 들어 있는 DB로 띄운 서버가 필요하다.
 *   개발 서버(next dev)는 화면 구석에 개발 도구 표시가 찍히므로 next build → next start 를 권한다.
 * - Playwright 가 필요하다 (npm i -D playwright 또는 전역 설치).
 * - 결과: public/samples/*.webp — 찍을 목록은 lib/sample-shots.json (메인 슬라이드도 같은 파일을 읽는다)
 */
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';
import SAMPLE_SHOTS from '../lib/sample-shots.json' with { type: 'json' };

const BASE = (process.env.BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const OUT = new URL('../public/samples/', import.meta.url);

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error('playwright 를 찾을 수 없습니다. npm i -D playwright 후 다시 실행하세요.');
  process.exit(1);
}

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const desktop = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
const mobile = await browser.newContext({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

for (const s of SAMPLE_SHOTS) {
  const page = await (s.device === 'mobile' ? mobile : desktop).newPage();
  await page.goto(`${BASE}${s.path}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  if (s.scrollTo) {
    await page.evaluate((sel) => document.querySelector(sel)?.scrollIntoView({ block: 'start' }), s.scrollTo);
  } else if (s.scrollY) {
    await page.evaluate((y) => window.scrollTo(0, y), s.scrollY);
  }
  await page.waitForTimeout(600);
  const png = await page.screenshot({ type: 'png' });
  const width = s.device === 'mobile' ? 360 : 960;
  await sharp(png).resize({ width }).webp({ quality: 72 }).toFile(new URL(`${s.id}.webp`, OUT).pathname);
  console.log('찍음', s.id, s.path);
  await page.close();
}
await browser.close();
