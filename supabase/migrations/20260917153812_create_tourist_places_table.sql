/*
# Create tourist_places table for SAFEYATRI

1. New Tables
- `tourist_places`
  - `id` (uuid, primary key, auto-generated)
  - `name` (text, not null) — destination name
  - `district` (text, not null) — district in Tamil Nadu
  - `city` (text) — city or area name
  - `description` (text, not null) — short factual description
  - `latitude` (double precision, not null) — geographic latitude (-90 to 90)
  - `longitude` (double precision, not null) — geographic longitude (-180 to 180)
  - `category` (text, not null) — Heritage, Beach, Hill Station, Temple, Wildlife, Waterfall, Adventure, Cultural, Pilgrimage
  - `is_active` (boolean, default true) — whether the destination is active
  - `created_at` (timestamptz, default now)
  - `updated_at` (timestamptz, default now)

2. Constraints
- CHECK on latitude range (-90 to 90)
- CHECK on longitude range (-180 to 180)
- CHECK on category values (enum-like)

3. Indexes
- Index on district for filtering
- Index on category for filtering
- Index on is_active for active-only queries

4. Security
- RLS enabled on tourist_places
- Public read access for anon + authenticated (no-auth app, shared data)
- Write access restricted to authenticated (future admin use)

5. Seed Data
- 15+ real Tamil Nadu tourist destinations with real geographic coordinates
*/

CREATE TABLE IF NOT EXISTS tourist_places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  district text NOT NULL,
  city text,
  description text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  category text NOT NULL CHECK (
    category IN (
      'Heritage', 'Beach', 'Hill Station', 'Temple',
      'Wildlife', 'Waterfall', 'Adventure', 'Cultural', 'Pilgrimage'
    )
  ),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_latitude CHECK (latitude >= -90 AND latitude <= 90),
  CONSTRAINT valid_longitude CHECK (longitude >= -180 AND longitude <= 180)
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_tourist_places_district ON tourist_places(district);
CREATE INDEX IF NOT EXISTS idx_tourist_places_category ON tourist_places(category);
CREATE INDEX IF NOT EXISTS idx_tourist_places_is_active ON tourist_places(is_active);

-- Enable RLS
ALTER TABLE tourist_places ENABLE ROW LEVEL SECURITY;

-- Public read access (no-auth app, shared destination data)
DROP POLICY IF EXISTS "public_read_tourist_places" ON tourist_places;
CREATE POLICY "public_read_tourist_places"
ON tourist_places FOR SELECT
TO anon, authenticated
USING (true);

-- Write access for authenticated users (future admin)
DROP POLICY IF EXISTS "auth_insert_tourist_places" ON tourist_places;
CREATE POLICY "auth_insert_tourist_places"
ON tourist_places FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_tourist_places" ON tourist_places;
CREATE POLICY "auth_update_tourist_places"
ON tourist_places FOR UPDATE
TO authenticated
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_tourist_places" ON tourist_places;
CREATE POLICY "auth_delete_tourist_places"
ON tourist_places FOR DELETE
TO authenticated
USING (true);

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_tourist_places_updated_at ON tourist_places;
CREATE TRIGGER trigger_tourist_places_updated_at
BEFORE UPDATE ON tourist_places
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Seed initial Tamil Nadu tourist destinations with real geographic coordinates
INSERT INTO tourist_places (name, district, city, description, latitude, longitude, category, is_active) VALUES
('Marina Beach', 'Chennai', 'Chennai', 'A long urban sandy beach along the Bay of Bengal coast, popular for morning walks and evening crowds.', 13.0500, 80.2824, 'Beach', true),
('Mahabalipuram Shore Temple', 'Kanchipuram', 'Mahabalipuram', 'A UNESCO World Heritage site featuring ancient stone-carved shore temples by the Bay of Bengal.', 12.6269, 80.1927, 'Heritage', true),
('Meenakshi Amman Temple', 'Madurai', 'Madurai', 'A historic Hindu temple complex known for its towering gopurams and intricate sculpture.', 9.9195, 78.1193, 'Temple', true),
('Ooty Botanical Gardens', 'Nilgiris', 'Ooty', 'Terraced hill-station gardens with manicured lawns, rare trees and mountain climate.', 11.4102, 76.6950, 'Hill Station', true),
('Kodaikanal Lake', 'Dindigul', 'Kodaikanal', 'A star-shaped artificial lake set in a hill station surrounded by forested hills.', 10.2381, 77.4892, 'Hill Station', true),
('Ramanathaswamy Temple', 'Ramanathapuram', 'Rameswaram', 'A renowned pilgrimage temple with long corridors and sacred water tanks on an island town.', 9.2876, 79.3129, 'Pilgrimage', true),
('Vivekananda Rock Memorial', 'Kanyakumari', 'Kanyakumari', 'A memorial on a rocky island where the Arabian Sea, Bay of Bengal and Indian Ocean meet.', 8.1578, 77.5535, 'Cultural', true),
('Brihadeeswara Temple', 'Thanjavur', 'Thanjavur', 'A Chola-era UNESCO World Heritage temple with a massive vimana and detailed frescoes.', 10.7850, 79.1323, 'Temple', true),
('Marudamalai Temple', 'Coimbatore', 'Coimbatore', 'A hilltop Murugan temple with forested slopes on the Western Ghats outskirts.', 11.0230, 76.8760, 'Temple', true),
('Yercaud Lake', 'Salem', 'Yercaud', 'A scenic lake surrounded by coffee plantations and viewpoints in the Eastern Ghats.', 11.7792, 78.2036, 'Hill Station', true),
('Sim''s Park', 'Nilgiris', 'Coonoor', 'A terraced botanical park with rare plant species in a quiet hill station setting.', 11.3516, 76.7950, 'Hill Station', true),
('Valparai Tea Estates', 'Coimbatore', 'Valparai', 'Rolling tea plantations and forest patches in the Anaimalai Hills of the Western Ghats.', 10.3260, 76.9530, 'Hill Station', true),
('Kamakshi Amman Temple', 'Kanchipuram', 'Kanchipuram', 'An ancient temple city known for silk weaving and historic shrines.', 12.8351, 79.7001, 'Temple', true),
('Rockfort Temple', 'Tiruchirappalli', 'Tiruchirappalli', 'A temple complex on a massive rock outcrop rising above the city along the Kaveri river.', 10.3910, 78.7047, 'Temple', true),
('Dhanushkodi Beach', 'Ramanathapuram', 'Dhanushkodi', 'A ghost town at the southeastern tip with sandy shores and views toward Sri Lanka.', 9.2200, 79.4100, 'Beach', true),
('Mudumalai Wildlife Sanctuary', 'Nilgiris', 'Masinagudi', 'A protected forest reserve with elephants, tigers and diverse birdlife at the foothills.', 11.5720, 76.5500, 'Wildlife', true),
('Courtallam Waterfalls', 'Tenkasi', 'Courtallam', 'A series of scenic waterfalls in the Western Ghats, popular during the monsoon season.', 8.9450, 77.2730, 'Waterfall', true),
('Hogenakkal Falls', 'Dharmapuri', 'Hogenakkal', 'A waterfall on the Kaveri river known for coracle rides and riverside scenery.', 12.1167, 77.8833, 'Waterfall', true)
ON CONFLICT DO NOTHING;
