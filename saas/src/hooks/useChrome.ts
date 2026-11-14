import { useEffect, useState } from 'react';

export function useScrolled(threshold = 8): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return scrolled;
}

export function useBodyLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    document.body.classList.add('is-locked');
    return () => document.body.classList.remove('is-locked');
  }, [locked]);
}
