import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Construction, ChevronRight } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';

type PlaceholderPageProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
};

export default function PlaceholderPage({ title, description, icon: Icon, gradient }: PlaceholderPageProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 pt-16">
        <div className="mx-auto max-w-2xl text-center">
          <div
            className={`mx-auto flex h-20 w-20 items-center justify-center rounded-3xl ${gradient} shadow-float`}
          >
            <Icon className="h-10 w-10 text-white" strokeWidth={1.5} />
          </div>

          <h1 className="mt-8 text-3xl font-extrabold tracking-tight text-saf-text sm:text-4xl">
            {title}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-saf-muted">{description}</p>

          <div className="mt-8 inline-flex items-center gap-2 rounded-xl border border-saf-border bg-saf-white px-5 py-3 text-sm font-medium text-saf-muted shadow-soft">
            <Construction className="h-4 w-4 text-saf-orange" />
            Coming in a later development stage
          </div>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-saf-border bg-saf-white px-5 py-3 text-sm font-semibold text-saf-text transition-all hover:border-saf-blue/30 hover:bg-saf-bg hover:shadow-soft"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-xl gradient-blue-indigo px-5 py-3 text-sm font-semibold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-float"
            >
              View Dashboard
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
