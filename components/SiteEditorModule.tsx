'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, MousePointer2, Code2, GitCommit, X, ChevronDown, RotateCcw, CheckCircle2, AlertCircle, Maximize2, Minimize2 } from 'lucide-react';
import { computeDiff, type DiffLine } from '@/lib/diff';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? '';

interface SelectedElement {
  outerHTML: string;
  tagName: string;
  cssPath: string;
  classes: string;
}

// Script injected into the iframe to enable element picking
const PICKER_SCRIPT = `
(function() {
  if (window.__editorPickerActive) return;
  window.__editorPickerActive = true;

  var highlighted = null;
  var locked = false;
  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:2147483647;pointer-events:none;';
  document.body.appendChild(overlay);

  var box = document.createElement('div');
  box.style.cssText = 'position:absolute;border:2px solid #0969da;background:rgba(9,105,218,0.08);border-radius:3px;pointer-events:none;transition:all 0.1s;display:none;';
  overlay.appendChild(box);

  var label = document.createElement('div');
  label.style.cssText = 'position:absolute;top:-22px;left:0;background:#0969da;color:#fff;font-size:11px;padding:2px 6px;border-radius:3px;font-family:monospace;white-space:nowrap;';
  box.appendChild(label);

  function getCssPath(el) {
    var parts = [];
    while (el && el !== document.body) {
      var s = el.tagName.toLowerCase();
      if (el.id) { s += '#' + el.id; parts.unshift(s); break; }
      var idx = Array.from(el.parentNode ? el.parentNode.children : []).indexOf(el) + 1;
      if (idx > 1) s += ':nth-child(' + idx + ')';
      parts.unshift(s);
      el = el.parentNode;
    }
    return parts.join(' > ');
  }

  function highlight(el) {
    if (!el || el === document.body || el === document.documentElement) { box.style.display='none'; return; }
    var r = el.getBoundingClientRect();
    box.style.display = 'block';
    box.style.top = (r.top + window.scrollY) + 'px';
    box.style.left = (r.left + window.scrollX) + 'px';
    box.style.width = r.width + 'px';
    box.style.height = r.height + 'px';
    label.textContent = el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ').filter(Boolean).slice(0,3).join('.') : '');
  }

  document.addEventListener('mousemove', function(e) {
    if (locked) return;
    highlighted = e.target;
    highlight(highlighted);
  }, true);

  document.addEventListener('click', function(e) {
    var el = e.target;
    if (!el || el === document.body) return;
    e.preventDefault(); e.stopPropagation();
    locked = true;
    box.style.borderColor = '#1a7f37';
    box.style.background = 'rgba(26,127,55,0.08)';
    window.parent.postMessage({
      type: '__editor_select__',
      outerHTML: el.outerHTML.slice(0, 4000),
      tagName: el.tagName,
      cssPath: getCssPath(el),
      classes: el.className || '',
    }, '*');
  }, true);

  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === '__editor_reset__') {
      locked = false;
      box.style.borderColor = '#0969da';
      box.style.background = 'rgba(9,105,218,0.08)';
      box.style.display = 'none';
    }
  });
})();
`;

export default function SiteEditorModule() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeReady, setIframeReady] = useState(false);
  const [pickerActive, setPickerActive] = useState(false);
  const [selected, setSelected] = useState<SelectedElement | null>(null);

  const [files, setFiles] = useState<string[]>([]);
  const [fileSearch, setFileSearch] = useState('');
  const [selectedFile, setSelectedFile] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [loadingFile, setLoadingFile] = useState(false);

  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [diffLines, setDiffLines] = useState<DiffLine[]>([]);

  const [committing, setCommitting] = useState(false);
  const [commitResult, setCommitResult] = useState<{ url?: string; error?: string } | null>(null);

  const [iframeExpanded, setIframeExpanded] = useState(false);
  const [showDiffOnly, setShowDiffOnly] = useState(false);

  // Load file list
  useEffect(() => {
    fetch('/api/editor/files').then(r => r.json()).then(d => { if (Array.isArray(d)) setFiles(d); });
  }, []);

  // Listen for postMessage from iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === '__editor_select__') {
        setSelected({
          outerHTML: e.data.outerHTML,
          tagName: e.data.tagName,
          cssPath: e.data.cssPath,
          classes: e.data.classes,
        });
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // Inject picker script into iframe
  const injectPicker = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentDocument) return;
    const script = iframe.contentDocument.createElement('script');
    script.textContent = PICKER_SCRIPT;
    iframe.contentDocument.head.appendChild(script);
    setPickerActive(true);
  }, []);

  const handleIframeLoad = () => {
    setIframeReady(true);
  };

  const resetSelection = () => {
    setSelected(null);
    setGeneratedCode(null);
    setDiffLines([]);
    setCommitResult(null);
    iframeRef.current?.contentWindow?.postMessage({ type: '__editor_reset__' }, '*');
  };

  // Load file content when file is selected
  useEffect(() => {
    if (!selectedFile) { setFileContent(''); return; }
    setLoadingFile(true);
    fetch(`/api/editor/file?path=${encodeURIComponent(selectedFile)}`)
      .then(r => r.json())
      .then(d => setFileContent(d.content ?? ''))
      .finally(() => setLoadingFile(false));
  }, [selectedFile]);

  const handleGenerate = async () => {
    if (!prompt.trim() || !fileContent) return;
    setGenerating(true);
    setGeneratedCode(null);
    setDiffLines([]);
    setCommitResult(null);
    try {
      const r = await fetch('/api/editor/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ elementHTML: selected?.outerHTML, fileContent, filePath: selectedFile, prompt }),
      });
      const data = await r.json();
      if (data.modifiedCode) {
        setGeneratedCode(data.modifiedCode);
        setDiffLines(computeDiff(fileContent, data.modifiedCode));
      } else {
        setCommitResult({ error: data.error ?? 'AI 생성 실패' });
      }
    } catch {
      setCommitResult({ error: '네트워크 오류' });
    } finally { setGenerating(false); }
  };

  const handleCommit = async () => {
    if (!generatedCode || !selectedFile) return;
    setCommitting(true);
    setCommitResult(null);
    try {
      const r = await fetch('/api/editor/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: selectedFile, content: generatedCode, message: `feat: AI 편집기 — ${prompt.slice(0, 60)}` }),
      });
      const data = await r.json();
      if (data.commitUrl) {
        setCommitResult({ url: data.commitUrl });
        // Refresh iframe
        if (iframeRef.current) iframeRef.current.src = iframeRef.current.src;
        setGeneratedCode(null);
        setDiffLines([]);
        setSelected(null);
        setPrompt('');
      } else {
        setCommitResult({ error: data.error ?? '커밋 실패' });
      }
    } catch {
      setCommitResult({ error: '네트워크 오류' });
    } finally { setCommitting(false); }
  };

  const filteredFiles = fileSearch
    ? files.filter(f => f.toLowerCase().includes(fileSearch.toLowerCase()))
    : files;

  const diffStats = diffLines.reduce((acc, l) => {
    if (l.type === 'add') acc.added++;
    else if (l.type === 'remove') acc.removed++;
    return acc;
  }, { added: 0, removed: 0 });

  return (
    <div className="h-full flex gap-0 overflow-hidden rounded-xl border border-[#d0d7de] dark:border-[#30363d]">

      {/* ── Left: iframe ── */}
      <div className={`relative flex flex-col border-r border-[#d0d7de] dark:border-[#30363d] bg-white transition-all ${iframeExpanded ? 'flex-1' : 'w-[58%]'}`}>
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-3 py-2 bg-[#f6f8fa] dark:bg-[#161b22] border-b border-[#d0d7de] dark:border-[#30363d] shrink-0">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ef4444]"/>
            <div className="w-3 h-3 rounded-full bg-[#f59e0b]"/>
            <div className="w-3 h-3 rounded-full bg-[#22c55e]"/>
          </div>
          <div className="flex-1 px-3 py-1 bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-md text-xs text-[#57606a] dark:text-[#8b949e] font-mono truncate">
            {APP_URL || 'http://localhost:3000'}
          </div>
          <button onClick={() => { if (iframeRef.current) iframeRef.current.src = iframeRef.current.src; setIframeReady(false); }}
            className="p-1 text-[#57606a] hover:text-[#24292f] dark:text-[#8b949e] dark:hover:text-[#e6edf3]" title="새로고침">
            <RotateCcw size={13}/>
          </button>
          {!pickerActive ? (
            <button onClick={injectPicker} disabled={!iframeReady}
              className="flex items-center gap-1 px-2 py-1 bg-[#0969da] text-white text-xs rounded hover:bg-[#0860ca] disabled:opacity-40">
              <MousePointer2 size={12}/> 요소 선택 시작
            </button>
          ) : (
            <span className="flex items-center gap-1 px-2 py-1 bg-[#1a7f37] text-white text-xs rounded">
              <MousePointer2 size={12}/> 선택 중…
            </span>
          )}
          <button onClick={() => setIframeExpanded(v => !v)}
            className="p-1 text-[#57606a] hover:text-[#24292f] dark:text-[#8b949e] dark:hover:text-[#e6edf3]">
            {iframeExpanded ? <Minimize2 size={13}/> : <Maximize2 size={13}/>}
          </button>
        </div>

        {/* iframe */}
        <div className="relative flex-1 overflow-hidden">
          {!iframeReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-[#0d1117] z-10">
              <Loader2 size={24} className="animate-spin text-[#57606a]"/>
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={APP_URL || '/app'}
            onLoad={handleIframeLoad}
            className="w-full h-full border-0"
            title="사이트 미리보기"
          />
        </div>
      </div>

      {/* ── Right: Edit Panel ── */}
      {!iframeExpanded && (
        <div className="w-[42%] flex flex-col bg-[#f6f8fa] dark:bg-[#0d1117] overflow-y-auto">

          {/* Selected element */}
          <div className="p-4 border-b border-[#d0d7de] dark:border-[#30363d]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#57606a] dark:text-[#8b949e] uppercase tracking-wider flex items-center gap-1.5">
                <MousePointer2 size={12}/> 선택된 요소
              </span>
              {selected && (
                <button onClick={resetSelection} className="text-[#8c959f] hover:text-red-500 transition-colors">
                  <X size={14}/>
                </button>
              )}
            </div>
            {selected ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-[#0969da] text-white text-[10px] font-mono rounded">{selected.tagName.toLowerCase()}</span>
                  {selected.classes && (
                    <span className="text-[10px] text-[#57606a] dark:text-[#8b949e] font-mono truncate">.{selected.classes.split(' ').filter(Boolean).slice(0, 4).join('.')}</span>
                  )}
                </div>
                <div className="text-[10px] text-[#8c959f] font-mono bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded p-2 max-h-20 overflow-y-auto whitespace-pre-wrap break-all">
                  {selected.outerHTML.slice(0, 300)}{selected.outerHTML.length > 300 ? '…' : ''}
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#8c959f]">
                {pickerActive ? '← iframe에서 수정할 요소를 클릭하세요' : '"요소 선택 시작" 버튼을 눌러주세요'}
              </p>
            )}
          </div>

          {/* File selector */}
          <div className="p-4 border-b border-[#d0d7de] dark:border-[#30363d]">
            <label className="block text-xs font-semibold text-[#57606a] dark:text-[#8b949e] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Code2 size={12}/> 수정할 파일
            </label>
            <input value={fileSearch} onChange={e => setFileSearch(e.target.value)} placeholder="파일 검색..."
              className="w-full px-3 py-1.5 mb-2 text-xs bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-[#24292f] dark:text-[#e6edf3] placeholder-[#8c959f] focus:outline-none focus:ring-1 focus:ring-[#0969da]"/>
            <div className="relative">
              <select value={selectedFile} onChange={e => setSelectedFile(e.target.value)}
                className="w-full appearance-none px-3 py-2 pr-8 text-xs bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-[#24292f] dark:text-[#e6edf3] focus:outline-none focus:ring-1 focus:ring-[#0969da] cursor-pointer">
                <option value="">파일 선택...</option>
                {filteredFiles.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#57606a] pointer-events-none"/>
            </div>
            {loadingFile && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-[#57606a]">
                <Loader2 size={11} className="animate-spin"/> 파일 로드 중...
              </div>
            )}
            {fileContent && !loadingFile && (
              <p className="mt-1.5 text-[10px] text-[#8c959f]">{fileContent.split('\n').length}줄 로드됨</p>
            )}
          </div>

          {/* Prompt */}
          <div className="p-4 border-b border-[#d0d7de] dark:border-[#30363d]">
            <label className="block text-xs font-semibold text-[#57606a] dark:text-[#8b949e] uppercase tracking-wider mb-2">
              수정 요청
            </label>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
              placeholder="예: 헤더 배경색을 짙은 남색으로 변경하고 글자 크기를 키워줘"
              rows={4}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-[#24292f] dark:text-[#e6edf3] placeholder-[#8c959f] focus:outline-none focus:ring-1 focus:ring-[#0969da] resize-none"/>
            <button onClick={handleGenerate}
              disabled={generating || !prompt.trim() || !fileContent}
              className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#0969da] text-white text-sm font-medium rounded-lg hover:bg-[#0860ca] disabled:opacity-40 transition-colors">
              {generating ? <><Loader2 size={14} className="animate-spin"/> AI 생성 중...</> : '✨ AI 수정 코드 생성'}
            </button>
          </div>

          {/* Diff preview */}
          {diffLines.length > 0 && (
            <div className="p-4 border-b border-[#d0d7de] dark:border-[#30363d]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#57606a] dark:text-[#8b949e] uppercase tracking-wider">
                  변경 미리보기
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-green-600 dark:text-green-400 font-mono">+{diffStats.added}</span>
                  <span className="text-[10px] text-red-600 dark:text-red-400 font-mono">-{diffStats.removed}</span>
                  <button onClick={() => setShowDiffOnly(v => !v)} className="text-[10px] text-[#0969da] hover:underline">
                    {showDiffOnly ? '전체 보기' : '변경만'}
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-[#d0d7de] dark:border-[#30363d] overflow-hidden font-mono text-[11px] max-h-72 overflow-y-auto">
                {(showDiffOnly ? diffLines.filter(l => l.type !== 'same') : diffLines).map((line, idx) => (
                  <div key={idx}
                    className={`flex px-2 py-0.5 leading-5 whitespace-pre ${
                      line.type === 'add' ? 'bg-[#dafbe1] dark:bg-[#1a4a29] text-[#1a7f37] dark:text-[#56d364]' :
                      line.type === 'remove' ? 'bg-[#ffebe9] dark:bg-[#4a1a1a] text-[#cf222e] dark:text-[#ff7b72]' :
                      'bg-white dark:bg-[#0d1117] text-[#57606a] dark:text-[#8b949e]'
                    }`}>
                    <span className="w-6 shrink-0 text-right mr-3 opacity-50 select-none">{line.lineNo}</span>
                    <span className="shrink-0 mr-2 select-none">{line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}</span>
                    <span className="break-all">{line.content}</span>
                  </div>
                ))}
              </div>

              {/* Commit actions */}
              <div className="flex gap-2 mt-3">
                <button onClick={() => { setGeneratedCode(null); setDiffLines([]); }}
                  className="flex-1 px-3 py-2 border border-[#d0d7de] dark:border-[#30363d] text-[#57606a] dark:text-[#8b949e] text-sm rounded-lg hover:bg-[#f6f8fa] dark:hover:bg-[#161b22] transition-colors">
                  취소
                </button>
                <button onClick={handleCommit} disabled={committing}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#1a7f37] text-white text-sm font-medium rounded-lg hover:bg-[#1a6b2e] disabled:opacity-40 transition-colors">
                  {committing ? <><Loader2 size={13} className="animate-spin"/> 커밋 중...</> : <><GitCommit size={13}/> 승인 & 커밋</>}
                </button>
              </div>
            </div>
          )}

          {/* Commit result */}
          {commitResult && (
            <div className="p-4">
              {commitResult.url ? (
                <div className="flex items-start gap-2 p-3 bg-[#dafbe1] dark:bg-[#1a4a29] border border-green-300 dark:border-green-800 rounded-lg">
                  <CheckCircle2 size={16} className="text-[#1a7f37] dark:text-[#56d364] mt-0.5 shrink-0"/>
                  <div>
                    <p className="text-sm font-medium text-[#1a7f37] dark:text-[#56d364]">커밋 완료!</p>
                    <a href={commitResult.url} target="_blank" rel="noreferrer"
                      className="text-xs text-[#0969da] hover:underline break-all">{commitResult.url}</a>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 p-3 bg-[#ffebe9] dark:bg-[#4a1a1a] border border-red-300 dark:border-red-800 rounded-lg">
                  <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0"/>
                  <p className="text-sm text-red-700 dark:text-red-400">{commitResult.error}</p>
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {!generating && !generatedCode && !commitResult && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <Code2 size={36} className="mx-auto text-[#d0d7de] dark:text-[#30363d] mb-3"/>
                <p className="text-sm text-[#57606a] dark:text-[#8b949e] font-medium">사이트 편집기</p>
                <p className="text-xs text-[#8c959f] mt-1">요소 선택 → 파일 지정 → 프롬프트 작성</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
