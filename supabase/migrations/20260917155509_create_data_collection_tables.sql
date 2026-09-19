/*
# SAFEYATRI Step 3 — Real-World Data Collection Architecture

## Overview
Creates the raw data foundation for the future AI/ML safety intelligence system.
Five new tables plus a data-source registry and an import tracking table.
No fake data is inserted — all tables start empty for future verified data ingestion.

## New Tables

### data_sources
- Registry of external/public data sources (weather, crime, tourism, emergency, geographic)
- `id` (uuid PK)
- `name` (text, not null) — source name
- `category` (text, not null) — Weather, Crime, Tourism, Emergency, Geographic
- `provider` (text) — organization providing the data
- `description` (text) — what the source provides
- `source_url` (text) — valid URL if known
- `geographic_scope` (text) — e.g. "Tamil Nadu", "District-level", "India"
- `update_frequency` (text) — e.g. "Real-time", "Daily", "Annual"
- `status` (text, default 'Pending Verification') — Connected, Available for Integration, Manual Import Required, Pending Verification
- `is_active` (boolean, default true)
- `created_at` (timestamptz)

### weather_data
- Raw weather/environmental observations linked to tourist places
- `id` (uuid PK)
- `tourist_place_id` (uuid FK → tourist_places, nullable for district-level data)
- `district` (text) — district name for district-level records
- `recorded_at` (timestamptz, not null) — when the observation was recorded
- `temperature` (double precision) — Celsius
- `humidity` (double precision) — percentage
- `precipitation` (double precision) — mm
- `visibility` (double precision) — km
- `wind_speed` (double precision) — km/h
- `weather_code` (text) — source-specific condition code
- `source` (text, not null) — data source name
- `created_at` (timestamptz)

### crime_data
- Real safety/crime information at original geographic granularity
- `id` (uuid PK)
- `tourist_place_id` (uuid FK → tourist_places, nullable)
- `district` (text) — district name (data may be district-level)
- `date` (date, not null) — reporting period
- `crime_category` (text, not null) — e.g. theft, assault, etc.
- `incident_count` (integer) — documented count
- `source` (text, not null) — data source
- `created_at` (timestamptz)

### emergency_services
- Emergency service facilities across Tamil Nadu
- `id` (uuid PK)
- `name` (text, not null)
- `type` (text, not null) — Police, Hospital, Ambulance, Fire & Rescue, Tourist Assistance
- `district` (text, not null)
- `address` (text)
- `latitude` (double precision) — with CHECK constraint
- `longitude` (double precision) — with CHECK constraint
- `phone` (text) — only verified numbers
- `availability_status` (text) — e.g. "24/7", "Requires Verification"
- `source` (text, not null)
- `created_at` (timestamptz)

### tourism_context
- Contextual tourism information (seasons, events, holidays)
- `id` (uuid PK)
- `tourist_place_id` (uuid FK → tourist_places, nullable)
- `district` (text)
- `date` (date, not null)
- `season` (text) — e.g. Summer, Monsoon, Winter
- `tourism_event` (text) — event name if applicable
- `holiday_indicator` (boolean, default false)
- `source` (text, not null)
- `created_at` (timestamptz)

### data_imports
- Tracks CSV/dataset imports for admin/developer use
- `id` (uuid PK)
- `source` (text, not null) — data source name
- `dataset_name` (text, not null)
- `upload_date` (timestamptz, default now)
- `geographic_scope` (text)
- `record_count` (integer, default 0)
- `status` (text, default 'Pending') — Pending, Processing, Completed, Failed
- `created_at` (timestamptz)

## Security
- RLS enabled on all new tables
- Public read access (anon + authenticated) for data_sources, emergency_services — these are reference data
- Public read access for weather_data, crime_data, tourism_context, data_imports — shared data for the no-auth app
- Write access restricted to authenticated (future admin)

## Notes
1. No fake data is inserted. All tables start empty.
2. tourist_place_id is nullable on weather_data, crime_data, and tourism_context because real data may be district-level, not tourist-place-level.
3. Latitude/longitude CHECK constraints on emergency_services match tourist_places validation.
4. The data_sources table uses a status field instead of a boolean to support the four-state model.
*/

-- ============================================================
-- data_sources
-- ============================================================
CREATE TABLE IF NOT EXISTS data_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (
    category IN ('Weather', 'Crime', 'Tourism', 'Emergency', 'Geographic')
  ),
  provider text,
  description text,
  source_url text,
  geographic_scope text,
  update_frequency text,
  status text NOT NULL DEFAULT 'Pending Verification' CHECK (
    status IN ('Connected', 'Available for Integration', 'Manual Import Required', 'Pending Verification')
  ),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_data_sources_category ON data_sources(category);
CREATE INDEX IF NOT EXISTS idx_data_sources_is_active ON data_sources(is_active);

ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_data_sources" ON data_sources;
CREATE POLICY "public_read_data_sources"
ON data_sources FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "auth_insert_data_sources" ON data_sources;
CREATE POLICY "auth_insert_data_sources"
ON data_sources FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_data_sources" ON data_sources;
CREATE POLICY "auth_update_data_sources"
ON data_sources FOR UPDATE
TO authenticated
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_data_sources" ON data_sources;
CREATE POLICY "auth_delete_data_sources"
ON data_sources FOR DELETE
TO authenticated
USING (true);

-- ============================================================
-- weather_data
-- ============================================================
CREATE TABLE IF NOT EXISTS weather_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tourist_place_id uuid REFERENCES tourist_places(id) ON DELETE SET NULL,
  district text,
  recorded_at timestamptz NOT NULL,
  temperature double precision,
  humidity double precision,
  precipitation double precision,
  visibility double precision,
  wind_speed double precision,
  weather_code text,
  source text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_weather_data_tourist_place ON weather_data(tourist_place_id);
CREATE INDEX IF NOT EXISTS idx_weather_data_district ON weather_data(district);
CREATE INDEX IF NOT EXISTS idx_weather_data_recorded_at ON weather_data(recorded_at);

ALTER TABLE weather_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_weather_data" ON weather_data;
CREATE POLICY "public_read_weather_data"
ON weather_data FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "auth_insert_weather_data" ON weather_data;
CREATE POLICY "auth_insert_weather_data"
ON weather_data FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_weather_data" ON weather_data;
CREATE POLICY "auth_update_weather_data"
ON weather_data FOR UPDATE
TO authenticated
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_weather_data" ON weather_data;
CREATE POLICY "auth_delete_weather_data"
ON weather_data FOR DELETE
TO authenticated
USING (true);

-- ============================================================
-- crime_data
-- ============================================================
CREATE TABLE IF NOT EXISTS crime_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tourist_place_id uuid REFERENCES tourist_places(id) ON DELETE SET NULL,
  district text,
  date date NOT NULL,
  crime_category text NOT NULL,
  incident_count integer,
  source text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crime_data_tourist_place ON crime_data(tourist_place_id);
CREATE INDEX IF NOT EXISTS idx_crime_data_district ON crime_data(district);
CREATE INDEX IF NOT EXISTS idx_crime_data_date ON crime_data(date);

ALTER TABLE crime_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_crime_data" ON crime_data;
CREATE POLICY "public_read_crime_data"
ON crime_data FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "auth_insert_crime_data" ON crime_data;
CREATE POLICY "auth_insert_crime_data"
ON crime_data FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_crime_data" ON crime_data;
CREATE POLICY "auth_update_crime_data"
ON crime_data FOR UPDATE
TO authenticated
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_crime_data" ON crime_data;
CREATE POLICY "auth_delete_crime_data"
ON crime_data FOR DELETE
TO authenticated
USING (true);

-- ============================================================
-- emergency_services
-- ============================================================
CREATE TABLE IF NOT EXISTS emergency_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (
    type IN ('Police', 'Hospital', 'Ambulance', 'Fire & Rescue', 'Tourist Assistance')
  ),
  district text NOT NULL,
  address text,
  latitude double precision,
  longitude double precision,
  phone text,
  availability_status text,
  source text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_emergency_lat CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
  CONSTRAINT valid_emergency_lng CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180))
);

CREATE INDEX IF NOT EXISTS idx_emergency_services_district ON emergency_services(district);
CREATE INDEX IF NOT EXISTS idx_emergency_services_type ON emergency_services(type);

ALTER TABLE emergency_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_emergency_services" ON emergency_services;
CREATE POLICY "public_read_emergency_services"
ON emergency_services FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "auth_insert_emergency_services" ON emergency_services;
CREATE POLICY "auth_insert_emergency_services"
ON emergency_services FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_emergency_services" ON emergency_services;
CREATE POLICY "auth_update_emergency_services"
ON emergency_services FOR UPDATE
TO authenticated
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_emergency_services" ON emergency_services;
CREATE POLICY "auth_delete_emergency_services"
ON emergency_services FOR DELETE
TO authenticated
USING (true);

-- ============================================================
-- tourism_context
-- ============================================================
CREATE TABLE IF NOT EXISTS tourism_context (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tourist_place_id uuid REFERENCES tourist_places(id) ON DELETE SET NULL,
  district text,
  date date NOT NULL,
  season text,
  tourism_event text,
  holiday_indicator boolean DEFAULT false,
  source text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tourism_context_tourist_place ON tourism_context(tourist_place_id);
CREATE INDEX IF NOT EXISTS idx_tourism_context_district ON tourism_context(district);
CREATE INDEX IF NOT EXISTS idx_tourism_context_date ON tourism_context(date);

ALTER TABLE tourism_context ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_tourism_context" ON tourism_context;
CREATE POLICY "public_read_tourism_context"
ON tourism_context FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "auth_insert_tourism_context" ON tourism_context;
CREATE POLICY "auth_insert_tourism_context"
ON tourism_context FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_tourism_context" ON tourism_context;
CREATE POLICY "auth_update_tourism_context"
ON tourism_context FOR UPDATE
TO authenticated
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_tourism_context" ON tourism_context;
CREATE POLICY "auth_delete_tourism_context"
ON tourism_context FOR DELETE
TO authenticated
USING (true);

-- ============================================================
-- data_imports
-- ============================================================
CREATE TABLE IF NOT EXISTS data_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  dataset_name text NOT NULL,
  upload_date timestamptz DEFAULT now(),
  geographic_scope text,
  record_count integer DEFAULT 0,
  status text NOT NULL DEFAULT 'Pending' CHECK (
    status IN ('Pending', 'Processing', 'Completed', 'Failed')
  ),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_data_imports_status ON data_imports(status);

ALTER TABLE data_imports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_data_imports" ON data_imports;
CREATE POLICY "public_read_data_imports"
ON data_imports FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "auth_insert_data_imports" ON data_imports;
CREATE POLICY "auth_insert_data_imports"
ON data_imports FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_data_imports" ON data_imports;
CREATE POLICY "auth_update_data_imports"
ON data_imports FOR UPDATE
TO authenticated
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_data_imports" ON data_imports;
CREATE POLICY "auth_delete_data_imports"
ON data_imports FOR DELETE
TO authenticated
USING (true);
