export interface DiagnosisRecord {
  url: string;
  timestamp: number;
  scores: {
    performance: number;
    seo: number;
    accessibility: number;
    geo: number;
  };
}

export interface UsageStats {
  diagnosisCount: number;
  contentCount: number;
}

const DIAGNOSIS_KEY = 'marketerops_diagnoses';
const STATS_KEY = 'marketerops_stats';

export function saveDiagnosis(record: DiagnosisRecord): void {
  if (typeof window === 'undefined') return;
  const existing = getDiagnoses();
  const updated = [record, ...existing].slice(0, 20);
  localStorage.setItem(DIAGNOSIS_KEY, JSON.stringify(updated));

  const stats = getStats();
  stats.diagnosisCount += 1;
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export function getDiagnoses(): DiagnosisRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(DIAGNOSIS_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function incrementContentCount(): void {
  if (typeof window === 'undefined') return;
  const stats = getStats();
  stats.contentCount += 1;
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export function getStats(): UsageStats {
  if (typeof window === 'undefined') return { diagnosisCount: 0, contentCount: 0 };
  try {
    return JSON.parse(localStorage.getItem(STATS_KEY) ?? '{"diagnosisCount":0,"contentCount":0}');
  } catch {
    return { diagnosisCount: 0, contentCount: 0 };
  }
}
