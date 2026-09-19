/**
 * Text and data-type normalization utilities.
 * These functions standardize formatting WITHOUT changing the meaning of source data.
 * Original values remain traceable through the source fields on each record.
 */

/** Trim whitespace and normalize capitalization for a text field. */
export function normalizeText(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  if (trimmed === '') return null;
  return trimmed;
}

/** Title-case a district name: "chennai" → "Chennai", "theni district" → "Theni District" */
export function normalizeDistrictName(value: string | null | undefined): string | null {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  return normalized
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/** Standardize a category string: trim, title-case, collapse spaces. */
export function normalizeCategory(value: string | null | undefined): string | null {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  return normalized
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Parse a date or timestamp string into a standardized ISO 8601 string.
 * Returns null if the input cannot be parsed.
 * Does NOT fabricate dates — if the source value is invalid, the result is null.
 */
export function standardizeDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

/**
 * Standardize a date-only field (no time component).
 * Returns YYYY-MM-DD or null.
 */
export function standardizeDateOnly(value: string | null | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
}

/**
 * Convert a value to a number, returning null if it cannot be converted.
 * Does NOT coerce invalid values to zero.
 */
export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : parseFloat(String(value));
  if (isNaN(n) || !isFinite(n)) return null;
  return n;
}

/**
 * Convert a value to an integer, returning null if it cannot be converted.
 */
export function toInteger(value: unknown): number | null {
  const n = toNumber(value);
  if (n === null) return null;
  return Math.round(n);
}

/**
 * Convert a value to boolean.
 * Accepts true/false, 1/0, "true"/"false", "yes"/"no", "1"/"0".
 */
export function toBoolean(value: unknown): boolean | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'boolean') return value;
  const str = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'y'].includes(str)) return true;
  if (['false', '0', 'no', 'n'].includes(str)) return false;
  return null;
}

/** District name aliases for Tamil Nadu — maps known variations to canonical names. */
const DISTRICT_ALIASES: Record<string, string> = {
  'madurai district': 'Madurai',
  'chennai district': 'Chennai',
  'kancheepuram': 'Kanchipuram',
  'kancheepuram district': 'Kanchipuram',
  'thanjavur district': 'Thanjavur',
  'tiruchirappalli': 'Tiruchirappalli',
  'trichy': 'Tiruchirappalli',
  'tirunelveli district': 'Tirunelveli',
  'nilgiris district': 'Nilgiris',
  'the nilgiris': 'Nilgiris',
  'coimbatore district': 'Coimbatore',
  'dindigul district': 'Dindigul',
  'ramanathapuram district': 'Ramanathapuram',
  'kanyakumari district': 'Kanyakumari',
  'salem district': 'Salem',
  'dharmapuri district': 'Dharmapuri',
  'tenkasi district': 'Tenkasi',
};

/** Resolve a district name to its canonical form using known aliases. */
export function resolveDistrictName(value: string | null | undefined): string | null {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  const lower = normalized.toLowerCase();
  if (DISTRICT_ALIASES[lower]) return DISTRICT_ALIASES[lower];
  return normalizeDistrictName(normalized);
}
