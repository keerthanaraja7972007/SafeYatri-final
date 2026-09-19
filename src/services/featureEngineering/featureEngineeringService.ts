import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { FeatureSet, FeatureDatasetSummary, FeatureRecord } from '@/types/featureEngineering';
import type { RiskLabelResult, RiskLabelEligibility, ClassDistributionAnalysis } from '@/types/riskLabels';
import type { TouristPlace } from '@/types/touristPlaces';
import type { WeatherData } from '@/types/weatherData';
import type { CrimeData } from '@/types/crimeData';
import type { EmergencyService } from '@/types/emergencyServices';
import type { TourismContext } from '@/types/tourismContext';
import { getTouristPlaces } from '@/services/touristPlacesService';
import { getWeatherData } from '@/services/weatherDataService';
import { getCrimeData } from '@/services/crimeDataService';
import { getEmergencyServices } from '@/services/emergencyService';
import { getTourismContext } from '@/services/tourismDataService';
import { FEATURE_REGISTRY, buildAvailabilityMatrix } from './featureRegistry';
import { extractWeatherFeatures } from './weatherFeatures';
import { extractCrimeFeatures } from './crimeFeatures';
import { extractEmergencyFeatures } from './emergencyFeatures';
import { extractTourismFeatures } from './tourismFeatures';
import { extractTemporalFeatures } from './temporalFeatures';
import { extractGeographicFeatures } from './geographicFeatures';
import { validateFeatureSet } from '@/utils/featureValidation';
import { buildTraceabilitySet } from '@/utils/featureTraceability';
import { createDatasetVersion, CURRENT_FEATURE_ENGINEERING_VERSION } from '@/utils/featureVersioning';
import { generateRiskLabel } from '@/services/riskMethodology/riskLabelService';
import { analyzeLabelDistribution, analyzeClassBalance } from '@/services/riskMethodology/riskLabelValidation';

export interface FeatureEngineeringResult {
  featureSets: FeatureSet[];
  summary: FeatureDatasetSummary;
  riskLabels: RiskLabelResult[];
  labelEligibility: RiskLabelEligibility;
  classDistribution: ClassDistributionAnalysis;
  traceability: { feature_name: string; source_dataset: string; source_record_id: string | null; original_value: unknown; derived_value: unknown; transformation: string | null; generated_at: string; processing_version: string }[];
}

/**
 * Run the full feature engineering pipeline across all datasets.
 * 1. Fetch all cleaned source data
 * 2. For each tourist place, extract all applicable features
 * 3. Validate features
 * 4. Build availability matrix
 * 5. Generate risk labels using the documented methodology
 * 6. Analyze label distribution and class balance
 * 7. Build traceability records
 */
export async function runFeatureEngineering(): Promise<FeatureEngineeringResult> {
  if (!supabase) throw new Error('Database is not configured.');

  // Fetch all source data in parallel
  const [places, weather, crime, emergency, tourism] = await Promise.all([
    getTouristPlaces(),
    getWeatherData(),
    getCrimeData(),
    getEmergencyServices(),
    getTourismContext(),
  ]);

  // Dataset record counts for availability matrix
  const datasetCounts: Record<string, number> = {
    tourist_places: places.length,
    weather_data: weather.length,
    crime_data: crime.length,
    emergency_services: emergency.length,
    tourism_context: tourism.length,
  };

  // Build feature sets for each tourist place
  const featureSets: FeatureSet[] = places.map((place) => {
    const generatedAt = new Date().toISOString();
    const features: FeatureRecord[] = [
      ...extractGeographicFeatures(place),
      ...extractWeatherFeatures(weather, place.id, place.district),
      ...extractCrimeFeatures(crime, place.id, place.district),
      ...extractEmergencyFeatures(emergency, place.district),
      ...extractTourismFeatures(tourism, place.id, place.district),
    ];

    // Add temporal features from the latest weather record if available
    const latestWeather = weather.find((w) => w.tourist_place_id === place.id || w.district === place.district);
    if (latestWeather) {
      features.push(...extractTemporalFeatures(latestWeather.recorded_at, 'weather_data', latestWeather.id));
    } else {
      features.push(...extractTemporalFeatures(null, 'weather_data', null));
    }

    return {
      tourist_place_id: place.id,
      district: place.district,
      features,
      generated_at: generatedAt,
      processing_version: CURRENT_FEATURE_ENGINEERING_VERSION,
    };
  });

  // Validate all features
  const allFeatures = featureSets.flatMap((fs) => fs.features);
  const validationResults = validateFeatureSet(allFeatures);

  // Build availability matrix
  const availabilityMatrix = buildAvailabilityMatrix(datasetCounts);

  // Build summary
  const availableCount = availabilityMatrix.filter((a) => a.available).length;
  const missingCount = availabilityMatrix.filter((a) => !a.available).length;
  const derivedCount = FEATURE_REGISTRY.filter((f) => f.is_derived).length;

  const version = createDatasetVersion(FEATURE_REGISTRY.length, featureSets.length);

  const summary: FeatureDatasetSummary = {
    totalFeatures: FEATURE_REGISTRY.length,
    availableFeatures: availableCount,
    missingFeatures: missingCount,
    derivedFeatures: derivedCount,
    categoricalFeatures: FEATURE_REGISTRY.filter((f) => f.data_type === 'categorical').length,
    numericalFeatures: FEATURE_REGISTRY.filter((f) => f.data_type === 'numeric').length,
    temporalFeatures: FEATURE_REGISTRY.filter((f) => f.data_type === 'temporal').length,
    geographicFeatures: FEATURE_REGISTRY.filter((f) => f.data_type === 'geographic').length,
    booleanFeatures: FEATURE_REGISTRY.filter((f) => f.data_type === 'boolean').length,
    availabilityMatrix,
    version,
  };

  // Generate risk labels
  const riskLabels: RiskLabelResult[] = featureSets.map((fs) =>
    generateRiskLabel(fs.features, fs.tourist_place_id, fs.district)
  );

  // Analyze label distribution
  const labelEligibility = analyzeLabelDistribution(riskLabels);
  const classDistribution = analyzeClassBalance(riskLabels);

  // Build traceability records
  const traceability = featureSets.flatMap((fs) =>
    buildTraceabilitySet(fs.features, fs.generated_at, fs.processing_version)
  );

  return {
    featureSets,
    summary,
    riskLabels,
    labelEligibility,
    classDistribution,
    traceability,
  };
}

export { isSupabaseConfigured, FEATURE_REGISTRY };
