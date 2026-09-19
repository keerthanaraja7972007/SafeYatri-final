/*
  Add collection metrics to data_imports so server-side real-data collectors
  can report attempted, inserted, skipped, and failed records without adding
  a competing import-tracking table.
*/

ALTER TABLE data_imports
  ADD COLUMN IF NOT EXISTS records_attempted integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS records_inserted integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS records_skipped integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS records_failed integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes text;