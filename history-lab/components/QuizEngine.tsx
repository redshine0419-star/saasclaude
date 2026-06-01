'use client';

import { useState } from 'react';
import AdInterstitialModal from './AdInterstitialModal';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';

const examQuestions = [
  {
    q: '1789년 프랑스 혁명의 직접적 계기가 된 신분 대표 회의는?',
    options: ['삼부회', '국민의회', '입법의회', '국민공회'],
    answer: 0,
    explanation: '삼부회 소집 이후 제3신분이 독자적으로 국민의회를 구성하면서 혁명이 시작되었습니다.',
  },
  {
    q: '"인간은 자유롭고 평등하게 태어났다"는 내용을 담은 1789년 프랑스 문서는?',
    options: ['마그나 카르타', '인권 선언', '권리 장전', '독립 선언'],
    answer: 1,
    explanation: '프랑스 인권 선언(Declaration of the Rights of Man)은 자유·평등·인민 주권을 선포했습니다.',
  },
  {
    q: '바스티유 감옥 습격이 일어난 날짜로 현재 프랑스 국경일인 것은?',
    options: ['7월 4일', '7월 14일', '8월 15일', '9월 21일'],
    answer: 1,
    explanation: '1789년 7월 14일 바스티유 함락은 혁명의 상징으로, 현재도 프랑스 혁명 기념일입니다.',
  },
  {
    q: '나폴레옹이 쿠데타로 총재정부를 전복한 사건을 무엇이라 부르는가?',
    options: ['테르미도르 반동', '브뤼메르 18일 쿠데타', '뤼미에르 혁명', '방데미에르 봉기'],
    answer: 1,
    explanation: '1799년 브뤼메르 18일(혁명력)에 나폴레옹이 쿠데타를 일으켜 제1통령이 되었습니다.',
  },
  {
    q: '공포정치 시기 단두대로 처형된 루이 16세의 처형 연도는?',
    options: ['1791년', '1792년', '1793년', '1795년'],
    answer: 2,
    explanation: '루이 16세는 1793년 1월 21일 처형되었고, 마리 앙투아네트는 같은 해 10월 처형되었습니다.',
  },
];

const personalityQuestions = [
  {
    q: '나는 새로운 일을 시작할 때 어떻게 하는가?',
    options: ['치밀하게 계획을 세운다', '일단 시작하고 본다', '주변에 의견을 구한다', '전례를 찾아 따른다'],
  },
  {
    q: '가장 보람을 느끼는 순간은?',
    options: ['혼자 문제를 해결했을 때', '팀이 목표를 달성했을 때', '누군가를 도왔을 때', '새 아이디어가 떠올랐을 때'],
  },
  {
    q: '스트레스를 받을 때 나는?',
    options: ['혼자 조용히 생각한다', '운동으로 풀어낸다', '친구와 이야기한다', '창작 활동을 한다'],
  },
  {
    q: '가장 중요하게 생각하는 가치는?',
    options: ['정의와 원칙', '실용과 결과', '관계와 화합', '창의와 혁신'],
  },
  {
    q: '나를 한 단어로 표현하면?',
    options: ['전략가', '실행가', '중재자', '창조자'],
  },
];

const personalityResults = [
  { title: '정3품 홍문관 대제학', desc: '지식과 원칙을 중시하는 당신은 조선 최고의 학자 관료. 경연에서 왕을 가르치고 역사서를 편찬하는 역할이 딱입니다.', emoji: '📚', color: '#5b8dd9' },
  { title: '종2품 훈련대장', desc: '실행력과 결단력의 소유자. 5만 군대를 통솔하며 나라를 지키는 무장 최고 직위입니다.', emoji: '⚔️', color: '#c0392b' },
  { title: '정2품 이조판서', desc: '사람을 파악하는 눈이 뛰어난 당신. 전국 관리 인사권을 쥔 조선의 인사위원회 위원장.', emoji: '🎎', color: '#d4a843' },
  { title: '정3품 규장각 검서관', desc: '창의력이 넘치는 당신은 정조 시대 개혁의 두뇌. 새로운 학문과 기술을 연구하는 왕의 싱크탱크.', emoji: '🔬', color: '#4a7c59' },
];

type Mode = 'select' | 'exam' | 'personality';

export default function QuizEngine() {
  const [mode, setMode] = useState<Mode>('select');
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const reset = () => {
    setCurrentQ(0);
    setSelected(null);
    setAnswers([]);
    setShowModal(false);
    setShowResult(false);
    setMode('select');
  };

  const handleAnswer = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
  };

  const handleNext = () => {
    const newAnswers = [...answers, selected!];
    if (mode === 'exam' && currentQ < examQuestions.length - 1) {
      setAnswers(newAnswers);
      setCurrentQ(currentQ + 1);
      setSelected(null);
    } else if (mode === 'personality' && currentQ < personalityQuestions.length - 1) {
      setAnswers(newAnswers);
      setCurrentQ(currentQ + 1);
      setSelected(null);
    } else {
      setAnswers(newAnswers);
      setShowModal(true);
    }
  };

  // Exam result
  const examScore = mode === 'exam' ? answers.filter((a, i) => a === examQuestions[i].answer).length : 0;

  // Personality result
  const personalityResult = (() => {
    const counts = [0, 0, 0, 0];
    answers.forEach((a) => counts[a % 4]++);
    return personalityResults[counts.indexOf(Math.max(...counts))];
  })();

  const questions = mode === 'exam' ? examQuestions : personalityQuestions;
  const total = questions.length;
  const progress = ((currentQ + 1) / total) * 100;

  return (
    <div className="max-w-xl mx-auto">
      {/* Mode select */}
      {mode === 'select' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setMode('exam')}
            className="p-6 rounded-2xl border text-left transition-all hover:scale-[1.02] group"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="text-3xl mb-3">🏛️</div>
            <h3 className="font-bold text-base mb-1" style={{ color: 'var(--cream)' }}>세능검 기출 퀴즈</h3>
            <p className="text-xs" style={{ color: 'var(--cream-muted)' }}>프랑스 혁명 핵심 기출 5문항 도전</p>
            <div className="mt-3 text-xs font-bold" style={{ color: 'var(--gold)' }}>A형 — 수험생 추천</div>
          </button>
          <button
            onClick={() => setMode('personality')}
            className="p-6 rounded-2xl border text-left transition-all hover:scale-[1.02] group"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="text-3xl mb-3">👘</div>
            <h3 className="font-bold text-base mb-1" style={{ color: 'var(--cream)' }}>조선시대 나의 직업은?</h3>
            <p className="text-xs" style={{ color: 'var(--cream-muted)' }}>성향 테스트로 전생 관직 발견하기</p>
            <div className="mt-3 text-xs font-bold" style={{ color: '#8b4a8b' }}>B형 — 교양 추천</div>
          </button>
        </div>
      )}

      {/* Quiz in progress */}
      {(mode === 'exam' || mode === 'personality') && !showResult && (
        <div>
          {/* Progress */}
          <div className="mb-5">
            <div className="flex justify-between text-xs mb-2" style={{ color: 'var(--cream-muted)' }}>
              <span>{mode === 'exam' ? '세능검 기출' : '조선직업 테스트'} · {currentQ + 1}/{total}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: 'var(--border)' }}>
              <div
                className="h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, backgroundColor: mode === 'exam' ? 'var(--gold)' : '#8b4a8b' }}
              />
            </div>
          </div>

          {/* Question */}
          <div className="p-5 rounded-2xl mb-4" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-sm font-semibold leading-relaxed" style={{ color: 'var(--cream)' }}>
              {mode === 'exam' ? `Q${currentQ + 1}. ${examQuestions[currentQ].q}` : personalityQuestions[currentQ].q}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-2 mb-4">
            {(mode === 'exam' ? examQuestions[currentQ].options : personalityQuestions[currentQ].options).map((opt, i) => {
              const isSelected = selected === i;
              const isCorrect = mode === 'exam' && i === examQuestions[currentQ].answer;
              const isWrong = mode === 'exam' && isSelected && !isCorrect;

              let borderColor = 'var(--border)';
              let bg = 'var(--surface)';
              let textColor = 'var(--cream)';

              if (selected !== null) {
                if (mode === 'exam') {
                  if (isCorrect) { borderColor = '#4a7c59'; bg = 'rgba(74,124,89,0.15)'; textColor = '#6dbf7e'; }
                  else if (isWrong) { borderColor = 'var(--red)'; bg = 'rgba(192,57,43,0.15)'; textColor = '#e57565'; }
                } else if (isSelected) {
                  borderColor = '#8b4a8b';
                  bg = 'rgba(139,74,139,0.15)';
                  textColor = '#c87ec8';
                }
              } else if (isSelected) {
                borderColor = mode === 'exam' ? 'var(--gold)' : '#8b4a8b';
                bg = mode === 'exam' ? 'rgba(212,168,67,0.12)' : 'rgba(139,74,139,0.12)';
              }

              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={selected !== null}
                  className="w-full px-4 py-3 rounded-xl border text-left text-sm transition-all"
                  style={{ backgroundColor: bg, borderColor, color: textColor }}
                >
                  <span className="font-bold mr-2" style={{ color: 'var(--gold-dark)' }}>
                    {['①', '②', '③', '④'][i]}
                  </span>
                  {opt}
                  {selected !== null && mode === 'exam' && isCorrect && <CheckCircle size={14} className="inline ml-2 text-green-400" />}
                  {selected !== null && mode === 'exam' && isWrong && <XCircle size={14} className="inline ml-2 text-red-400" />}
                </button>
              );
            })}
          </div>

          {/* Explanation (exam only) */}
          {selected !== null && mode === 'exam' && (
            <div className="p-3 rounded-xl mb-4 fade-in-up" style={{ backgroundColor: 'rgba(91,141,217,0.1)', border: '1px solid rgba(91,141,217,0.3)' }}>
              <p className="text-xs" style={{ color: '#a0c4f0' }}>
                💡 {examQuestions[currentQ].explanation}
              </p>
            </div>
          )}

          {/* Next button */}
          {selected !== null && (
            <button
              onClick={handleNext}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 fade-in-up"
              style={{ backgroundColor: mode === 'exam' ? 'var(--gold)' : '#8b4a8b', color: mode === 'exam' ? '#1a1208' : 'white' }}
            >
              {currentQ < total - 1 ? '다음 문제 →' : '결과 보기'}
            </button>
          )}
        </div>
      )}

      {/* Result */}
      {showResult && (
        <div className="text-center fade-in-up">
          {mode === 'exam' ? (
            <div>
              <div className="text-5xl mb-4">{examScore >= 4 ? '🏆' : examScore >= 2 ? '📚' : '💪'}</div>
              <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--gold)' }}>
                {examScore}점 / {total}점
              </h3>
              <p className="text-sm mb-6" style={{ color: 'var(--cream-muted)' }}>
                {examScore === total ? '완벽합니다! 세능검 1급 도전하세요!' : examScore >= 3 ? '잘 하셨어요. 조금만 더 공부하면 합격권!' : '프랑스 혁명을 다시 한번 읽어봐요.'}
              </p>
            </div>
          ) : (
            <div>
              <div className="text-5xl mb-3">{personalityResult.emoji}</div>
              <h3 className="text-xl font-bold mb-1" style={{ color: personalityResult.color }}>
                {personalityResult.title}
              </h3>
              <p className="text-sm mb-6 px-4 leading-relaxed" style={{ color: 'var(--cream-muted)' }}>
                {personalityResult.desc}
              </p>
            </div>
          )}
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-medium transition-all hover:opacity-80"
            style={{ borderColor: 'var(--border)', color: 'var(--cream-muted)' }}
          >
            <RefreshCw size={14} />
            다시 도전하기
          </button>
        </div>
      )}

      {/* Interstitial Ad Modal */}
      <AdInterstitialModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setShowResult(true); }}
      />
    </div>
  );
}
