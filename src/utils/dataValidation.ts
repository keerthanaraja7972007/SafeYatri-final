export type DataQualityStatus = 'Valid' | 'Incomplete' | 'Invalid' | 'Pending Verification';

export interface ValidationResult {
  status: DataQualityStatus;
  errors: string[];
}

export function validateLatitude(lat: number | null | undefined): boolean {
  if (lat === null || lat === undefined) return true;
  return typeof lat === 'number' && lat >= -90 && lat <= 90;
}

export function validateLongitude(lng: number | null | undefined): boolean {
  if (lng === null || lng === undefined) return true;
  return typeof lng === 'number' && lng >= -180 && lng <= 180;
}

export function validateDate(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
}

export function validateNumeric(
  value: number | null | undefined,
  min?: number,
  max?: number
): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value !== 'number' || isNaN(value)) return false;
  if (min !== undefined && value < min) return false;
  if (max !== undefined && value > max) return false;
  return true;
}

export function validateRequired(value: string | null | undefined, fieldName: string): string | null {
  if (!value || !value.trim()) return `${fieldName} is required.`;
  return null;
}

export function validateWeatherRecord(record: {
  recorded_at?: string;
  source?: string;
  temperature?: number | null;
  humidity?: number | null;
  latitude?: number | null;
  longitude?: number | null;
}): ValidationResult {
  const errors: string[] = [];

  const dateErr = validateRequired(record.recorded_at, 'Recorded date');
  if (dateErr) errors.push(dateErr);
  else if (!validateDate(record.recorded_at)) errors.push('Recorded date is not a valid date.');

  const sourceErr = validateRequired(record.source, 'Source');
  if (sourceErr) errors.push(sourceErr);

  if (!validateNumeric(record.temperature, -100, 100))
    errors.push('Temperature must be a number between -100 and 100.');
  if (!validateNumeric(record.humidity, 0, 100))
    errors.push('Humidity must be a number between 0 and 100.');

  return { status: errors.length === 0 ? 'Valid' : 'Invalid', errors };
}

export function validateCrimeRecord(record: {
  date?: string;
  crime_category?: string;
  source?: string;
  incident_count?: number | null;
}): ValidationResult {
  const errors: string[] = [];

  const dateErr = validateRequired(record.date, 'Date');
  if (dateErr) errors.push(dateErr);
  else if (!validateDate(record.date)) errors.push('Date is not a valid date.');

  const catErr = validateRequired(record.crime_category, 'Crime category');
  if (catErr) errors.push(catErr);

  const sourceErr = validateRequired(record.source, 'Source');
  if (sourceErr) errors.push(sourceErr);

  if (
    record.incident_count !== null &&
    record.incident_count !== undefined &&
    (typeof record.incident_count !== 'number' || record.incident_count < 0)
  ) {
    errors.push('Incident count must be a non-negative number.');
  }

  return { status: errors.length === 0 ? 'Valid' : 'Invalid', errors };
}

export function validateEmergencyRecord(record: {
  name?: string;
  type?: string;
  district?: string;
  source?: string;
  latitude?: number | null;
  longitude?: number | null;
}): ValidationResult {
  const errors: string[] = [];

  const nameErr = validateRequired(record.name, 'Name');
  if (nameErr) errors.push(nameErr);

  const typeErr = validateRequired(record.type, 'Type');
  if (typeErr) errors.push(typeErr);

  const districtErr = validateRequired(record.district, 'District');
  if (districtErr) errors.push(districtErr);

  const sourceErr = validateRequired(record.source, 'Source');
  if (sourceErr) errors.push(sourceErr);

  if (!validateLatitude(record.latitude))
    errors.push('Latitude must be between -90 and 90.');
  if (!validateLongitude(record.longitude))
    errors.push('Longitude must be between -180 and 180.');

  return { status: errors.length === 0 ? 'Valid' : 'Invalid', errors };
}

export function validateTourismContextRecord(record: {
  date?: string;
  source?: string;
}): ValidationResult {
  const errors: string[] = [];

  const dateErr = validateRequired(record.date, 'Date');
  if (dateErr) errors.push(dateErr);
  else if (!validateDate(record.date)) errors.push('Date is not a valid date.');

  const sourceErr = validateRequired(record.source, 'Source');
  if (sourceErr) errors.push(sourceErr);

  return { status: errors.length === 0 ? 'Valid' : 'Invalid', errors };
}

export function checkDataQuality(
  record: Record<string, unknown>,
  requiredFields: string[]
): DataQualityStatus {
  const missing = requiredFields.filter(
    (field) =>
      record[field] === null ||
      record[field] === undefined ||
      (typeof record[field] === 'string' && (record[field] as string).trim() === '')
  );
  if (missing.length === requiredFields.length) return 'Invalid';
  if (missing.length > 0) return 'Incomplete';
  return 'Valid';
}
