export class GeminiLiveClient {
  constructor(apiKey, onAudioChunk, onTurnComplete) {
    this.apiKey = apiKey;
    this.socket = null;
    this.onAudioChunk = onAudioChunk;   // (base64Audio) => void
    this.onTurnComplete = onTurnComplete; // () => void
    this.isSetupComplete = false;
  }

  connect(systemInstruction) {
    return new Promise((resolve, reject) => {
      if (!this.apiKey) {
        reject(new Error("Missing VITE_GEMINI_API_KEY"));
        return;
      }

      // Official endpoint uses v1beta, NOT v1alpha
      const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${this.apiKey}`;
      console.log("[Gemini] Connecting to WebSocket...");
      this.socket = new WebSocket(url);
      this.socket.binaryType = 'arraybuffer';

      this.socket.onopen = () => {
        console.log("[Gemini] WebSocket opened.");
        const setupMessage = {
          setup: {
            model: "models/gemini-3.1-flash-live-preview",
            generationConfig: {
              responseModalities: ["AUDIO"]
            },
            systemInstruction: {
              parts: [{ text: systemInstruction }]
            }
          }
        };
        this.socket.send(JSON.stringify(setupMessage));
        console.log("[Gemini] Setup sent at", Date.now());
        this._setupSentAt = Date.now();
      };

      this.socket.onmessage = (event) => {
        // Decode ArrayBuffer to string
        let msgStr;
        if (event.data instanceof ArrayBuffer) {
          msgStr = new TextDecoder().decode(event.data);
        } else if (typeof event.data === 'string') {
          msgStr = event.data;
        } else {
          console.warn("[Gemini] Unknown message type:", typeof event.data);
          return;
        }

        let msg;
        try {
          msg = JSON.parse(msgStr);
        } catch (e) {
          console.error("[Gemini] Failed to parse:", e, msgStr.substring(0, 200));
          return;
        }

        // 1) Setup complete acknowledgment
        if (msg.setupComplete !== undefined) {
          console.log("[Gemini] ✅ Setup complete! Elapsed:", Date.now() - this._setupSentAt, "ms");
          this.isSetupComplete = true;
          this._audioSendCount = 0;
          resolve();
          return;
        }

        // 2) Model audio response
        if (msg.serverContent && msg.serverContent.modelTurn) {
          const parts = msg.serverContent.modelTurn.parts;
          if (parts) {
            for (const part of parts) {
              if (part.inlineData && part.inlineData.data) {
                console.log("[Gemini] 🔊 Audio chunk, size:", part.inlineData.data.length);
                if (this.onAudioChunk) this.onAudioChunk(part.inlineData.data);
              }
            }
          }
        }

        // 3) Transcription data
        if (msg.serverContent && msg.serverContent.inputTranscription) {
          console.log("[Gemini] 🎤 User said:", msg.serverContent.inputTranscription.text);
        }
        if (msg.serverContent && msg.serverContent.outputTranscription) {
          console.log("[Gemini] 🤖 AI said:", msg.serverContent.outputTranscription.text);
        }

        // 4) Turn complete
        if (msg.serverContent && msg.serverContent.turnComplete) {
          console.log("[Gemini] Turn complete");
          if (this.onTurnComplete) this.onTurnComplete();
        }
      };

      this.socket.onerror = (err) => {
        console.error("[Gemini] ❌ WebSocket error:", err);
        reject(err);
      };

      this.socket.onclose = (event) => {
        console.warn(`[Gemini] WebSocket closed: ${event.code} ${event.reason}`);
        console.warn(`[Gemini] isSetupComplete: ${this.isSetupComplete}, audioChunksSent: ${this._audioSendCount || 0}`);
        if (!this.isSetupComplete) {
          reject(new Error(`WebSocket closed before setup: ${event.code} ${event.reason}`));
        }
      };
    });
  }

  sendAudio(base64Pcm) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN && this.isSetupComplete) {
      this._audioSendCount = (this._audioSendCount || 0) + 1;
      if (this._audioSendCount <= 3) {
        console.log(`[Gemini] Sending audio chunk #${this._audioSendCount}, length: ${base64Pcm.length}`);
      }
      const payload = {
        realtimeInput: {
          audio: {
            mimeType: "audio/pcm;rate=16000",
            data: base64Pcm
          }
        }
      };
      this.socket.send(JSON.stringify(payload));
    }
  }

  sendText(text) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN && this.isSetupComplete) {
      console.log("[Gemini] Sending text:", text);
      const payload = {
        realtimeInput: {
          text: text
        }
      };
      this.socket.send(JSON.stringify(payload));
    } else {
      console.warn("[Gemini] Cannot send text — socket not ready or setup not complete");
    }
  }

  disconnect() {
    console.log("[Gemini] Disconnecting...");
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isSetupComplete = false;
  }
}
