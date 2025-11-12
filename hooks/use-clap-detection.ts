import { useEffect, useRef, useCallback } from "react";

interface UseClapDetectionOptions {
  requiredClaps?: number;
  clapWindow?: number; // Time window for claps (ms)
  minTimeBetweenClaps?: number; // Minimum time between claps (ms)
  volumeThreshold?: number; // 0-255
  onClapDetected?: () => void;
  onProgressUpdate?: (count: number, total: number) => void;
}

export function useClapDetection(options: UseClapDetectionOptions = {}) {
  const {
    requiredClaps = 3,
    clapWindow = 2000,
    minTimeBetweenClaps = 200,
    volumeThreshold = 200,
    onClapDetected,
    onProgressUpdate,
  } = options;

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const clapCountRef = useRef<number>(0);
  const lastClapTimeRef = useRef<number>(0);
  const firstClapTimeRef = useRef<number>(0);

  const detectClap = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current) return;

    analyserRef.current.getByteTimeDomainData(dataArrayRef.current);

    // Calculate volume (deviation from 128, which is silence)
    let sum = 0;
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      const deviation = Math.abs(dataArrayRef.current[i] - 128);
      sum += deviation;
    }
    const average = sum / dataArrayRef.current.length;

    const now = Date.now();
    const timeSinceLastClap = now - lastClapTimeRef.current;

    // Detect a clap (loud sudden sound)
    if (average > volumeThreshold && timeSinceLastClap > minTimeBetweenClaps) {
      console.log("👏 CLAP detected! Volume:", average.toFixed(0));

      // First clap - start sequence
      if (clapCountRef.current === 0) {
        firstClapTimeRef.current = now;
        clapCountRef.current = 1;
        lastClapTimeRef.current = now;
        onProgressUpdate?.(1, requiredClaps);
        console.log(`Clap ${clapCountRef.current}/${requiredClaps}`);
      }
      // Subsequent claps - check timing
      else {
        const timeSinceFirst = now - firstClapTimeRef.current;

        // Within window - count it
        if (timeSinceFirst < clapWindow) {
          clapCountRef.current += 1;
          lastClapTimeRef.current = now;
          onProgressUpdate?.(clapCountRef.current, requiredClaps);
          console.log(`Clap ${clapCountRef.current}/${requiredClaps}`);

          // Check if we got all claps
          if (clapCountRef.current >= requiredClaps) {
            console.log("✨💥 ALL CLAPS DETECTED - SPELL CAST!");
            onClapDetected?.();
            clapCountRef.current = 0;
            firstClapTimeRef.current = 0;
            onProgressUpdate?.(0, requiredClaps);
          }
        }
        // Outside window - reset and start new sequence
        else {
          console.log("⏱️ Clap window expired - starting new sequence");
          firstClapTimeRef.current = now;
          clapCountRef.current = 1;
          lastClapTimeRef.current = now;
          onProgressUpdate?.(1, requiredClaps);
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(detectClap);
  }, [
    volumeThreshold,
    minTimeBetweenClaps,
    clapWindow,
    requiredClaps,
    onClapDetected,
    onProgressUpdate,
  ]);

  useEffect(() => {
    const initAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: false,
          },
        });

        const audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);

        analyser.fftSize = 512;
        microphone.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        dataArrayRef.current = dataArray;

        console.log("🎤 Microphone initialized for clap detection");
        detectClap();
      } catch (error) {
        console.error("Error accessing microphone:", error);
      }
    };

    initAudio();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [detectClap]);

  return {};
}
