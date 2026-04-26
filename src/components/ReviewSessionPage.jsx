import { useEffect, useState, useCallback } from 'react';
import { useReviewSession } from '../hooks/useReviewSession';
import './ReviewSessionPage.css';

/* ─── helpers ──────────────────────────────────────────────────────────── */
const TYPE_META = {
  CLOZE:     { label: '克漏字',    emoji: '🔲', badgeClass: 'badge-cloze',    hint: '填入空格中的關鍵詞' },
  L1_PROMPT: { label: '中文提示',  emoji: '🇹🇼', badgeClass: 'badge-l1prompt', hint: '看中文，寫出目標語句' },
  CONTEXT:   { label: '情境作答',  emoji: '🌐', badgeClass: 'badge-context',   hint: '閱讀情境敘述後作答' },
};

const LANG_LOCALE = {
  en: 'en-US',
  ja: 'ja-JP',
  fr: 'fr-FR',
  ko: 'ko-KR',
  es: 'es-ES',
  de: 'de-DE',
};

/** CLOZE 唸完整原句，其餘唸 answer（目標語言句子） */
function getTargetText(card) {
  return card.cardType === 'CLOZE' ? card.originalText : card.answer;
}

function speakCard(card, lang = 'en') {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(getTargetText(card));
  utter.lang = LANG_LOCALE[lang] ?? 'en-US';
  utter.rate = lang === 'ja' || lang === 'ko' ? 0.8 : 0.9;
  window.speechSynthesis.speak(utter);
}

/** 比較答案：去頭尾空白、不分大小寫、忽略標點 */
function normalise(str) {
  return str.trim().toLowerCase().replace(/[.,!?'"]/g, '');
}
function isCorrect(userInput, correctAnswer) {
  return normalise(userInput) === normalise(correctAnswer);
}

/** Render question text — for CLOZE, style the blank */
function QuestionText({ cardType, question }) {
  if (cardType === 'CLOZE') {
    const parts = question.split('___');
    return (
      <p className="card-question">
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < parts.length - 1 && <span className="blank" aria-label="blank" />}
          </span>
        ))}
      </p>
    );
  }
  return <p className="card-question">{question}</p>;
}

/** Dots that reflect reviewStage (up to 10) */
function StageDots({ stage }) {
  const MAX = 10;
  return (
    <div className="stage-row">
      {Array.from({ length: MAX }).map((_, i) => (
        <div key={i} className={`stage-dot ${i < stage ? 'filled' : ''}`} />
      ))}
      <span className="stage-label">Stage {stage}</span>
    </div>
  );
}

/* ─── Main component ───────────────────────────────────────────────────── */
export default function ReviewSessionPage({ onBack, activeLang = 'en' }) {
  const {
    currentCard,
    currentIndex,
    totalCards,
    progress,
    status,
    errorMessage,
    startSession,
    revealAnswer,
    markReviewed,
  } = useReviewSession(activeLang);

  const [userInput, setUserInput]     = useState('');
  const [checkResult, setCheckResult] = useState(null); // null | 'correct' | 'incorrect'

  /* Kick off the session on mount */
  useEffect(() => {
    startSession();
  }, [startSession]);

  /* Reset input state whenever the card changes */
  useEffect(() => {
    setUserInput('');
    setCheckResult(null);
  }, [currentCard?.id]);

  const handleCheck = useCallback(() => {
    if (!currentCard || !userInput.trim()) return;
    const result = isCorrect(userInput, currentCard.answer) ? 'correct' : 'incorrect';
    setCheckResult(result);
    revealAnswer();
  }, [currentCard, userInput, revealAnswer]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCheck();
    }
  }, [handleCheck]);

  /* ── Idle / Loading ── */
  if (status === 'idle' || status === 'loading') {
    return (
      <div className="review-page">
        <Topbar onBack={onBack} label="" />
        <div className="review-center-screen">
          <div className="spinner" />
          <p>載入待複習卡片中…</p>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (status === 'error') {
    return (
      <div className="review-page">
        <Topbar onBack={onBack} label="" />
        <div className="review-center-screen">
          <div className="big-icon">⚠️</div>
          <h2>連線失敗</h2>
          <p className="review-error-msg">{errorMessage}</p>
          <p>請確認後端伺服器是否正常運作。</p>
          <button id="retry-btn" className="btn-start-review" onClick={startSession}>重試</button>
          <button className="review-close-btn" style={{ marginTop: '0.5rem' }} onClick={onBack}>返回首頁</button>
        </div>
      </div>
    );
  }

  /* ── All done ── */
  if (status === 'finished') {
    return (
      <div className="review-page">
        <Topbar onBack={onBack} label="" />
        <div className="review-center-screen">
          <div className="big-icon">🎉</div>
          <h2>今日複習完成！</h2>
          <p>
            {totalCards > 0
              ? `已完成 ${totalCards} 張卡片的複習。下次排程已依費氏數列自動計算。`
              : '今天沒有待複習的卡片，明天再來看看！'}
          </p>
          <button id="finish-back-btn" className="btn-start-review" onClick={onBack}>返回首頁</button>
        </div>
      </div>
    );
  }

  if (!currentCard) return null;

  const meta        = TYPE_META[currentCard.cardType] ?? TYPE_META.CONTEXT;
  const isRevealed  = status === 'revealed';
  const isSubmitting = status === 'submitting';

  return (
    <div className="review-page">
      <Topbar onBack={onBack} label={`${currentIndex + 1} / ${totalCards}`} />

      {/* Progress bar */}
      <div className="review-progress-wrap">
        <div className="review-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Card */}
      <div className="review-card" data-type={currentCard.cardType} key={currentCard.id}>

        {/* Badge */}
        <div className={`card-type-badge ${meta.badgeClass}`}>
          {meta.emoji} {meta.label}
        </div>

        {/* Hint */}
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          {meta.hint}
        </p>

        {/* Question + TTS button */}
        <div className="question-row">
          <QuestionText cardType={currentCard.cardType} question={currentCard.question} />
          <button
            className="btn-tts"
            onClick={() => speakCard(currentCard, activeLang)}
            title="朗讀句子"
            aria-label="朗讀句子"
          >
            🔊
          </button>
        </div>

        {/* Answer input area (before reveal) */}
        {!isRevealed && (
          <div className="answer-input-area">
            <input
              className="answer-input"
              type="text"
              placeholder="輸入你的答案…"
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <div className="card-actions">
              <button
                id="check-answer-btn"
                className="btn-reveal"
                onClick={handleCheck}
                disabled={!userInput.trim()}
              >
                確認答案
              </button>
              <button
                className="btn-skip"
                onClick={revealAnswer}
              >
                直接顯示答案
              </button>
            </div>
          </div>
        )}

        {/* Revealed: feedback + correct answer */}
        {isRevealed && (
          <>
            <div className="card-divider" />

            {/* Feedback badge (only when user submitted an answer) */}
            {checkResult && (
              <div className={`result-badge ${checkResult === 'correct' ? 'result-correct' : 'result-incorrect'}`}>
                {checkResult === 'correct' ? '✓ 答對了！' : `✗ 答錯了　你的答案：${userInput}`}
              </div>
            )}

            <div className="card-answer-wrap">
              <p className="card-answer-label">正確答案</p>
              <p className="card-answer-text">{currentCard.answer}</p>
            </div>

            <div className="card-actions">
              <button
                id="got-it-btn"
                className="btn-got-it"
                onClick={markReviewed}
                disabled={isSubmitting}
              >
                {isSubmitting ? '記錄中…' : '下一張 →'}
              </button>
            </div>
          </>
        )}

        {/* Stage dots */}
        <StageDots stage={currentCard.reviewStage} />
      </div>
    </div>
  );
}

/* ─── Shared top bar ───────────────────────────────────────────────────── */
function Topbar({ onBack, label }) {
  return (
    <div className="review-topbar">
      <button id="review-back-btn" className="review-close-btn" onClick={onBack}>← 返回</button>
      {label && <span className="review-counter">{label}</span>}
      <div style={{ width: 64 }} />
    </div>
  );
}
