import { useState, useCallback, useRef } from 'react';
import './App.css';
import { useSessionManager } from './hooks/useSessionManager';
import { useAudioStreamer } from './hooks/useAudioStreamer';
import { useAuth } from './hooks/useAuth';
import { useLanguage } from './hooks/useLanguage';
import { GeminiLiveClient } from './services/GeminiLiveClient';
import ImmersiveOrb from './components/ImmersiveOrb';
import RefinementDashboard from './components/RefinementDashboard';
import ReviewSessionPage from './components/ReviewSessionPage';
import CardManagerPage from './components/CardManagerPage';
import AuthPage from './components/AuthPage';
import LanguageSwitcher from './components/LanguageSwitcher';
import { SUPPORTED_LANGUAGES } from './constants/languages';

function App() {
  const { isLoggedIn, user, login, register, logout } = useAuth();
  const { registeredLangs, activeLang, setActiveLang, addLanguage, removeLanguage } = useLanguage();
  const { isActive, transcript, startSession, endSession, addTranscript } = useSessionManager();
  const [currentView, setCurrentView] = useState('landing');
  const geminiClientRef = useRef(null);
  const playbackCtxRef = useRef(null);
  const audioQueueRef = useRef(0);

  const handleAIAudioResponse = useCallback((base64PCM) => {
    if (!playbackCtxRef.current) return;
    const binary = window.atob(base64PCM);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const int16 = new Int16Array(bytes.buffer);
    const audioCtx = playbackCtxRef.current;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768.0;
    const audioBuffer = audioCtx.createBuffer(1, float32.length, 24000);
    audioBuffer.getChannelData(0).set(float32);
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);
    const currentTime = audioCtx.currentTime;
    if (audioQueueRef.current < currentTime) audioQueueRef.current = currentTime;
    source.start(audioQueueRef.current);
    audioQueueRef.current += audioBuffer.duration;
  }, []);

  const handleTurnComplete = useCallback(() => {}, []);

  const handleAudioData = useCallback((base64PcmChunk) => {
    if (geminiClientRef.current) geminiClientRef.current.sendAudio(base64PcmChunk);
  }, []);

  const { isRecording, volume, error, startRecording, stopRecording } = useAudioStreamer(handleAudioData);

  const handleStartLiveSpeak = async () => {
    setCurrentView('live-speak');
    startSession();
    await startRecording();

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    geminiClientRef.current = new GeminiLiveClient(apiKey, handleAIAudioResponse, handleTurnComplete, addTranscript);

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    playbackCtxRef.current = new AudioContextClass({ sampleRate: 24000 });
    audioQueueRef.current = playbackCtxRef.current.currentTime;

    const langName = SUPPORTED_LANGUAGES[activeLang]?.name ?? 'English';
    try {
      await geminiClientRef.current.connect(
        `You are a ${langName} role-play assistant. Keep your responses under 3 sentences. Be extremely concise. Focus on immersive back-and-forth conversation in ${langName}.`
      );
      addTranscript('sys', 'Connected to Gemini Live');
      geminiClientRef.current.sendText(`Hello! Please greet me briefly in ${langName} and ask what topic I want to role-play today.`);
    } catch (err) {
      console.error(err);
      addTranscript('sys', 'Failed to connect. Did you add VITE_GEMINI_API_KEY to .env.local?');
    }
  };

  const handleEndLiveSpeak = () => {
    if (geminiClientRef.current) geminiClientRef.current.disconnect();
    if (playbackCtxRef.current) {
      playbackCtxRef.current.close().catch(console.error);
      playbackCtxRef.current = null;
    }
    stopRecording();
    endSession();
    setCurrentView('dashboard');
  };

  const resetToLanding = () => setCurrentView('landing');

  // Shared navbar for sub-pages
  const SubNav = () => (
    <nav className="navbar">
      <div className="logo cursor-pointer" onClick={resetToLanding}>
        <div className="logo-icon" />
        MySpeak
      </div>
      <LanguageSwitcher
        registeredLangs={registeredLangs}
        activeLang={activeLang}
        onSwitch={setActiveLang}
        onAdd={addLanguage}
        onRemove={removeLanguage}
      />
    </nav>
  );

  if (!isLoggedIn) {
    return <AuthPage onLogin={login} onRegister={register} />;
  }

  if (currentView === 'live-speak' && isActive) {
    return (
      <div className="active-session" style={{ textAlign: 'center', height: '100vh', display: 'flex', flexDirection: 'column', padding: '2rem' }}>
        <div style={{ alignSelf: 'flex-end' }}>
          <button className="btn btn-outline" onClick={handleEndLiveSpeak}>End Session</button>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {error ? (
            <p style={{ color: '#ef4444' }}>{error}</p>
          ) : (
            <>
              <ImmersiveOrb isSpeaking={isRecording} volume={volume} />
              <p style={{ color: '#fff', marginTop: '2rem', fontSize: '1.2rem', fontWeight: '300' }}>
                {isRecording ? "Listening & Recording..." : "Connecting microphone..."}
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  if (currentView === 'dashboard') {
    return (
      <div className="app-container" style={{ padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <RefinementDashboard transcript={transcript} onRestart={handleStartLiveSpeak} />
      </div>
    );
  }

  if (currentView === 'memory-cards') {
    return (
      <div className="app-container">
        <SubNav />
        <ReviewSessionPage onBack={resetToLanding} activeLang={activeLang} />
      </div>
    );
  }

  if (currentView === 'card-manager') {
    return (
      <div className="app-container">
        <SubNav />
        <CardManagerPage onBack={resetToLanding} activeLang={activeLang} />
      </div>
    );
  }

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="logo">
          <div className="logo-icon"></div>
          MySpeak
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <LanguageSwitcher
            registeredLangs={registeredLangs}
            activeLang={activeLang}
            onSwitch={setActiveLang}
            onAdd={addLanguage}
            onRemove={removeLanguage}
          />
          <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ color: '#94a3b8', fontSize: '0.85em' }}>{user?.account}</span>
          <button className="btn btn-ghost" onClick={logout} style={{ fontSize: '0.85em' }}>登出</button>
        </div>
      </nav>

      <main className="hero">
        <div className="badge">Beta Available Now</div>
        <h1 className="hero-title">
          Master any language with <span>intelligent</span> coaching.
        </h1>
        <p className="hero-desc">
          Choose your learning path. Deep immersion or targeted practice.
        </p>

        <div className="hero-actions">
          <div className="feature-select-card" onClick={handleStartLiveSpeak}>
            <div className="feature-icon">🎙️</div>
            <h3>Live Speaking</h3>
            <p>Real-time AI conversation practice</p>
            <button className="btn btn-primary">Start Speaking</button>
          </div>

          <div className="feature-select-card" onClick={() => setCurrentView('memory-cards')}>
            <div className="feature-icon">🎴</div>
            <h3>Memory Cards</h3>
            <p>Master vocabulary with AI smart cards</p>
            <button className="btn btn-outline">Explore Cards</button>
          </div>

          <div className="feature-select-card" onClick={() => setCurrentView('card-manager')}>
            <div className="feature-icon">🗂️</div>
            <h3>Card Library</h3>
            <p>View, edit, and manage your saved cards</p>
            <button className="btn btn-outline">Manage Cards</button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
