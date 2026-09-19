import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { PreprocessingResult, PreprocessingLog } from '@/types/preprocessing';
import { getWeatherData } from '@/services/weatherDataService';
import { getCrimeData } from '@/services/crimeDataService';
import { getEmergencyServices } from '@/services/emergencyService';
import { getTourismContext } from '@/services/tourismDataService';
import { getTouristPlaces } from '@/services/touristPlacesService';
import { preprocessWeatherData } from './weatherPreprocessor';
import { preprocessCrimeData } from './crimePreprocessor';
import { preprocessEmergencyData } from './emergencyPreprocessor';
import { preprocessTourismData } from './tourismPreprocessor';
import { preprocessTouristPlaceData } from './touristPlacePreprocessor';

export type DatasetName =
  | 'weather_data'
  | 'crime_data'
  | 'emergency_services'
  | 'tourism_context'
  | 'tourist_places';

/**
 * Run preprocessing for a single dataset.
 * Fetches raw data, runs the appropriate preprocessor, logs the result, and returns it.
 */
export async function preprocessDataset(dataset: DatasetName): Promise<PreprocessingResult> {
  switch (dataset) {
    case 'weather_data': {
      const raw = await getWeatherData();
      return preprocessWeatherData(raw);
    }
    case 'crime_data': {
      const raw = await getCrimeData();
      return preprocessCrimeData(raw);
    }
    case 'emergency_services': {
      const raw = await getEmergencyServices();
      return preprocessEmergencyData(raw);
    }
    case 'tourism_context': {
      const raw = await getTourismContext();
      return preprocessTourismData(raw);
    }
    case 'tourist_places': {
      const raw = await getTouristPlaces();
      return preprocessTouristPlaceData(raw);
    }
    default:
      throw new Error(`Unknown dataset: ${dataset}`);
  }
}

/**
 * Run preprocessing across all datasets and log each run.
 */
export async function preprocessAll(): Promise<PreprocessingResult[]> {
  const datasets: DatasetName[] = [
    'tourist_places',
    'weather_data',
    'crime_data',
    'emergency_services',
    'tourism_context',
  ];

  const results: PreprocessingResult[] = [];
  for (const dataset of datasets) {
    const result = await preprocessDataset(dataset);
    await logPreprocessingRun(result);
    results.push(result);
  }
  return results;
}

/**
 * Persist a preprocessing run to the preprocessing_logs table.
 */
async function logPreprocessingRun(result: PreprocessingResult): Promise<void> {
  if (!supabase) return;

  const logEntry = {
    dataset: result.dataset,
    processing_started: result.processingStarted,
    processing_completed: result.processingCompleted,
    records_received: result.summary.totalRecords,
    records_clean: result.summary.validRecords,
    records_invalid: result.summary.invalidRecords,
    records_incomplete: result.summary.incompleteRecords,
    records_duplicate: result.summary.duplicateRecords,
    records_needs_review: result.summary.needsReviewRecords,
    notes: `Missing-value records: ${result.summary.missingValueRecords}. Records retained: ${result.summary.retainedRecords}.`,
    status: 'Completed' as const,
  };

  await supabase.from('preprocessing_logs').insert(logEntry);
}

/**
 * Fetch all preprocessing logs from the database.
 */
export async function getPreprocessingLogs(): Promise<PreprocessingLog[]> {
  if (!supabase) throw new Error('Database is not configured.');

  const { data, error } = await supabase
    .from('preprocessing_logs')
    .select('*')
    .order('processing_started', { ascending: false });

  if (error) throw error;
  return (data ?? []) as PreprocessingLog[];
}

export { isSupabaseConfigured };
