# ML Tourist Safety Feature Dataset Report

## Generation summary

- Tourist places processed: 1958 (18 preserved seed records plus 1940 integrated JSON records after the service-style merge).
- Feature rows successfully generated: 1958.
- Duplicate tourist places: 0 duplicate place_id values and 0 exact normalized name/district/coordinate duplicates.
- Repeated normalized name/district labels at different coordinates: 88; these distinct source points were retained.
- Engineered numerical/context features: 31.
- No UI, application behavior, original integrated data, or tourist seed data was modified.

## Generated columns

### Identity
- place_id
- place_name
- district
- latitude
- longitude
- place_category

### Provenance/reference
- place_source_url
- weather_nearest_station_name

### Numerical/contextual features
- nearest_police_distance_km
- police_count_1km
- police_count_5km
- police_count_10km
- nearest_hospital_distance_km
- hospital_count_1km
- hospital_count_5km
- hospital_count_10km
- nearest_phc_distance_km
- phc_count_1km
- phc_count_5km
- phc_count_10km
- nearest_fire_rescue_distance_km
- fire_rescue_count_5km
- fire_rescue_count_10km
- nearest_ambulance_distance_km
- ambulance_count_5km
- ambulance_count_10km
- weather_nearest_station_distance_km
- weather_2024_nearest_station_mean_temperature_c
- weather_2024_nearest_station_mean_daily_precipitation_mm
- weather_2024_nearest_station_mean_daily_max_wind_speed_kmh
- weather_2024_nearest_station_mean_relative_humidity_pct
- district_domestic_footfall_share_pct
- district_foreign_footfall_share_pct
- place_site_annual_domestic_visitors_approx
- place_site_annual_foreign_visitors_approx
- district_macro_total_cognizable_crime_ipc_sll_rate_2023_per_100k
- district_macro_road_accident_rate_2023_per_100k
- district_macro_theft_crime_rate_per_100k
- district_listed_historical_disaster_record_count

## Source mapping

- `nearest_police_distance_km`, `police_count_1km`, `police_count_5km`, `police_count_10km`: `public/data/realWorldEmergencyServices.json`, selected by exact `facility_subtype` (Police Station); Haversine distance from POI coordinates.
- `nearest_hospital_distance_km`, `hospital_count_1km`, `hospital_count_5km`, `hospital_count_10km`: `public/data/realWorldEmergencyServices.json`, selected by exact `facility_subtype` (Government Hospital, Private Hospital); Haversine distance from POI coordinates.
- `nearest_phc_distance_km`, `phc_count_1km`, `phc_count_5km`, `phc_count_10km`: `public/data/realWorldEmergencyServices.json`, selected by exact `facility_subtype` (Primary Health Centre / Clinic); Haversine distance from POI coordinates.
- `nearest_fire_rescue_distance_km`, `fire_rescue_count_5km`, `fire_rescue_count_10km`: `public/data/realWorldEmergencyServices.json`, selected by exact `facility_subtype` (Fire and Rescue Station); Haversine distance from POI coordinates.
- `nearest_ambulance_distance_km`, `ambulance_count_5km`, `ambulance_count_10km`: `public/data/realWorldEmergencyServices.json`, selected by exact `facility_subtype` (Ambulance Station); Haversine distance from POI coordinates.
- `weather_nearest_station_distance_km`, `weather_nearest_station_name`, and four `weather_2024_nearest_station_*` metrics: daily/hourly weather CSVs; nearest coordinate hub, then arithmetic mean over available 2024 station observations.
- `district_domestic_footfall_share_pct`, `district_foreign_footfall_share_pct`: `raw/tourism/tamil_nadu_district_tourist_arrivals_patterns.csv`, exact district key only when it matches the administrative district reference.
- `place_site_annual_domestic_visitors_approx`, `place_site_annual_foreign_visitors_approx`: `raw/tourism/tamil_nadu_key_monuments_visitor_footfalls.csv`, exact normalized place-name and exact district join; ambiguous matches are null.
- `district_macro_total_cognizable_crime_ipc_sll_rate_2023_per_100k`: `raw/crime/tn_district_complaints_ipc_sll_2021_2023.csv`, exact canonical district row; district-level context only.
- `district_macro_road_accident_rate_2023_per_100k`: `raw/crime/tn_district_road_accidents_2023.csv`, exact canonical district row; district-level context only.
- `district_macro_theft_crime_rate_per_100k`: `raw/crime/tn_district_theft_and_robbery_cases.csv`, exact canonical district row; district-level context only.
- `district_listed_historical_disaster_record_count`: `raw/disasters/tamil_nadu_historical_disaster_records.csv`, count of records listing the exact canonical district in `affected_districts`; this is catalogue context, not a POI incident count.
- Identity fields and place_source_url: existing integrated tourist JSON, with the existing seed records included as the service fallback does; source URL is null where the seed has none.
- District exact-join validation: raw/geographic/tamil_nadu_38_districts_administrative_boundaries.csv.
- Emergency facility type/subtype and source provenance: public/data/realWorldEmergencyServices.json.

## Distance and radius definitions

- Point distances use the Haversine great-circle formula with Earth mean radius 6371.0088 km and source decimal latitude/longitude coordinates.
- nearest_*_distance_km is the minimum distance to any coordinate-valid facility in the exact facility subtype group; distances are rounded to 3 decimal places.
- Radius counts include facilities at distance <= the named radius. Police, hospital, and PHC radii are 1, 5, and 10 km; fire/rescue and ambulance radii are 5 and 10 km.
- Hospital counts include Government Hospital and Private Hospital subtypes, excluding Primary Health Centre / Clinic. PHC/clinic is counted separately.
- Weather station assignment uses the nearest station coordinate in the daily 2024 file. Reported weather values are station-level arithmetic means over available 2024 daily/hourly rows, not measurements at the tourist place.

## Missing-value counts

Null/empty cells across all 39 output columns: 7241.

| Column | Missing values |
| --- | ---: |
| place_id | 0 |
| place_name | 0 |
| district | 0 |
| latitude | 0 |
| longitude | 0 |
| place_category | 0 |
| place_source_url | 18 |
| weather_nearest_station_name | 0 |
| nearest_police_distance_km | 0 |
| police_count_1km | 0 |
| police_count_5km | 0 |
| police_count_10km | 0 |
| nearest_hospital_distance_km | 0 |
| hospital_count_1km | 0 |
| hospital_count_5km | 0 |
| hospital_count_10km | 0 |
| nearest_phc_distance_km | 0 |
| phc_count_1km | 0 |
| phc_count_5km | 0 |
| phc_count_10km | 0 |
| nearest_fire_rescue_distance_km | 0 |
| fire_rescue_count_5km | 0 |
| fire_rescue_count_10km | 0 |
| nearest_ambulance_distance_km | 0 |
| ambulance_count_5km | 0 |
| ambulance_count_10km | 0 |
| weather_nearest_station_distance_km | 0 |
| weather_2024_nearest_station_mean_temperature_c | 0 |
| weather_2024_nearest_station_mean_daily_precipitation_mm | 0 |
| weather_2024_nearest_station_mean_daily_max_wind_speed_kmh | 0 |
| weather_2024_nearest_station_mean_relative_humidity_pct | 0 |
| district_domestic_footfall_share_pct | 745 |
| district_foreign_footfall_share_pct | 745 |
| place_site_annual_domestic_visitors_approx | 1958 |
| place_site_annual_foreign_visitors_approx | 1958 |
| district_macro_total_cognizable_crime_ipc_sll_rate_2023_per_100k | 495 |
| district_macro_road_accident_rate_2023_per_100k | 495 |
| district_macro_theft_crime_rate_per_100k | 529 |
| district_listed_historical_disaster_record_count | 298 |

Unavailable / intentionally omitted data:

- No tourist-place incident-level crime or safety outcomes were present; no POI incident features or target labels were created.
- Crime and road-accident source tables contain district/city aggregates only. Only exact canonical district rows were attached, and their output names explicitly retain the district_macro_ scope.
- The district tourist-arrivals table has no matching exact canonical district row for some places; those district shares are null, not zero.
- Site-specific visitor counts are attached only for an exact normalized monument-name and district match. All other site-volume values remain null; no fuzzy name matching was used.
- The available monument footfall file yielded no exact normalized name-and-district matches in the current catalog, so both site visitor features are null for all rows. Statewide visitor totals were omitted because they cannot be attributed to individual places.
- Place-specific crime, road-accident, and disaster-event features could not be generated: the available sources provide district aggregates or broad affected-district lists, not incidents geocoded to tourist places.
- The disaster source is a finite historical-record catalogue. A zero means no row in that available catalogue listed the exact canonical district; noncanonical district strings remain null.
- Unmatched weather stations or missing source measurements remain null. No source fields were imputed.

## Validation

- Row cardinality equals the service-style tourist catalog: PASS (1958 rows for 1958 places).
- Unique place_id: PASS.
- Latitude/longitude ranges: PASS.
- All non-null distance values are finite and nonnegative: PASS.
- All non-null radius counts are nonnegative integers: PASS.
- No NaN, Infinity, or invalid numeric values in JSON output: PASS.
- Original integrated tourist/emergency JSON byte hashes unchanged during generation: PASS.
- No safe, unsafe, risk_label, risk_score, lower_risk, moderate_risk, or higher_risk target column was created; no ML model was trained.
- No synthetic/fabricated data was added. Derived values use only source coordinates and recorded source values; unavailable values remain null.

## Source files used

- public/data/realWorldTouristPlaces.json
- public/data/realWorldEmergencyServices.json
- src/data/touristPlacesSeed.ts
- src/data/real-world/safeyatri-real-world-data/raw/weather/tamil_nadu_historical_weather_daily_2024.csv
- src/data/real-world/safeyatri-real-world-data/raw/weather/tamil_nadu_historical_weather_hourly_2024.csv
- src/data/real-world/safeyatri-real-world-data/raw/tourism/tamil_nadu_district_tourist_arrivals_patterns.csv
- src/data/real-world/safeyatri-real-world-data/raw/tourism/tamil_nadu_key_monuments_visitor_footfalls.csv
- src/data/real-world/safeyatri-real-world-data/raw/crime/tn_district_complaints_ipc_sll_2021_2023.csv
- src/data/real-world/safeyatri-real-world-data/raw/crime/tn_district_road_accidents_2023.csv
- src/data/real-world/safeyatri-real-world-data/raw/crime/tn_district_theft_and_robbery_cases.csv
- src/data/real-world/safeyatri-real-world-data/raw/disasters/tamil_nadu_historical_disaster_records.csv
- src/data/real-world/safeyatri-real-world-data/raw/geographic/tamil_nadu_38_districts_administrative_boundaries.csv
