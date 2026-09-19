import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronRight } from 'lucide-react';
import Logo from './Logo';
import LanguageSelector from './LanguageSelector';
import { useTranslation } from '@/i18n';

const NAV_LINKS = [
  { label: 'home', href: '/' },
  { label: 'features', href: '/#features' },
  { label: 'howItWorks', href: '/#how-it-works' },
  { label: 'exploreTamilNadu', href: '/#tamil-nadu' },
  { label: 'safety', href: '/#safety' },
  { label: 'arSafety', href: '/ar-safety' },
] as const;

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const handleNavClick = (href: string) => {
    setMenuOpen(false);
    if (href.startsWith('/#')) {
      const id = href.slice(2);
      if (location.pathname !== '/') {
        window.location.href = href;
      } else {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-saf-white/90 backdrop-blur-md shadow-soft border-b border-saf-border'
          : 'bg-saf-white/60 backdrop-blur-sm'
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex-shrink-0">
          <Logo />
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) =>
            link.href.startsWith('/#') ? (
              <button
                key={link.label}
                onClick={() => handleNavClick(link.href)}
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-saf-muted transition-colors hover:bg-saf-bg hover:text-saf-text"
              >
                {t(link.label)}
              </button>
            ) : (
              <Link
                key={link.label}
                to={link.href}
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-saf-muted transition-colors hover:bg-saf-bg hover:text-saf-text"
              >
                {t(link.label)}
              </Link>
            )
          )}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSelector />
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-xl gradient-blue-indigo px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-all hover:shadow-float hover:-translate-y-0.5"
          >
            {t('getStarted')}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-saf-border text-saf-text lg:hidden"
          aria-label={t('toggleMenu')}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden">
          <div className="mx-4 mb-4 rounded-2xl border border-saf-border bg-saf-white shadow-card overflow-hidden">
            <div className="flex flex-col p-2">
              {NAV_LINKS.map((link) =>
                link.href.startsWith('/#') ? (
                  <button
                    key={link.label}
                    onClick={() => handleNavClick(link.href)}
                    className="flex items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium text-saf-text transition-colors hover:bg-saf-bg"
                  >
                    {t(link.label)}
                    <ChevronRight className="h-4 w-4 text-saf-muted" />
                  </button>
                ) : (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-saf-text transition-colors hover:bg-saf-bg"
                  >
                    {t(link.label)}
                    <ChevronRight className="h-4 w-4 text-saf-muted" />
                  </Link>
                )
              )}
              <Link
                to="/dashboard"
                className="mt-2 flex items-center justify-center gap-1.5 rounded-xl gradient-blue-indigo px-5 py-3 text-sm font-semibold text-white"
              >
                {t('getStarted')}
                <ChevronRight className="h-4 w-4" />
              </Link>
              <LanguageSelector className="mt-2 justify-center" />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
