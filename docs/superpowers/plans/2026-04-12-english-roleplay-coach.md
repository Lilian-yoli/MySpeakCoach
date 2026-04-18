# English Role-Play Coach Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a voice-first immersive English Role-Play web app that provides a continuous conversational experience and post-session refinement feedback.

**Architecture:** A Vite+React frontend using custom hooks (`useAudioStreamer`, `useSessionManager`) to handle MediaRecorder and transcript state. The UI transitions from a landing page, to an immersive pulsing orb, to a post-session refinement dashboard.

**Tech Stack:** React 18, Vite, Vitest (for TDD).

---

### Task 1: Test Environment Setup & State Management Hooks

**Files:**
- Modify: `package.json`
- Create: `vite.config.js`
- Create: `src/hooks/useSessionManager.js`
- Create: `src/hooks/useSessionManager.test.js`

- [ ] **Step 1: Install testing dependencies**
```bash
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 2: Write failing test for useSessionManager**
```javascript
// src/hooks/useSessionManager.test.js
import { renderHook, act } from '@testing-library/react';
import { expect, test } from 'vitest';
import { useSessionManager } from './useSessionManager';

test('manages session state correctly', () => {
  const { result } = renderHook(() => useSessionManager());
  expect(result.current.isActive).toBe(false);
  expect(result.current.transcript).toEqual([]);

  act(() => {
    result.current.startSession();
  });
  expect(result.current.isActive).toBe(true);

  act(() => {
    result.current.addTranscript('user', 'Hello');
  });
  expect(result.current.transcript).toHaveLength(1);
  expect(result.current.transcript[0]).toEqual({ role: 'user', text: 'Hello' });

  act(() => {
    result.current.endSession();
  });
  expect(result.current.isActive).toBe(false);
});
```

- [ ] **Step 3: Run test to verify it fails**
```bash
npx vitest run src/hooks/useSessionManager.test.js
```
Expected: FAIL due to missing module.

- [ ] **Step 4: Implement minimal code to pass test**
```javascript
// src/hooks/useSessionManager.js
import { useState, useCallback } from 'react';

export function useSessionManager() {
  const [isActive, setIsActive] = useState(false);
  const [transcript, setTranscript] = useState([]);

  const startSession = useCallback(() => {
    setIsActive(true);
    setTranscript([]);
  }, []);

  const addTranscript = useCallback((role, text) => {
    setTranscript(prev => [...prev, { role, text }]);
  }, []);

  const endSession = useCallback(() => {
    setIsActive(false);
  }, []);

  return { isActive, transcript, startSession, addTranscript, endSession };
}
```

- [ ] **Step 5: Run test to verify it passes**
```bash
npx vitest run src/hooks/useSessionManager.test.js
```
Expected: PASS

- [ ] **Step 6: Commit**
```bash
git add package.json package-lock.json src/hooks/useSessionManager.js src/hooks/useSessionManager.test.js
git commit -m "feat: add session manager hook and test framework"
```

---

### Task 2: Immersive Visual Component (The Orb)

**Files:**
- Create: `src/components/ImmersiveOrb.jsx`
- Create: `src/components/ImmersiveOrb.css`
- Create: `src/components/ImmersiveOrb.test.jsx`

- [ ] **Step 1: Write failing test for ImmersiveOrb**
```javascript
// src/components/ImmersiveOrb.test.jsx
import { render } from '@testing-library/react';
import { expect, test } from 'vitest';
import ImmersiveOrb from './ImmersiveOrb';

test('renders orb with active state', () => {
  const { container } = render(<ImmersiveOrb isSpeaking={true} volume={0.5} />);
  const orb = container.querySelector('.orb-container');
  expect(orb).not.toBeNull();
  expect(orb.className).toContain('active');
});
```

- [ ] **Step 2: Run test to verify it fails**
```bash
npx vitest run src/components/ImmersiveOrb.test.jsx
```
Expected: FAIL.

- [ ] **Step 3: Implement ImmersiveOrb component and styling**
```javascript
// src/components/ImmersiveOrb.jsx
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
```

```css
/* src/components/ImmersiveOrb.css */
.orb-container {
  box-shadow: 0 0 20px rgba(99, 102, 241, 0.4);
}
.orb-container.active {
  box-shadow: 0 0 40px rgba(99, 102, 241, 0.8), 0 0 80px rgba(168, 85, 247, 0.6);
  animation: pulse-glow 2s infinite alternate;
}
@keyframes pulse-glow {
  0% { filter: brightness(1); }
  100% { filter: brightness(1.3); }
}
```

- [ ] **Step 4: Run test to verify it passes**
```bash
npx vitest run src/components/ImmersiveOrb.test.jsx
```
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/components/ImmersiveOrb*
git commit -m "feat: add immersive orb UI component"
```

---

### Task 3: Refinement Dashboard & App Orchestration

**Files:**
- Create: `src/components/RefinementDashboard.jsx`
- Modify: `src/App.jsx`
- Modify: `src/index.css`

- [ ] **Step 1: Implement RefinementDashboard visually**
```javascript
// src/components/RefinementDashboard.jsx
export default function RefinementDashboard({ transcript, onRestart }) {
  // Filter only user messages
  const userMessages = transcript.filter(t => t.role === 'user');
  
  return (
    <div className="dashboard">
      <h2>Session Refinement</h2>
      {userMessages.length === 0 ? <p>No speaking detected.</p> : (
        <ul className="refinement-list" style={{ listStyle: 'none', padding: 0 }}>
          {userMessages.map((msg, idx) => (
            <li key={idx} style={{ marginBottom: '1rem', padding: '1rem', background: '#1e293b', borderRadius: '8px' }}>
              <p style={{ color: '#94a3b8', fontSize: '0.9em', margin: 0 }}>What you said:</p>
              <p style={{ margin: '0 0 10px 0' }}>"{msg.text}"</p>
              <p style={{ color: '#10b981', fontSize: '0.9em', margin: 0 }}>Native speaker tone:</p>
              <p style={{ margin: 0 }}>"{msg.text} (Refined version here)"</p>
            </li>
          ))}
        </ul>
      )}
      <button className="btn btn-primary" onClick={onRestart}>Start New Session</button>
    </div>
  );
}
```

- [ ] **Step 2: Orchestrate via App.jsx**
```javascript
// src/App.jsx (replace entirely)
import { useState } from 'react';
import './App.css';
import { useSessionManager } from './hooks/useSessionManager';
import ImmersiveOrb from './components/ImmersiveOrb';
import RefinementDashboard from './components/RefinementDashboard';

function App() {
  const { isActive, transcript, startSession, endSession, addTranscript } = useSessionManager();
  const [showDashboard, setShowDashboard] = useState(false);

  const handleStart = () => {
    setShowDashboard(false);
    startSession();
    // Provide a mocked sequence of conversational additions
    setTimeout(() => addTranscript('ai', 'Hello! What topic would you like to role-play today?'), 1000);
    setTimeout(() => addTranscript('user', 'I want to order food at a restaurant.'), 4000);
  };

  const handleEnd = () => {
    endSession();
    setShowDashboard(true);
  };

  if (isActive) {
    return (
      <div className="active-session" style={{ textAlign: 'center', height: '100vh', display: 'flex', flexDirection: 'column', padding: '2rem' }}>
        <button onClick={handleEnd} style={{ alignSelf: 'flex-end', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>End Session</button>
        <ImmersiveOrb isSpeaking={true} volume={0.8} />
        <p style={{ color: '#fff' }}>Listening to you...</p>
      </div>
    );
  }

  if (showDashboard) {
    return (
      <div className="app-container" style={{ padding: '2rem' }}>
        <RefinementDashboard transcript={transcript} onRestart={handleStart} />
      </div>
    );
  }

  // Original UI
  return (
    <div className="app-container" style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Master any language with intelligent coaching.</h1>
      <button className="btn btn-primary btn-large" onClick={handleStart}>Start Immersive Session</button>
    </div>
  );
}

export default App;
```

- [ ] **Step 3: Run full manual tests / App check**
Run `npm run dev` and click through the "Start" → "End" workflow to verify state transitions and the transcript mockup rendering.

- [ ] **Step 4: Commit**
```bash
git add src/components/RefinementDashboard.jsx src/App.jsx
git commit -m "feat: complete end-to-end app orchestration and dashboard"
```
