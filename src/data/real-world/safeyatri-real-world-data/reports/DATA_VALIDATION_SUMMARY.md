# SAFEYATRI Data Validation Summary Report

**Audit Date:** 2026-10-01 22:26:39
**Total CSV Datasets Audited:** 24

| File Name | Category | Records | Null Cells | Duplicates | Quality Score | Status |
|:---|:---|---:|---:|---:|---:|:---|
| `tn_district_citywise_ipc_crimes_2019_2021.csv` | crime | 48 | 6 | 0 | 100.0% | PASSED (CLEAN) |
| `tn_district_citywise_total_complaints_2021.csv` | crime | 48 | 1 | 0 | 100.0% | PASSED (CLEAN) |
| `tn_district_complaints_ipc_sll_2021_2023.csv` | crime | 51 | 1 | 0 | 100.0% | PASSED (CLEAN) |
| `tn_district_crimes_against_women_2023.csv` | crime | 51 | 1 | 0 | 100.0% | PASSED (CLEAN) |
| `tn_district_deaths_crime_negligence.csv` | crime | 48 | 1 | 0 | 100.0% | PASSED (CLEAN) |
| `tn_district_murder_homicide_negligence_2023.csv` | crime | 51 | 5 | 0 | 100.0% | PASSED (CLEAN) |
| `tn_district_road_accidents_2023.csv` | crime | 51 | 1 | 0 | 100.0% | PASSED (CLEAN) |
| `tn_district_road_accident_deaths_2019_2021.csv` | crime | 46 | 2 | 0 | 100.0% | PASSED (CLEAN) |
| `tn_district_sexual_harassment_2021.csv` | crime | 48 | 1 | 0 | 100.0% | PASSED (CLEAN) |
| `tn_district_suicides_2023.csv` | crime | 49 | 1 | 0 | 100.0% | PASSED (CLEAN) |
| `tn_district_theft_and_robbery_cases.csv` | crime | 48 | 1 | 0 | 100.0% | PASSED (CLEAN) |
| `tn_district_total_complaints_2023.csv` | crime | 51 | 1 | 0 | 100.0% | PASSED (CLEAN) |
| `tamil_nadu_historical_disaster_records.csv` | disasters | 12 | 4 | 0 | 100.0% | PASSED (CLEAN) |
| `tamil_nadu_emergency_infrastructure_master.csv` | emergency | 10,166 | 30,959 | 0 | 100.0% | PASSED (CLEAN) |
| `tamil_nadu_fire_and_ambulance.csv` | emergency | 61 | 225 | 0 | 100.0% | PASSED (CLEAN) |
| `tamil_nadu_hospitals_phc.csv` | emergency | 9,659 | 29,195 | 0 | 100.0% | PASSED (CLEAN) |
| `tamil_nadu_police_stations.csv` | emergency | 446 | 1,539 | 0 | 100.0% | PASSED (CLEAN) |
| `tamil_nadu_38_districts_administrative_boundaries.csv` | geographic | 38 | 190 | 0 | 100.0% | PASSED (CLEAN) |
| `tamil_nadu_annual_tourist_visits_2021_2026.csv` | tourism | 6 | 0 | 0 | 100.0% | PASSED (CLEAN) |
| `tamil_nadu_district_tourist_arrivals_patterns.csv` | tourism | 20 | 0 | 0 | 100.0% | PASSED (CLEAN) |
| `tamil_nadu_key_monuments_visitor_footfalls.csv` | tourism | 9 | 0 | 0 | 100.0% | PASSED (CLEAN) |
| `tamil_nadu_tourist_places_osm.csv` | tourist_places | 1,943 | 5,596 | 0 | 99.9% | PASSED (MINOR WARNINGS) |
| `tamil_nadu_historical_weather_daily_2024.csv` | weather | 17,568 | 0 | 0 | 100.0% | PASSED (CLEAN) |
| `tamil_nadu_historical_weather_hourly_2024.csv` | weather | 70,272 | 0 | 0 | 100.0% | PASSED (CLEAN) |


## Geographic Coordinates Quality Summary

| Dataset | Coordinate Pairs | Lat Range | Lon Range | Within TN Extents |
|:---|---:|:---|:---|:---|
| `tamil_nadu_emergency_infrastructure_master.csv` | 10,166 | 8.0810 to 13.5373 | 76.2582 to 80.3272 | 100% Verified |
| `tamil_nadu_fire_and_ambulance.csv` | 61 | 8.1778 to 13.2512 | 76.8447 to 80.3272 | 100% Verified |
| `tamil_nadu_hospitals_phc.csv` | 9,659 | 8.0830 to 13.5373 | 76.2582 to 80.3201 | 100% Verified |
| `tamil_nadu_police_stations.csv` | 446 | 8.0810 to 13.4202 | 76.6885 to 80.3176 | 100% Verified |
| `tamil_nadu_38_districts_administrative_boundaries.csv` | 38 | 8.3279 to 13.2541 | 76.6239 to 80.2126 | 100% Verified |
| `tamil_nadu_tourist_places_osm.csv` | 1,943 | 8.0777 to 13.7188 | 76.3069 to 80.3384 | 1942/1943 (1 boundary edge) |
| `tamil_nadu_historical_weather_daily_2024.csv` | 17,568 | 8.0883 to 13.1432 | 76.5333 to 80.2707 | 100% Verified |
| `tamil_nadu_historical_weather_hourly_2024.csv` | 70,272 | 8.0883 to 13.1432 | 76.5333 to 80.2707 | 100% Verified |
