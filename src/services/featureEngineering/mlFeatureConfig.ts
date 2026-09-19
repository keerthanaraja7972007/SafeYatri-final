/**
 * Configuration for the hourly ML feature vector.
 *
 * These thresholds are feature-engineering indicators only. They are not
 * validated safety-label thresholds and must not be used to create targets.
 */
export const ML_WEATHER_THRESHOLDS = {
  heavyRainPrecipitationMm: 10,
  highWindSpeedKmh: 31.25,
  highTemperatureC: 35,
  highHumidityPercent: 90,
} as const;

export const ML_FEATURE_METHODOLOGY = {
  visibility: 'Excluded: source visibility is unavailable for all audited records.',
  precipitation: 'Retain every non-negative source value; positive rainfall is not an error.',
  categoricalEncoding: 'One-hot encode tourist_place_id and district using sorted observed categories.',
  split: 'Chronological by recorded_at; earlier records train and later records test.',
  target: 'Blocked until the existing risk-label methodology is validated.',
} as const;
