import { useState } from 'react';
import { getAuthHeader } from '../hooks/useAuth';
import './RefinementDashboard.css';
import { API_BASE } from '../config.js';

export default function RefinementDashboard({ transcript, activeLang = 'en', onRestart, onBack, onManageCards }) {
  const [status, setStatus] = useState('confirm'); // 'confirm' | 'loading' | 'done' | 'error'
  const [pairs, setPairs] = useState([]);
  const [cardsCreated, setCardsCreated] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const userUtterances = transcript
    .filter(t => t.role === 'user')
    .map(t => t.text)
    .filter(Boolean);

  const handleSaveToCards = async () => {
    setStatus('loading');
    setErrorMessage('');
    try {
      const res = await fetch(`${API_BASE}/cards/refine`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ utterances: userUtterances, language: activeLang }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || '生成失敗');
      setPairs(json.pairs);
      setCardsCreated(json.cardsCreated);
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
            本次共說了 {userUtterances.length} 句。要將這些句子加入 Memory Card 嗎？
            <br />
            AI 將自動潤飾語句，並生成克漏字、中文提示、情境三種卡片。
          </p>

          <ul className="rf-utterance-list">
            {userUtterances.map((text, i) => (
              <li key={i} className="rf-utterance-item">{text}</li>
            ))}
          </ul>

          <div className="rf-actions">
            <button className="rf-btn-confirm" onClick={handleSaveToCards}>
              ✨ 加入 Memory Card
            </button>
            <button className="rf-btn-skip" onClick={onBack}>不用了，返回首頁</button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Loading ── */
  if (status === 'loading') {
    return (
      <div className="rf-page">
        <div className="rf-card">
          <h2 className="rf-title">AI 分析中…</h2>
          <div className="rf-loading">
            <div className="rf-spinner" />
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
              正在將對話潤飾成自然母語語句，並生成 Memory Card…
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
            <button className="rf-btn-confirm" onClick={handleSaveToCards}>重試</button>
            <button className="rf-btn-skip" onClick={() => setStatus('confirm')}>返回確認頁</button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Done ── */
  const changedPairs  = pairs.filter(p => p.refined?.trim() !== p.original?.trim());
  const unchangedCount = pairs.length - changedPairs.length;

  return (
    <div className="rf-page">
      <div className="rf-card">
        <h2 className="rf-title">卡片生成完成！</h2>
        <div className="rf-success-badge">
          ✓ 已生成 {cardsCreated} 張 Memory Card
        </div>

        {changedPairs.length > 0 && (
          <>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
              AI 潤飾了 {changedPairs.length} 句，讓表達更自然道地：
            </p>
            <ul className="rf-pairs-list">
              {changedPairs.map((p, i) => (
                <li key={i} className="rf-pair-item">
                  <p className="rf-pair-label" style={{ color: '#64748b' }}>你說的</p>
                  <p className="rf-pair-original">{p.original}</p>
                  <p className="rf-pair-label" style={{ color: '#34d399' }}>母語潤飾</p>
                  <p className="rf-pair-refined">{p.refined}</p>
                </li>
              ))}
            </ul>
            {unchangedCount > 0 && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
                另有 {unchangedCount} 句已夠自然，直接收錄。
              </p>
            )}
          </>
        )}

        {changedPairs.length === 0 && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', marginBottom: '1.5rem' }}>
            你的表達已相當自然！所有句子直接收錄。
          </p>
        )}

        <div className="rf-actions">
          <button className="rf-btn-confirm" onClick={onManageCards}>查看卡片庫</button>
          <button className="rf-btn-skip" onClick={onBack}>返回首頁</button>
        </div>
      </div>
    </div>
  );
}
