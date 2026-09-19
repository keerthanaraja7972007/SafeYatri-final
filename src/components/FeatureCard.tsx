import type { LucideIcon } from 'lucide-react';

type FeatureCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
  index?: number;
};

export default function FeatureCard({
  icon: Icon,
  title,
  description,
  gradient,
  index = 0,
}: FeatureCardProps) {
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-saf-border bg-saf-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Hover gradient overlay */}
      <div
        className={`absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-20 ${gradient}`}
      />

      <div
        className={`relative flex h-12 w-12 items-center justify-center rounded-xl ${gradient} shadow-soft transition-transform duration-300 group-hover:scale-110`}
      >
        <Icon className="h-6 w-6 text-white" strokeWidth={2} />
      </div>

      <h3 className="relative mt-5 text-lg font-bold text-saf-text">{title}</h3>
      <p className="relative mt-2 text-sm leading-relaxed text-saf-muted">{description}</p>
    </div>
  );
}
