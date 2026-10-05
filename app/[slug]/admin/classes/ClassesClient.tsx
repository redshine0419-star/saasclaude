'use client';

import { useState } from 'react';

interface ClassItem {
  id: string;
  name: string;
  gradeBand: string | null;
  days: string[];
  startTime: string | null;
  endTime: string | null;
  capacity: number | null;
  seatsLeft: number | null;
  waitlistCount: number;
  textbook: string | null;
  description: string | null;
}

interface LevelTestSlot {
  id: string;
  weekday: number | null;
  time: string | null;
  active: boolean;
}

interface Props {
  slug: string;
  classes: ClassItem[];
  levelTestSlots: LevelTestSlot[];
}

const WEEKDAYS = ['월', '화', '수', '목', '금', '토'];

function formatTime(start: string | null, end: string | null) {
  if (!start) return '–';
  if (!end) return start;
  return `${start}–${end}`;
}

export function ClassesClient({ slug, classes: initialClasses, levelTestSlots: initialSlots }: Props) {
  const [classes, setClasses] = useState(initialClasses);
  const [slots, setSlots] = useState(initialSlots.filter((s) => s.active));
  const [selectedId, setSelectedId] = useState<string | null>(initialClasses[0]?.id ?? null);
  const [form, setForm] = useState<Partial<ClassItem>>({});
  const [saving, setSaving] = useState(false);
  const [seatsLoading, setSeatsLoading] = useState<string | null>(null);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [newSlot, setNewSlot] = useState({ weekday: 0, time: '' });

  const selected = classes.find((c) => c.id === selectedId) ?? null;

  function fieldVal<K extends keyof ClassItem>(key: K): ClassItem[K] {
    return (form[key] as ClassItem[K]) ?? (selected?.[key] as ClassItem[K]);
  }

  async function adjustSeats(classId: string, delta: number) {
    setSeatsLoading(classId);
    try {
      const res = await fetch(`/api/${slug}/admin/classes/${classId}/seats`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta }),
      });
      if (res.ok) {
        const data = await res.json();
        setClasses((prev) =>
          prev.map((c) => (c.id === classId ? { ...c, seatsLeft: data.seatsLeft } : c)),
        );
      }
    } finally {
      setSeatsLoading(null);
    }
  }

  async function saveClass() {
    if (!selectedId) return;
    setSaving(true);
    try {
      const payload = {
        name: fieldVal('name'),
        gradeBand: fieldVal('gradeBand'),
        days: fieldVal('days'),
        startTime: fieldVal('startTime'),
        endTime: fieldVal('endTime'),
        capacity: fieldVal('capacity'),
        textbook: fieldVal('textbook'),
        description: fieldVal('description'),
      };
      const res = await fetch(`/api/${slug}/admin/classes/${selectedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setClasses((prev) => prev.map((c) => (c.id === selectedId ? { ...c, ...data.class } : c)));
        setForm({});
      }
    } finally {
      setSaving(false);
    }
  }

  async function addClass() {
    const res = await fetch(`/api/${slug}/admin/classes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '새 반', days: [], startTime: null, endTime: null }),
    });
    if (res.ok) {
      const data = await res.json();
      setClasses((prev) => [...prev, data.class]);
      setSelectedId(data.class.id);
      setForm({});
    }
  }

  async function removeSlot(id: string) {
    await fetch(`/api/${slug}/admin/classes/slots/${id}`, { method: 'DELETE' });
    setSlots((prev) => prev.filter((s) => s.id !== id));
  }

  async function addSlot() {
    const res = await fetch(`/api/${slug}/admin/classes/slots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSlot),
    });
    if (res.ok) {
      const data = await res.json();
      setSlots((prev) => [...prev, data.slot]);
      setShowAddSlot(false);
      setNewSlot({ weekday: 0, time: '' });
    }
  }

  const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div style={{ display: 'flex', gap: 20, flex: 1, minHeight: 0 }}>
      {/* Left */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>수업·시간표</h1>
          <button
            type="button"
            onClick={addClass}
            style={{
              height: 44,
              padding: '0 18px',
              border: 'none',
              borderRadius: 8,
              background: '#1E5645',
              color: '#FFFFFF',
              font: 'inherit',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            반 추가
          </button>
        </div>

        {/* Class table */}
        <div style={{ background: '#FFFFFF', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#5A6270', background: '#FAF9F6' }}>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>반</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>요일·시간</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>잔여석</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((cls) => {
                const isFull = (cls.seatsLeft ?? 1) <= 0;
                const isSelected = cls.id === selectedId;
                return (
                  <tr
                    key={cls.id}
                    onClick={() => { setSelectedId(cls.id); setForm({}); }}
                    style={{
                      borderTop: '1px solid #EEEAE2',
                      background: isSelected ? '#EEF5F1' : 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <td style={{ padding: '14px 16px', fontWeight: 600 }}>{cls.name}</td>
                    <td style={{ padding: '14px 16px' }}>
                      {cls.days.join('·') || '–'} {cls.startTime ?? ''}
                    </td>
                    <td style={{ padding: '8px 16px' }}>
                      {isFull ? (
                        <span style={{ color: '#8A3A1C', fontWeight: 600 }}>
                          마감{cls.waitlistCount > 0 ? ` · 대기 ${cls.waitlistCount}명` : ''}
                        </span>
                      ) : (
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            aria-label="잔여석 줄이기"
                            disabled={seatsLoading === cls.id}
                            onClick={() => adjustSeats(cls.id, -1)}
                            style={{ width: 36, height: 36, border: '1px solid #D5D0C6', borderRadius: 8, background: '#FFFFFF', font: 'inherit', cursor: 'pointer' }}
                          >
                            −
                          </button>
                          <b style={{ width: 20, textAlign: 'center' }}>{cls.seatsLeft ?? '?'}</b>
                          <button
                            type="button"
                            aria-label="잔여석 늘리기"
                            disabled={seatsLoading === cls.id}
                            onClick={() => adjustSeats(cls.id, +1)}
                            style={{ width: 36, height: 36, border: '1px solid #D5D0C6', borderRadius: 8, background: '#FFFFFF', font: 'inherit', cursor: 'pointer' }}
                          >
                            +
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Level test slots */}
        <div
          style={{
            padding: 24,
            background: '#FFFFFF',
            borderRadius: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>레벨테스트 가능 시간</div>
            <div style={{ fontSize: 13, color: '#5A6270' }}>
              매주 월요일 오전, 이번 주 시간 확인 알림이 원장님께 갑니다
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {slots.map((slot) => (
              <button
                key={slot.id}
                type="button"
                onClick={() => removeSlot(slot.id)}
                style={{
                  height: 40,
                  padding: '0 14px',
                  border: '1px solid #1E5645',
                  borderRadius: 8,
                  background: '#E4EEE9',
                  color: '#1E5645',
                  font: 'inherit',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {slot.weekday !== null ? WEEKDAY_LABELS[slot.weekday] : ''} {slot.time} ✕
              </button>
            ))}
            {showAddSlot ? (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <select
                  value={newSlot.weekday}
                  onChange={(e) => setNewSlot((p) => ({ ...p, weekday: Number(e.target.value) }))}
                  style={{ height: 40, padding: '0 8px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14 }}
                >
                  {WEEKDAY_LABELS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
                <input
                  type="text"
                  value={newSlot.time}
                  onChange={(e) => setNewSlot((p) => ({ ...p, time: e.target.value }))}
                  placeholder="18:00"
                  style={{ width: 72, height: 40, padding: '0 10px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14 }}
                />
                <button type="button" onClick={addSlot} style={{ height: 40, padding: '0 12px', border: 'none', borderRadius: 8, background: '#1E5645', color: '#FFFFFF', font: 'inherit', fontSize: 14, cursor: 'pointer' }}>추가</button>
                <button type="button" onClick={() => setShowAddSlot(false)} style={{ height: 40, padding: '0 12px', border: '1px solid #D5D0C6', borderRadius: 8, background: '#FFFFFF', font: 'inherit', fontSize: 14, cursor: 'pointer' }}>취소</button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAddSlot(true)}
                style={{ height: 40, padding: '0 14px', border: '1px dashed #B7B0A2', borderRadius: 8, background: '#FFFFFF', font: 'inherit', fontSize: 14, cursor: 'pointer' }}
              >
                + 시간 추가
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right: edit panel */}
      {selected && (
        <div
          style={{
            width: 420,
            padding: 24,
            boxSizing: 'border-box',
            background: '#FFFFFF',
            borderRadius: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            alignSelf: 'flex-start',
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700 }}>{selected.name} 편집</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#5A6270' }}>반 이름</label>
            <input
              type="text"
              value={(fieldVal('name') as string) ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              style={{ height: 44, padding: '0 12px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14 }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#5A6270' }}>요일</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
              {WEEKDAYS.map((d) => {
                const days = (fieldVal('days') as string[]) ?? [];
                const active = days.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      setForm((p) => ({
                        ...p,
                        days: active ? days.filter((x) => x !== d) : [...days, d],
                      }))
                    }
                    style={{
                      height: 40,
                      border: active ? 'none' : '1px solid #D5D0C6',
                      borderRadius: 8,
                      background: active ? '#1E5645' : '#FFFFFF',
                      color: active ? '#FFFFFF' : '#1B2430',
                      font: 'inherit',
                      fontWeight: active ? 600 : 400,
                      cursor: 'pointer',
                    }}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#5A6270' }}>시작 시간</label>
              <input
                type="text"
                value={(fieldVal('startTime') as string) ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))}
                placeholder="17:00"
                style={{ height: 44, padding: '0 12px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14 }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#5A6270' }}>정원</label>
              <input
                type="number"
                value={(fieldVal('capacity') as number) ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, capacity: Number(e.target.value) }))}
                placeholder="8"
                style={{ height: 44, padding: '0 12px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14 }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#5A6270' }}>교재</label>
            <input
              type="text"
              value={(fieldVal('textbook') as string) ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, textbook: e.target.value }))}
              placeholder="교재명"
              style={{ height: 44, padding: '0 12px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14 }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#5A6270' }}>소개 (한두 문장)</label>
            <textarea
              value={(fieldVal('description') as string) ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={3}
              style={{ padding: '10px 12px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14, resize: 'none' }}
            />
          </div>

          <button
            type="button"
            onClick={saveClass}
            disabled={saving}
            style={{ marginTop: 'auto', height: 48, border: 'none', borderRadius: 10, background: '#1E5645', color: '#FFFFFF', font: 'inherit', fontSize: 15, fontWeight: 700, cursor: saving ? 'wait' : 'pointer' }}
          >
            저장하면 홈페이지에 바로 반영
          </button>
        </div>
      )}
    </div>
  );
}
