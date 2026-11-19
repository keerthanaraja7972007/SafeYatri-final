import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  MapPin,
  Filter,
  X,
  ChevronRight,
  Loader2,
  AlertCircle,
  Compass,
  ArrowLeft,
  ChevronLeft,
} from 'lucide-react';
import type { TouristPlace, TouristCategory, TouristRiskLevel } from '@/types/touristPlaces';
import RiskAssessmentBadge from '@/components/RiskAssessmentBadge';
import RiskAssessmentPanel from '@/components/RiskAssessmentPanel';

const CATEGORIES: TouristCategory[] = [
  'Heritage',
  'Beach',
  'Hill Station',
  'Temple',
  'Wildlife',
  'Waterfall',
  'Adventure',
  'Cultural',
  'Pilgrimage',
];

const CATEGORY_COLORS: Record<string, string> = {
  Heritage: 'bg-saf-orange/10 text-saf-orange',
  Beach: 'bg-saf-cyan/10 text-saf-cyan',
  'Hill Station': 'bg-saf-green/10 text-saf-green',
  Temple: 'bg-saf-orange/10 text-saf-orange',
  Wildlife: 'bg-saf-green/10 text-saf-green',
  Waterfall: 'bg-saf-sky/10 text-saf-sky',
  Adventure: 'bg-saf-red/10 text-saf-red',
  Cultural: 'bg-saf-indigo/10 text-saf-indigo',
  Pilgrimage: 'bg-saf-blue/10 text-saf-blue',
};

type State = 'loading' | 'success' | 'error' | 'empty';

type ExploreDashboardProps = {
  places: TouristPlace[];
  state: State;
  onRetry: () => void;
};

const PAGE_SIZE = 36;

export default function ExploreDashboard({ places, state, onRetry }: ExploreDashboardProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TouristCategory | 'All'>('All');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<TouristRiskLevel | 'All'>('All');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [page, setPage] = useState(1);
  const [selectedPlace, setSelectedPlace] = useState<TouristPlace | null>(null);

  const districts = useMemo(() => {
    const set = new Set(places.map((p) => p.district));
    return ['All', ...Array.from(set).sort()];
  }, [places]);

  const filteredPlaces = useMemo(() => {
    return places.filter((place) => {
      const matchesSearch = search.trim() === '' ||
        `${place.name} ${place.city ?? ''} ${place.location_label ?? ''} ${place.district} ${place.category}`.toLowerCase().includes(search.trim().toLowerCase());
      const matchesCategory = selectedCategory === 'All' || place.category === selectedCategory;
      const matchesDistrict = selectedDistrict === 'All' || place.district === selectedDistrict;
      const matchesRiskLevel = selectedRiskLevel === 'All' || place.risk_assessment?.risk_level === selectedRiskLevel;
      const matchesLocation = !selectedLocation.trim() || `${place.city ?? ''} ${place.location_label ?? ''} ${place.district}`.toLowerCase().includes(selectedLocation.trim().toLowerCase());
      return matchesSearch && matchesCategory && matchesDistrict && matchesLocation && matchesRiskLevel;
    });
  }, [places, search, selectedCategory, selectedDistrict, selectedLocation, selectedRiskLevel]);

  const pageCount = Math.max(1, Math.ceil(filteredPlaces.length / PAGE_SIZE));
  const visiblePlaces = filteredPlaces.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // --- Destination details view ---
  if (selectedPlace) {
    return (
      <div className="px-4 pt-20 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <button
            onClick={() => setSelectedPlace(null)}
            className="mb-6 inline-flex items-center gap-1.5 rounded-xl border border-saf-border bg-saf-white px-4 py-2.5 text-sm font-semibold text-saf-text shadow-soft transition-all hover:border-saf-blue/30 hover:bg-saf-bg"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to destinations
          </button>
          <Link to={`/safety-map?placeId=${encodeURIComponent(selectedPlace.id)}`} className="mb-6 ml-3 inline-flex items-center gap-1.5 rounded-xl bg-saf-blue px-4 py-2.5 text-sm font-semibold text-white">
            <MapPin className="h-4 w-4" />Open in safety map
          </Link>

          <div className="overflow-hidden rounded-3xl border border-saf-border bg-saf-white shadow-card">
            {/* Header */}
            <div className="border-b border-saf-border bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${CATEGORY_COLORS[selectedPlace.category] ?? 'bg-saf-blue/10 text-saf-blue'}`}
                  >
                    {selectedPlace.category}
                  </span>
                  <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-saf-text">
                    {selectedPlace.name}
                  </h1>
                  <div className="mt-2 flex items-center gap-2 text-sm text-saf-muted">
                    <MapPin className="h-4 w-4 text-saf-blue" />
                    {selectedPlace.city ? `${selectedPlace.city}, ` : ''}
                    {selectedPlace.district} District, Tamil Nadu
                  </div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-8">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Left: details */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-saf-muted">
                      About this destination
                    </h2>
                    {selectedPlace.name_ta && <p className="mt-2 text-sm text-saf-muted">{selectedPlace.name_ta}</p>}
                    <p className="mt-2 text-base leading-relaxed text-saf-text">
                      {selectedPlace.description}
                    </p>
                    {selectedPlace.source_url && <a href={selectedPlace.source_url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold text-saf-blue hover:underline">Open source record</a>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-saf-border bg-saf-bg p-4">
                      <p className="text-xs font-medium text-saf-muted">District</p>
                      <p className="mt-1 text-sm font-bold text-saf-text">{selectedPlace.district}</p>
                    </div>
                    <div className="rounded-xl border border-saf-border bg-saf-bg p-4">
                      <p className="text-xs font-medium text-saf-muted">Category</p>
                      <p className="mt-1 text-sm font-bold text-saf-text">{selectedPlace.category}</p>
                    </div>
                    <div className="rounded-xl border border-saf-border bg-saf-bg p-4">
                      <p className="text-xs font-medium text-saf-muted">Latitude</p>
                      <p className="mt-1 text-sm font-bold text-saf-text">
                        {selectedPlace.latitude.toFixed(4)}°
                      </p>
                    </div>
                    <div className="rounded-xl border border-saf-border bg-saf-bg p-4">
                      <p className="text-xs font-medium text-saf-muted">Longitude</p>
                      <p className="mt-1 text-sm font-bold text-saf-text">
                        {selectedPlace.longitude.toFixed(4)}°
                      </p>
                    </div>
                  </div>
                </div>

                <RiskAssessmentPanel assessment={selectedPlace.risk_assessment} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Main dashboard view ---
  return (
    <div className="px-4 pt-20 pb-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block rounded-full bg-saf-blue/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-saf-blue">
            Explore Tamil Nadu
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-saf-text sm:text-4xl">
            Explore Tamil Nadu
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-saf-muted">
            Discover destinations across Tamil Nadu through SAFEYATRI.
          </p>
          <Link
            to="/safety-map"
            className="mt-5 inline-flex items-center gap-2 rounded-xl gradient-blue-indigo px-4 py-2.5 text-sm font-bold text-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-float"
          >
            <MapPin className="h-4 w-4" />
            Open Safety Map
          </Link>
        </div>

        {/* Search & filters */}
        <div className="mt-10 space-y-4">
          {/* Search bar */}
          <div className="relative mx-auto max-w-xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-saf-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search destinations by name, city, or district..."
              className="w-full rounded-xl border border-saf-border bg-saf-white py-3 pl-12 pr-4 text-sm text-saf-text shadow-soft outline-none transition-all placeholder:text-saf-muted focus:border-saf-blue/40 focus:ring-2 focus:ring-saf-blue/10"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-saf-muted transition-colors hover:bg-saf-bg hover:text-saf-text"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Category pills + district dropdown */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setSelectedCategory('All'); setPage(1); }}
                className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                  selectedCategory === 'All'
                    ? 'gradient-blue-indigo text-white shadow-soft'
                    : 'border border-saf-border bg-saf-white text-saf-muted hover:border-saf-blue/30 hover:text-saf-text'
                }`}
              >
                All Categories
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setSelectedCategory(cat); setPage(1); }}
                  className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                    selectedCategory === cat
                      ? 'gradient-blue-indigo text-white shadow-soft'
                      : 'border border-saf-border bg-saf-white text-saf-muted hover:border-saf-blue/30 hover:text-saf-text'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-saf-muted" />
              <select
                value={selectedDistrict}
                onChange={(e) => { setSelectedDistrict(e.target.value); setPage(1); }}
                className="rounded-xl border border-saf-border bg-saf-white px-4 py-2.5 text-sm font-medium text-saf-text shadow-soft outline-none transition-all focus:border-saf-blue/40 focus:ring-2 focus:ring-saf-blue/10"
              >
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d === 'All' ? 'All Districts' : d}
                  </option>
                ))}
              </select>
              <select
                aria-label="Filter by ML risk level"
                value={selectedRiskLevel}
                onChange={(e) => { setSelectedRiskLevel(e.target.value as TouristRiskLevel | 'All'); setPage(1); }}
                className="rounded-xl border border-saf-border bg-saf-white px-4 py-2.5 text-sm font-medium text-saf-text shadow-soft outline-none transition-all focus:border-saf-blue/40 focus:ring-2 focus:ring-saf-blue/10"
              >
                <option value="All">All Risk Levels</option>
                <option value="LOW RISK">Low Risk</option>
                <option value="MODERATE RISK">Moderate Risk</option>
                <option value="HIGH RISK">High Risk</option>
              </select>
              <input
                value={selectedLocation}
                onChange={(e) => { setSelectedLocation(e.target.value); setPage(1); }}
                aria-label="Filter by city or source location"
                placeholder="Filter city / location"
                className="w-full rounded-xl border border-saf-border bg-saf-white px-4 py-2.5 text-sm font-medium text-saf-text shadow-soft outline-none transition-all focus:border-saf-blue/40 focus:ring-2 focus:ring-saf-blue/10"
              />
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-saf-muted">
            {state === 'success' && (
              <>
                {filteredPlaces.length} destination{filteredPlaces.length !== 1 ? 's' : ''} found
              </>
            )}
          </p>
          {(selectedCategory !== 'All' || selectedDistrict !== 'All' || selectedRiskLevel !== 'All' || selectedLocation || search) && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('All');
                setSelectedDistrict('All');
                setSelectedRiskLevel('All');
                setSelectedLocation('');
                setPage(1);
              }}
              className="text-sm font-medium text-saf-blue transition-colors hover:text-saf-indigo"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Content */}
        <div className="mt-6">
          {state === 'loading' && (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="h-10 w-10 animate-spin text-saf-blue" />
              <p className="mt-4 text-sm font-medium text-saf-muted">Loading destinations...</p>
            </div>
          )}

          {state === 'error' && (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-saf-red/10">
                <AlertCircle className="h-8 w-8 text-saf-red" />
              </div>
              <p className="mt-4 text-lg font-bold text-saf-text">
                Unable to load destinations
              </p>
              <p className="mt-1 text-sm text-saf-muted">Please try again.</p>
              <button
                onClick={onRetry}
                className="mt-6 inline-flex items-center gap-1.5 rounded-xl gradient-blue-indigo px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-float"
              >
                Try Again
              </button>
            </div>
          )}

          {state === 'success' && filteredPlaces.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-saf-bg border border-saf-border">
                <Compass className="h-8 w-8 text-saf-muted" />
              </div>
              <p className="mt-4 text-lg font-bold text-saf-text">No destinations found</p>
              <p className="mt-1 text-sm text-saf-muted">
                Try adjusting your search or filters.
              </p>
            </div>
          )}

          {state === 'success' && filteredPlaces.length > 0 && (
            <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visiblePlaces.map((place) => (
                <button
                  key={place.id}
                  onClick={() => setSelectedPlace(place)}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-saf-border bg-saf-white text-left shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
                >
                  {/* Visual header */}
                  <div className="relative h-28 overflow-hidden bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <MapPin className="h-10 w-10 text-saf-blue/30 transition-transform duration-500 group-hover:scale-110" />
                    </div>
                    <span
                      className={`absolute top-3 left-3 rounded-full px-3 py-1 text-[10px] font-semibold ${CATEGORY_COLORS[place.category] ?? 'bg-saf-blue/10 text-saf-blue'}`}
                    >
                      {place.category}
                    </span>
                    <RiskAssessmentBadge level={place.risk_assessment?.risk_level} className="absolute right-3 top-3" />
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-lg font-bold text-saf-text">{place.name}</h3>
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-saf-muted">
                      <MapPin className="h-3.5 w-3.5 text-saf-blue" />
                      {place.city ? `${place.city}, ` : ''}
                      {place.district}
                    </div>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-saf-muted line-clamp-2">
                      {place.description}
                    </p>
                    <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-saf-blue transition-colors group-hover:text-saf-indigo">
                      View details
                      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between gap-3 text-sm text-saf-muted">
              <span>Page {page} of {pageCount} · Showing {visiblePlaces.length} of {filteredPlaces.length}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} aria-label="Previous page" className="inline-flex items-center gap-1 rounded-lg border border-saf-border bg-saf-white px-3 py-2 font-semibold text-saf-text disabled:opacity-40"><ChevronLeft className="h-4 w-4" />Previous</button>
                <button onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page === pageCount} aria-label="Next page" className="inline-flex items-center gap-1 rounded-lg border border-saf-border bg-saf-white px-3 py-2 font-semibold text-saf-text disabled:opacity-40">Next<ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
