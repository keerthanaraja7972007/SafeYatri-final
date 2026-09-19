import { Link } from 'react-router-dom';
import { Shield, MapPin, Mail, Phone, Globe } from 'lucide-react';
import Logo from './Logo';

const FOOTER_COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Features', to: '/#features' },
      { label: 'Safety', to: '/#safety' },
      { label: 'AI Assistant', to: '/ai-assistant' },
      { label: 'Emergency', to: '/emergency' },
    ],
  },
  {
    title: 'Explore',
    links: [
      { label: 'Tamil Nadu', to: '/#tamil-nadu' },
      { label: 'Destinations', to: '/#tamil-nadu' },
      { label: 'Safety Map', to: '/safety-map' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', to: '/' },
      { label: 'Contact', to: '/' },
      { label: 'Privacy', to: '/' },
      { label: 'Terms', to: '/' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-saf-border bg-saf-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Brand */}
          <div className="lg:col-span-4">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-saf-muted">
              Travel Smart. Travel Safe. Your intelligent safety companion for exploring Tamil Nadu.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-saf-border text-saf-muted transition-colors hover:border-saf-blue hover:text-saf-blue">
                <Mail className="h-4 w-4" />
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-saf-border text-saf-muted transition-colors hover:border-saf-blue hover:text-saf-blue">
                <Phone className="h-4 w-4" />
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-saf-border text-saf-muted transition-colors hover:border-saf-blue hover:text-saf-blue">
                <Globe className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-8">
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title}>
                <h4 className="text-sm font-semibold text-saf-text">{col.title}</h4>
                <ul className="mt-4 space-y-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      {link.to.startsWith('/#') ? (
                        <a
                          href={link.to}
                          className="text-sm text-saf-muted transition-colors hover:text-saf-blue"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          to={link.to}
                          className="text-sm text-saf-muted transition-colors hover:text-saf-blue"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-saf-border pt-6 sm:flex-row">
          <p className="text-sm text-saf-muted">© 2026 SAFEYATRI. All rights reserved.</p>
          <div className="flex items-center gap-2 text-sm text-saf-muted">
            <Shield className="h-4 w-4 text-saf-green" />
            <span>Designed for safer tourism across Tamil Nadu</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
