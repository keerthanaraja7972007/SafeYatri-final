import {
  MapPin,
  Shield,
  Siren,
  Cloud,
  Navigation,
  Sun,
  CloudRain,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Phone,
} from 'lucide-react';

export default function ProductPreview() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block rounded-full bg-saf-indigo/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-saf-indigo">
            Product Preview
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-saf-text sm:text-4xl">
            One platform for a safer journey
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-saf-muted">
            A unified dashboard that brings safety insights, travel guidance and emergency
            support together — designed around the Tamil Nadu travel experience.
          </p>
        </div>

        {/* Dashboard mockup */}
        <div className="mt-12 overflow-hidden rounded-3xl border border-saf-border bg-saf-white shadow-float">
          {/* Top bar */}
          <div className="flex items-center justify-between border-b border-saf-border bg-saf-bg px-5 py-3">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-saf-red/40" />
              <div className="h-3 w-3 rounded-full bg-saf-yellow/50" />
              <div className="h-3 w-3 rounded-full bg-saf-green/40" />
            </div>
            <div className="hidden items-center gap-2 rounded-full bg-saf-white px-3 py-1 text-xs text-saf-muted shadow-soft sm:flex">
              <Navigation className="h-3 w-3 text-saf-blue" />
              app.safeyatri.com/dashboard
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-saf-muted">
              <Shield className="h-3.5 w-3.5 text-saf-green" />
              <span className="hidden sm:inline">Live Preview</span>
            </div>
          </div>

          <div className="grid gap-0 lg:grid-cols-2">
            {/* Left: Map */}
            <div className="relative overflow-hidden border-b border-saf-border bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 p-6 lg:border-b-0 lg:border-r">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-saf-text">Tamil Nadu Map</h3>
                <span className="rounded-full bg-saf-white px-3 py-1 text-[10px] font-medium text-saf-muted shadow-soft">
                  Interactive View
                </span>
              </div>

              <div className="relative h-80 rounded-2xl border border-saf-border bg-gradient-to-br from-sky-50/50 to-blue-50/50">
                {/* Tamil Nadu outline */}
                <svg
                  viewBox="0 0 300 340"
                  className="absolute inset-0 h-full w-full opacity-50"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <path
                    d="M150 20 C130 30, 120 50, 125 70 C128 85, 135 95, 130 110 C125 125, 110 130, 105 145 C100 160, 108 175, 100 190 C95 205, 80 215, 75 235 C70 255, 85 275, 100 290 C115 305, 130 315, 145 325 C160 320, 175 310, 185 290 C195 270, 190 250, 195 230 C200 210, 210 195, 215 175 C220 155, 210 140, 215 120 C220 100, 215 80, 200 60 C185 40, 170 25, 150 20 Z"
                    fill="rgba(37, 99, 235, 0.05)"
                    stroke="#2563EB"
                    strokeWidth="1.5"
                  />
                </svg>

                {/* Route */}
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 300 340">
                  <path
                    d="M80 80 Q140 60, 160 140 T220 260"
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="2.5"
                    strokeDasharray="6 4"
                    opacity="0.6"
                  />
                </svg>

                {/* Markers */}
                <div className="absolute left-[22%] top-[20%]">
                  <div className="relative">
                    <div className="absolute inset-0 animate-pulse-ring rounded-full bg-saf-green/30" />
                    <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-saf-green text-white shadow-soft">
                      <MapPin className="h-4 w-4" />
                    </div>
                  </div>
                </div>
                <div className="absolute left-[48%] top-[38%]">
                  <div className="relative">
                    <div className="absolute inset-0 animate-pulse-ring rounded-full bg-saf-blue/30" style={{ animationDelay: '0.5s' }} />
                    <div className="relative flex h-9 w-9 items-center justify-center rounded-full gradient-blue-indigo text-white shadow-soft">
                      <MapPin className="h-4 w-4" />
                    </div>
                  </div>
                </div>
                <div className="absolute left-[60%] top-[55%]">
                  <div className="relative">
                    <div className="absolute inset-0 animate-pulse-ring rounded-full bg-saf-yellow/30" style={{ animationDelay: '1s' }} />
                    <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-saf-yellow text-white shadow-soft">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                  </div>
                </div>
                <div className="absolute left-[70%] top-[75%]">
                  <div className="relative">
                    <div className="absolute inset-0 animate-pulse-ring rounded-full bg-saf-red/30" style={{ animationDelay: '1.5s' }} />
                    <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-saf-red text-white shadow-soft">
                      <Siren className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                {/* Floating info card */}
                <div className="absolute bottom-4 left-4 rounded-xl border border-saf-border bg-saf-white/95 p-3 shadow-card backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-saf-blue" />
                    <div>
                      <p className="text-xs font-bold text-saf-text">Madurai</p>
                      <p className="text-[10px] text-saf-muted">Heritage City</p>
                    </div>
                  </div>
                </div>

                {/* Weather */}
                <div className="absolute right-4 top-4 rounded-xl border border-saf-border bg-saf-white/95 p-3 shadow-card backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <Sun className="h-5 w-5 text-saf-orange" />
                    <div>
                      <p className="text-xs font-bold text-saf-text">34°C</p>
                      <p className="text-[10px] text-saf-muted">Sunny</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Safety overview panel */}
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-saf-text">Safety Overview</h3>
                <span className="flex items-center gap-1.5 rounded-full bg-saf-green/10 px-3 py-1 text-[10px] font-semibold text-saf-green">
                  <CheckCircle2 className="h-3 w-3" />
                  All Systems Active
                </span>
              </div>

              <div className="space-y-3">
                {/* Card 1 */}
                <div className="flex items-center justify-between rounded-xl border border-saf-border bg-saf-bg p-4 transition-colors hover:border-saf-blue/30">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-saf-blue/10">
                      <MapPin className="h-5 w-5 text-saf-blue" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-saf-muted">Travel Area</p>
                      <p className="text-sm font-bold text-saf-text">Madurai</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-saf-blue/10 px-3 py-1 text-xs font-semibold text-saf-blue">
                    Active
                  </span>
                </div>

                {/* Card 2 */}
                <div className="flex items-center justify-between rounded-xl border border-saf-border bg-saf-bg p-4 transition-colors hover:border-saf-green/30">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-saf-green/10">
                      <Shield className="h-5 w-5 text-saf-green" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-saf-muted">Safety Status</p>
                      <p className="text-sm font-bold text-saf-text">Favorable</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-saf-green/10 px-3 py-1 text-xs font-semibold text-saf-green">
                    Good
                  </span>
                </div>

                {/* Card 3 */}
                <div className="flex items-center justify-between rounded-xl border border-saf-border bg-saf-bg p-4 transition-colors hover:border-saf-red/30">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-saf-red/10">
                      <Siren className="h-5 w-5 text-saf-red" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-saf-muted">Nearby Assistance</p>
                      <p className="text-sm font-bold text-saf-text">Available</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 rounded-full bg-saf-red/10 px-3 py-1 text-xs font-semibold text-saf-red">
                    <Phone className="h-3 w-3" />
                    Ready
                  </span>
                </div>

                {/* Card 4 */}
                <div className="flex items-center justify-between rounded-xl border border-saf-border bg-saf-bg p-4 transition-colors hover:border-saf-cyan/30">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-saf-cyan/10">
                      <Cloud className="h-5 w-5 text-saf-cyan" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-saf-muted">Travel Conditions</p>
                      <p className="text-sm font-bold text-saf-text">Clear Weather</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 rounded-full bg-saf-cyan/10 px-3 py-1 text-xs font-semibold text-saf-cyan">
                    <CloudRain className="h-3 w-3" />
                    32°C
                  </span>
                </div>
              </div>

              {/* Mini stats */}
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-saf-border bg-saf-white p-3 text-center">
                  <TrendingUp className="mx-auto h-4 w-4 text-saf-green" />
                  <p className="mt-1 text-xs font-bold text-saf-text">6 Areas</p>
                  <p className="text-[10px] text-saf-muted">Covered</p>
                </div>
                <div className="rounded-xl border border-saf-border bg-saf-white p-3 text-center">
                  <Shield className="mx-auto h-4 w-4 text-saf-blue" />
                  <p className="mt-1 text-xs font-bold text-saf-text">Safety</p>
                  <p className="text-[10px] text-saf-muted">Monitored</p>
                </div>
                <div className="rounded-xl border border-saf-border bg-saf-white p-3 text-center">
                  <Siren className="mx-auto h-4 w-4 text-saf-red" />
                  <p className="mt-1 text-xs font-bold text-saf-text">Support</p>
                  <p className="text-[10px] text-saf-muted">On Standby</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
