import { Link } from 'react-router-dom';
import {
  ChevronRight,
  Play,
  Shield,
  MapPin,
  Cloud,
  Siren,
  Navigation,
  TrendingUp,
  Sun,
  CloudRain,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

function HeroVisual() {
  return (
    <div className="relative">
      {/* Floating background shapes */}
      <div className="absolute -left-8 top-12 h-32 w-32 rounded-full bg-saf-cyan/20 blur-2xl" />
      <div className="absolute -right-4 bottom-20 h-40 w-40 rounded-full bg-saf-blue/20 blur-2xl" />

      {/* Main card */}
      <div className="relative rounded-3xl border border-saf-border bg-saf-white p-3 shadow-float">
        {/* Top bar */}
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-saf-red/40" />
            <div className="h-2.5 w-2.5 rounded-full bg-saf-yellow/50" />
            <div className="h-2.5 w-2.5 rounded-full bg-saf-green/40" />
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-saf-bg px-3 py-1 text-[10px] font-medium text-saf-muted">
            <Shield className="h-3 w-3 text-saf-green" />
            Safety Overview
          </div>
        </div>

        {/* Map area */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 p-4">
          {/* Stylized Tamil Nadu map outline */}
          <svg
            viewBox="0 0 300 340"
            className="absolute inset-0 h-full w-full opacity-60"
            preserveAspectRatio="xMidYMid slice"
          >
            <path
              d="M150 20 C130 30, 120 50, 125 70 C128 85, 135 95, 130 110 C125 125, 110 130, 105 145 C100 160, 108 175, 100 190 C95 205, 80 215, 75 235 C70 255, 85 275, 100 290 C115 305, 130 315, 145 325 C160 320, 175 310, 185 290 C195 270, 190 250, 195 230 C200 210, 210 195, 215 175 C220 155, 210 140, 215 120 C220 100, 215 80, 200 60 C185 40, 170 25, 150 20 Z"
              fill="none"
              stroke="#2563EB"
              strokeWidth="1.5"
              strokeDasharray="4 3"
              opacity="0.4"
            />
          </svg>

          {/* Floating safety score cards */}
          <div className="relative space-y-3">
            {/* Top card row */}
            <div className="flex gap-3">
              <div className="flex-1 rounded-xl border border-saf-border bg-saf-white/90 p-3 shadow-soft backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-saf-green/10">
                    <CheckCircle2 className="h-4 w-4 text-saf-green" />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-saf-muted">Travel Area</p>
                    <p className="text-xs font-bold text-saf-text">Chennai</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 rounded-xl border border-saf-border bg-saf-white/90 p-3 shadow-soft backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-saf-blue/10">
                    <TrendingUp className="h-4 w-4 text-saf-blue" />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-saf-muted">Safety Status</p>
                    <p className="text-xs font-bold text-saf-text">Favorable</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Map markers */}
            <div className="relative h-44 rounded-xl border border-saf-border bg-gradient-to-br from-sky-50/50 to-blue-50/50">
              {/* Route line */}
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 280 176">
                <path
                  d="M50 40 Q120 20, 150 80 T230 140"
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="2"
                  strokeDasharray="5 4"
                  opacity="0.5"
                />
              </svg>

              {/* Markers */}
              <div className="absolute left-[14%] top-[18%]">
                <div className="relative">
                  <div className="absolute inset-0 animate-pulse-ring rounded-full bg-saf-green/30" />
                  <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-saf-green text-saf-white shadow-soft">
                    <MapPin className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
              <div className="absolute left-[48%] top-[42%]">
                <div className="relative">
                  <div className="absolute inset-0 animate-pulse-ring rounded-full bg-saf-blue/30" style={{ animationDelay: '0.5s' }} />
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-full gradient-blue-indigo text-saf-white shadow-soft">
                    <MapPin className="h-4 w-4" />
                  </div>
                </div>
              </div>
              <div className="absolute left-[78%] top-[72%]">
                <div className="relative">
                  <div className="absolute inset-0 animate-pulse-ring rounded-full bg-saf-orange/30" style={{ animationDelay: '1s' }} />
                  <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-saf-orange text-saf-white shadow-soft">
                    <AlertTriangle className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>

              {/* Location info card */}
              <div className="absolute bottom-3 left-3 rounded-xl border border-saf-border bg-saf-white/95 p-2.5 shadow-card backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <Navigation className="h-3.5 w-3.5 text-saf-blue" />
                  <div>
                    <p className="text-[10px] font-semibold text-saf-text">Tourist Location</p>
                    <p className="text-[9px] text-saf-muted">Marina Beach</p>
                  </div>
                </div>
              </div>

              {/* Weather indicator */}
              <div className="absolute right-3 top-3 rounded-xl border border-saf-border bg-saf-white/95 p-2.5 shadow-card backdrop-blur-sm">
                <div className="flex items-center gap-1.5">
                  <Sun className="h-4 w-4 text-saf-orange" />
                  <div>
                    <p className="text-[10px] font-semibold text-saf-text">32°C</p>
                    <p className="text-[8px] text-saf-muted">Sunny</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom cards */}
            <div className="flex gap-3">
              <div className="flex-1 rounded-xl border border-saf-border bg-saf-white/90 p-3 shadow-soft backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-saf-red/10">
                    <Siren className="h-4 w-4 text-saf-red" />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-saf-muted">Nearby Assistance</p>
                    <p className="text-xs font-bold text-saf-text">Available</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 rounded-xl border border-saf-border bg-saf-white/90 p-3 shadow-soft backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-saf-cyan/10">
                    <Cloud className="h-4 w-4 text-saf-cyan" />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-saf-muted">Conditions</p>
                    <p className="text-xs font-bold text-saf-text">Clear</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating badge */}
      <div className="absolute -right-3 top-4 animate-float rounded-2xl border border-saf-border bg-saf-white p-3 shadow-card sm:-right-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-green-cyan">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-medium text-saf-muted">Safety Insights</p>
            <p className="text-xs font-bold text-saf-text">AI-Powered</p>
          </div>
        </div>
      </div>

      {/* Floating weather badge */}
      <div className="absolute -left-3 bottom-8 animate-float-slow rounded-2xl border border-saf-border bg-saf-white p-3 shadow-card sm:-left-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-saf-sky/15">
            <CloudRain className="h-4 w-4 text-saf-sky" />
          </div>
          <div>
            <p className="text-[10px] font-medium text-saf-muted">Weather</p>
            <p className="text-xs font-bold text-saf-text">Monsoon Ready</p>
          </div>
        </div>
      </div>
    </div>
  );
}

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
            <HeroVisual />
          </div>
        </div>
      </div>
    </section>
  );
}
