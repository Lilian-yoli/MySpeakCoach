import { useEffect, useState, useRef } from 'react';
import { useCardManager } from '../hooks/useCardManager';

const TYPE_COLORS = {
  CLOZE:     { bg: '#1e3a5f', border: '#3b82f6', label: '克漏字' },
  L1_PROMPT: { bg: '#2d1b69', border: '#8b5cf6', label: '中文提示' },
  CONTEXT:   { bg: '#064e3b', border: '#10b981', label: '情境' },
};

function CardItem({ card, onSave }) {
  const [editing, setEditing] = useState(false);
  const [question, setQuestion] = useState(card.question);
  const [answer, setAnswer] = useState(card.answer);
  const [saving, setSaving] = useState(false);
  const colors = TYPE_COLORS[card.cardType] || TYPE_COLORS.CLOZE;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(card.id, question, answer);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setQuestion(card.question);
    setAnswer(card.answer);
    setEditing(false);
  };

  return (
    <div style={{
      padding: '1rem 1.25rem',
      background: colors.bg,
      borderRadius: '8px',
      borderLeft: `4px solid ${colors.border}`,
      marginBottom: '0.75rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.75em', color: colors.border, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
          {colors.label}
        </span>
        <span style={{ fontSize: '0.75em', color: '#64748b' }}>Stage {card.reviewStage}</span>
      </div>

      {editing ? (
        <>
          <p style={{ color: '#94a3b8', fontSize: '0.8em', margin: '0 0 3px 0' }}>題目</p>
          <textarea
            value={question}
            onChange={e => setQuestion(e.target.value)}
            rows={2}
            style={{ width: '100%', background: 'rgba(0,0,0,0.3)', color: '#f1f5f9', border: '1px solid #334155', borderRadius: '6px', padding: '0.5rem', fontSize: '0.95em', resize: 'vertical', boxSizing: 'border-box', marginBottom: '0.5rem' }}
          />
          <p style={{ color: '#94a3b8', fontSize: '0.8em', margin: '0 0 3px 0' }}>答案</p>
          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            rows={2}
            style={{ width: '100%', background: 'rgba(0,0,0,0.3)', color: '#f1f5f9', border: '1px solid #334155', borderRadius: '6px', padding: '0.5rem', fontSize: '0.95em', resize: 'vertical', boxSizing: 'border-box', marginBottom: '0.75rem' }}
          />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ fontSize: '0.85em', padding: '0.4rem 0.9rem' }}>
              {saving ? '儲存中…' : '儲存'}
            </button>
            <button className="btn btn-ghost" onClick={handleCancel} style={{ fontSize: '0.85em', padding: '0.4rem 0.9rem' }}>取消</button>
          </div>
        </>
      ) : (
        <>
          <p style={{ color: '#94a3b8', fontSize: '0.8em', margin: '0 0 3px 0' }}>題目</p>
          <p style={{ margin: '0 0 8px 0', color: '#f1f5f9', fontSize: '0.95em' }}>{card.question}</p>
          <p style={{ color: '#94a3b8', fontSize: '0.8em', margin: '0 0 3px 0' }}>答案</p>
          <p style={{ margin: '0 0 10px 0', color: '#cbd5e1', fontSize: '0.95em' }}>{card.answer}</p>
          <button className="btn btn-outline" onClick={() => setEditing(true)} style={{ fontSize: '0.8em', padding: '0.3rem 0.8rem' }}>
            編輯
          </button>
        </>
      )}
    </div>
  );
}

function ContinueSentenceForm({ onContinue, onAdd }) {
  const [open, setOpen] = useState(false);
  const [sentence, setSentence] = useState('');
  const [loading, setLoading] = useState(false);
  const [continuations, setContinuations] = useState([]);
  const [error, setError] = useState('');
  const [added, setAdded] = useState(new Set());
  const [adding, setAdding] = useState(new Set());
  const inputRef = useRef(null);

  const handleOpen = () => {
    setOpen(true);
    setContinuations([]);
    setError('');
    setAdded(new Set());
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleAsk = async () => {
    if (!sentence.trim()) return;
    setLoading(true);
    setError('');
    setContinuations([]);
    setAdded(new Set());
    try {
      const results = await onContinue(sentence.trim());
      setContinuations(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (text, idx) => {
    setAdding(prev => new Set(prev).add(idx));
    try {
      await onAdd([text]);
      setAdded(prev => new Set(prev).add(idx));
    } finally {
      setAdding(prev => { const next = new Set(prev); next.delete(idx); return next; });
    }
  };

  return (
    <div>
      {!open ? (
        <button className="btn btn-outline" onClick={handleOpen} style={{ fontSize: '0.9em' }}>
          💬 這句話可以怎麼接？
        </button>
      ) : (
        <div style={{ background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(16,185,129,0.35)', borderRadius: '10px', padding: '1.25rem' }}>
          <p style={{ color: '#f1f5f9', fontWeight: 500, margin: '0 0 0.4rem 0' }}>這句話可以怎麼接？</p>
          <p style={{ color: '#64748b', fontSize: '0.8em', margin: '0 0 0.75rem 0' }}>
            輸入一句英文，AI 提供 5 種道地的接話方式。
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              ref={inputRef}
              type="text"
              value={sentence}
              onChange={e => setSentence(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAsk()}
              placeholder="e.g. I've been really stressed out lately."
              style={{ flex: 1, background: 'rgba(0,0,0,0.3)', color: '#f1f5f9', border: '1px solid #334155', borderRadius: '6px', padding: '0.5rem 0.75rem', fontSize: '0.95em' }}
            />
            <button
              className="btn btn-primary"
              onClick={handleAsk}
              disabled={loading || !sentence.trim()}
              style={{ fontSize: '0.85em', whiteSpace: 'nowrap' }}
            >
              {loading ? '生成中…' : '送出'}
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => setOpen(false)}
              disabled={loading}
              style={{ fontSize: '0.85em' }}
            >
              關閉
            </button>
          </div>

          {error && <p style={{ color: '#ef4444', fontSize: '0.85em', margin: '0.75rem 0 0' }}>{error}</p>}

          {continuations.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <p style={{ color: '#94a3b8', fontSize: '0.8em', margin: '0 0 0.5rem 0' }}>AI 建議的接話</p>
              {continuations.map((c, idx) => {
                const isAdded = added.has(idx);
                const isAdding = adding.has(idx);
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.75rem', background: 'rgba(0,0,0,0.25)', borderRadius: '6px', marginBottom: '0.5rem', borderLeft: '3px solid rgba(16,185,129,0.4)' }}>
                    <span style={{ flex: 1, color: '#f1f5f9', fontSize: '0.95em' }}>{c}</span>
                    {isAdded ? (
                      <span style={{ color: '#10b981', fontSize: '0.8em', whiteSpace: 'nowrap' }}>✓ 已加入</span>
                    ) : (
                      <button
                        className="btn btn-outline"
                        onClick={() => handleAdd(c, idx)}
                        disabled={isAdding}
                        style={{ fontSize: '0.78em', padding: '0.25rem 0.65rem', whiteSpace: 'nowrap' }}
                      >
                        {isAdding ? '加入中…' : '加入卡片'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const HEADER_RE = /^(sentence|text|input|content|phrase|句子|詞彙|詞組|單字)$/i;

function parseCSV(raw) {
  const lines = raw.split(/\r?\n/);
  const results = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    // grab first column, handle double-quoted fields
    let cell;
    if (line.startsWith('"')) {
      const close = line.indexOf('"', 1);
      cell = close > 0 ? line.slice(1, close) : line.slice(1);
    } else {
      cell = line.split(',')[0];
    }
    cell = cell.trim();
    if (cell) results.push(cell);
  }
  if (results.length > 0 && HEADER_RE.test(results[0])) results.shift();
  return results;
}

function CSVImportForm({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [sentences, setSentences] = useState([]);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [successCount, setSuccessCount] = useState(null);
  const fileRef = useRef(null);

  const reset = () => { setSentences([]); setError(''); };

  const handleOpen = () => { setOpen(true); setSuccessCount(null); reset(); };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    reset();
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseCSV(ev.target.result);
      if (parsed.length === 0) {
        setError('CSV 中未找到有效句子，請確認格式正確。');
      } else {
        setSentences(parsed);
      }
    };
    reader.onerror = () => setError('讀取檔案失敗，請再試一次。');
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  const handleImport = async () => {
    setAdding(true);
    setError('');
    try {
      const cards = await onAdd(sentences);
      setSuccessCount(cards.length);
      setSentences([]);
      setOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const PREVIEW_MAX = 5;

  return (
    <div>
      <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={handleFile} />
      {!open ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-outline" onClick={handleOpen} style={{ fontSize: '0.9em' }}>
            📂 CSV 批次匯入
          </button>
          {successCount != null && (
            <span style={{ color: '#10b981', fontSize: '0.85em' }}>✓ 已成功生成 {successCount} 張卡片</span>
          )}
        </div>
      ) : (
        <div style={{ background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '1.25rem' }}>
          <p style={{ color: '#f1f5f9', fontWeight: 500, margin: '0 0 0.4rem 0' }}>CSV 批次匯入</p>
          <p style={{ color: '#64748b', fontSize: '0.8em', margin: '0 0 0.75rem 0' }}>
            每列一句，取第一欄內容。支援帶引號的格式（含逗號的句子請用雙引號包住）。若有標題列會自動略過。
          </p>

          {sentences.length === 0 ? (
            <button className="btn btn-outline" onClick={() => fileRef.current?.click()} style={{ fontSize: '0.85em' }}>
              選擇 CSV 檔案
            </button>
          ) : (
            <>
              <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '6px', padding: '0.75rem', marginBottom: '0.75rem' }}>
                <p style={{ color: '#94a3b8', fontSize: '0.78em', margin: '0 0 0.5rem 0' }}>
                  已解析 {sentences.length} 句，將生成 {sentences.length * 3} 張卡片
                </p>
                {sentences.slice(0, PREVIEW_MAX).map((s, i) => (
                  <p key={i} style={{ color: '#f1f5f9', fontSize: '0.88em', margin: '0.2rem 0' }}>
                    <span style={{ color: '#475569', marginRight: '0.4em' }}>{i + 1}.</span>{s}
                  </p>
                ))}
                {sentences.length > PREVIEW_MAX && (
                  <p style={{ color: '#475569', fontSize: '0.82em', margin: '0.3rem 0 0' }}>
                    … 還有 {sentences.length - PREVIEW_MAX} 句
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-primary"
                  onClick={handleImport}
                  disabled={adding}
                  style={{ fontSize: '0.85em' }}
                >
                  {adding ? 'AI 生成中…' : `匯入並生成卡片`}
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => { reset(); fileRef.current?.click(); }}
                  disabled={adding}
                  style={{ fontSize: '0.85em' }}
                >
                  重新選擇
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => { setOpen(false); reset(); }}
                  disabled={adding}
                  style={{ fontSize: '0.85em' }}
                >
                  取消
                </button>
              </div>
            </>
          )}

          {error && <p style={{ color: '#ef4444', fontSize: '0.85em', margin: '0.6rem 0 0' }}>{error}</p>}
        </div>
      )}
    </div>
  );
}

function AddCardsForm({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [adding, setAdding] = useState(false);
  const [result, setResult] = useState(null); // { count } | { error }
  const textareaRef = useRef(null);

  const handleOpen = () => {
    setOpen(true);
    setResult(null);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleSubmit = async () => {
    const sentences = text.split('\n').map(s => s.trim()).filter(Boolean);
    if (sentences.length === 0) return;
    setAdding(true);
    setResult(null);
    try {
      const cards = await onAdd(sentences);
      setResult({ count: cards.length });
      setText('');
      setOpen(false);
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setAdding(false);
    }
  };

  return (
    <div>
      {!open ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-primary" onClick={handleOpen} style={{ fontSize: '0.9em' }}>
            ＋ 新增卡片
          </button>
          {result?.count != null && (
            <span style={{ color: '#10b981', fontSize: '0.85em' }}>
              ✓ 已成功生成 {result.count} 張卡片
            </span>
          )}
        </div>
      ) : (
        <div style={{ background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '1.25rem' }}>
          <p style={{ color: '#f1f5f9', fontWeight: 500, margin: '0 0 0.5rem 0' }}>輸入句子或片語</p>
          <p style={{ color: '#64748b', fontSize: '0.8em', margin: '0 0 0.75rem 0' }}>每行一句，AI 將自動為每句生成克漏字、中文提示、情境三張卡片。</p>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={'I can\'t believe how fast time flies.\nLet\'s grab a coffee sometime.'}
            rows={5}
            style={{ width: '100%', background: 'rgba(0,0,0,0.3)', color: '#f1f5f9', border: '1px solid #334155', borderRadius: '6px', padding: '0.6rem 0.75rem', fontSize: '0.95em', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
          />
          {result?.error && (
            <p style={{ color: '#ef4444', fontSize: '0.85em', margin: '0.5rem 0 0' }}>{result.error}</p>
          )}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={adding || !text.trim()}
              style={{ fontSize: '0.85em' }}
            >
              {adding ? 'AI 生成中…' : '生成卡片'}
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => { setOpen(false); setResult(null); }}
              disabled={adding}
              style={{ fontSize: '0.85em' }}
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AskAIForm({ onSuggest, onAdd }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState('');
  const [added, setAdded] = useState(new Set()); // indices already added
  const [adding, setAdding] = useState(new Set()); // indices being added
  const inputRef = useRef(null);

  const handleOpen = () => {
    setOpen(true);
    setSuggestions([]);
    setError('');
    setAdded(new Set());
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleAsk = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setSuggestions([]);
    setAdded(new Set());
    try {
      const results = await onSuggest(query.trim());
      setSuggestions(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAsk();
  };

  const handleAdd = async (sentence, idx) => {
    setAdding(prev => new Set(prev).add(idx));
    try {
      await onAdd([sentence]);
      setAdded(prev => new Set(prev).add(idx));
    } finally {
      setAdding(prev => { const next = new Set(prev); next.delete(idx); return next; });
    }
  };

  return (
    <div style={{ marginBottom: '1rem' }}>
      {!open ? (
        <button className="btn btn-outline" onClick={handleOpen} style={{ fontSize: '0.9em' }}>
          💬 詢問 AI 怎麼說
        </button>
      ) : (
        <div style={{ background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: '10px', padding: '1.25rem' }}>
          <p style={{ color: '#f1f5f9', fontWeight: 500, margin: '0 0 0.5rem 0' }}>詢問 AI 怎麼說</p>
          <p style={{ color: '#64748b', fontSize: '0.8em', margin: '0 0 0.75rem 0' }}>用中文描述你想表達的意思，AI 將提供幾個道地英文句子。</p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="例如：我想說我很驚訝、不敢相信"
              style={{ flex: 1, background: 'rgba(0,0,0,0.3)', color: '#f1f5f9', border: '1px solid #334155', borderRadius: '6px', padding: '0.5rem 0.75rem', fontSize: '0.95em' }}
            />
            <button
              className="btn btn-primary"
              onClick={handleAsk}
              disabled={loading || !query.trim()}
              style={{ fontSize: '0.85em', whiteSpace: 'nowrap' }}
            >
              {loading ? '生成中…' : '詢問'}
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => setOpen(false)}
              disabled={loading}
              style={{ fontSize: '0.85em' }}
            >
              關閉
            </button>
          </div>

          {error && <p style={{ color: '#ef4444', fontSize: '0.85em', margin: '0.75rem 0 0' }}>{error}</p>}

          {suggestions.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <p style={{ color: '#94a3b8', fontSize: '0.8em', margin: '0 0 0.5rem 0' }}>AI 建議句子</p>
              {suggestions.map((s, idx) => {
                const isAdded = added.has(idx);
                const isAdding = adding.has(idx);
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.75rem', background: 'rgba(0,0,0,0.25)', borderRadius: '6px', marginBottom: '0.5rem' }}>
                    <span style={{ flex: 1, color: '#f1f5f9', fontSize: '0.95em' }}>{s}</span>
                    {isAdded ? (
                      <span style={{ color: '#10b981', fontSize: '0.8em', whiteSpace: 'nowrap' }}>✓ 已加入</span>
                    ) : (
                      <button
                        className="btn btn-outline"
                        onClick={() => handleAdd(s, idx)}
                        disabled={isAdding}
                        style={{ fontSize: '0.78em', padding: '0.25rem 0.65rem', whiteSpace: 'nowrap' }}
                      >
                        {isAdding ? '加入中…' : '加入卡片'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CardManagerPage({ onBack }) {
  const { groups, status, errorMessage, loadCards, deleteGroup, updateCard, addCards, suggestSentences, continueSentence } = useCardManager();
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [deletingGroup, setDeletingGroup] = useState(null);

  useEffect(() => { loadCards(); }, [loadCards]);

  const handleAddCards = async (sentences) => {
    const cards = await addCards(sentences);
    await loadCards();
    return cards;
  };

  const toggleGroup = (text) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      next.has(text) ? next.delete(text) : next.add(text);
      return next;
    });
  };

  const handleDeleteGroup = async (cards, originalText) => {
    if (!window.confirm(`確定要刪除「${originalText}」的所有 ${cards.length} 張卡片嗎？刪除後將不再列入複習。`)) return;
    setDeletingGroup(originalText);
    try {
      await deleteGroup(cards[0].id, originalText);
    } finally {
      setDeletingGroup(null);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
        <button className="btn btn-ghost" onClick={onBack}>← 返回</button>
        <h2 style={{ color: '#f8fafc', margin: 0 }}>我的卡片庫</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <AddCardsForm onAdd={handleAddCards} />
        <CSVImportForm onAdd={handleAddCards} />
        <ContinueSentenceForm onContinue={continueSentence} onAdd={handleAddCards} />
        <AskAIForm onSuggest={suggestSentences} onAdd={handleAddCards} />
      </div>

      {status === 'loading' && <p style={{ color: '#94a3b8', textAlign: 'center' }}>載入中…</p>}

      {status === 'error' && (
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#ef4444' }}>{errorMessage}</p>
          <button className="btn btn-outline" onClick={loadCards}>重試</button>
        </div>
      )}

      {status === 'ready' && groups.length === 0 && (
        <p style={{ color: '#94a3b8', textAlign: 'center' }}>尚無任何卡片。完成一次 Live Speaking 或批次匯入後即可在此管理。</p>
      )}

      {status === 'ready' && groups.map(({ originalText, cards }) => {
        const isOpen = expandedGroups.has(originalText);
        const isDeleting = deletingGroup === originalText;
        return (
          <div key={originalText} style={{ marginBottom: '1rem', background: 'rgba(30, 41, 59, 0.8)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '1rem 1.25rem' }}>
              <button
                onClick={() => toggleGroup(originalText)}
                style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', padding: 0 }}
              >
                <span style={{ color: '#f1f5f9', fontWeight: 500 }}>{originalText}</span>
                <span style={{ color: '#64748b', fontSize: '0.85em', marginRight: '1rem' }}>
                  {cards.length} 張 {isOpen ? '▲' : '▼'}
                </span>
              </button>
              <button
                onClick={() => handleDeleteGroup(cards, originalText)}
                disabled={isDeleting}
                style={{ flexShrink: 0, fontSize: '0.8em', padding: '0.3rem 0.8rem', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '6px', cursor: 'pointer', opacity: isDeleting ? 0.5 : 1 }}
              >
                {isDeleting ? '刪除中…' : '刪除整組'}
              </button>
            </div>

            {isOpen && (
              <div style={{ padding: '0 1.25rem 1.25rem' }}>
                {cards.map(card => (
                  <CardItem key={card.id} card={card} onSave={updateCard} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
