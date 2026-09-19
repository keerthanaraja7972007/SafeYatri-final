import { MapPin } from 'lucide-react';

type DestinationCardProps = {
  name: string;
  description: string;
  gradient: string;
  emoji: string;
};

export default function DestinationCard({
  name,
  description,
  gradient,
  emoji,
}: DestinationCardProps) {
  return (
    <div className="group relative min-w-[260px] flex-shrink-0 overflow-hidden rounded-2xl border border-saf-border bg-saf-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover sm:min-w-[300px]">
      {/* Visual top */}
      <div className={`relative h-32 overflow-hidden ${gradient}`}>
        <div className="absolute inset-0 bg-black/5" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl opacity-90 transition-transform duration-500 group-hover:scale-110">
            {emoji}
          </span>
        </div>
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-saf-white/90 px-3 py-1 backdrop-blur-sm">
          <MapPin className="h-3 w-3 text-saf-blue" />
          <span className="text-[11px] font-semibold text-saf-text">Tamil Nadu</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-saf-text">{name}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-saf-muted">{description}</p>
      </div>
    </div>
  );
}
