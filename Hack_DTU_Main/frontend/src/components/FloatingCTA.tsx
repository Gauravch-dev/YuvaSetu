import { useState, useEffect } from 'react';
import { ArrowUp, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const FloatingCTA = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isNearFooter, setIsNearFooter] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show button after scrolling past hero (800px)
      const scrolled = window.scrollY > 800;
      setIsVisible(scrolled);

      // Hide when near footer
      const footer = document.querySelector('footer');
      if (footer) {
        const footerRect = footer.getBoundingClientRect();
        const isNear = footerRect.top < window.innerHeight + 100;
        setIsNearFooter(isNear);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isVisible || isNearFooter) return null;

  return (
    <div className="fixed bottom-8 right-8 z-40 flex flex-col gap-3 animate-fade-in">
      {/* Main CTA Button */}
      <Button
        size="lg"
        variant="seeker"
        className="rounded-full shadow-3d hover:animate-scale-brighten group px-6"
        onClick={() => window.location.href = '/login/seeker'}
      >
        <Briefcase className="w-5 h-5" />
        <span className="hidden sm:inline">Find Jobs</span>
      </Button>

      {/* Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className="w-12 h-12 rounded-full bg-card border-2 border-border hover:border-primary flex items-center justify-center shadow-3d-hover transition-all duration-300 hover:scale-110 group"
        aria-label="Scroll to top"
      >
        <ArrowUp className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </button>
    </div>
  );
};
