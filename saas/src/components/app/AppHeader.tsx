import type { Theme } from '../../hooks/useTheme';
import type { CloudStatus, VoiceProvider } from '../../lib/types';
import { Logo } from '../Logo';
import { ThemeToggle } from '../ThemeToggle';

interface AppHeaderProps {
  theme: Theme;
  onToggleTheme: () => void;
  status: CloudStatus | null;
  activeVoice: VoiceProvider;
}

function voiceStatusLabel(status: CloudStatus | null, activeVoice: VoiceProvider): string {
  if (!status) return 'Checking voice';
  if (status.mock) return 'Mock cloud voice';
  if (activeVoice === 'fish') return 'Fish S2.1 ready';
  if (activeVoice === 'openrouter') return 'OpenRouter free';
  if (!status.configured) return 'Cloud not connected';
  return 'Browser voice';
}

export function AppHeader({ theme, onToggleTheme, status, activeVoice }: AppHeaderProps) {
  const tone = !status
    ? 'waiting'
    : status.mock
      ? 'mock'
      : activeVoice === 'browser'
        ? status.configured
          ? 'neutral'
          : 'warn'
        : 'ready';

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div className="app-header-brand">
          <Logo href="/" />
          <span className="app-header-sep" aria-hidden="true" />
          <span className="app-header-crumb">Pro studio</span>
          <span className="app-header-preview">Preview</span>
        </div>

        <div className="app-header-actions">
          <span className={`app-voice-status is-${tone}`}>
            <span className="app-voice-dot" aria-hidden="true" />
            {voiceStatusLabel(status, activeVoice)}
          </span>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <a className="btn btn-sm app-back" href="/">
            Back to site
          </a>
        </div>
      </div>
    </header>
  );
}
