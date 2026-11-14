import { useState } from 'react';
import { Nav } from './components/Nav';
import { Hero } from './components/Hero';
import { Loop } from './components/Loop';
import { Pace } from './components/Pace';
import { Notes } from './components/Notes';
import { Pro } from './components/Pro';
import { Pricing } from './components/Pricing';
import { Faq } from './components/Faq';
import { Closing } from './components/Closing';
import { Footer } from './components/Footer';
import { AuthDialog } from './components/AuthDialog';
import { PracticeDialog } from './components/PracticeDialog';
import { useTheme } from './hooks/useTheme';

export default function App() {
  const { theme, toggle } = useTheme();
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'pro'>('signin');

  const startFree = () => setPracticeOpen(true);

  const signIn = () => {
    setAuthMode('signin');
    setAuthOpen(true);
  };

  const startPro = () => {
    setAuthMode('pro');
    setAuthOpen(true);
  };

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <Nav
        theme={theme}
        onToggleTheme={toggle}
        onSignIn={signIn}
        onStartFree={startFree}
      />

      <main id="main">
        <Hero onStartFree={startFree} />
        <Loop />
        <Pace />
        <Notes onStartFree={startFree} />
        <Pro />
        <Pricing onStartFree={startFree} onStartPro={startPro} />
        <Faq />
        <Closing onStartFree={startFree} />
      </main>

      <Footer onSignIn={signIn} onStartFree={startFree} />

      <AuthDialog open={authOpen} mode={authMode} onClose={() => setAuthOpen(false)} />
      <PracticeDialog open={practiceOpen} onClose={() => setPracticeOpen(false)} />
    </>
  );
}
