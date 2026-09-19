import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

type CTASectionProps = {
  title: string;
  subtitle: string;
  buttonText?: string;
  to?: string;
  variant?: 'light' | 'gradient';
};

export default function CTASection({
  title,
  subtitle,
  buttonText = 'Get Started',
  to = '/dashboard',
  variant = 'gradient',
}: CTASectionProps) {
  const isGradient = variant === 'gradient';
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div
        className={`relative mx-auto max-w-5xl overflow-hidden rounded-3xl p-10 text-center shadow-float sm:p-16 ${
          isGradient ? 'gradient-blue-indigo' : 'border border-saf-border bg-saf-white'
        }`}
      >
        {isGradient && (
          <>
            <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -right-16 -bottom-16 h-56 w-56 rounded-full bg-saf-cyan/20 blur-3xl" />
          </>
        )}
        <div className="relative">
          <h2
            className={`text-3xl font-extrabold tracking-tight sm:text-4xl ${
              isGradient ? 'text-white' : 'text-saf-text'
            }`}
          >
            {title}
          </h2>
          <p
            className={`mx-auto mt-4 max-w-xl text-lg leading-relaxed ${
              isGradient ? 'text-blue-100' : 'text-saf-muted'
            }`}
          >
            {subtitle}
          </p>
          <Link
            to={to}
            className={`mt-8 inline-flex items-center gap-1.5 rounded-xl px-6 py-3.5 text-sm font-semibold shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-float ${
              isGradient
                ? 'bg-saf-white text-saf-blue'
                : 'gradient-blue-indigo text-white'
            }`}
          >
            {buttonText}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
