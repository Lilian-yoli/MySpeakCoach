export default function RefinementDashboard({ transcript, onRestart }) {
  // Filter only user messages
  const userMessages = transcript.filter(t => t.role === 'user');
  
  return (
    <div className="dashboard" style={{
      maxWidth: '800px', margin: '0 auto', textAlign: 'left',
      background: 'rgba(30, 41, 59, 0.8)', padding: '2rem', borderRadius: '12px',
      backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)'
    }}>
      <h2 style={{ color: '#f8fafc', marginBottom: '1.5rem', textAlign: 'center' }}>Session Refinement</h2>
      {userMessages.length === 0 ? <p style={{textAlign: 'center', color: '#94a3b8'}}>No speaking detected during the session.</p> : (
        <ul className="refinement-list" style={{ listStyle: 'none', padding: 0 }}>
          {userMessages.map((msg, idx) => (
            <li key={idx} style={{ marginBottom: '1rem', padding: '1.5rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '8px', borderLeft: '4px solid #6366f1' }}>
              <p style={{ color: '#94a3b8', fontSize: '0.85em', margin: '0 0 5px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>What you said</p>
              <p style={{ margin: '0 0 15px 0', fontSize: '1.1em', color: '#f1f5f9' }}>"{msg.text}"</p>
              <p style={{ color: '#10b981', fontSize: '0.85em', margin: '0 0 5px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Native speaker tone</p>
              <p style={{ margin: 0, fontSize: '1.1em', color: '#f1f5f9' }}>"{msg.text} (Refined phrasing goes here)"</p>
            </li>
          ))}
        </ul>
      )}
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <button className="btn btn-primary btn-large" onClick={onRestart}>Start New Session</button>
      </div>
    </div>
  );
}
