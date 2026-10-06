'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { FdHeader } from '@/components/fd/FdHeader';
import { FdFooter } from '@/components/fd/FdFooter';

export default function ApplyDonePage() {
  const searchParams = useSearchParams();
  const applicationId = searchParams.get('id');
  const queueOrder = searchParams.get('queue');

  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload() {
    if (!applicationId || files.length === 0) return;
    setUploading(true);
    setUploadError('');
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append('files', f));
      const res = await fetch(`/api/apply/${applicationId}/upload`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { setUploadError(data.error ?? '업로드 오류가 발생했습니다.'); return; }
      setUploadDone(true);
      setFiles([]);
    } catch {
      setUploadError('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div data-theme="fd" style={{ fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo','Malgun Gothic',sans-serif", background: '#FFFFFF', color: '#14213D' }}>
      <FdHeader />
      <section style={{ padding: 'clamp(80px, 10vw, 140px) clamp(20px, 4vw, 56px)', display: 'flex', justifyContent: 'center' }}>
        <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: 36, background: '#FFF3CC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#5C4300" strokeWidth="2.5">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h1 style={{ margin: 0, fontSize: 34, fontWeight: 700, letterSpacing: '-0.5px' }}>신청이 완료됐습니다</h1>
          {queueOrder && (
            <div style={{ padding: '12px 24px', borderRadius: 10, background: '#FFF3CC', fontSize: 15, fontWeight: 600, color: '#5C4300' }}>
              대기 순번 {queueOrder}번째
            </div>
          )}
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.75, color: '#4A5568' }}>
            영업일 기준 2일 이내 담당자가 직접 연락드리겠습니다.<br />
            신청해 주셔서 감사합니다.
          </p>

          {/* Next steps */}
          <div style={{ padding: '20px 28px', borderRadius: 14, background: '#F3F5F8', textAlign: 'left', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>다음 단계</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 15, lineHeight: 1.6, color: '#3C4659' }}>
              <div>1. 담당자가 연락 후 제작 시작</div>
              <div>2. 아래에서 학원 자료 제출 <span style={{ fontSize: 13, color: '#8A93A8' }}>(신청일로부터 2주 이내)</span></div>
              <div>3. 시안 확인 후 오픈</div>
            </div>
          </div>

          {/* File upload section */}
          {applicationId && (
            <div style={{ width: '100%', padding: '24px 28px', borderRadius: 16, border: '1px solid #CDD3DD', textAlign: 'left', boxSizing: 'border-box' }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>학원 자료 제출</div>
              <div style={{ fontSize: 14, color: '#5A6270', marginBottom: 16, lineHeight: 1.6 }}>
                학원 소개 자료, 사진, 교사 프로필 등 제작에 필요한 파일을 올려주세요.<br />
                파일 최대 10개, 각 20MB 이내. 나중에 이 페이지에서 다시 제출할 수 있습니다.
              </div>

              {uploadDone ? (
                <div style={{ padding: '14px 18px', borderRadius: 10, background: '#D8E8E0', color: '#1E5645', fontSize: 14, fontWeight: 600 }}>
                  자료를 제출했습니다. 담당자가 검토 후 연락드리겠습니다.
                </div>
              ) : (
                <>
                  <div
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const dropped = Array.from(e.dataTransfer.files);
                      setFiles((prev) => [...prev, ...dropped].slice(0, 10));
                    }}
                    style={{ border: '2px dashed #CDD3DD', borderRadius: 12, padding: '28px 20px', textAlign: 'center', cursor: 'pointer', background: files.length > 0 ? '#F7F9FF' : '#FAFBFC', marginBottom: 12 }}
                  >
                    <input
                      ref={inputRef}
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.hwp,.pptx,.xlsx"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const selected = Array.from(e.target.files ?? []);
                        setFiles((prev) => [...prev, ...selected].slice(0, 10));
                      }}
                    />
                    <div style={{ fontSize: 15, color: '#5A6270' }}>
                      클릭하거나 파일을 드래그해서 올려주세요
                    </div>
                    <div style={{ fontSize: 13, color: '#9AA3AF', marginTop: 6 }}>
                      이미지, PDF, Word, 한글, PPT, Excel 지원
                    </div>
                  </div>

                  {files.length > 0 && (
                    <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {files.map((f, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 8, background: '#F3F5F8', fontSize: 14 }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{f.name}</span>
                          <button
                            type="button"
                            onClick={() => setFiles((p) => p.filter((_, j) => j !== i))}
                            style={{ background: 'none', border: 'none', color: '#8A3A1C', cursor: 'pointer', fontSize: 16, flexShrink: 0, marginLeft: 8 }}
                          >×</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {uploadError && <p style={{ margin: '0 0 10px', color: '#8A3A1C', fontSize: 14 }}>{uploadError}</p>}

                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={files.length === 0 || uploading}
                    style={{ width: '100%', height: 48, borderRadius: 10, border: 'none', background: files.length > 0 ? '#14213D' : '#C9CFDA', color: '#FFFFFF', fontSize: 15, fontWeight: 700, cursor: files.length > 0 ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}
                  >
                    {uploading ? '업로드 중...' : `파일 제출 (${files.length}개)`}
                  </button>
                </>
              )}
            </div>
          )}

          <Link href="/" style={{ height: 52, padding: '0 28px', borderRadius: 12, background: '#14213D', color: '#FFFFFF', textDecoration: 'none', fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
            홈으로 돌아가기
          </Link>
        </div>
      </section>
      <FdFooter />
    </div>
  );
}
