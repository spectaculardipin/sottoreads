interface LogoProps {
  href?: string;
}

export function Logo({ href = '#top' }: LogoProps) {
  return (
    <a className="logo" href={href} aria-label="Sotto Reads home">
      <span className="logo-mark" aria-hidden="true" />
      <span className="logo-text">
        sotto <em>reads</em>
      </span>
    </a>
  );
}
