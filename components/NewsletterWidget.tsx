'use client';

import { useState } from 'react';
import { Mail, CheckCircle2, Loader2 } from 'lucide-react';

interface NewsletterWidgetProps {
  lang?: 'ko' | 'en' | 'ja';
}

const labels = {
  ko: {
    title: '주간 마케팅 인사이트 구독',
    sub: '매주 최신 GEO·SEO 팁과 마케팅 트렌드를 이메일로 받아보세요.',
    placeholder: '이메일 주소',
    btn: '무료 구독',
    loading: '처리 중…',
    success: '구독 완료! 매주 수요일 인사이트를 보내드립니다.',
    error: '오류가 발생했습니다. 다시 시도해주세요.',
  },
  en: {
    title: 'Weekly Marketing Insights',
    sub: 'Get the latest GEO·SEO tips and marketing trends delivered every week.',
    placeholder: 'Your email address',
    btn: 'Subscribe Free',
    loading: 'Processing…',
    success: 'Subscribed! We\'ll send your weekly insights every Wednesday.',
    error: 'Something went wrong. Please try again.',
  },
  ja: {
    title: '週刊マーケティングインサイト',
    sub: '最新のGEO・SEOヒントとマーケティングトレンドを毎週メールでお届けします。',
    placeholder: 'メールアドレス',
    btn: '無料登録',
    loading: '処理中…',
    success: '登録完了！毎週水曜日にインサイトをお届けします。',
    error: 'エラーが発生しました。もう一度お試しください。',
  },
};

export default function NewsletterWidget({ lang = 'ko' }: NewsletterWidgetProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const t = labels[lang];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || status === 'loading') return;
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), lang }),
      });
      if (!res.ok) throw new Error();
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="bg-[#f6f8fa] dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-xl p-6 md:p-8">
      <div className="flex items-center gap-2 mb-2">
        <Mail size={18} className="text-[#4f46e5]" />
        <h3 className="font-bold text-[#24292f] dark:text-[#e6edf3] text-base">{t.title}</h3>
      </div>
      <p className="text-sm text-[#57606a] dark:text-[#8b949e] mb-4 leading-relaxed">{t.sub}</p>

      {status === 'success' ? (
        <div className="flex items-center gap-2 text-emerald-600 font-medium text-sm">
          <CheckCircle2 size={16} />
          {t.success}
        </div>
      ) : (
        <form onSubmit={submit} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder={t.placeholder}
            required
            disabled={status === 'loading'}
            className="flex-1 px-3 py-2 text-sm border border-[#d0d7de] dark:border-[#30363d] rounded-lg bg-white dark:bg-[#0d1117] text-[#24292f] dark:text-[#e6edf3] focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/40 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={status === 'loading' || !email.trim()}
            className="px-4 py-2 bg-[#4f46e5] hover:bg-[#4338ca] disabled:bg-slate-300 text-white text-sm font-bold rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors"
          >
            {status === 'loading' ? <><Loader2 size={13} className="animate-spin" />{t.loading}</> : t.btn}
          </button>
        </form>
      )}

      {status === 'error' && (
        <p className="text-xs text-rose-500 mt-2">{t.error}</p>
      )}
    </div>
  );
}
