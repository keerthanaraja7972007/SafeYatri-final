import { Link } from 'react-router-dom';
import HomeMap from '@/components/HomeMap';
import {
  ChevronRight,
  Play,
  Shield,
  MapPin,
  Siren,
} from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-16 sm:pt-32 lg:pb-24">
      {/* Background shapes */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-saf-blue/8 blur-3xl" />
        <div className="absolute right-0 top-20 h-80 w-80 rounded-full bg-saf-cyan/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-saf-indigo/8 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
          {/* Left content */}
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-saf-border bg-saf-white px-4 py-2 text-sm font-medium text-saf-muted shadow-soft">
              <span className="flex h-2 w-2 rounded-full bg-saf-green">
                <span className="absolute h-2 w-2 animate-ping rounded-full bg-saf-green/60" />
              </span>
              Built for safer tourism across Tamil Nadu
            </div>

            <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight text-saf-text sm:text-5xl lg:text-6xl">
              Explore Tamil Nadu.
              <br />
              <span className="text-gradient gradient-blue-indigo">Travel With Confidence.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-saf-muted">
              SAFEYATRI brings intelligent safety insights, safer travel recommendations and
              emergency support together in one platform.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl gradient-blue-indigo px-6 py-3.5 text-sm font-semibold text-white shadow-soft transition-all hover:shadow-float hover:-translate-y-0.5"
              >
                Get Started
                <ChevronRight className="h-4 w-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-saf-border bg-saf-white px-6 py-3.5 text-sm font-semibold text-saf-text transition-all hover:border-saf-blue/30 hover:bg-saf-bg hover:shadow-soft"
              >
                <Play className="h-4 w-4 text-saf-blue" />
                Explore Safety Features
              </a>
            </div>

            {/* Trust indicators */}
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
              <div className="flex items-center gap-2 text-sm text-saf-muted">
                <Shield className="h-4 w-4 text-saf-green" />
                Safety-first design
              </div>
              <div className="flex items-center gap-2 text-sm text-saf-muted">
                <MapPin className="h-4 w-4 text-saf-blue" />
                Tamil Nadu focused
              </div>
              <div className="flex items-center gap-2 text-sm text-saf-muted">
                <Siren className="h-4 w-4 text-saf-red" />
                Emergency ready
              </div>
            </div>
          </div>

          {/* Right visual */}
          <div className="animate-fade-in lg:pl-8">
            <HomeMap />
          </div>
        </div>
      </div>
    </section>
  );
}
