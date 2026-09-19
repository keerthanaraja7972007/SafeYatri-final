import type { FeatureRecord } from '@/types/featureEngineering';
import type { WeatherData } from '@/types/weatherData';

/**
 * Extract weather features from cleaned weather data.
 * Only produces features where source values are actually present.
 * Does NOT fabricate missing values.
 */
export function extractWeatherFeatures(
  weather: WeatherData[],
  touristPlaceId: string | null,
  district: string | null
): FeatureRecord[] {
  // Filter to records matching this place or district
  const relevant = weather.filter(
    (w) =>
      (touristPlaceId && w.tourist_place_id === touristPlaceId) ||
      (district && w.district === district)
  );

  if (relevant.length === 0) {
    // No weather data available — return all features as unavailable
    return [
      unavailableFeature('temperature_value', 'weather_data', 'No weather data available for this location.'),
      unavailableFeature('humidity_value', 'weather_data', 'No weather data available for this location.'),
      unavailableFeature('precipitation_value', 'weather_data', 'No weather data available for this location.'),
      unavailableFeature('visibility_value', 'weather_data', 'No weather data available for this location.'),
      unavailableFeature('wind_speed_value', 'weather_data', 'No weather data available for this location.'),
      unavailableFeature('weather_condition', 'weather_data', 'No weather data available for this location.'),
    ];
  }

  // Use the most recent record for current conditions
  const latest = relevant[0];

  return [
    buildFeature('temperature_value', latest.temperature, 'weather_data', latest.id, 'numeric'),
    buildFeature('humidity_value', latest.humidity, 'weather_data', latest.id, 'numeric'),
    buildFeature('precipitation_value', latest.precipitation, 'weather_data', latest.id, 'numeric'),
    buildFeature('visibility_value', latest.visibility, 'weather_data', latest.id, 'numeric'),
    buildFeature('wind_speed_value', latest.wind_speed, 'weather_data', latest.id, 'numeric'),
    buildFeature('weather_condition', latest.weather_code, 'weather_data', latest.id, 'categorical'),
  ];
}

function buildFeature(
  name: string,
  value: unknown,
  sourceDataset: string,
  sourceRecordId: string,
  dataType: 'numeric' | 'categorical'
): FeatureRecord {
  const isAvailable = value !== null && value !== undefined;
  return {
    feature_name: name,
    value: isAvailable ? value : null,
    original_value: value,
    data_type: dataType,
    is_available: isAvailable,
    unavailable_reason: isAvailable ? null : 'Source value is null in the cleaned data.',
    transformation: 'Direct passthrough from cleaned source.',
    source_dataset: sourceDataset,
    source_record_id: sourceRecordId,
  };
}

function unavailableFeature(
  name: string,
  sourceDataset: string,
  reason: string
): FeatureRecord {
  return {
    feature_name: name,
    value: null,
    original_value: null,
    data_type: 'numeric',
    is_available: false,
    unavailable_reason: reason,
    transformation: null,
    source_dataset: sourceDataset,
    source_record_id: null,
  };
}
