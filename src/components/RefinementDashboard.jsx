import { useState } from 'react';

const API_BASE = 'http://localhost:3001/api';

export default function RefinementDashboard({ transcript, onRestart }) {
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'done' | 'error'
  const [pairs, setPairs] = useState([]);
  const [cardsCreated, setCardsCreated] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const userUtterances = transcript
    .filter(t => t.role === 'user')
    .map(t => t.text);

  const handleRefineAndSave = async () => {
    setStatus('loading');
    setErrorMessage('');
    try {
      const res = await fetch(`${API_BASE}/cards/refine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ utterances: userUtterances }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Refinement failed');

      setPairs(json.pairs);
      setCardsCreated(json.cardsCreated);
      setStatus('done');
    } catch (err) {
      setErrorMessage(err.message);
      setStatus('error');
    }
  };

  return (
    <div style={{
      maxWidth: '800px', margin: '0 auto', textAlign: 'left',
      background: 'rgba(30, 41, 59, 0.8)', padding: '2rem', borderRadius: '12px',
      backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)'
    }}>
      <h2 style={{ color: '#f8fafc', marginBottom: '1.5rem', textAlign: 'center' }}>Session Refinement</h2>

      {userUtterances.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#94a3b8' }}>No speaking detected during the session.</p>
      ) : status === 'idle' ? (
        <>
          <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem' }}>
            {userUtterances.map((text, idx) => (
              <li key={idx} style={{ marginBottom: '0.75rem', padding: '1rem 1.25rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '8px', borderLeft: '4px solid #6366f1' }}>
                <p style={{ color: '#94a3b8', fontSize: '0.8em', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>What you said</p>
                <p style={{ margin: 0, color: '#f1f5f9' }}>"{text}"</p>
              </li>
            ))}
          </ul>
          <div style={{ textAlign: 'center' }}>
            <button className="btn btn-primary btn-large" onClick={handleRefineAndSave}>
              Refine &amp; Save to Cards
            </button>
          </div>
        </>
      ) : status === 'loading' ? (
        <p style={{ textAlign: 'center', color: '#94a3b8' }}>Refining with AI and saving cards…</p>
      ) : status === 'error' ? (
        <>
          <p style={{ textAlign: 'center', color: '#ef4444' }}>{errorMessage}</p>
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button className="btn btn-outline" onClick={() => setStatus('idle')}>Try Again</button>
          </div>
        </>
      ) : (
        <>
          <p style={{ textAlign: 'center', color: '#10b981', marginBottom: '1.5rem' }}>
            {cardsCreated} card{cardsCreated !== 1 ? 's' : ''} saved to your deck.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem' }}>
            {pairs.map((pair, idx) => (
              <li key={idx} style={{ marginBottom: '1rem', padding: '1.25rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '8px', borderLeft: '4px solid #6366f1' }}>
                <p style={{ color: '#94a3b8', fontSize: '0.8em', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>What you said</p>
                <p style={{ margin: '0 0 12px 0', color: '#94a3b8' }}>"{pair.original}"</p>
                <p style={{ color: '#10b981', fontSize: '0.8em', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Native speaker tone</p>
                <p style={{ margin: 0, color: '#f1f5f9' }}>"{pair.refined}"</p>
              </li>
            ))}
          </ul>
        </>
      )}

      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        <button className="btn btn-outline" onClick={onRestart}>Start New Session</button>
      </div>
    </div>
  );
}
