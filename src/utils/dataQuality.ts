/**
 * Data quality analysis utilities.
 * These functions detect missing values, duplicates, invalid values, and potential outliers
 * WITHOUT modifying or deleting the original data.
 */

import {
  validateLatitude,
  validateLongitude,
  validateNumeric,
} from './dataValidation';
import { toNumber } from './dataNormalization';

// ─── Types ──────────────────────────────────────────────────────

export type ProcessingStatus =
  | 'Pending'
  | 'Processing'
  | 'Clean'
  | 'Needs Review'
  | 'Invalid'
  | 'Duplicate'
  | 'Incomplete';

export interface FieldQuality {
  field: string;
  total: number;
  missing: number;
  missingPercentage: number;
}

export interface DatasetQualitySummary {
  totalRecords: number;
  validRecords: number;
  retainedRecords: number;
  missingValueRecords: number;
  incompleteRecords: number;
  invalidRecords: number;
  duplicateRecords: number;
  needsReviewRecords: number;
  fieldQuality: FieldQuality[];
}

export interface RecordAnalysis {
  status: ProcessingStatus;
  issues: string[];
  isDuplicate: boolean;
  isOutlier: boolean;
  outlierFields: string[];
}

// ─── Missing Value Analysis ─────────────────────────────────────

export function analyzeMissingValues(
  records: Record<string, unknown>[],
  fields: string[]
): FieldQuality[] {
  const total = records.length;
  if (total === 0) return fields.map((field) => ({ field, total: 0, missing: 0, missingPercentage: 0 }));

  return fields.map((field) => {
    const missing = records.filter((r) => {
      const v = r[field];
      return v === null || v === undefined || (typeof v === 'string' && v.trim() === '');
    }).length;
    return {
      field,
      total,
      missing,
      missingPercentage: total > 0 ? (missing / total) * 100 : 0,
    };
  });
}

// ─── Duplicate Detection ────────────────────────────────────────

/** Build a composite key from specified fields for duplicate detection. */
export function buildDuplicateKey(record: Record<string, unknown>, keyFields: string[]): string {
  return keyFields
    .map((f) => {
      const v = record[f];
      if (v === null || v === undefined) return '';
      return String(v).trim().toLowerCase();
    })
    .join('|');
}

/**
 * Detect duplicate records by composite key.
 * Returns a Set of keys that appear more than once.
 */
export function detectDuplicates(
  records: Record<string, unknown>[],
  keyFields: string[]
): Set<string> {
  const seen = new Map<string, number>();
  for (const record of records) {
    const key = buildDuplicateKey(record, keyFields);
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  const dupKeys = new Set<string>();
  for (const [key, count] of seen) {
    if (count > 1) dupKeys.add(key);
  }
  return dupKeys;
}

// ─── Outlier Detection ──────────────────────────────────────────

export interface NumericFieldRange {
  field: string;
  min: number;
  max: number;
}

/**
 * Detect potential outliers using the IQR method.
 * Returns the set of record indices that have at least one outlier field,
 * plus the specific fields that are outliers.
 * Does NOT delete or modify the outliers — only flags them.
 */
export function detectOutliers(
  records: Record<string, unknown>[],
  numericFields: string[]
): Map<number, string[]> {
  const result = new Map<number, string[]>();

  for (const field of numericFields) {
    const values: number[] = [];
    const indices: number[] = [];

    records.forEach((record, idx) => {
      const n = toNumber(record[field]);
      if (n !== null) {
        values.push(n);
        indices.push(idx);
      }
    });

    if (values.length < 4) continue; // Not enough data for IQR

    const sorted = [...values].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    values.forEach((val, i) => {
      if (val < lowerBound || val > upperBound) {
        const recordIdx = indices[i];
        const existing = result.get(recordIdx) ?? [];
        existing.push(field);
        result.set(recordIdx, existing);
      }
    });
  }

  return result;
}

// ─── Invalid Value Detection ────────────────────────────────────

export interface FieldRangeCheck {
  field: string;
  min?: number;
  max?: number;
  isLat?: boolean;
  isLng?: boolean;
}

/**
 * Check a record's numeric fields against valid ranges.
 * Returns a list of issues found.
 */
export function checkInvalidValues(
  record: Record<string, unknown>,
  checks: FieldRangeCheck[]
): string[] {
  const issues: string[] = [];

  for (const check of checks) {
    const value = record[check.field];
    if (value === null || value === undefined || value === '') continue;

    const n = toNumber(value);
    if (n === null) {
      issues.push(`${check.field} is not a valid number.`);
      continue;
    }

    if (check.isLat && !validateLatitude(n)) {
      issues.push(`${check.field} (${n}) is outside valid latitude range (-90 to 90).`);
    } else if (check.isLng && !validateLongitude(n)) {
      issues.push(`${check.field} (${n}) is outside valid longitude range (-180 to 180).`);
    } else if (!check.isLat && !check.isLng && !validateNumeric(n, check.min, check.max)) {
      const rangeStr =
        check.min !== undefined && check.max !== undefined
          ? `between ${check.min} and ${check.max}`
          : check.min !== undefined
            ? `>= ${check.min}`
            : check.max !== undefined
              ? `<= ${check.max}`
              : 'in valid range';
      issues.push(`${check.field} (${n}) is outside valid range (${rangeStr}).`);
    }
  }

  return issues;
}

// ─── Required Field Check ───────────────────────────────────────

/**
 * Check which required fields are missing from a record.
 */
export function checkMissingRequired(
  record: Record<string, unknown>,
  requiredFields: string[]
): string[] {
  const missing: string[] = [];
  for (const field of requiredFields) {
    const v = record[field];
    if (v === null || v === undefined || (typeof v === 'string' && v.trim() === '')) {
      missing.push(field);
    }
  }
  return missing;
}

// ─── Record Analysis Assembly ───────────────────────────────────

/**
 * Combine all checks into a single record analysis.
 * Priority: Invalid > Duplicate > Incomplete > Needs Review (outlier) > Clean
 */
export function analyzeRecord(
  record: Record<string, unknown>,
  requiredFields: string[],
  rangeChecks: FieldRangeCheck[],
  isDuplicate: boolean,
  outlierFields: string[]
): RecordAnalysis {
  const issues: string[] = [];

  const missing = checkMissingRequired(record, requiredFields);
  if (missing.length > 0) {
    issues.push(`Missing required fields: ${missing.join(', ')}.`);
  }

  const invalid = checkInvalidValues(record, rangeChecks);
  issues.push(...invalid);

  if (isDuplicate) issues.push('Potential duplicate record detected.');
  if (outlierFields.length > 0) issues.push(`Potential outlier in: ${outlierFields.join(', ')}.`);

  let status: ProcessingStatus;
  if (issues.some((i) => i.includes('outside valid') || i.includes('not a valid number'))) {
    status = 'Invalid';
  } else if (isDuplicate) {
    status = 'Duplicate';
  } else if (missing.length > 0) {
    status = 'Incomplete';
  } else if (outlierFields.length > 0) {
    status = 'Needs Review';
  } else {
    status = 'Clean';
  }

  return {
    status,
    issues,
    isDuplicate,
    isOutlier: outlierFields.length > 0,
    outlierFields,
  };
}

// ─── Dataset Quality Summary ────────────────────────────────────

/**
 * Build a quality summary for an entire dataset.
 * Does NOT calculate an artificial quality percentage.
 */
export function summarizeDatasetQuality(
  analyses: RecordAnalysis[],
  records: Record<string, unknown>[],
  allFields: string[]
): DatasetQualitySummary {
  const totalRecords = analyses.length;

  let validRecords = 0;
  let retainedRecords = 0;
  let missingValueRecords = 0;
  let incompleteRecords = 0;
  let invalidRecords = 0;
  let duplicateRecords = 0;
  let needsReviewRecords = 0;

  analyses.forEach((a, index) => {
    if (a.status === 'Clean') {
      validRecords++;
      retainedRecords++;
    }
    const record = records[index];
    if (allFields.some((field) => {
      const value = record?.[field];
      return value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
    })) {
      missingValueRecords++;
    }

    switch (a.status) {
      case 'Incomplete':
        incompleteRecords++;
        break;
      case 'Invalid':
        invalidRecords++;
        break;
      case 'Duplicate':
        duplicateRecords++;
        break;
      case 'Needs Review':
        needsReviewRecords++;
        break;
    }
  });

  return {
    totalRecords,
    validRecords,
    retainedRecords,
    missingValueRecords,
    incompleteRecords,
    invalidRecords,
    duplicateRecords,
    needsReviewRecords,
    fieldQuality: analyzeMissingValues(records, allFields),
  };
}
