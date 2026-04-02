import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Navbar = () => {
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Features', href: '/#features', homeOnly: true },
    { name: 'How it Works', href: '/#how-it-works', homeOnly: true },
    { name: 'Testimonials', href: '/#testimonials', homeOnly: true },
  ];

  const isHomePage = location.pathname === '/';

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled ? 'glass-strong py-3' : 'bg-transparent py-6'
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-xl bg-transparent border-[3px] border-black flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform duration-300 overflow-hidden">
            <img src="/favicon.ico" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-display font-bold text-xl text-foreground">
            Yuva<span className="text-primary">Setu</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => 
            (!link.homeOnly || isHomePage) && (
              <a
                key={link.name}
                href={link.href}
                className="text-muted-foreground hover:text-foreground transition-colors duration-300 font-medium relative group"
              >
                {link.name === 'Features' ? t('navbar.features') : link.name === 'How it Works' ? t('navbar.howItWorks') : link.name === 'Testimonials' ? t('navbar.testimonials') : link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
              </a>
            )
          )}
          <Link
            to="/about"
            className="text-muted-foreground hover:text-foreground transition-colors duration-300 font-medium relative group"
          >
            {t('navbar.about')}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
          </Link>
        </div>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <LanguageSwitcher />
          <ThemeToggle />
          {location.pathname === '/about' ? (
            <Link to="/">
              <Button variant="seeker" size="sm">
                {t('navbar.backToHome')}
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login/seeker">
                <Button variant="ghost" size="sm">
                  {t('navbar.signIn')}
                </Button>
              </Link>
              <Link to="/login/seeker?mode=signup">
                <Button variant="seeker" size="sm">
                  {t('navbar.getStarted')}
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 glass-strong border-t border-border animate-fade-in">
          <div className="container mx-auto px-4 py-6 flex flex-col gap-4">
            {navLinks.map((link) => 
              (!link.homeOnly || isHomePage) && (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name === 'Features' ? t('navbar.features') : link.name === 'How it Works' ? t('navbar.howItWorks') : link.name === 'Testimonials' ? t('navbar.testimonials') : link.name}
                </a>
              )
            )}
            <Link 
              to="/about"
              className="text-muted-foreground hover:text-foreground transition-colors py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {t('navbar.about')}
            </Link>
            <div className="flex items-center justify-between py-2 border-t border-border mt-2 pt-4">
              <span className="text-sm text-muted-foreground">{t('common.language')}</span>
              <LanguageSwitcher />
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">{t('common.theme')}</span>
              <ThemeToggle />
            </div>
            <div className="flex flex-col gap-3 pt-4 border-t border-border">
              {location.pathname === '/about' ? (
                <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="seeker" className="w-full">
                    {t('navbar.backToHome')}
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/login/seeker" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full">
                      {t('navbar.signIn')}
                    </Button>
                  </Link>
                  <Link to="/login/seeker?mode=signup" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="seeker" className="w-full">
                      {t('navbar.getStarted')}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
