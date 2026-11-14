import { AlertCircle, Check, Cloud, Loader2, Timer } from 'lucide-react';
import { truncate } from '../../lib/text';
import type { QueueItem, VoiceProvider } from '../../lib/types';

interface QueuePanelProps {
  items: QueueItem[];
  index: number;
  active: boolean;
  voice: VoiceProvider;
  preparedAhead: number;
  prefetchAhead: number;
}

function stateLabel(state: QueueItem['state']): string {
  if (state === 'ready') return 'Ready';
  if (state === 'generating') return 'Generating';
  if (state === 'error') return 'Error';
  return 'Queued';
}

export function QueuePanel({
  items,
  index,
  active,
  voice,
  preparedAhead,
  prefetchAhead,
}: QueuePanelProps) {
  const upcoming = active ? items.slice(index + 1, index + 1 + prefetchAhead) : [];
  const slots = Math.min(prefetchAhead, Math.max(0, items.length - index - 1));

  return (
    <section className="app-card queue-card">
      <div className="app-card-head">
        <div>
          <span className="app-card-kicker">Cloud queue</span>
          <h2>Prepared ahead</h2>
        </div>
        {active && voice !== 'browser' ? (
          <span className="app-queue-count">
            {preparedAhead}/{slots} ready
          </span>
        ) : (
          <Timer size={17} className="app-head-icon" />
        )}
      </div>

      {!active ? (
        <div className="app-empty-note">
          <Cloud size={18} />
          <p>
            Start a session and the next {prefetchAhead} batches will be generated here before
            you need them.
          </p>
        </div>
      ) : voice === 'browser' ? (
        <div className="app-empty-note">
          <Cloud size={18} />
          <p>
            Browser voice reads live, so there is no cloud queue. Switch to a cloud voice to have
            four batches prepared ahead.
          </p>
        </div>
      ) : upcoming.length === 0 ? (
        <div className="app-empty-note">
          <Check size={18} />
          <p>This is the last batch in the session.</p>
        </div>
      ) : (
        <div className="queue-list">
          {upcoming.map((item) => (
            <div className="queue-row" key={item.index}>
              <span className="queue-index">{String(item.index + 1).padStart(2, '0')}</span>
              <span className="queue-text">{truncate(item.text, 86)}</span>
              <span className={`queue-state is-${item.state}`} title={item.error || undefined}>
                {item.state === 'generating' ? (
                  <Loader2 size={12} className="spin" />
                ) : item.state === 'ready' ? (
                  <Check size={12} />
                ) : item.state === 'error' ? (
                  <AlertCircle size={12} />
                ) : (
                  <span className="queue-dot" aria-hidden="true" />
                )}
                {stateLabel(item.state)}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
