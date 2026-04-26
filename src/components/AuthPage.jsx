import { useState } from 'react';

export default function AuthPage({ onLogin, onRegister }) {
    const [mode, setMode]         = useState('login'); // 'login' | 'register'
    const [account, setAccount]   = useState('');
    const [password, setPassword] = useState('');
    const [confirm,  setConfirm]  = useState('');
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState('');

    const switchMode = (m) => { setMode(m); setError(''); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (mode === 'register' && password !== confirm) {
            setError('兩次密碼輸入不一致');
            return;
        }
        if (password.length < 6) {
            setError('密碼至少 6 個字元');
            return;
        }

        setLoading(true);
        try {
            if (mode === 'login') {
                await onLogin(account.trim(), password);
            } else {
                await onRegister(account.trim(), password);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg, #0f172a)',
            padding: '1rem',
        }}>
            <div style={{
                width: '100%',
                maxWidth: '400px',
                background: 'rgba(30,41,59,0.9)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                padding: '2.5rem 2rem',
            }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc' }}>
                        <div className="logo-icon" />
                        MySpeak
                    </div>
                    <p style={{ color: '#64748b', fontSize: '0.85em', marginTop: '0.4rem' }}>
                        {mode === 'login' ? '登入以繼續學習' : '建立帳號，開始學習之旅'}
                    </p>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '4px', marginBottom: '1.75rem' }}>
                    {['login', 'register'].map(m => (
                        <button
                            key={m}
                            onClick={() => switchMode(m)}
                            style={{
                                flex: 1,
                                padding: '0.5rem',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.9em',
                                fontWeight: 500,
                                transition: 'all 0.15s',
                                background: mode === m ? 'rgba(99,102,241,0.9)' : 'transparent',
                                color: mode === m ? '#fff' : '#94a3b8',
                            }}
                        >
                            {m === 'login' ? '登入' : '註冊'}
                        </button>
                    ))}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8em', marginBottom: '0.4rem' }}>帳號</label>
                        <input
                            type="text"
                            value={account}
                            onChange={e => setAccount(e.target.value)}
                            placeholder="輸入帳號"
                            required
                            autoFocus
                            style={inputStyle}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8em', marginBottom: '0.4rem' }}>密碼</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="至少 6 個字元"
                            required
                            style={inputStyle}
                        />
                    </div>

                    {mode === 'register' && (
                        <div>
                            <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8em', marginBottom: '0.4rem' }}>確認密碼</label>
                            <input
                                type="password"
                                value={confirm}
                                onChange={e => setConfirm(e.target.value)}
                                placeholder="再次輸入密碼"
                                required
                                style={inputStyle}
                            />
                        </div>
                    )}

                    {error && (
                        <p style={{ color: '#ef4444', fontSize: '0.85em', margin: '0', padding: '0.5rem 0.75rem', background: 'rgba(239,68,68,0.1)', borderRadius: '6px' }}>
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading || !account.trim() || !password}
                        style={{ marginTop: '0.25rem', padding: '0.7rem', fontSize: '0.95em', fontWeight: 600 }}
                    >
                        {loading ? '處理中…' : mode === 'login' ? '登入' : '建立帳號'}
                    </button>
                </form>
            </div>
        </div>
    );
}

const inputStyle = {
    width: '100%',
    background: 'rgba(0,0,0,0.3)',
    color: '#f1f5f9',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '0.6rem 0.85rem',
    fontSize: '0.95em',
    boxSizing: 'border-box',
    outline: 'none',
};
