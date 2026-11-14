interface WordPhraseProps {
  words: string[];
  activeWord: number;
  revealAll: boolean;
  className?: string;
}

export function WordPhrase({ words, activeWord, revealAll, className }: WordPhraseProps) {
  return (
    <p className={`phrase${className ? ` ${className}` : ''}`}>
      {words.map((word, index) => {
        const state = revealAll
          ? 'is-spoken'
          : activeWord < 0
            ? 'is-upcoming'
            : index < activeWord
              ? 'is-spoken'
              : index === activeWord
                ? 'is-current'
                : 'is-upcoming';
        return (
          <span key={`${word}-${index}`} className={`phrase-word ${state}`}>
            {word}
          </span>
        );
      })}
    </p>
  );
}
