import { ArrowUpRight } from 'lucide-react';

const ITEMS = [
  {
    question: 'Does Sotto Reads upload my notes?',
    answer:
      'Sotto Reads does not upload the file. The free plan opens and splits it in your browser, then your device voice reads it. Some browser voices use a network; check your browser settings. On Pro, only the text of each batch is sent to the cloud voice you choose.',
  },
  {
    question: 'Do I need an account?',
    answer:
      'No for the free plan. Pro needs one so your subscription and voice settings can follow you.',
  },
  {
    question: 'What is Smart mode?',
    answer:
      'A short training session records how long each batch takes. Sotto Reads turns that into milliseconds per character and uses it to advance. You can always press Next sooner or ask for more time.',
  },
  {
    question: 'Which voice do I get for free?',
    answer:
      "Your browser's built-in English voice. It is instant and works offline after the page loads. Pro adds Fish Audio and ElevenLabs.",
  },
  {
    question: 'Can I use it offline?',
    answer:
      'The free plan works offline after the page loads, as long as your device voice is available and does not need a network. Some browser voices do. Pro cloud voices need a connection.',
  },
  {
    question: 'Can I move my pace to another browser?',
    answer:
      'Yes. Export your pace data as JSON and import it on the other browser. It contains your training batches and the pace model.',
  },
  {
    question: 'What file types can I load?',
    answer: 'PDF, DOCX, TXT, Markdown, or pasted text. The file limit is 40 MB.',
  },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="faq-item">
      <summary>
        <span className="faq-question">{question}</span>
        <span className="faq-icon" aria-hidden="true" />
      </summary>
      <div className="faq-answer">{answer}</div>
    </details>
  );
}

export function Faq() {
  const first = ITEMS.slice(0, 4);
  const second = ITEMS.slice(4);

  return (
    <section className="section" id="faq">
      <div className="shell section-grid">
        <div className="rail" aria-hidden="true">
          07
        </div>
        <div className="section-body">
          <div className="faq-head">
            <div>
              <h2 className="section-title">
                The things people ask
                <br />
                before starting.
              </h2>
            </div>
            <div>
              <p className="section-lede">
                If something is still unclear, the repository is the best place to ask.
              </p>
              <p style={{ marginTop: 16 }}>
                <a
                  className="link"
                  href="https://github.com/spectaculardipin/sottoreads/issues"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open an issue
                  <ArrowUpRight size={14} style={{ display: 'inline', marginLeft: 4 }} />
                </a>
              </p>
            </div>
          </div>

          <div className="faq-columns">
            <div className="faq-list">
              {first.map((item) => (
                <FaqItem key={item.question} {...item} />
              ))}
            </div>
            <div className="faq-list">
              {second.map((item) => (
                <FaqItem key={item.question} {...item} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

