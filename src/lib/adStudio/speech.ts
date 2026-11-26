// Speech to text through the browser's own recognition. Where it does not
// exist (Firefox, some in-app browsers) the mic button is simply not shown.

import { useCallback, useEffect, useRef, useState } from 'react';

type RecognitionCtor = new () => {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
};

export function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function speechMessage(code: string): string {
  if (code === 'not-allowed' || code === 'service-not-allowed') return 'Microphone access is blocked. Allow it in your browser settings.';
  if (code === 'no-speech') return 'No speech was heard. Try again.';
  if (code === 'audio-capture') return 'No microphone was found.';
  if (code === 'network') return 'Speech recognition needs a connection.';
  return 'Speech recognition stopped. Try again.';
}

export function useSpeech(onText: (text: string) => void, onError: (message: string) => void) {
  const [supported] = useState(() => recognitionCtor() !== null);
  const [listening, setListening] = useState(false);
  const ref = useRef<InstanceType<RecognitionCtor> | null>(null);
  const textRef = useRef(onText);
  const errorRef = useRef(onError);
  textRef.current = onText;
  errorRef.current = onError;

  const stop = useCallback(() => {
    ref.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.lang = typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results as ArrayLike<any>)
        .map((result) => result[0]?.transcript ?? '')
        .join(' ')
        .trim();
      if (transcript) textRef.current(transcript);
    };
    recognition.onerror = (event) => errorRef.current(speechMessage(String(event?.error ?? '')));
    recognition.onend = () => {
      setListening(false);
      ref.current = null;
    };
    ref.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }, []);

  useEffect(() => () => ref.current?.abort(), []);

  return { supported, listening, start, stop, toggle: () => (listening ? stop() : start()) };
}
