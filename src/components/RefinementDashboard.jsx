import { useState } from 'react';
import { getAuthHeader } from '../hooks/useAuth';
import './RefinementDashboard.css';
import { API_BASE } from '../config.js';

export default function RefinementDashboard({ transcript, activeLang = 'en', onRestart, onBack, onManageCards }) {
  const [status, setStatus] = useState('confirm'); // confirm | optimizing | refined | savingAll | done | error
  const [pairs, setPairs] = useState([]);
  const [savedIndices, setSavedIndices] = useState(new Set());
  const [savingIndex, setSavingIndex] = useState(null);
  const [cardsCreated, setCardsCreated] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const userUtterances = transcript
    .filter(t => t.role === 'user')
    .map(t => t.text)
    .filter(Boolean);

  const handleOptimize = async () => {
    setStatus('optimizing');
    setErrorMessage('');
    try {
      const res = await fetch(`${API_BASE}/cards/refine/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ utterances: userUtterances, language: activeLang }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || '優化失敗');
      setPairs(json.pairs);
      setStatus('refined');
    } catch (err) {
      setErrorMessage(err.message);
      setStatus('error');
    }
  };

  const handleSaveSingle = async (index) => {
    if (savedIndices.has(index) || savingIndex !== null) return;
    setSavingIndex(index);
    try {
      const res = await fetch(`${API_BASE}/cards/refine/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ pairs: [pairs[index]], language: activeLang }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || '儲存失敗');
      setSavedIndices(prev => new Set([...prev, index]));
      setCardsCreated(prev => prev + json.cardsCreated);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setSavingIndex(null);
    }
  };

  const handleSaveAll = async () => {
    const unsavedPairs = pairs.filter((_, i) => !savedIndices.has(i));
    if (unsavedPairs.length === 0) { setStatus('done'); return; }
    setStatus('savingAll');
    setErrorMessage('');
    try {
      const res = await fetch(`${API_BASE}/cards/refine/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ pairs: unsavedPairs, language: activeLang }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || '儲存失敗');
      setCardsCreated(prev => prev + json.cardsCreated);
      setStatus('done');
    } catch (err) {
      setErrorMessage(err.message);
      setStatus('error');
    }
  };

  /* ── No speech detected ── */
  if (userUtterances.length === 0) {
    return (
      <div className="rf-page">
        <div className="rf-card">
          <div className="rf-empty">
            <div className="rf-big-icon">🎤</div>
            <p>這次對話中未偵測到語音內容。</p>
          </div>
          <div className="rf-actions" style={{ marginTop: '1.5rem' }}>
            <button className="rf-btn-confirm" onClick={onRestart}>再來一次</button>
            <button className="rf-btn-skip" onClick={onBack}>返回首頁</button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Confirm ── */
  if (status === 'confirm') {
    return (
      <div className="rf-page">
        <div className="rf-card">
          <h2 className="rf-title">對話結束 🎉</h2>
          <p className="rf-subtitle">
            本次共說了 {userUtterances.length} 句。要讓 AI 將這些句子優化為母語人士口吻嗎？
          </p>

          <ul className="rf-utterance-list">
            {userUtterances.map((text, i) => (
              <li key={i} className="rf-utterance-item">{text}</li>
            ))}
          </ul>

          <div className="rf-actions">
            <button className="rf-btn-confirm" onClick={handleOptimize}>
              ✨ 一鍵優化語句
            </button>
            <button className="rf-btn-skip" onClick={onBack}>不用了，返回首頁</button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Optimizing ── */
  if (status === 'optimizing') {
    return (
      <div className="rf-page">
        <div className="rf-card">
          <h2 className="rf-title">AI 優化中…</h2>
          <div className="rf-loading">
            <div className="rf-spinner" />
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
              正在將句子潤飾為自然的母語人士口吻…
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Refined (show results, save one-by-one or all) ── */
  if (status === 'refined') {
    const unsavedCount = pairs.length - savedIndices.size;

    return (
      <div className="rf-page">
        <div className="rf-card">
          <h2 className="rf-title">優化完成！</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
            可逐句加入，或直接點「全部儲存」。
          </p>

          {errorMessage && (
            <p className="rf-error-msg" style={{ marginBottom: '0.75rem' }}>{errorMessage}</p>
          )}

          <ul className="rf-pairs-list">
            {pairs.map((p, i) => {
              const isChanged = p.refined?.trim() !== p.original?.trim();
              const isSaved = savedIndices.has(i);
              const isSaving = savingIndex === i;
              return (
                <li key={i} className="rf-pair-item" style={{ opacity: isSaved ? 0.5 : 1 }}>
                  {isChanged ? (
                    <>
                      <p className="rf-pair-label" style={{ color: '#64748b' }}>你說的</p>
                      <p className="rf-pair-original">{p.original}</p>
                      <p className="rf-pair-label" style={{ color: '#34d399' }}>母語潤飾</p>
                      <p className="rf-pair-refined">{p.refined}</p>
                    </>
                  ) : (
                    <>
                      <p className="rf-pair-label" style={{ color: '#34d399' }}>已自然，直接收錄</p>
                      <p className="rf-pair-refined">{p.original}</p>
                    </>
                  )}
                  <button
                    className="rf-btn-single"
                    onClick={() => handleSaveSingle(i)}
                    disabled={isSaved || isSaving || savingIndex !== null}
                  >
                    {isSaved ? '✓ 已加入' : isSaving ? '加入中…' : '+ 加入卡片'}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="rf-actions" style={{ marginTop: '1.5rem' }}>
            <button
              className="rf-btn-confirm"
              onClick={handleSaveAll}
              disabled={savingIndex !== null || unsavedCount === 0}
            >
              {unsavedCount === 0 ? '全部已加入' : `全部儲存（${unsavedCount} 句）`}
            </button>
            <button className="rf-btn-skip" onClick={onBack}>返回首頁</button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Saving All ── */
  if (status === 'savingAll') {
    return (
      <div className="rf-page">
        <div className="rf-card">
          <h2 className="rf-title">儲存中…</h2>
          <div className="rf-loading">
            <div className="rf-spinner" />
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
              正在生成克漏字、中文提示、情境三種卡片…
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (status === 'error') {
    return (
      <div className="rf-page">
        <div className="rf-card">
          <h2 className="rf-title">發生錯誤</h2>
          <p className="rf-error-msg" style={{ marginTop: '1.5rem' }}>{errorMessage}</p>
          <div className="rf-actions">
            <button className="rf-btn-confirm" onClick={() => setStatus('confirm')}>返回重試</button>
            <button className="rf-btn-skip" onClick={onBack}>返回首頁</button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Done ── */
  return (
    <div className="rf-page">
      <div className="rf-card">
        <h2 className="rf-title">卡片生成完成！</h2>
        <div className="rf-success-badge">
          ✓ 已生成 {cardsCreated} 張 Memory Card
        </div>
        <div className="rf-actions">
          <button className="rf-btn-confirm" onClick={onManageCards}>查看卡片庫</button>
          <button className="rf-btn-skip" onClick={onBack}>返回首頁</button>
        </div>
      </div>
    </div>
  );
}
