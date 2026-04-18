import { useState, useRef, useCallback } from 'react';

// Helper to encode ArrayBuffer to Base64
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function useAudioStreamer(onPcmBase64Data) {
  const [isRecording, setIsRecording] = useState(false);
  const [volume, setVolume] = useState(0);
  const [error, setError] = useState(null);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const streamRef = useRef(null);
  const workletNodeRef = useRef(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Gemini requires exactly 16kHz sample rate
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;

      // Load PCM parsing worklet
      await audioCtx.audioWorklet.addModule('/pcm-processor.js');
      const pcmNode = new AudioWorkletNode(audioCtx, 'pcm-processor');
      workletNodeRef.current = pcmNode;

      // Handle decoded chunks
      pcmNode.port.onmessage = (event) => {
        if (onPcmBase64Data) {
          const base64Str = arrayBufferToBase64(event.data);
          onPcmBase64Data(base64Str);
        }
      };

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.connect(pcmNode);
      // We don't connect pcmNode to destination to prevent feedback loop

      const updateVolume = () => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        setVolume(Math.min((sum / dataArray.length) / 100, 1));
        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();

      setIsRecording(true);
      setError(null);

    } catch (err) {
      console.error('Microphone Error:', err);
      setError('Could not access microphone.');
      setIsRecording(false);
    }
  }, [onPcmBase64Data]);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    if (workletNodeRef.current) workletNodeRef.current.disconnect();
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') audioContextRef.current.close().catch(console.error);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    setVolume(0);
  }, []);

  return { isRecording, volume, error, startRecording, stopRecording };
}
