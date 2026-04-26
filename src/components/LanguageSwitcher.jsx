import { useState } from 'react';
import { SUPPORTED_LANGUAGES } from '../constants/languages';

export default function LanguageSwitcher({ registeredLangs, activeLang, onSwitch, onAdd, onRemove }) {
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(null);

  const handleAdd = async (code) => {
    setAdding(code);
    try {
      await onAdd(code);
      setShowAdd(false);
    } finally {
      setAdding(null);
    }
  };

  const unregistered = Object.keys(SUPPORTED_LANGUAGES).filter(c => !registeredLangs.includes(c));

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
      {/* Registered language chips */}
      {registeredLangs.map(code => {
        const lang = SUPPORTED_LANGUAGES[code];
        if (!lang) return null;
        const isActive = code === activeLang;
        return (
          <button
            key={code}
            onClick={() => onSwitch(code)}
            title={lang.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.3rem 0.65rem',
              borderRadius: '20px',
              border: isActive ? '1.5px solid rgba(99,102,241,0.8)' : '1.5px solid rgba(255,255,255,0.12)',
              background: isActive ? 'rgba(99,102,241,0.2)' : 'transparent',
              color: isActive ? '#a5b4fc' : '#94a3b8',
              cursor: 'pointer',
              fontSize: '0.8em',
              fontWeight: isActive ? 600 : 400,
              transition: 'all 0.15s',
            }}
          >
            <span>{lang.flag}</span>
            <span>{lang.label}</span>
          </button>
        );
      })}

      {/* Add language button */}
      {unregistered.length > 0 && (
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowAdd(v => !v)}
            title="新增學習語言"
            style={{
              width: '28px', height: '28px',
              borderRadius: '50%',
              border: '1.5px solid rgba(255,255,255,0.15)',
              background: 'transparent',
              color: '#64748b',
              cursor: 'pointer',
              fontSize: '1rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              lineHeight: 1,
            }}
          >
            +
          </button>

          {showAdd && (
            <div style={{
              position: 'absolute',
              top: '36px',
              right: 0,
              background: '#1e293b',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              padding: '0.5rem',
              zIndex: 100,
              minWidth: '160px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}>
              <p style={{ color: '#64748b', fontSize: '0.75em', margin: '0 0 0.5rem 0.5rem' }}>新增學習語言</p>
              {unregistered.map(code => {
                const lang = SUPPORTED_LANGUAGES[code];
                return (
                  <button
                    key={code}
                    onClick={() => handleAdd(code)}
                    disabled={adding === code}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      width: '100%',
                      padding: '0.45rem 0.65rem',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#f1f5f9',
                      cursor: 'pointer',
                      fontSize: '0.88em',
                      textAlign: 'left',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                    {adding === code && <span style={{ marginLeft: 'auto', color: '#64748b', fontSize: '0.8em' }}>加入中…</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
