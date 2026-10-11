import { analyzePage, emptyResult, type DiagnosisResult } from './analyze';
import { FetchBlockedError, safeFetchHtml } from './safe-fetch';

export async function runDiagnosis(currentUrl: string | null): Promise<DiagnosisResult> {
  if (!currentUrl?.trim()) return emptyResult('none');
  try {
    const page = await safeFetchHtml(currentUrl.trim());
    if (page.status >= 400) return emptyResult('unreachable');
    return analyzePage(page);
  } catch (e) {
    if (!(e instanceof FetchBlockedError)) {
      console.warn('[diagnosis] fetch failed:', e instanceof Error ? e.message : 'unknown');
    }
    return emptyResult('unreachable');
  }
}
