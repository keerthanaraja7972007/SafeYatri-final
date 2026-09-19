import type { WeatherData } from '@/types/weatherData';
import { ML_WEATHER_THRESHOLDS } from './mlFeatureConfig';

export interface MlFeatureRow {
  source_record_id: string;
  recorded_at: string;
  temperature: number;
  humidity: number;
  precipitation: number;
  wind_speed: number;
  weather_code: string;
  hour: number;
  day_of_week: number;
  month: number;
  is_weekend: boolean;
  is_night: boolean;
  tourist_place_id: string;
  district: string;
  heavy_rain: boolean;
  high_wind: boolean;
  high_temperature: boolean;
  high_humidity: boolean;
  extreme_weather: boolean;
  night_time: boolean;
}

export interface MlFeatureBuildResult {
  rows: MlFeatureRow[];
  excludedRecords: Array<{ id: string; reason: string }>;
}

export interface EncodedMlFeatureRow extends Omit<MlFeatureRow, 'tourist_place_id' | 'district'> {
  tourist_place_id: string;
  district: string;
  tourist_place_features: Record<string, number>;
  district_features: Record<string, number>;
}

export interface ChronologicalSplit<T> {
  train: T[];
  test: T[];
  splitAt: string | null;
}

/**
 * Build one ML feature row per valid hourly weather observation.
 * Visibility is deliberately absent from this vector because it is unavailable
 * in the source dataset. No source weather record is mutated.
 */
export function buildMlFeatureRows(records: WeatherData[]): MlFeatureBuildResult {
  const rows: MlFeatureRow[] = [];
  const excludedRecords: Array<{ id: string; reason: string }> = [];

  for (const record of records) {
    const timestamp = new Date(record.recorded_at);

    if (
      Number.isNaN(timestamp.getTime()) ||
      !record.tourist_place_id ||
      !record.district ||
      record.weather_code === null ||
      record.temperature === null ||
      record.humidity === null ||
      record.precipitation === null ||
      record.wind_speed === null ||
      !Number.isFinite(record.temperature) ||
      !Number.isFinite(record.humidity) ||
      !Number.isFinite(record.precipitation) ||
      !Number.isFinite(record.wind_speed)
    ) {
      excludedRecords.push({ id: record.id, reason: 'Missing or invalid required ML feature source value.' });
      continue;
    }

    const hour = timestamp.getUTCHours();
    const dayOfWeek = timestamp.getUTCDay();
    const month = timestamp.getUTCMonth() + 1;
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isNight = hour < 6 || hour >= 18;
    const heavyRain = record.precipitation >= ML_WEATHER_THRESHOLDS.heavyRainPrecipitationMm;
    const highWind = record.wind_speed >= ML_WEATHER_THRESHOLDS.highWindSpeedKmh;
    const highTemperature = record.temperature >= ML_WEATHER_THRESHOLDS.highTemperatureC;
    const highHumidity = record.humidity >= ML_WEATHER_THRESHOLDS.highHumidityPercent;

    rows.push({
      source_record_id: record.id,
      recorded_at: record.recorded_at,
      temperature: record.temperature,
      humidity: record.humidity,
      precipitation: record.precipitation,
      wind_speed: record.wind_speed,
      weather_code: record.weather_code,
      hour,
      day_of_week: dayOfWeek,
      month,
      is_weekend: isWeekend,
      is_night: isNight,
      tourist_place_id: record.tourist_place_id,
      district: record.district,
      heavy_rain: heavyRain,
      high_wind: highWind,
      high_temperature: highTemperature,
      high_humidity: highHumidity,
      extreme_weather: heavyRain || highWind || highTemperature,
      night_time: isNight,
    });
  }

  return { rows, excludedRecords };
}

/** Encode categorical location fields without imposing numeric ordering. */
export function oneHotEncodeLocation(rows: MlFeatureRow[]): EncodedMlFeatureRow[] {
  const placeCategories = [...new Set(rows.map((row) => row.tourist_place_id))].sort();
  const districtCategories = [...new Set(rows.map((row) => row.district))].sort();

  return rows.map((row) => ({
    ...row,
    tourist_place_features: oneHotValues(placeCategories, row.tourist_place_id),
    district_features: oneHotValues(districtCategories, row.district),
  }));
}

/** Split already-sorted or unsorted rows chronologically without random leakage. */
export function chronologicalSplit<T extends { recorded_at: string }>(rows: T[], trainFraction = 0.8): ChronologicalSplit<T> {
  const sorted = [...rows].sort((left, right) => left.recorded_at.localeCompare(right.recorded_at));
  const splitIndex = Math.floor(sorted.length * trainFraction);

  return {
    train: sorted.slice(0, splitIndex),
    test: sorted.slice(splitIndex),
    splitAt: sorted[splitIndex]?.recorded_at ?? null,
  };
}

function oneHotValues(categories: string[], selected: string): Record<string, number> {
  return Object.fromEntries(categories.map((category) => [category, category === selected ? 1 : 0]));
}
