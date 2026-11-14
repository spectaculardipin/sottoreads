const ITEMS = [
  {
    question: 'Does Sotto Reads upload my notes?',
    answer:
      'No. The free plan opens and splits the file in your browser. On Pro, only the text of the batch you are hearing goes to the voice provider.',
  },
  {
    question: 'Do I need an account?',
    answer: 'Not for the free plan. Pro needs one so your voice settings and subscription can follow you.',
  },
  {
    question: 'What is Smart mode?',
    answer:
      'A short training session measures your writing speed. Smart mode uses it to advance. You can always press Next first.',
  },
  {
    question: 'Which voice do I get for free?',
    answer:
      "Your browser's built-in voice. It is instant and works offline after the page loads. Pro adds Fish Audio and ElevenLabs.",
  },
  {
    question: 'Can I use it offline?',
    answer:
      'The free plan works offline after the page loads, as long as your device voice does not need a network. Pro voices need a connection.',
  },
  {
    question: 'Can I move my pace to another browser?',
    answer:
      'Yes. Export it as JSON and import it on the other browser. It contains your training batches and the pace model.',
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
