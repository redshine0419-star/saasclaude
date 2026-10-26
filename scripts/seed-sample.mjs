#!/usr/bin/env node
/**
 * 샘플 학원에 "실제로 운영 중인 학원"처럼 보이는 데이터를 한 번 채운다 (빌드 때 실행).
 * 대상: test2(직접 만든 테스트 학원), demo-warm·demo-result·demo-bright(첫등원 데모).
 *
 * - 대상 학원만 건드린다. 없으면 건너뛴다.
 * - 학원마다 platform_settings 표시가 있으면 다시 실행하지 않는다.
 * - 이미 입력된 값은 덮어쓰지 않는다 (비어 있는 칸·비어 있는 표만 채운다). 학생은 빠진 이름만 더 넣는다.
 * - 학부모·학생 번호는 모두 010-0000-xxxx(미할당 국번) — lib/messaging/send.ts가 실제 발송을 막는다.
 * - 자동 발송을 타지 않게: 테스트 예약 상담은 시간대(slot) 없이, 미등록 상담은 마케팅 동의 없이 만든다.
 * - 글·목록은 scripts/sample-content.mjs. 실패해도 빌드는 계속한다.
 */
import { randomBytes, createHmac } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { kidsContent, middleContent } from './sample-content.mjs';

const TARGETS = [
  // test2 v1: 학생 10명 / v2: 20명
  { slug: 'test2', marker: 'seed:test2:v2', kids: false },
  { slug: 'demo-warm', marker: 'seed:sample:demo-warm:v1', kids: false },
  { slug: 'demo-result', marker: 'seed:sample:demo-result:v1', kids: false },
  { slug: 'demo-bright', marker: 'seed:sample:demo-bright:v1', kids: true },
];

if (!process.env.DATABASE_URL) {
  console.log('[seed-sample] DATABASE_URL 없음 — 건너뜀');
  process.exit(0);
}
const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }) });

// ── 날짜 도우미 (KST 기준) ────────────────────────────────────
const KST = 9 * 3600 * 1000;
const NOW = new Date();
/** n일 전 KST hh:mm */
function at(daysAgo, hh = 15, mm = 0) {
  const k = new Date(NOW.getTime() + KST);
  const d = Date.UTC(k.getUTCFullYear(), k.getUTCMonth(), k.getUTCDate() - daysAgo, hh, mm) - KST;
  return new Date(d);
}
/** n일 전 날짜(UTC 자정, DB date 칼럼용) */
function day(daysAgo) {
  const k = new Date(NOW.getTime() + KST);
  return new Date(Date.UTC(k.getUTCFullYear(), k.getUTCMonth(), k.getUTCDate() - daysAgo));
}
const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토'];
const token = () => randomBytes(24).toString('base64url');
const phone = (n) => `010-0000-${String(n).padStart(4, '0')}`;
function hashPhone(p) {
  const secret = process.env.MESSAGING_SECRET;
  return secret ? createHmac('sha256', secret).update(p.replace(/\D/g, '')).digest('hex') : `seed-${p.replace(/\D/g, '')}`;
}
// 결정적 의사난수 (실행마다 같은 모양)
let seed = 20261027;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

async function seedAcademy({ slug, marker, kids }) {
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) return console.log(`[seed-sample] ${slug} 학원 없음 — 건너뜀`);
  if (await prisma.platformSetting.findUnique({ where: { key: marker } })) return console.log(`[seed-sample] ${slug} 이미 채움 — 건너뜀`);
  seed = 20261027; // 학원마다 같은 모양

  const T = tenant.id;
  const subjects = tenant.subjects || '수학';
  const english = /영어/.test(subjects) && !/수학/.test(subjects);
  const S = kids || english ? '영어' : '수학';
  const C = kids ? kidsContent() : middleContent(S, english);
  const owner = await prisma.membership.findFirst({ where: { tenantId: T, role: 'owner' }, include: { user: true } });
  const ownerEmail = owner?.user.email ?? 'owner@growweb.me';
  const ownerName = owner?.user.name ?? '원장';
  const count = async (model) => prisma[model].count({ where: { tenantId: T } });

  // ── 1. 학원 기본 정보 (빈 칸만) ──────────────────────────────
  const fill = {};
  if (!tenant.targetGrades) fill.targetGrades = C.targetGrades;
  if (!tenant.hours) fill.hours = '평일 14:00~22:00 / 토 10:00~17:00 (일·공휴일 휴무)';
  if (!tenant.locationHeadline) fill.locationHeadline = '역에서 걸어서 5분, 상가 3층';
  if (!tenant.transitInfo) fill.transitInfo = '지하철 2호선 3번 출구 도보 5분 · 마을버스 07번 정류장 앞';
  if (!tenant.parkingInfo) fill.parkingInfo = '건물 지하 주차장 30분 무료 (상담·픽업 시)';
  if (Object.keys(fill).length) await prisma.tenant.update({ where: { id: T }, data: fill });

  // ── 2. 홈페이지 섹션: 테마의 모든 섹션 켜기 ─────────────────
  const ORDER = {
    warm: ['hero', 'quick_info', 'director', 'principles', 'classes', 'timetable', 'fees', 'reviews', 'news', 'faq', 'consult_form', 'location'],
    result: ['hero', 'results_stats', 'exam_system', 'curriculum', 'score_cases', 'teachers', 'fees', 'faq', 'consult_form'],
    bright: ['hero', 'day_flow', 'classes', 'gallery', 'safety', 'reviews', 'faq', 'consult_form'],
  }[tenant.theme] ?? [];
  for (const [i, key] of ORDER.entries()) {
    await prisma.tenantSection.upsert({
      where: { tenantId_sectionKey: { tenantId: T, sectionKey: key } },
      create: { tenantId: T, sectionKey: key, enabled: true, sortOrder: i },
      update: { enabled: true },
    });
  }

  // 데모(가상 학원)에서만: 안심 항목 예시 — 실제 학원은 원장이 입력한 항목만 보인다 (lib/section-copy.ts)
  if (slug.startsWith('demo-') && tenant.theme === 'bright' && !tenant.sectionCopy) {
    await prisma.tenant.update({ where: { id: T }, data: { sectionCopy: { safety: { items: [
      { title: '셔틀 동승 선생님', body: '모든 노선 동승' },
      { title: '교실 CCTV', body: '녹화 운영' },
      { title: '선생님 자격', body: '성범죄 경력 조회 완료' },
    ] } } } });
  }

  // ── 3. 원장·원칙·시설·강사 ──────────────────────────────────
  if (!(await prisma.directorProfile.findUnique({ where: { tenantId: T } }))) {
    await prisma.directorProfile.create({
      data: { tenantId: T, ...C.director },
    });
  }
  if ((await count('teachingPrinciple')) === 0) {
    const ps = C.principles;
    await prisma.teachingPrinciple.createMany({ data: ps.map(([number, title, description], i) => ({ tenantId: T, number, title, description, sortOrder: i })) });
  }
  if ((await count('facility')) === 0) {
    await prisma.facility.createMany({ data: C.facilities.map((label, i) => ({ tenantId: T, label, sortOrder: i })) });
  }
  if ((await count('staffProfile')) === 0) {
    await prisma.staffProfile.createMany({
      data: C.staff.map((s, i) => ({ ...s, tenantId: T, sortOrder: i })),
    });
  }

  // ── 4. 수업·교습비·추가 비용·환불 규정 ────────────────────────
  let classes = await prisma.classItem.findMany({ where: { tenantId: T }, orderBy: { sortOrder: 'asc' } });
  if (classes.length === 0) {
    const CL = C.classes;
    for (const [i, c] of CL.entries()) await prisma.classItem.create({ data: { ...c, tenantId: T, sortOrder: i } });
    classes = await prisma.classItem.findMany({ where: { tenantId: T }, orderBy: { sortOrder: 'asc' } });
  }
  if ((await count('fee')) === 0) {
    const amounts = C.feeAmounts;
    await prisma.fee.createMany({
      data: classes.slice(0, 4).map((c, i) => ({ tenantId: T, classId: c.id, label: c.name, sessionsPerWeek: c.days.length, monthlyHours: c.days.length * 7, amount: amounts[i] ?? 320000, note: '교재비 별도' })),
    });
  }
  if ((await count('extraCost')) === 0) {
    await prisma.extraCost.createMany({ data: C.extraCosts.map((x) => ({ ...x, tenantId: T })) });
  }
  if (!(await prisma.refundPolicyText.findUnique({ where: { tenantId: T } }))) {
    await prisma.refundPolicyText.create({ data: { tenantId: T, body: '수업 시작 전: 이미 낸 교습비 전액\n총 교습시간 1/3 지나기 전: 2/3 환불\n총 교습시간 1/2 지나기 전: 1/2 환불\n총 교습시간 1/2 지난 후: 환불 없음' } });
  }

  // ── 5. 레벨테스트 시간·셔틀·FAQ ─────────────────────────────
  if ((await prisma.levelTestSlot.count({ where: { tenantId: T } })) === 0) {
    await prisma.levelTestSlot.createMany({ data: [
      { tenantId: T, weekday: 2, time: '15:00', capacity: 3 },
      { tenantId: T, weekday: 4, time: '15:00', capacity: 3 },
      { tenantId: T, weekday: 6, time: '11:00', capacity: 4 },
    ] });
  }
  if ((await count('shuttleStop')) === 0) {
    await prisma.shuttleStop.createMany({ data: C.shuttle.map(([stop, pickup, dropoff], i) => ({ tenantId: T, stop, pickup, dropoff, sortOrder: i })) });
  }
  if ((await count('faqItem')) === 0) {
    const fq = C.faq;
    await prisma.faqItem.createMany({ data: fq.map(([question, answer], i) => ({ tenantId: T, question, answer, sortOrder: i })) });
  }

  // ── 6. 소식·후기·성과 ───────────────────────────────────────
  if ((await count('post')) === 0) {
    const posts = C.posts(at);
    for (const p of posts) await prisma.post.create({ data: { tenantId: T, status: p.status ?? 'published', images: [], ...p } });
  }
  if ((await count('review')) === 0) {
    const rv = C.reviews;
    await prisma.review.createMany({ data: rv.map((r, i) => ({ tenantId: T, consentConfirmed: true, visible: true, createdAt: at(60 - i * 7), ...r })) });
  }
  if ((await count('resultStat')) === 0) {
    await prisma.resultStat.create({ data: { tenantId: T, published: true, ...C.resultStat } });
  }

  // ── 7. 문제은행·시험지 ─────────────────────────────────────
  let test = await prisma.test.findFirst({ where: { tenantId: T } });
  let qs = await prisma.question.findMany({ where: { tenantId: T } });
  if (qs.length === 0) {
    const grade = C.questionGrade;
    for (const q of C.questions) {
      await prisma.question.create({ data: { tenantId: T, subject: S, grade, points: q.points ?? (q.difficulty >= 4 ? 3 : 2), choices: q.choices ?? undefined, explanation: q.explanation ?? null, type: q.type, unit: q.unit, difficulty: q.difficulty, body: q.body, answers: q.answers } });
    }
    qs = await prisma.question.findMany({ where: { tenantId: T }, orderBy: { createdAt: 'asc' } });
  }
  if (!test && qs.length) {
    test = await prisma.test.create({ data: {
      tenantId: T, ...C.test,
      items: { create: qs.map((q, i) => ({ questionId: q.id, sortOrder: i, points: q.points })) },
    } });
  }
  const items = test ? await prisma.testItem.findMany({ where: { testId: test.id }, include: { question: true }, orderBy: { sortOrder: 'asc' } }) : [];

  // ── 8. 상담(리드)·상담 이력·동의·응시 ────────────────────────
  const LEADS = C.leads;
  const leadByName = {};
  if ((await count('lead')) === 0) {
    for (const [i, [parentName, studentGrade, school, consultType, status, ago, message, marketing, source]] of LEADS.entries()) {
      const createdAt = at(ago, 10 + (i % 8), (i * 7) % 60);
      const changed = at(Math.max(0, ago - 2), 18);
      const lead = await prisma.lead.create({ data: {
        tenantId: T, parentName, phone: phone(1001 + i), studentGrade, school, consultType, status, createdAt,
        statusChangedAt: status === 'new' ? createdAt : changed, message: message || null, source, utm: { source, medium: source === 'naver' ? 'organic' : 'social' },
        notEnrolledReason: status === 'not_enrolled' ? '시간' : null,
        testAt: status === 'test_booked' ? at(-3, 11) : null, // slot 없이 — 전날 알림 대상 아님
      } });
      leadByName[parentName] = lead;
      const ev = [{ leadId: lead.id, type: 'created', createdAt, payload: { consultType } }];
      if (status !== 'new') ev.push({ leadId: lead.id, type: 'call', createdAt: at(Math.max(0, ago - 1), 16), payload: { note: '첫 통화 — 아이 상황·희망 시간 확인' } });
      if (status !== 'new' && status !== 'contacted') ev.push({ leadId: lead.id, type: 'status_changed', createdAt: changed, payload: { from: 'contacted', to: status } });
      await prisma.leadEvent.createMany({ data: ev });
      await prisma.consent.create({ data: { tenantId: T, leadId: lead.id, type: 'privacy', grantedAt: createdAt, channel: 'web' } });
      // 미등록 상담은 마케팅 동의 없이 — 후속 메시지 자동 발송 대상이 되지 않게
      if (marketing && status !== 'not_enrolled') await prisma.consent.create({ data: { tenantId: T, leadId: lead.id, type: 'marketing', grantedAt: createdAt, channel: 'web' } });
      // 접수 안내 발송 기록 (이미 보낸 것으로만 — 대기 중인 발송은 만들지 않는다)
      await prisma.message.create({ data: { tenantId: T, leadId: lead.id, scenario: 'receipt', kind: 'info', channel: 'alimtalk', recipientHash: hashPhone(phone(1001 + i)), status: 'sent', sentAt: new Date(createdAt.getTime() + 60000), cost: 9, createdAt } });
    }
  } else {
    for (const l of await prisma.lead.findMany({ where: { tenantId: T } })) leadByName[l.parentName] = l;
  }

  // 레벨테스트 응시 (제출·채점 완료)
  const ATTEMPTS = C.attempts;
  if (test && items.length && (await prisma.testAttempt.count({ where: { tenantId: T } })) === 0) {
    for (const [name, skill, ago] of ATTEMPTS) {
      const lead = leadByName[name];
      if (!lead) continue;
      let score = 0;
      const max = items.reduce((t, it) => t + it.points, 0);
      const responses = items.map((it) => {
        const q = it.question;
        const ok = rand() < skill + (3 - q.difficulty) * 0.08;
        if (q.type === 'essay') {
          const pts = ok ? it.points : Math.max(1, Math.round(it.points * 0.5));
          score += pts;
          return { questionId: q.id, answer: C.essay.answer, correct: pts === it.points, points: pts, feedback: ok ? C.essay.good : C.essay.bad, errorType: ok ? null : C.essay.errorType, gradedBy: ownerEmail };
        }
        if (ok) score += it.points;
        const answer = q.type === 'choice' ? (ok ? q.answers[0] : String(((Number(q.answers[0]) % 5) + 1))) : ok ? q.answers[0] : kids ? 'apel' : '7';
        return { questionId: q.id, answer, correct: ok, points: ok ? it.points : 0 };
      });
      const started = at(ago, 15, 0);
      await prisma.testAttempt.create({ data: {
        tenantId: T, testId: test.id, leadId: lead.id, token: token(), status: 'submitted', startedAt: started, submittedAt: new Date(started.getTime() + 34 * 60000),
        score, maxScore: max, needsGrading: false, gradedAt: new Date(started.getTime() + 3 * 3600000), issuedBy: ownerEmail, createdAt: new Date(started.getTime() - 3600000),
        responses: { create: responses.map((r) => ({ ...r, tenantId: T })) },
      } });
    }
  }

  // ── 9. 학생부·성적·메모·출결 ────────────────────────────────
  {
    const existing = await prisma.student.findMany({ where: { tenantId: T }, select: { name: true, leadId: true } });
    const existingNames = new Set(existing.map((x) => x.name));
    const linkedLeads = new Set(existing.map((x) => x.leadId).filter(Boolean));
    const cls = (grade) => classes.find((c) => c.gradeBand === C.classFor(grade)) ?? null;
    const STU = C.students;
    const SUBJECTS_SCORE = C.scoreSubjects;
    for (const [k, [name, grade, school, parentName, leadName, skill, traits, summary, enrolledAgo]] of STU.entries()) {
      if (existingNames.has(name)) continue;
      const found = leadName ? leadByName[leadName] : null;
      const lead = found && !linkedLeads.has(found.id) ? found : null;
      const c = cls(grade);
      const st = await prisma.student.create({ data: {
        tenantId: T, name, grade, school, classId: c?.id ?? null, status: 'active', enrolledAt: day(enrolledAgo),
        parentName, parentPhone: lead?.phone ?? phone(2001 + k), studentPhone: k % 3 === 0 ? phone(3001 + k) : null,
        traits, summary, leadId: lead?.id ?? null, createdBy: ownerEmail,
        consentAt: day(enrolledAgo), consentMethod: k % 4 === 3 ? 'electronic' : 'written',
      } });
      // 성적: 학교 내신(1학기 중간·기말, 2학기 중간) + 학원 단원평가(매달)
      const scores = [];
      const sp = (base) => Math.max(35, Math.min(100, Math.round(base * 100 + (rand() - 0.5) * 14)));
      if (C.hasSchoolExams(grade)) {
        const exams = [['1학기 중간고사', 182], ['1학기 기말고사', 118], ['2학기 중간고사', 12]];
        for (const [label, ago] of exams) {
          if (ago > enrolledAgo + 200) continue;
          for (const sub of SUBJECTS_SCORE) {
            const growth = ago < enrolledAgo ? (enrolledAgo - ago) / 400 : 0;
            const score = sp(skill + growth - (sub === S ? 0 : -0.03));
            scores.push({ kind: 'school', examDate: day(ago), label, subject: sub, score, maxScore: 100, rankGrade: score >= 90 ? 1 : score >= 80 ? 2 : score >= 70 ? 3 : 4 });
          }
        }
      }
      for (const [m, ago] of [[0, Math.min(enrolledAgo - 7, 150)], [1, Math.min(enrolledAgo - 7, 90)], [2, Math.min(enrolledAgo - 7, 60)], [3, 32], [4, 4]]) {
        if (ago < 0 || ago > enrolledAgo) continue;
        scores.push({ kind: 'academy', examDate: day(ago), label: C.academyTestLabel(m), subject: S, score: sp(skill + m * 0.02), maxScore: 100, rankGrade: null, memo: m === 4 && skill < 0.65 ? C.academyMemo : null });
      }
      const mock = C.mockFor(grade);
      if (mock) scores.push({ kind: 'mock', examDate: day(20), label: mock, subject: S, score: sp(skill - 0.05), maxScore: 100, rankGrade: skill > 0.78 ? 2 : 3, percentile: Math.round(skill * 100) });
      if (scores.length) await prisma.studentScore.createMany({ data: scores.map((x) => ({ ...x, tenantId: T, studentId: st.id, createdBy: ownerEmail })) });

      // 관찰 메모
      const NOTES = C.notes(traits);
      const n = 1 + (k % 4);
      await prisma.studentNote.createMany({ data: NOTES.slice(0, n).map(([kind, body, ago]) => ({ tenantId: T, studentId: st.id, kind, body, authorEmail: ownerEmail, authorName: ownerName, createdAt: at(ago + (k * 3) % 9, 21) })) });

      // 최근 6주 출결 (반 수업 요일만)
      if (c) {
        const att = [];
        for (let ago = 41; ago >= 0; ago--) {
          const d = day(ago);
          if (!c.days.includes(WEEKDAY[d.getUTCDay()]) || ago > enrolledAgo) continue;
          const r = rand();
          const status = r < 0.86 ? 'present' : r < 0.93 ? 'late' : r < 0.97 ? 'absent' : 'excused';
          att.push({ tenantId: T, studentId: st.id, date: d, status, note: status === 'late' ? pick(C.lateNotes) : status === 'absent' ? '병결' : status === 'excused' ? '가족 행사' : null, checkedBy: ownerEmail });
        }
        if (att.length) await prisma.attendance.createMany({ data: att, skipDuplicates: true });
      }

      // 첫 학생에게는 지난달 학부모 리포트 1건
      if (k === 0) {
        const start = day(35), end = day(5);
        const scs = await prisma.studentScore.findMany({ where: { studentId: st.id, examDate: { gte: start, lte: end } }, orderBy: { examDate: 'asc' } });
        const ats = await prisma.attendance.findMany({ where: { studentId: st.id, date: { gte: start, lte: end } } });
        const counts = { present: 0, late: 0, absent: 0, excused: 0 };
        for (const a of ats) counts[a.status]++;
        const comment = C.reportComment(name.slice(1));
        await prisma.studentReport.create({ data: {
          tenantId: T, studentId: st.id, token: token(), periodStart: start, periodEnd: end, comment, createdBy: ownerEmail,
          expiresAt: new Date(NOW.getTime() + 25 * 86400000), viewCount: 3, lastViewedAt: at(2, 21), createdAt: at(5, 20),
          snapshot: {
            v: 1,
            academy: { name: tenant.name, slug: tenant.slug, phone: tenant.phone, kakaoChannelUrl: tenant.kakaoChannelUrl },
            student: { name, grade, className: c?.name ?? null },
            period: { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) },
            scores: scs.map((s) => ({ examDate: s.examDate.toISOString().slice(0, 10), kind: s.kind, label: s.label, subject: s.subject, score: s.score, maxScore: s.maxScore, rankGrade: s.rankGrade })),
            attendance: { total: ats.length, counts, rate: ats.length ? Math.round(((counts.present + counts.late) / ats.length) * 100) : null },
            comment,
          },
        } });
      }
    }
  }

  await prisma.platformSetting.create({ data: { key: marker, value: NOW.toISOString() } });
  console.log(`[seed-sample] ${slug} 샘플 데이터 채움 완료`);
}

async function main() {
  for (const t of TARGETS) {
    try {
      await seedAcademy(t);
    } catch (e) {
      console.error(`[seed-sample] ${t.slug} 실패 (빌드는 계속):`, e instanceof Error ? e.message : e);
    }
  }
}

main().finally(() => prisma.$disconnect());
