import { Nav } from './components/Nav';
import { Hero } from './components/Hero';
import { FreePractice } from './components/FreePractice';
import { Loop } from './components/Loop';
import { Pace } from './components/Pace';
import { Notes } from './components/Notes';
import { Pro } from './components/Pro';
import { Pricing } from './components/Pricing';
import { Faq } from './components/Faq';
import { Closing } from './components/Closing';
import { Footer } from './components/Footer';
import { ProAppPage } from './components/app/ProAppPage';
import { useTheme } from './hooks/useTheme';

function LandingPage() {
  const { theme, toggle } = useTheme();

  const scrollToFree = () => {
    const section = document.getElementById('free');
    if (!section) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    section.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    window.setTimeout(() => {
      const textarea = document.getElementById('free-text') as HTMLTextAreaElement | null;
      textarea?.focus({ preventScroll: true });
    }, reduced ? 40 : 520);
  };

  const openPro = () => {
    window.location.href = '/app';
  };

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <Nav
        theme={theme}
        onToggleTheme={toggle}
        onStartFree={scrollToFree}
        onOpenPro={openPro}
      />

      <main id="main">
        <Hero onStartFree={scrollToFree} />
        <FreePractice onOpenPro={openPro} />
        <Loop />
        <Pace />
        <Notes onStartFree={scrollToFree} />
        <Pro />
        <Pricing onStartFree={scrollToFree} onStartPro={openPro} />
        <Faq />
        <Closing onStartFree={scrollToFree} />
      </main>

      <Footer onStartFree={scrollToFree} />
    </>
  );
}

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '');
  if (path === '/app') return <ProAppPage />;
  return <LandingPage />;
}
