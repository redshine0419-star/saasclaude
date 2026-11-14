import { ga4Status } from '@/lib/analytics';

/** GA4 연결 점검 — 측정 ID 환경변수 상태와 확인 방법 */
export function Ga4StatusCard() {
  const st = ga4Status();
  const color = st.state === 'ok' ? { bg: '#E3F1EA', fg: '#1E5645', text: '연결됨' } : { bg: '#FDECEC', fg: '#B91C1C', text: st.state === 'missing' ? '측정 ID 없음' : '측정 ID 형식 오류' };
  return (
    <section style={{ background: '#FFFFFF', borderRadius: 12, padding: 20, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>GA4 방문 분석</div>
        <span style={{ padding: '2px 10px', borderRadius: 999, background: color.bg, color: color.fg, fontSize: 12, fontWeight: 700 }}>{color.text}</span>
        {st.id && <code style={{ fontSize: 13, color: '#3A4556' }}>{st.id}</code>}
      </div>
      <div style={{ fontSize: 14, color: '#3A4556', lineHeight: 1.6 }}>{st.hint}</div>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#5A6270', lineHeight: 1.7 }}>
        <li>관리자·플랫폼·로그인 화면은 일부러 보내지 않습니다. 확인은 growweb.me, 블로그, 학원 홈페이지에서 해 주세요.</li>
        <li>GA4 › 보고서 › <b>실시간</b>에서 바로 보입니다. 일반 보고서는 하루 정도 늦게 쌓입니다.</li>
        <li>광고 차단 앱·브라우저(브레이브, 사파리 차단 확장 등)에서는 잡히지 않습니다.</li>
        <li>환경변수를 넣거나 바꾼 뒤에는 반드시 다시 배포해야 반영됩니다.</li>
      </ul>
    </section>
  );
}
