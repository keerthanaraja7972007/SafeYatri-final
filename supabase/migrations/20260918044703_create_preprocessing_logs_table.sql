/*
# SAFEYATRI Step 4 — Preprocessing Log Table

## Overview
Creates a `preprocessing_logs` table to track every preprocessing run across all datasets.
This provides an audit trail from raw data through cleaning, traceable to the ML pipeline.

## New Table

### preprocessing_logs
- `id` (uuid PK)
- `dataset` (text, not null) — which dataset was processed (weather_data, crime_data, emergency_services, tourism_context, tourist_places)
- `processing_started` (timestamptz, not null) — when the run started
- `processing_completed` (timestamptz) — when the run finished (null if still running)
- `records_received` (integer, default 0) — total records examined
- `records_clean` (integer, default 0) — records that passed all checks
- `records_invalid` (integer, default 0) — records with invalid values
- `records_incomplete` (integer, default 0) — records with missing required fields
- `records_duplicate` (integer, default 0) — duplicate records detected
- `records_needs_review` (integer, default 0) — records flagged for manual review (outliers, unverified geo, etc.)
- `status` (text, not null default 'Pending') — Pending, Processing, Completed, Failed
- `notes` (text) — optional notes about the run
- `created_at` (timestamptz, default now())

## Security
- RLS enabled
- Public read (anon + authenticated) — admin dashboard needs to display these
- Write access restricted to authenticated (future admin)

## Notes
1. No fake data inserted — table starts empty.
2. Each preprocessing run creates one row, updated when processing completes.
3. This is an audit trail, not a data-storage table — cleaned records stay in their original tables.
*/

CREATE TABLE IF NOT EXISTS preprocessing_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset text NOT NULL,
  processing_started timestamptz NOT NULL DEFAULT now(),
  processing_completed timestamptz,
  records_received integer NOT NULL DEFAULT 0,
  records_clean integer NOT NULL DEFAULT 0,
  records_invalid integer NOT NULL DEFAULT 0,
  records_incomplete integer NOT NULL DEFAULT 0,
  records_duplicate integer NOT NULL DEFAULT 0,
  records_needs_review integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Pending' CHECK (
    status IN ('Pending', 'Processing', 'Completed', 'Failed')
  ),
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_preprocessing_logs_dataset ON preprocessing_logs(dataset);
CREATE INDEX IF NOT EXISTS idx_preprocessing_logs_status ON preprocessing_logs(status);
CREATE INDEX IF NOT EXISTS idx_preprocessing_logs_started ON preprocessing_logs(processing_started);

ALTER TABLE preprocessing_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_preprocessing_logs" ON preprocessing_logs;
CREATE POLICY "public_read_preprocessing_logs"
ON preprocessing_logs FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "auth_insert_preprocessing_logs" ON preprocessing_logs;
CREATE POLICY "auth_insert_preprocessing_logs"
ON preprocessing_logs FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_preprocessing_logs" ON preprocessing_logs;
CREATE POLICY "auth_update_preprocessing_logs"
ON preprocessing_logs FOR UPDATE
TO authenticated
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_preprocessing_logs" ON preprocessing_logs;
CREATE POLICY "auth_delete_preprocessing_logs"
ON preprocessing_logs FOR DELETE
TO authenticated
USING (true);
