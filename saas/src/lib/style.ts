import type { CSSProperties } from 'react';

export function delay(ms: number): CSSProperties {
  return { '--delay': `${ms}ms` } as CSSProperties;
}
