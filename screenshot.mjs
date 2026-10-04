import { chromium } from 'playwright';

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

const widths = [390, 1440];
for (const width of widths) {
  const page = await browser.newPage();
  await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
  await page.goto('http://localhost:3000/demo', { waitUntil: 'networkidle' });
  await page.screenshot({
    path: `/tmp/claude-0/-home-user-saasclaude/bbf0354a-541c-5736-b50f-827cab5259eb/scratchpad/demo-${width}.png`,
    fullPage: true,
  });
  console.log(`Captured ${width}px`);
  await page.close();
}

await browser.close();
