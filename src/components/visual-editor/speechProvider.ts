/**
 * Text-to-speech providers the audio sheet can call once a key exists.
 * No provider here speaks without that key, and none is called from the placeholder.
 */
export type SpeechRequest = { text: string; voice?: string };

export type SpeechProvider = {
  id: string;
  label: string;
  /** Server secret name. The browser never stores the key. */
  secret: string;
  speak?: (request: SpeechRequest, key: string) => Promise<Blob>;
};

export const speechProviders: SpeechProvider[] = [
  { id: 'elevenlabs', label: 'ElevenLabs', secret: 'ELEVENLABS_API_KEY' },
  { id: 'openai', label: 'OpenAI', secret: 'OPENAI_API_KEY' },
];

export function speechProviderReady(provider: SpeechProvider, key: string | null | undefined) {
  return Boolean(provider.speak && key && key.trim().length > 0);
}
