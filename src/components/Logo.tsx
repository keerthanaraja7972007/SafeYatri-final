import { Shield, MapPin } from 'lucide-react';

type LogoProps = {
  className?: string;
  showText?: boolean;
};

export default function Logo({ className = '', showText = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="relative">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-blue-indigo shadow-soft">
          <Shield className="h-5 w-5 text-white" strokeWidth={2.5} />
        </div>
        <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-saf-white shadow-soft ring-1 ring-saf-border">
          <MapPin className="h-3 w-3 text-saf-blue" strokeWidth={2.5} />
        </div>
      </div>
      {showText && (
        <span className="text-xl font-extrabold tracking-tight text-saf-text">
          SAFE<span className="text-saf-blue">YATRI</span>
        </span>
      )}
    </div>
  );
}
