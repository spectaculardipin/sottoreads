import { useCallback, useEffect, useRef, useState } from 'react';

interface SampleVoice {
  playing: boolean;
  activeWord: number;
  play: (text: string) => void;
  stop: () => void;
}

export function useSampleVoice(): SampleVoice {
  const [playing, setPlaying] = useState(false);
  const [activeWord, setActiveWord] = useState(-1);
  const timerRef = useRef<number | null>(null);
  const activeRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const finish = useCallback(() => {
    activeRef.current = false;
    clearTimer();
    setPlaying(false);
    setActiveWord(-1);
  }, [clearTimer]);

  const stop = useCallback(() => {
    activeRef.current = false;
    clearTimer();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setPlaying(false);
    setActiveWord(-1);
  }, [clearTimer]);

  const play = useCallback(
    (text: string) => {
      if (activeRef.current) {
        stop();
        return;
      }

      const words = text.split(/\s+/).filter(Boolean);
      if (words.length === 0) return;

      activeRef.current = true;
      setPlaying(true);
      setActiveWord(0);

      let fallbackIndex = 0;
      let boundarySeen = false;

      const step = () => {
        if (!activeRef.current || boundarySeen) return;
        if (fallbackIndex >= words.length) {
          finish();
          return;
        }
        const word = words[fallbackIndex] ?? '';
        setActiveWord(fallbackIndex);
        fallbackIndex += 1;
        timerRef.current = window.setTimeout(step, 330 + Math.min(430, word.length * 34));
      };

      timerRef.current = window.setTimeout(step, 460);

      if (!('speechSynthesis' in window)) {
        return;
      }

      const synth = window.speechSynthesis;
      synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.92;
      utterance.pitch = 1;
      utterance.lang = 'en-US';

      const voices = synth.getVoices();
      const preferred =
        voices.find(
          (voice) =>
            voice.lang.toLowerCase().startsWith('en') &&
            /natural|google|aria|jenny|samantha|zira|female/i.test(voice.name),
        ) ??
        voices.find((voice) => voice.lang.toLowerCase().startsWith('en')) ??
        voices[0];
      if (preferred) utterance.voice = preferred;

      utterance.onboundary = (event) => {
        if (!activeRef.current) return;
        if (event.name && event.name !== 'word') return;
        boundarySeen = true;
        if (timerRef.current !== null) {
          window.clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        const before = text.slice(0, event.charIndex);
        const index = before.split(/\s+/).filter(Boolean).length - 1;
        setActiveWord(Math.max(0, Math.min(words.length - 1, index)));
      };

      utterance.onend = () => {
        if (activeRef.current) finish();
      };

      utterance.onerror = (event) => {
        if (!activeRef.current) return;
        if (event.error === 'canceled' || event.error === 'interrupted') return;
        if (boundarySeen) finish();
      };

      synth.speak(utterance);
    },
    [finish, stop],
  );

  useEffect(() => {
    return () => {
      activeRef.current = false;
      clearTimer();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [clearTimer]);

  return { playing, activeWord, play, stop };
}
