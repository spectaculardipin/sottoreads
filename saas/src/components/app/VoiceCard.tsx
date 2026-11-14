import { Cloud, Volume2, Zap } from 'lucide-react';
import type { VoiceChoice } from '../../lib/cloud';
import type { AdvanceMode, BatchMode, CloudStatus, VoiceProvider } from '../../lib/types';

interface VoiceCardProps {
  status: CloudStatus | null;
  voiceChoice: VoiceChoice;
  onVoiceChoice: (choice: VoiceChoice) => void;
  activeVoice: VoiceProvider;
  cloudVoiceId: string;
  onCloudVoiceId: (value: string) => void;
  speed: number;
  onSpeed: (value: number) => void;
  mode: BatchMode;
  onMode: (mode: BatchMode) => void;
  wordsPerBatch: number;
  onWordsPerBatch: (value: number) => void;
  advance: AdvanceMode;
  onAdvance: (mode: AdvanceMode) => void;
  browserVoices: SpeechSynthesisVoice[];
  browserVoiceURI: string;
  onBrowserVoiceURI: (value: string) => void;
  prefetchAhead: number;
}

const MODES: Array<{ id: BatchMode; label: string }> = [
  { id: 'sentence', label: 'Sentence' },
  { id: 'phrase', label: 'Phrase' },
  { id: 'words', label: 'Words' },
];

function providerLabel(status: CloudStatus | null, provider: 'fish' | 'openrouter'): string {
  if (provider === 'fish') {
    if (status?.mock) return 'Mock cloud voice';
    return 'Fish Audio S2.1';
  }
  return 'OpenRouter · Fish free';
}

export function VoiceCard({
  status,
  voiceChoice,
  onVoiceChoice,
  activeVoice,
  cloudVoiceId,
  onCloudVoiceId,
  speed,
  onSpeed,
  mode,
  onMode,
  wordsPerBatch,
  onWordsPerBatch,
  advance,
  onAdvance,
  browserVoices,
  browserVoiceURI,
  onBrowserVoiceURI,
  prefetchAhead,
}: VoiceCardProps) {
  const fishConfigured = status?.providers.fish.configured ?? false;
  const openRouterConfigured = status?.providers.openrouter.configured ?? false;
  const autoLabel = !status
    ? 'checking'
    : status.defaultProvider === 'browser'
      ? 'browser voice'
      : providerLabel(status, status.defaultProvider);
  const activeDetail =
    activeVoice === 'fish'
      ? status?.mock
        ? 'Development tone · exact timing'
        : 'Direct Fish API · exact word timing'
      : activeVoice === 'openrouter'
        ? 'Free Fish S2.1 route · estimated word timing'
        : 'Built into this browser · no upload';

  return (
    <section className="app-card voice-card">
      <div className="app-card-head">
        <div>
          <span className="app-card-kicker">Voice</span>
          <h2>Cloud or browser</h2>
        </div>
        <Cloud size={17} className="app-head-icon" />
      </div>

      <label className="app-field">
        <span>Provider</span>
        <select
          className="select"
          value={voiceChoice}
          onChange={(event) => onVoiceChoice(event.target.value as VoiceChoice)}
        >
          <option value="auto">Auto · {autoLabel}</option>
          <option value="fish" disabled={!fishConfigured}>
            {providerLabel(status, 'fish')}
            {fishConfigured ? '' : ' — key missing'}
          </option>
          <option value="openrouter" disabled={!openRouterConfigured}>
            {providerLabel(status, 'openrouter')}
            {openRouterConfigured ? '' : ' — key missing'}
          </option>
          <option value="browser">Browser voice · free</option>
        </select>
      </label>
      <p className="app-field-note">{activeDetail}</p>

      {activeVoice === 'fish' && !status?.mock ? (
        <label className="app-field">
          <span>Fish voice ID (optional)</span>
          <input
            className="input"
            value={cloudVoiceId}
            onChange={(event) => onCloudVoiceId(event.target.value.trim())}
            placeholder="Default narrator"
            spellCheck={false}
          />
        </label>
      ) : null}

      {activeVoice === 'browser' ? (
        <label className="app-field">
          <span>Browser voice</span>
          <select
            className="select"
            value={browserVoiceURI}
            onChange={(event) => onBrowserVoiceURI(event.target.value)}
          >
            {browserVoices.length === 0 ? <option value="">System default</option> : null}
            {browserVoices.map((voice) => (
              <option key={voice.voiceURI} value={voice.voiceURI}>
                {voice.name} · {voice.lang}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <div className="app-field">
        <label className="app-inline-label" htmlFor="app-speed">
          <span>Speed</span>
          <strong>{speed.toFixed(2)}×</strong>
        </label>
        <input
          id="app-speed"
          type="range"
          min={0.7}
          max={1.15}
          step={0.02}
          value={speed}
          onChange={(event) => onSpeed(Number(event.target.value))}
        />
      </div>

      <div className="app-field">
        <span>Batch style</span>
        <div className="segmented segmented-full" role="group" aria-label="Batch style">
          {MODES.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={mode === item.id}
              onClick={() => onMode(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        {mode === 'words' ? (
          <label className="app-inline-label app-inline-label--sub">
            <span>Words per batch</span>
            <select
              className="select select-small"
              value={wordsPerBatch}
              onChange={(event) => onWordsPerBatch(Number(event.target.value))}
            >
              {[4, 6, 8, 10].map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <div className="app-field">
        <span>Advance</span>
        <div className="segmented segmented-full" role="group" aria-label="Advance mode">
          <button type="button" aria-pressed={advance === 'manual'} onClick={() => onAdvance('manual')}>
            Manual
          </button>
          <button type="button" aria-pressed={advance === 'smart'} onClick={() => onAdvance('smart')}>
            Smart
          </button>
        </div>
        <p className="app-field-note">
          {advance === 'smart'
            ? 'Smart uses your learned writing pace and shows a countdown.'
            : 'You press Next when the line is written.'}
        </p>
      </div>

      <div className="app-voice-foot">
        <span className="app-chip">
          <Zap size={12} />
          {prefetchAhead} batches ahead
        </span>
        <span className="app-chip">
          <Volume2 size={12} />
          Warm audio
        </span>
      </div>
    </section>
  );
}
