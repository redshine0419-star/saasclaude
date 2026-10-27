/** 직원 초대 메일 (Resend 어댑터로 발송 — lib/mail/send.ts) */

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function renderInviteMail({ academyName, inviteUrl, expiresAt }: { academyName: string; inviteUrl: string; expiresAt: Date }) {
  const until = new Date(expiresAt.getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10).replace(/-/g, '.');
  const subject = `[첫등원] ${academyName} 관리자 초대`;
  const text = [
    `${academyName}에서 학원 관리자(직원)로 초대했습니다.`,
    '',
    `아래 링크를 눌러 이 메일 주소의 Google 계정으로 로그인하면 바로 관리자 화면을 쓸 수 있습니다. (${until}까지 유효)`,
    inviteUrl,
    '',
    '초대를 요청한 적이 없다면 이 메일을 무시해 주세요.',
  ].join('\n');
  const html =
    `<div style="font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:#1B2430;max-width:520px;line-height:1.7">` +
    `<h2 style="font-size:18px;margin:0 0 12px">${esc(academyName)} 관리자 초대</h2>` +
    `<p style="margin:0 0 16px">${esc(academyName)}에서 학원 관리자(직원)로 초대했습니다. 아래 버튼을 눌러 <b>이 메일 주소의 Google 계정</b>으로 로그인하면 바로 관리자 화면을 쓸 수 있습니다.</p>` +
    `<p style="margin:0 0 16px"><a href="${esc(inviteUrl)}" style="display:inline-block;padding:12px 20px;background:#1E5645;color:#FFFFFF;border-radius:8px;text-decoration:none;font-weight:700">초대 수락하기</a></p>` +
    `<p style="margin:0;font-size:13px;color:#5A6270">${until}까지 유효합니다. 초대를 요청한 적이 없다면 이 메일을 무시해 주세요.</p>` +
    `</div>`;
  return { subject, html, text };
}
