import riskAssessmentUrl from '../../ml/final_risk_assessment/final_tourist_risk_assessment.json?url';
import type { TouristPlace, TouristRiskAssessment } from '@/types/touristPlaces';

const EXPECTED_ASSESSMENT_COUNT = 1958;
const EXPECTED_DISTRIBUTION: Record<TouristRiskAssessment['risk_level'], number> = {
  'LOW RISK': 631,
  'MODERATE RISK': 682,
  'HIGH RISK': 645,
};
const EXPECTED_SCORE_RANGE = { minimum: 17.720747, maximum: 78.65736 };
const VALID_RISK_LEVELS = new Set<TouristRiskAssessment['risk_level']>(Object.keys(EXPECTED_DISTRIBUTION) as TouristRiskAssessment['risk_level'][]);
type RiskRecord = TouristRiskAssessment & {
  place_name: string;
  district: string;
  latitude: number;
  longitude: number;
  place_category: string;
  place_source_url: string | null;
};
type RiskMatchPlace = Pick<TouristPlace, 'id' | 'name' | 'district' | 'latitude' | 'longitude' | 'category'> & Partial<Pick<TouristPlace, 'source_url'>>;
type RiskIndex = { byId: Map<string, RiskRecord>; bySource: Map<string, RiskRecord[]>; byLocation: Map<string, RiskRecord[]>; byName: Map<string, RiskRecord[]> };
let riskAssessmentMapPromise: Promise<RiskIndex> | null = null;

function normalizedName(value: string): string {
  return value.split(',')[0].normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}
function normalizedDistrict(value: string): string { return value.normalize('NFKD').trim().toLowerCase().replace(/\s+/g, ' '); }
function sourceKey(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  try { const url = new URL(value.trim()); return url.origin.toLowerCase() + url.pathname.replace(/\/+$/, '').toLowerCase() + url.search; }
  catch { return value.trim().toLowerCase(); }
}
function locationKey(place: Pick<RiskRecord, 'district' | 'latitude' | 'longitude'> | Pick<RiskMatchPlace, 'district' | 'latitude' | 'longitude'>): string | null {
  if (!Number.isFinite(place.latitude) || !Number.isFinite(place.longitude)) return null;
  return normalizedDistrict(place.district) + '|' + place.latitude.toFixed(6) + '|' + place.longitude.toFixed(6);
}
function nameKey(place: Pick<RiskRecord, 'place_name' | 'district'> | Pick<RiskMatchPlace, 'name' | 'district'>): string {
  const name = 'place_name' in place ? place.place_name : place.name;
  return normalizedName(name) + '|' + normalizedDistrict(place.district);
}
function addToIndex<T>(index: Map<string, T[]>, key: string | null, value: T) {
  if (!key) return;
  const records = index.get(key) ?? [];
  records.push(value);
  index.set(key, records);
}

async function loadRiskAssessments(): Promise<RiskIndex> {
  if (!riskAssessmentMapPromise) {
    riskAssessmentMapPromise = fetch(riskAssessmentUrl)
      .then(async (response) => {
        if (!response.ok) throw new Error('Risk assessment data returned HTTP ' + response.status + '.');
        const records = await response.json() as RiskRecord[];
        if (!Array.isArray(records) || records.length !== EXPECTED_ASSESSMENT_COUNT) throw new Error('Expected ' + EXPECTED_ASSESSMENT_COUNT + ' risk records.');
        const index: RiskIndex = { byId: new Map(), bySource: new Map(), byLocation: new Map(), byName: new Map() };
        const distribution: Record<TouristRiskAssessment['risk_level'], number> = { 'LOW RISK': 0, 'MODERATE RISK': 0, 'HIGH RISK': 0 };
        let minimum = Infinity; let maximum = -Infinity;
        for (const record of records) {
          if (!record.place_id || index.byId.has(record.place_id)) throw new Error('Risk assessment place IDs must be present and unique.');
          if (!VALID_RISK_LEVELS.has(record.risk_level) || !Number.isFinite(record.risk_score) || !record.place_name || !record.district || !Number.isFinite(record.latitude) || !Number.isFinite(record.longitude)) throw new Error('Invalid risk assessment record for ' + record.place_id + '.');
          index.byId.set(record.place_id, record);
          addToIndex(index.bySource, sourceKey(record.place_source_url), record);
          addToIndex(index.byLocation, locationKey(record), record);
          addToIndex(index.byName, nameKey(record), record);
          distribution[record.risk_level] += 1;
          minimum = Math.min(minimum, record.risk_score); maximum = Math.max(maximum, record.risk_score);
        }
        if (Object.keys(EXPECTED_DISTRIBUTION).some(level => distribution[level as TouristRiskAssessment['risk_level']] !== EXPECTED_DISTRIBUTION[level as TouristRiskAssessment['risk_level']])) throw new Error('The final risk assessment distribution does not match the published artifact.');
        if (minimum !== EXPECTED_SCORE_RANGE.minimum || maximum !== EXPECTED_SCORE_RANGE.maximum) throw new Error('The final risk assessment score range does not match the published artifact.');
        return index;
      })
      .catch((error: unknown) => { riskAssessmentMapPromise = null; throw error; });
  }
  return riskAssessmentMapPromise;
}

function findUnique(records: RiskRecord[] | undefined): RiskRecord | undefined { return records?.length === 1 ? records[0] : undefined; }
function findAssessment(place: RiskMatchPlace, index: RiskIndex): RiskRecord | undefined {
  const byId = index.byId.get(place.id);
  if (byId) return byId;
  const source = sourceKey(place.source_url);
  const bySource = findUnique(source ? index.bySource.get(source) : undefined);
  if (bySource) return bySource;
  const locationCandidates = index.byLocation.get(locationKey(place) ?? '') ?? [];
  if (locationCandidates.length === 1) return locationCandidates[0];
  if (locationCandidates.length > 1) return findUnique(locationCandidates.filter(record => nameKey(record) === nameKey(place)));
  return findUnique(index.byName.get(nameKey(place)));
}

export async function attachRiskAssessments<T extends RiskMatchPlace>(places: T[]): Promise<Array<T & { risk_assessment: TouristRiskAssessment | null }>> {
  const index = await loadRiskAssessments();
  const attached = places.map(place => ({ ...place, risk_assessment: findAssessment(place, index) ?? null }));
  const unmatched = attached.filter(place => place.risk_assessment === null).length;
  if (places.length === EXPECTED_ASSESSMENT_COUNT && unmatched > 0) throw new Error('Risk coverage validation failed: ' + unmatched + ' of ' + EXPECTED_ASSESSMENT_COUNT + ' tourist places have no unique assessment.');
  if (import.meta.env.DEV && places.length === EXPECTED_ASSESSMENT_COUNT && unmatched !== 0) console.error('SAFEYATRI risk coverage mismatch', { expectedTouristPlaces: EXPECTED_ASSESSMENT_COUNT, expectedRiskAssessments: index.byId.size, unmatched });
  return attached;
}

export function riskAssessmentMatchSummary(placeIds: string[], riskIds: string[]) {
  const riskIdSet = new Set(riskIds);
  return { touristPlaces: placeIds.length, riskRecords: riskIds.length, matched: placeIds.filter(id => riskIdSet.has(id)).length, unmatched: placeIds.filter(id => !riskIdSet.has(id)).length, duplicateRiskIds: riskIds.length - riskIdSet.size };
}

export async function getRiskAssessmentDistribution() {
  const assessments = await loadRiskAssessments();
  return { total: assessments.byId.size, counts: { ...EXPECTED_DISTRIBUTION } };
}
