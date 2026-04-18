import { useState, useCallback, useRef } from 'react';
import './App.css';
import { useSessionManager } from './hooks/useSessionManager';
import { useAudioStreamer } from './hooks/useAudioStreamer';
import { GeminiLiveClient } from './services/GeminiLiveClient';
import ImmersiveOrb from './components/ImmersiveOrb';
import RefinementDashboard from './components/RefinementDashboard';

function App() {
  const { isActive, transcript, startSession, endSession, addTranscript } = useSessionManager();
  const [showDashboard, setShowDashboard] = useState(false);
  const geminiClientRef = useRef(null);
  const playbackCtxRef = useRef(null);

  const audioQueueRef = useRef(0);

  const handleAIAudioResponse = useCallback((base64PCM) => {
    console.log('[App] 🔊 AI audio chunk received, length:', base64PCM.length);
    if (!playbackCtxRef.current) {
      console.warn('[App] No playback context!');
      return;
    }
    
    const binary = window.atob(base64PCM);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const int16 = new Int16Array(bytes.buffer);
    
    const audioCtx = playbackCtxRef.current;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768.0;

    const audioBuffer = audioCtx.createBuffer(1, float32.length, 24000);
    audioBuffer.getChannelData(0).set(float32);
    
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);
    
    // Manage playback queue
    const currentTime = audioCtx.currentTime;
    if (audioQueueRef.current < currentTime) {
      audioQueueRef.current = currentTime;
    }
    source.start(audioQueueRef.current);
    audioQueueRef.current += audioBuffer.duration;
  }, []);

  const handleTurnComplete = useCallback(() => {
    console.log('[App] AI turn complete');
  }, []);

  const handleAudioData = useCallback((base64PcmChunk) => {
    if (geminiClientRef.current) {
      geminiClientRef.current.sendAudio(base64PcmChunk);
    }
  }, []);

  const { isRecording, volume, error, startRecording, stopRecording } = useAudioStreamer(handleAudioData);

  const handleStart = async () => {
    setShowDashboard(false);
    startSession();
    await startRecording();
    
    // Connect to actual Gemini API!
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    geminiClientRef.current = new GeminiLiveClient(apiKey, handleAIAudioResponse, handleTurnComplete);
    
    // Initialize playback context securely during the click event
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    playbackCtxRef.current = new AudioContextClass({ sampleRate: 24000 });
    audioQueueRef.current = playbackCtxRef.current.currentTime;

    try {
      console.log('[App] Attempting Gemini connection...');
      await geminiClientRef.current.connect(
        "You are an English role-play assistant. Keep your responses under 3 sentences. Be extremely concise. Focus on immersive back-and-forth conversation."
      );
      console.log('[App] ✅ Connected! Sending initial text...');
      addTranscript('sys', 'Connected to Gemini Live');
      
      // Proactively trigger the AI to start speaking
      geminiClientRef.current.sendText("Hello! Please greet me briefly and ask what topic I want to role-play today.");
      console.log('[App] Initial text sent.');
    } catch(err) {
      console.error(err);
      addTranscript('sys', 'Failed to connect. Did you add VITE_GEMINI_API_KEY to .env.local?');
    }
  };

  const handleEnd = () => {
    if (geminiClientRef.current) geminiClientRef.current.disconnect();
    if (playbackCtxRef.current) {
      playbackCtxRef.current.close().catch(console.error);
      playbackCtxRef.current = null;
    }
    stopRecording();
    endSession();
    setShowDashboard(true);
  };

  if (isActive) {
    return (
      <div className="active-session" style={{ textAlign: 'center', height: '100vh', display: 'flex', flexDirection: 'column', padding: '2rem' }}>
        <div style={{ alignSelf: 'flex-end' }}>
          <button className="btn btn-outline" onClick={handleEnd} style={{ padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>End Session</button>
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

  if (showDashboard) {
    return (
      <div className="app-container" style={{ padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <RefinementDashboard transcript={transcript} onRestart={handleStart} />
      </div>
    );
  }

  // Original Landing Page UI
  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="logo">
          <div className="logo-icon"></div>
          MySpeak
        </div>
        <div className="nav-links">
          <a href="#features" className="nav-link">Features</a>
          <a href="#pricing" className="nav-link">Pricing</a>
          <a href="#community" className="nav-link">Community</a>
        </div>
        <div className="auth-buttons">
          <button className="btn btn-ghost">Log In</button>
          <button className="btn btn-primary">Get Started</button>
        </div>
      </nav>

      <main className="hero">
        <div className="badge">Beta Available Now</div>
        <h1 className="hero-title">
          Master any language with <span>intelligent</span> coaching.
        </h1>
        <p className="hero-desc">
          MySpeak uses cutting-edge AI to analyze your pronunciation, provide real-time feedback, and help you speak with absolute confidence.
        </p>
        <div className="hero-actions">
          <button className="btn btn-primary btn-large" onClick={handleStart}>Start Immersive Session</button>
        </div>
      </main>
    </div>
  );
}

export default App;
