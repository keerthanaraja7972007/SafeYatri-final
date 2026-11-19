import {
  Brain,
  Route,
  ShieldCheck,
  ShieldAlert,
  Siren,
  Bot,
  MapPin,
  CloudRain,
  HelpCircle,
  AlertTriangle,
  Compass,
  Eye,
  LifeBuoy,
  ArrowRight,
  Sparkles,
  Cpu,
  Activity,
  Layers,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Hero from '@/components/Hero';
import ProductPreview from '@/components/ProductPreview';
import SectionHeader from '@/components/SectionHeader';
import FeatureCard from '@/components/FeatureCard';
import DestinationCard from '@/components/DestinationCard';
import CTASection from '@/components/CTASection';
import { realWorldDistrictCoverage } from '@/data/realWorldDistrictCoverage';

const FEATURED_DISTRICT_STYLES = [
  { gradient: 'gradient-sky-cyan', emoji: '🏖️' },
  { gradient: 'gradient-cyan-blue', emoji: '🏛️' },
  { gradient: 'gradient-orange-red', emoji: '🛕' },
  { gradient: 'gradient-green-cyan', emoji: '⛰️' },
  { gradient: 'gradient-blue-indigo', emoji: '🌊' },
  { gradient: 'gradient-blue-violet', emoji: '🌅' },
];

const PROBLEM_CARDS = [
  {
    icon: Compass,
    title: 'Unfamiliar Places',
    description: 'Tourists often explore areas they have never visited, making it hard to assess local safety conditions.',
    gradient: 'bg-saf-blue/10',
    iconColor: 'text-saf-blue',
  },
  {
    icon: CloudRain,
    title: 'Changing Conditions',
    description: 'Weather, traffic and local situations can shift quickly, turning a safe route into a challenging one.',
    gradient: 'bg-saf-cyan/10',
    iconColor: 'text-saf-cyan',
  },
  {
    icon: AlertTriangle,
    title: 'Emergency Uncertainty',
    description: 'When something goes wrong, knowing what to do and where to get help is not always obvious.',
    gradient: 'bg-saf-orange/10',
    iconColor: 'text-saf-orange',
  },
  {
    icon: HelpCircle,
    title: 'Safety Information Gaps',
    description: 'Reliable, location-specific safety guidance is scattered or simply unavailable for many destinations.',
    gradient: 'bg-saf-red/10',
    iconColor: 'text-saf-red',
  },
];

const FEATURES = [
  {
    icon: Brain,
    title: 'AI-Powered Safety Insights',
    description: 'Understand potential safety conditions around tourist destinations using intelligent risk analysis.',
    gradient: 'gradient-blue-indigo',
  },
  {
    icon: Route,
    title: 'Safer Route Recommendations',
    description: 'Discover travel options that consider safety-related conditions along your journey.',
    gradient: 'gradient-cyan-blue',
  },
  {
    icon: ShieldCheck,
    title: 'Women Safety Mode',
    description: 'Enable additional safety considerations when planning and navigating your journey.',
    gradient: 'gradient-green-cyan',
  },
  {
    icon: ShieldAlert,
    title: 'Smart Safety Zones',
    description: 'Receive safety awareness when approaching locations that require additional caution.',
    gradient: 'gradient-orange-red',
  },
  {
    icon: Siren,
    title: 'Emergency Assistance',
    description: 'Access a structured emergency support experience when something goes wrong.',
    gradient: 'bg-saf-red',
  },
  {
    icon: Bot,
    title: 'AI Safety Assistant',
    description: 'Get instant safety guidance and travel-related assistance through an intelligent assistant.',
    gradient: 'gradient-blue-violet',
  },
];

const JOURNEY_STEPS = [
  {
    num: '01',
    icon: Compass,
    title: 'Plan',
    description: 'Understand your destination and travel conditions.',
    gradient: 'gradient-blue-indigo',
  },
  {
    num: '02',
    icon: MapPin,
    title: 'Explore',
    description: 'Discover places with safety information around you.',
    gradient: 'gradient-cyan-blue',
  },
  {
    num: '03',
    icon: Eye,
    title: 'Stay Aware',
    description: 'Receive intelligent safety guidance throughout your journey.',
    gradient: 'gradient-green-cyan',
  },
  {
    num: '04',
    icon: LifeBuoy,
    title: 'Respond',
    description: 'Get structured assistance when an emergency occurs.',
    gradient: 'gradient-orange-red',
  },
];

const AI_FACTORS = [
  { icon: MapPin, label: 'Location Conditions', color: 'text-saf-blue' },
  { icon: CloudRain, label: 'Environmental Factors', color: 'text-saf-cyan' },
  { icon: Route, label: 'Travel Conditions', color: 'text-saf-indigo' },
  { icon: Activity, label: 'Safety Patterns', color: 'text-saf-green' },
  { icon: Layers, label: 'Historical Information', color: 'text-saf-orange' },
];

export default function Home() {
  const featuredDistricts = [...realWorldDistrictCoverage]
    .filter((entry) => entry.touristPlaceCount > 0)
    .sort((left, right) => right.touristPlaceCount - left.touristPlaceCount)
    .slice(0, FEATURED_DISTRICT_STYLES.length);

  return (
    <div className="home-page-root">
      <Hero />
      <ProductPreview />

      {/* Problem Section */}
      <section id="problem" className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="The Challenge"
            title="Travel should feel exciting — not uncertain."
            subtitle="Tourists deserve to explore with confidence. But unfamiliar destinations bring real challenges that can make any journey feel unpredictable."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PROBLEM_CARDS.map((card, i) => (
              <div
                key={card.title}
                className="group rounded-2xl border border-saf-border bg-saf-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.gradient} transition-transform duration-300 group-hover:scale-110`}>
                  <card.icon className={`h-6 w-6 ${card.iconColor}`} strokeWidth={2} />
                </div>
                <h3 className="mt-5 text-lg font-bold text-saf-text">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-saf-muted">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="Features"
            title="Everything you need for a safer journey"
            subtitle="SAFEYATRI brings multiple safety capabilities together in one simple travel experience."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, i) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                gradient={feature.gradient}
                index={i}
              />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="How SAFEYATRI Helps"
            title="Safety that works around your journey"
            subtitle="From planning your trip to responding in an emergency, SAFEYATRI supports you at every step."
          />
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {JOURNEY_STEPS.map((step, i) => (
              <div key={step.num} className="relative">
                {/* Connector line */}
                {i < JOURNEY_STEPS.length - 1 && (
                  <div className="absolute top-10 left-[60%] hidden h-0.5 w-full bg-gradient-to-r from-saf-blue/30 to-transparent lg:block" />
                )}
                <div className="relative flex flex-col items-start">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-20 w-20 items-center justify-center rounded-2xl ${step.gradient} shadow-soft`}>
                      <step.icon className="h-8 w-8 text-white" strokeWidth={1.5} />
                    </div>
                    <span className="text-4xl font-extrabold text-saf-border">{step.num}</span>
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-saf-text">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-saf-muted">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tamil Nadu Section */}
      <section id="tamil-nadu" className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="Tamil Nadu"
            title="Built for exploring Tamil Nadu"
            subtitle="Counts reflect tourist locations in the integrated source data. Coverage varies by source district label."
          />
          <div className="mt-12 flex gap-5 overflow-x-auto pb-4 no-scrollbar sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3">
            {featuredDistricts.map((district, index) => (
              <Link key={district.district} to={`/safety-map?district=${encodeURIComponent(district.district)}`} className="block rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-saf-blue">
                <DestinationCard
                  name={district.district}
                  description={`${district.touristPlaceCount} integrated tourist places in the source data.`}
                  gradient={FEATURED_DISTRICT_STYLES[index].gradient}
                  emoji={FEATURED_DISTRICT_STYLES[index].emoji}
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Safety-First Section */}
      <section id="safety" className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-3xl gradient-blue-indigo p-10 shadow-float sm:p-16">
            <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-saf-cyan/20 blur-3xl" />
            <div className="absolute -right-20 -bottom-20 h-72 w-72 rounded-full bg-saf-indigo/30 blur-3xl" />

            <div className="relative grid items-center gap-10 lg:grid-cols-2">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-white">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Safety First
                </span>
                <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  Travel freely. Stay prepared.
                </h2>
                <p className="mt-4 max-w-xl text-lg leading-relaxed text-blue-100">
                  SAFEYATRI is designed to bring safety awareness, intelligent guidance and
                  emergency support into the travel experience — without making travel complicated.
                </p>
                <a
                  href="/"
                  className="mt-8 inline-flex items-center gap-1.5 rounded-xl bg-saf-white px-6 py-3.5 text-sm font-semibold text-saf-blue shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-float"
                >
                  Explore SAFEYATRI
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>

              {/* Shield illustration */}
              <div className="hidden justify-center lg:flex">
                <div className="relative">
                  <div className="flex h-48 w-48 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
                    <div className="flex h-36 w-36 items-center justify-center rounded-full bg-white/15">
                      <ShieldCheck className="h-16 w-16 text-white" strokeWidth={1.5} />
                    </div>
                  </div>
                  <div className="absolute -right-4 top-8 animate-float rounded-2xl bg-saf-white/95 p-3 shadow-card">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5 text-saf-blue" />
                      <span className="text-xs font-bold text-saf-text">Smart Zones</span>
                    </div>
                  </div>
                  <div className="absolute -left-4 bottom-12 animate-float-slow rounded-2xl bg-saf-white/95 p-3 shadow-card">
                    <div className="flex items-center gap-2">
                      <Siren className="h-5 w-5 text-saf-red" />
                      <span className="text-xs font-bold text-saf-text">Emergency</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section id="ai" className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-saf-indigo/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-saf-indigo">
                <Sparkles className="h-3.5 w-3.5" />
                AI Technology
              </span>
              <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-saf-text sm:text-4xl">
                Intelligence behind safer decisions
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-saf-muted">
                SAFEYATRI is designed to use machine learning to analyze multiple safety-related
                factors and provide meaningful insights for tourists.
              </p>
              <div className="mt-8 space-y-3">
                {AI_FACTORS.map((factor) => (
                  <div
                    key={factor.label}
                    className="flex items-center gap-3 rounded-xl border border-saf-border bg-saf-white p-3.5 shadow-soft transition-colors hover:border-saf-blue/30"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-saf-bg">
                      <factor.icon className={`h-4 w-4 ${factor.color}`} />
                    </div>
                    <span className="text-sm font-medium text-saf-text">{factor.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI visual */}
            <div className="relative">
              <div className="absolute -left-8 top-8 h-32 w-32 rounded-full bg-saf-blue/10 blur-2xl" />
              <div className="absolute -right-4 bottom-12 h-40 w-40 rounded-full bg-saf-indigo/10 blur-2xl" />

              <div className="relative rounded-3xl border border-saf-border bg-saf-white p-8 shadow-float">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-blue-indigo shadow-soft">
                    <Cpu className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-saf-text">SAFEYATRI Intelligence</p>
                    <p className="text-xs text-saf-muted">Product-enabling technology</p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {/* Input factors */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-saf-muted">
                      Safety Factors
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {AI_FACTORS.map((f) => (
                        <span
                          key={f.label}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-saf-border bg-saf-bg px-3 py-1.5 text-xs font-medium text-saf-text"
                        >
                          <f.icon className={`h-3 w-3 ${f.color}`} />
                          {f.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-saf-blue/10">
                      <ArrowRight className="h-5 w-5 text-saf-blue" />
                    </div>
                  </div>

                  {/* Output */}
                  <div className="rounded-xl gradient-blue-indigo p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-100">
                      Traveler Insights
                    </p>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-sm text-white">
                        <ShieldAlert className="h-4 w-4" />
                        Safety awareness guidance
                      </div>
                      <div className="flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-sm text-white">
                        <Route className="h-4 w-4" />
                        Safer route suggestions
                      </div>
                      <div className="flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-sm text-white">
                        <LifeBuoy className="h-4 w-4" />
                        Emergency readiness
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <CTASection
        title="Ready to explore Tamil Nadu with confidence?"
        subtitle="Discover a smarter approach to tourist safety with SAFEYATRI."
        buttonText="Get Started"
      />
    </div>
  );
}
