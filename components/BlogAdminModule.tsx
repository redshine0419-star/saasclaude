'use client';

import { useState, useEffect } from 'react';
import { Loader2, Trash2, ExternalLink, RefreshCw, Plus, Globe } from 'lucide-react';
import type { PostIndex, BlogPost } from '@/app/api/blog/generate/route';

type Lang = 'ko' | 'en';

interface Props {
  onToast: (msg: string) => void;
}

export default function BlogAdminModule({ onToast }: Props) {
  const [lang, setLang] = useState<Lang>('ko');
  const [keyword, setKeyword] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [tone, setTone] = useState('');
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<BlogPost | null>(null);
  const [posts, setPosts] = useState<PostIndex[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);

  const fetchPosts = async (l: Lang) => {
    setLoadingPosts(true);
    try {
      const res = await fetch(`/api/blog/posts?lang=${l}`);
      const data = await res.json();
      setPosts(data.posts || []);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => { fetchPosts(lang); }, [lang]);

  const handleGenerate = async () => {
    if (!keyword.trim()) { onToast('키워드를 입력해주세요.'); return; }
    setGenerating(true);
    setPreview(null);
    try {
      const res = await fetch('/api/blog/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, targetAudience, tone, lang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPreview(data.post);
      onToast('포스트가 생성되었습니다!');
      fetchPosts(lang);
    } catch (e) {
      onToast('오류: ' + (e as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm(`"${slug}" 포스트를 삭제할까요?`)) return;
    setDeletingSlug(slug);
    try {
      const res = await fetch('/api/blog/posts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, lang }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      onToast('삭제되었습니다.');
      fetchPosts(lang);
      if (preview?.slug === slug) setPreview(null);
    } catch (e) {
      onToast('삭제 오류: ' + (e as Error).message);
    } finally {
      setDeletingSlug(null);
    }
  };

  const toneOptions = lang === 'ko'
    ? ['전문적이고 실용적인', '친근하고 쉬운', '격식체', '캐주얼']
    : ['Professional and practical', 'Friendly and accessible', 'Formal', 'Casual'];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#24292f] dark:text-[#e6edf3]">Blog 관리</h2>
        <p className="text-sm text-[#57606a] dark:text-[#8b949e] mt-1">AI로 SEO 최적화 블로그 포스트를 자동 생성하세요.</p>
      </div>

      {/* Lang tabs */}
      <div className="flex gap-0 border border-[#d0d7de] dark:border-[#30363d] rounded-lg overflow-hidden w-fit">
        {(['ko', 'en'] as Lang[]).map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`px-5 py-2 text-sm font-medium flex items-center gap-2 transition-colors ${
              lang === l
                ? 'bg-[#000000] text-white'
                : 'text-[#57606a] dark:text-[#8b949e] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d]'
            }`}
          >
            <Globe size={14} />
            {l === 'ko' ? '국문 (KO)' : '영문 (EN)'}
          </button>
        ))}
      </div>

      {/* Generate form */}
      <div className="border border-[#d0d7de] dark:border-[#30363d] rounded-lg p-6 bg-white dark:bg-[#161b22]">
        <h3 className="font-semibold text-[#24292f] dark:text-[#e6edf3] mb-4 flex items-center gap-2">
          <Plus size={16} />
          {lang === 'ko' ? '국문 포스트 생성' : 'Generate English Post'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-[#57606a] dark:text-[#8b949e] mb-1">
              키워드 / Keyword <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder={lang === 'ko' ? 'AI 마케팅 전략' : 'AI marketing strategy'}
              className="w-full px-3 py-2 text-sm border border-[#d0d7de] dark:border-[#30363d] rounded-md bg-white dark:bg-[#0d1117] text-[#24292f] dark:text-[#e6edf3] focus:outline-none focus:border-[#57606a] dark:focus:border-[#8b949e]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#57606a] dark:text-[#8b949e] mb-1">
              {lang === 'ko' ? '대상 독자' : 'Target Audience'}
            </label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder={lang === 'ko' ? '스타트업 마케터' : 'Startup marketers'}
              className="w-full px-3 py-2 text-sm border border-[#d0d7de] dark:border-[#30363d] rounded-md bg-white dark:bg-[#0d1117] text-[#24292f] dark:text-[#e6edf3] focus:outline-none focus:border-[#57606a] dark:focus:border-[#8b949e]"
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-xs font-medium text-[#57606a] dark:text-[#8b949e] mb-1">
            {lang === 'ko' ? '톤앤매너' : 'Tone'}
          </label>
          <div className="flex flex-wrap gap-2">
            {toneOptions.map((t) => (
              <button
                key={t}
                onClick={() => setTone(tone === t ? '' : t)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  tone === t
                    ? 'bg-[#000000] text-white border-[#000000]'
                    : 'border-[#d0d7de] dark:border-[#30363d] text-[#57606a] dark:text-[#8b949e] hover:border-[#57606a]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2 bg-[#000000] hover:bg-[#333333] disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors"
        >
          {generating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          {generating
            ? (lang === 'ko' ? '생성 중... (10~20초)' : 'Generating... (10~20s)')
            : (lang === 'ko' ? 'AI 포스트 생성' : 'Generate with AI')}
        </button>
      </div>

      {/* Preview */}
      {preview && (
        <div className="border border-[#d0d7de] dark:border-[#30363d] rounded-lg p-6 bg-white dark:bg-[#161b22]">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-[#24292f] dark:text-[#e6edf3]">
              {lang === 'ko' ? '생성 완료 — 미리보기' : 'Generated — Preview'}
            </h3>
            <a
              href={`/blog/${lang}/${preview.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-[#57606a] dark:text-[#8b949e] hover:text-[#24292f] dark:hover:text-[#e6edf3] transition-colors"
            >
              <ExternalLink size={13} />
              {lang === 'ko' ? '블로그에서 보기' : 'View on blog'}
            </a>
          </div>
          <div className="space-y-2">
            <div>
              <span className="text-xs text-[#57606a] dark:text-[#8b949e]">제목</span>
              <p className="font-medium text-[#24292f] dark:text-[#e6edf3]">{preview.title}</p>
            </div>
            <div>
              <span className="text-xs text-[#57606a] dark:text-[#8b949e]">Meta Description</span>
              <p className="text-sm text-[#57606a] dark:text-[#8b949e]">{preview.metaDescription}</p>
            </div>
            <div>
              <span className="text-xs text-[#57606a] dark:text-[#8b949e]">태그</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {preview.tags.map((t) => (
                  <span key={t} className="px-2 py-0.5 bg-[#f6f8fa] dark:bg-[#21262d] text-xs text-[#57606a] dark:text-[#8b949e] rounded-full">{t}</span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-xs text-[#57606a] dark:text-[#8b949e]">본문 미리보기</span>
              <p className="text-sm text-[#24292f] dark:text-[#e6edf3] mt-1 line-clamp-4 bg-[#f6f8fa] dark:bg-[#21262d] p-3 rounded-md font-mono leading-relaxed">
                {preview.content.slice(0, 300)}...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Post list */}
      <div className="border border-[#d0d7de] dark:border-[#30363d] rounded-lg overflow-hidden bg-white dark:bg-[#161b22]">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#21262d]">
          <span className="text-sm font-medium text-[#24292f] dark:text-[#e6edf3]">
            {lang === 'ko' ? `국문 포스트 (${posts.length})` : `English Posts (${posts.length})`}
          </span>
          <button
            onClick={() => fetchPosts(lang)}
            className="p-1.5 text-[#57606a] dark:text-[#8b949e] hover:text-[#24292f] dark:hover:text-[#e6edf3] transition-colors"
          >
            <RefreshCw size={14} className={loadingPosts ? 'animate-spin' : ''} />
          </button>
        </div>

        {loadingPosts ? (
          <div className="flex justify-center py-10">
            <Loader2 size={20} className="animate-spin text-[#57606a]" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-10 text-[#57606a] dark:text-[#8b949e] text-sm">
            {lang === 'ko' ? '아직 포스트가 없습니다.' : 'No posts yet.'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#d0d7de] dark:border-[#30363d] text-xs text-[#57606a] dark:text-[#8b949e]">
                <th className="text-left px-5 py-2 font-medium">{lang === 'ko' ? '제목' : 'Title'}</th>
                <th className="text-left px-3 py-2 font-medium hidden md:table-cell">{lang === 'ko' ? '키워드' : 'Keyword'}</th>
                <th className="text-left px-3 py-2 font-medium hidden md:table-cell">{lang === 'ko' ? '날짜' : 'Date'}</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.slug} className="border-b border-[#d0d7de] dark:border-[#30363d] last:border-0 hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] transition-colors">
                  <td className="px-5 py-3">
                    <a
                      href={`/blog/${lang}/${post.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-[#24292f] dark:text-[#e6edf3] hover:underline line-clamp-1"
                    >
                      {post.title}
                    </a>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {post.tags.slice(0, 3).map((t) => (
                        <span key={t} className="px-1.5 py-0.5 bg-[#f6f8fa] dark:bg-[#21262d] text-[#57606a] dark:text-[#8b949e] text-xs rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-[#57606a] dark:text-[#8b949e] hidden md:table-cell">{post.keyword}</td>
                  <td className="px-3 py-3 text-[#57606a] dark:text-[#8b949e] text-xs hidden md:table-cell whitespace-nowrap">
                    {new Date(post.createdAt).toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US')}
                  </td>
                  <td className="px-3 py-3">
                    <button
                      onClick={() => handleDelete(post.slug)}
                      disabled={deletingSlug === post.slug}
                      className="p-1.5 text-[#57606a] dark:text-[#8b949e] hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                      {deletingSlug === post.slug
                        ? <Loader2 size={14} className="animate-spin" />
                        : <Trash2 size={14} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
