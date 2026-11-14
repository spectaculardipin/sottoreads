const ITEMS = [
  {
    question: 'Does Sotto Reads upload my notes?',
    answer:
      'The free room never uploads anything. Files are opened and split in your browser. On Pro, only the text of the batch being read is sent to the cloud voice provider.',
  },
  {
    question: 'Do I need an account?',
    answer:
      'No. The free room works without an account, and this preview of Pro opens directly from the pricing section. Billing and accounts come later.',
  },
  {
    question: 'What is Smart mode?',
    answer:
      'Smart mode is a Pro feature. It learns your writing speed and starts the next batch for you. You can always press Next first.',
  },
  {
    question: 'Which voice do I get for free?',
    answer:
      "Three of your browser's built-in voices. They are instant, private, and work offline after the page loads. Pro adds the Fish Audio S2.1 cloud voice.",
  },
  {
    question: 'What does “four batches prepared ahead” mean?',
    answer:
      'When you start a Pro session, the next four batches are generated in the background while you listen and write. Pressing Next then starts almost immediately instead of waiting for a fresh request.',
  },
  {
    question: 'Why does the first word sometimes get cut off in other apps?',
    answer:
      'Most web audio players begin before the browser has fully woken the audio pipeline. Sotto warms the audio graph first, pads the audio with a short lead-in, and schedules playback on the audio clock so the opening phoneme is intact.',
  },
];

export function Faq() {
  return (
    <section className="section faq-section" id="faq">
      <div className="shell">
        <div className="section-head-center">
          <h2 className="section-title">Before you start.</h2>
          <p className="section-lede">
            If something is still unclear, open an issue on GitHub.
          </p>
        </div>

        <div className="faq-list faq-single">
          {ITEMS.map((item) => (
            <details className="faq-item" key={item.question}>
              <summary>
                <span className="faq-question">{item.question}</span>
                <span className="faq-icon" aria-hidden="true" />
              </summary>
              <div className="faq-answer">{item.answer}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
