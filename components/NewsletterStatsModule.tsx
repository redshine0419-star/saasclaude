'use client';

import { useState } from 'react';
import { Mail, RefreshCw, Users } from 'lucide-react';

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  lang: string;
  createdAt: string;
}

interface Stats {
  total: number;
  byLang: Record<string, number>;
  recent: Subscriber[];
}

const LANG_LABEL: Record<string, string> = { ko: '한국어', en: '영어', ja: '일본어' };

export default function NewsletterStatsModule() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/newsletter/subscribe');
      if (!res.ok) throw new Error('불러오기 실패');
      setStats(await res.json());
    } catch {
      setError('데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Mail size={20} /> 수집 이메일 현황
        </h2>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-700 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {stats ? '새로고침' : '불러오기'}
        </button>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {!stats && !loading && (
        <div className="text-center py-16 text-slate-400 text-sm">
          위 버튼을 눌러 구독자 현황을 확인하세요.
        </div>
      )}

      {stats && (
        <>
          {/* 요약 카드 */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="col-span-2 sm:col-span-1 bg-slate-900 text-white rounded-xl p-4 text-center">
              <p className="text-3xl font-bold">{stats.total}</p>
              <p className="text-xs mt-1 opacity-70">전체 구독자</p>
            </div>
            {['ko', 'en', 'ja'].map((lang) => (
              <div key={lang} className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
                <p className="text-2xl font-bold text-slate-800">{stats.byLang[lang] ?? 0}</p>
                <p className="text-xs mt-1 text-slate-400">{LANG_LABEL[lang]}</p>
              </div>
            ))}
          </div>

          {/* 최근 구독자 목록 */}
          <div>
            <h3 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-1">
              <Users size={14} /> 최근 구독자 (최대 20명)
            </h3>
            <div className="rounded-xl border border-slate-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs">
                  <tr>
                    <th className="text-left px-4 py-2">이메일</th>
                    <th className="text-left px-4 py-2">이름</th>
                    <th className="text-left px-4 py-2">언어</th>
                    <th className="text-left px-4 py-2">구독일</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent.map((s, i) => (
                    <tr key={s.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="px-4 py-2 font-mono text-xs">{s.email}</td>
                      <td className="px-4 py-2 text-slate-600">{s.name ?? '-'}</td>
                      <td className="px-4 py-2">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs">
                          {LANG_LABEL[s.lang] ?? s.lang}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-slate-400 text-xs">
                        {new Date(s.createdAt).toLocaleDateString('ko-KR')}
                      </td>
                    </tr>
                  ))}
                  {stats.recent.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-slate-400">아직 구독자가 없습니다.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
