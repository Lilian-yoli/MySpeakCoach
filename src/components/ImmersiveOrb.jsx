import './ImmersiveOrb.css';

export default function ImmersiveOrb({ isSpeaking, volume }) {
  const scale = isSpeaking ? 1 + (volume * 0.5) : 1;
  return (
    <div className="orb-wrapper" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div 
        className={`orb-container ${isSpeaking ? 'active' : ''}`}
        style={{
          width: '150px', height: '150px',
          borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)',
          transform: `scale(${scale})`,
          transition: 'transform 0.1s ease-out'
        }}
      ></div>
    </div>
  );
}
