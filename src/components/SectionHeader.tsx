type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  className?: string;
};

export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  className = '',
}: SectionHeaderProps) {
  return (
    <div
      className={`${align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'} ${className}`}
    >
      {eyebrow && (
        <span className="inline-block rounded-full bg-saf-blue/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-saf-blue">
          {eyebrow}
        </span>
      )}
      <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-saf-text sm:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-lg leading-relaxed text-saf-muted">{subtitle}</p>
      )}
    </div>
  );
}
