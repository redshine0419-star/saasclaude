'use client';

import { useState } from 'react';
import { Bot, Loader2, Copy, Download, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAppLang } from '@/components/AppLangContext';
import { t } from '@/lib/app-i18n';

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={'bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden ' + className}>
    {children}
  </div>
);

function Field({
  label, hint, value, onChange, placeholder, multiline = false, required = false,
}: {
  label: string; hint?: string; value: string; onChange: (v: string) => void;
  placeholder: string; multiline?: boolean; required?: boolean;
}) {
  const base = 'w-full pl-4 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm';
  return (
    <div>
      <label className="text-xs font-black text-slate-600 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {hint && <p className="text-[10px] text-slate-400 mb-2">{hint}</p>}
      {multiline
        ? <textarea className={base + ' resize-none h-24'} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
        : <input className={base} type="text" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
      }
    </div>
  );
}

export default function LlmsTxtModule({ onToast }: { onToast: (msg: string) => void }) {
  const { lang } = useAppLang();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [services, setServices] = useState('');
  const [audience, setAudience] = useState('');
  const [urls, setUrls] = useState('');
  const [instructions, setInstructions] = useState('');
  const [blockedSections, setBlockedSections] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState('');

  const generate = async () => {
    if (!name.trim() || !description.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/llmstxt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, services, audience, urls, instructions, blockedSections }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t('common', 'error', lang));
      setResult(data.content);
      onToast(t('llmstxt', 'fileGenerated', lang));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common', 'error', lang));
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!result) return;
    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'llms.txt';
    a.click();
    URL.revokeObjectURL(url);
    onToast(t('llmstxt', 'downloadComplete', lang));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card className="p-6 md:p-8 border-indigo-100 bg-gradient-to-br from-white to-indigo-50/30">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-indigo-200 shadow-lg">
            <Bot size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">{t('llmstxt', 'title', lang)}</h3>
            <p className="text-sm text-slate-500">{t('llmstxt', 'subtitle', lang)}</p>
          </div>
        </div>
        <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-700 leading-relaxed">
          <strong>{t('llmstxt', 'whatIsTitle', lang)}</strong> {t('llmstxt', 'whatIs', lang)}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <h4 className="font-bold text-slate-800 text-sm">{t('llmstxt', 'basicInfo', lang)}</h4>
          <Field label={t('llmstxt', 'brandName', lang)} required value={name} onChange={setName} placeholder={t('llmstxt', 'brandNamePh', lang)} />
          <Field label={t('llmstxt', 'brandDesc', lang)} required multiline value={description} onChange={setDescription}
            placeholder={t('llmstxt', 'brandDescPh', lang)} />
          <Field label={t('llmstxt', 'services', lang)} value={services} onChange={setServices}
            placeholder="SEO, GEO, Keyword Research, Content Generation"
            hint={t('llmstxt', 'commaHint', lang)} />
          <Field label={t('llmstxt', 'targetUser', lang)} value={audience} onChange={setAudience}
            placeholder="Startup marketers, solo operators, SEO agencies" />
        </Card>

        <Card className="p-6 space-y-4">
          <h4 className="font-bold text-slate-800 text-sm">{t('llmstxt', 'aiGuide', lang)}</h4>
          <Field label={t('llmstxt', 'mainUrls', lang)} multiline value={urls} onChange={setUrls}
            placeholder={t('llmstxt', 'mainUrlsPh', lang)}
            hint={t('llmstxt', 'mainUrlsHint', lang)} />
          <Field label={t('llmstxt', 'aiInstructions', lang)} multiline value={instructions} onChange={setInstructions}
            placeholder={t('llmstxt', 'aiInstructPh', lang)}
            hint={t('llmstxt', 'aiInstructPh', lang)} />
          <Field label={t('llmstxt', 'privateSection', lang)} value={blockedSections} onChange={setBlockedSections}
            placeholder="/admin, /internal, /private"
            hint={t('llmstxt', 'privateSectionHint', lang)} />
        </Card>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">{error}</div>
      )}

      <button
        onClick={generate}
        disabled={loading || !name.trim() || !description.trim()}
        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
      >
        {loading ? <><Loader2 size={18} className="animate-spin" /> {t('common', 'generating', lang)}</> : <><Sparkles size={18} /> {t('llmstxt', 'generateBtn', lang)}</>}
      </button>

      {result && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-500" />
              <span className="font-bold text-slate-800">{t('llmstxt', 'generated', lang)}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { navigator.clipboard.writeText(result); onToast(t('common', 'copiedToClipboard', lang)); }}
                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                <Copy size={14} /> {t('common', 'copy', lang)}
              </button>
              <button
                onClick={download}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors"
              >
                <Download size={14} /> {t('common', 'download', lang)}
              </button>
            </div>
          </div>

          <Card className="p-6 bg-slate-900 border-slate-700">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
              {t('llmstxt', 'preview', lang)}
            </div>
            <pre className="text-xs text-emerald-400 leading-relaxed whitespace-pre-wrap font-mono overflow-x-auto">
              {result}
            </pre>
          </Card>

          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
            <div className="text-xs font-black text-emerald-700 mb-2">{t('llmstxt', 'uploadTitle', lang)}</div>
            <ol className="text-xs text-emerald-800 space-y-1 list-decimal pl-4 leading-relaxed">
              <li>{t('llmstxt', 'step1', lang)}</li>
              <li>{t('llmstxt', 'step2', lang)}</li>
              <li>{t('llmstxt', 'step3', lang)}</li>
              <li>{t('llmstxt', 'step4', lang)}</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
