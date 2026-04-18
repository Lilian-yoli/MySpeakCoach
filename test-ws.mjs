const API_KEY = process.argv[2];
const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${API_KEY}`;

import('ws').then(({ default: WebSocket }) => {
  const ws = new WebSocket(url);
  ws.on('open', () => {
    console.log('OPEN');
    const setupMsg = {
      setup: {
        model: 'models/gemini-3.1-flash-live-preview',
        generationConfig: {
          responseModalities: ['AUDIO']
        }
      }
    };
    ws.send(JSON.stringify(setupMsg));
  });

  ws.on('message', (d) => {
    const str = d.toString();
    console.log('MSG:', str.substring(0, 300));
    if (str.includes("setupComplete")) {
      const audioMsg = {
        realtimeInput: {
          audio: {
            mimeType: "audio/pcm",
            data: "YWFh"
          }
        }
      };
      console.log("SENDING audio using audio:", JSON.stringify(audioMsg));
      ws.send(JSON.stringify(audioMsg));
    }
  });
  ws.on('error', (e) => { console.log('ERR:', e.message); });
  ws.on('close', (code, reason) => { console.log('CLOSE:', code, reason.toString()); process.exit(); });
  setTimeout(() => process.exit(), 5000);
});
