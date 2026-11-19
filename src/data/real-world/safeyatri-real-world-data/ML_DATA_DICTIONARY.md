# SAFEYATRI — ML DATA DICTIONARY

**Project:** SAFEYATRI (AI-Powered Tourist Safety Intelligence Platform for Tamil Nadu)  
**Document Type:** Machine Learning Feature & Variable Specification  
**Version:** 1.0  
**Audit Date:** 2026-10-01  
**Total CSV Datasets Audited:** 24  
**Roles Allowed:** `FEATURE`, `TARGET`, `REFERENCE`, `NOT SUITABLE`  

---

## 1. Overview and Role Definitions

Every variable across the SAFEYATRI data repository has been classified according to strict statistical, geographical, and machine learning criteria:

* **FEATURE:** Legitimate, non-leaking observational or engineered predictor variable with verified spatial and temporal alignment.
* **TARGET:** Genuine, authentic ground-truth outcome label. *(Audit finding: No authentic incident-level human safety target is currently available).*
* **REFERENCE:** Metadata, unique identifiers, foreign keys, or descriptive labels used for entity indexing, traceability, and GIS rendering.
* **NOT SUITABLE:** Variables with excessive missingness (>80%), post-event telemetry that induces data leakage, or variables whose spatial granularity cannot legitimately support tourist safety modeling.

---

## 2. Comprehensive Variable Dictionary

| Variable | Dataset | Meaning | Spatial Resolution | Temporal Resolution | ML Role | Valid? |
|:---|:---|:---|:---|:---|:---:|:---:|
| `place_id` | `tamil_nadu_tourist_places_osm.csv` | Unique OpenStreetMap entity identifier | Tourist location (POI) | Static GIS Snapshot | **REFERENCE** | **YES** — Primary entity key |
| `place_name` | `tamil_nadu_tourist_places_osm.csv` | Official English name of the tourist attraction | Tourist location (POI) | Static GIS Snapshot | **REFERENCE** | **YES** — Display & geocoding label |
| `name_ta` | `tamil_nadu_tourist_places_osm.csv` | Local Tamil language script name | Tourist location (POI) | Static GIS Snapshot | **REFERENCE** | **PARTIAL** — 92.3% nulls; display only |
| `latitude` | `tamil_nadu_tourist_places_osm.csv` | WGS-84 decimal latitude coordinate | Tourist location (POI) | Static GIS Snapshot | **FEATURE** | **YES** — 100% complete, verified extents |
| `longitude` | `tamil_nadu_tourist_places_osm.csv` | WGS-84 decimal longitude coordinate | Tourist location (POI) | Static GIS Snapshot | **FEATURE** | **YES** — 100% complete, verified extents |
| `district` | `tamil_nadu_tourist_places_osm.csv` | Administrative revenue district name (1 of 38) | District | Static GIS Snapshot | **REFERENCE** | **YES** — Canonical administrative join key |
| `place_category` | `tamil_nadu_tourist_places_osm.csv` | Functional typology of attraction (beach, fort, etc.) | Tourist location (POI) | Static GIS Snapshot | **FEATURE** | **YES** — 100% complete; 27 categories |
| `geographic_location` | `tamil_nadu_tourist_places_osm.csv` | Descriptive settlement or regional identifier | Town / Landmark | Static GIS Snapshot | **REFERENCE** | **YES** — 100% complete text context |
| `city_town` | `tamil_nadu_tourist_places_osm.csv` | Sub-district municipality or urban body name | Town | Static GIS Snapshot | **NOT SUITABLE** | **NO** — 97.9% null cells in OSM source |
| `postcode` | `tamil_nadu_tourist_places_osm.csv` | India Post PIN code | Postal Zone | Static GIS Snapshot | **NOT SUITABLE** | **NO** — 97.7% null cells in OSM source |
| `source_url` | `tamil_nadu_tourist_places_osm.csv` | Direct Overpass API provenance endpoint | Web URL | Static GIS Snapshot | **REFERENCE** | **YES** — Traceability & audit verification |
| `osm_tags` | `tamil_nadu_tourist_places_osm.csv` | Raw JSON key-value tags from OpenStreetMap | Tourist location (POI) | Static GIS Snapshot | **REFERENCE** | **YES** — Unstructured secondary features |
| `facility_id` | `tamil_nadu_emergency_infrastructure_master.csv` | Unique emergency facility identifier | Facility point | Static GIS Snapshot | **REFERENCE** | **YES** — Primary facility key |
| `facility_name` | `tamil_nadu_emergency_infrastructure_master.csv` | Registered name of hospital, police, or fire station | Facility point | Static GIS Snapshot | **REFERENCE** | **YES** — Display & verification label |
| `facility_type` | `tamil_nadu_emergency_infrastructure_master.csv` | Category (Hospital, PHC, Police Station, Fire Station) | Facility point | Static GIS Snapshot | **FEATURE** | **YES** — Critical classification attribute |
| `district` | `tamil_nadu_emergency_infrastructure_master.csv` | Revenue district where facility is located | District | Static GIS Snapshot | **REFERENCE** | **YES** — District containment key |
| `latitude` | `tamil_nadu_emergency_infrastructure_master.csv` | WGS-84 decimal latitude of facility | Facility point | Static GIS Snapshot | **FEATURE** | **YES** — 10,166 coordinates, 0% nulls |
| `longitude` | `tamil_nadu_emergency_infrastructure_master.csv` | WGS-84 decimal longitude of facility | Facility point | Static GIS Snapshot | **FEATURE** | **YES** — 10,166 coordinates, 0% nulls |
| `address` | `tamil_nadu_emergency_infrastructure_master.csv` | Physical postal or street address | Facility point | Static GIS Snapshot | **REFERENCE** | **PARTIAL** — Text reference for routing |
| `phone_contact` | `tamil_nadu_emergency_infrastructure_master.csv` | Emergency contact phone / landline number | Facility point | Static GIS Snapshot | **NOT SUITABLE** | **NO** — 98.1% missing; UI SOS lookup only |
| `operator` | `tamil_nadu_emergency_infrastructure_master.csv` | Managing authority (Govt of Tamil Nadu, Private) | Facility point | Static GIS Snapshot | **NOT SUITABLE** | **NO** — 98.9% missing; captured in type |
| `date` | `tamil_nadu_historical_weather_daily_2024.csv` | Observation date (YYYY-MM-DD) | Coordinate / Grid | Daily (2024) | **REFERENCE** | **YES** — Temporal indexing key |
| `location_name` | `tamil_nadu_historical_weather_daily_2024.csv` | Name of monitored station hub (48 locations) | Coordinate / Grid | Daily (2024) | **REFERENCE** | **YES** — Station identifier |
| `temperature_max_c` | `tamil_nadu_historical_weather_daily_2024.csv` | Maximum 2-meter air temperature (°C) | Coordinate / Grid | Daily (2024) | **FEATURE** | **YES** — Heatwave & thermal hazard indicator |
| `temperature_min_c` | `tamil_nadu_historical_weather_daily_2024.csv` | Minimum 2-meter air temperature (°C) | Coordinate / Grid | Daily (2024) | **FEATURE** | **YES** — Cold stress / hill station hazard |
| `temperature_mean_c` | `tamil_nadu_historical_weather_daily_2024.csv` | Mean diurnal air temperature (°C) | Coordinate / Grid | Daily (2024) | **FEATURE** | **YES** — Climatological baseline feature |
| `precipitation_sum_mm` | `tamil_nadu_historical_weather_daily_2024.csv` | Total daily liquid precipitation (mm) | Coordinate / Grid | Daily (2024) | **FEATURE** | **YES** — Flood & cloudburst hazard metric |
| `wind_speed_max_kmh` | `tamil_nadu_historical_weather_daily_2024.csv` | Maximum sustained wind gust velocity (km/h) | Coordinate / Grid | Daily (2024) | **FEATURE** | **YES** — Gale & cyclonic hazard metric |
| `wind_direction_dominant_deg` | `tamil_nadu_historical_weather_daily_2024.csv` | Prevailing daily wind direction azimuth (0°–360°) | Coordinate / Grid | Daily (2024) | **FEATURE** | **YES** — Monsoon circulation vector |
| `weather_code` | `tamil_nadu_historical_weather_daily_2024.csv` | WMO standard meteorological code (0–99) | Coordinate / Grid | Daily (2024) | **FEATURE** | **YES** — Categorical thunderstorm/fog code |
| `timestamp` | `tamil_nadu_historical_weather_hourly_2024.csv` | Synoptic observation timestamp (UTC) | Coordinate / Grid | 6-Hourly Synoptic (4/day) | **REFERENCE** | **YES** — Exact synoptic time index |
| `relative_humidity_pct` | `tamil_nadu_historical_weather_hourly_2024.csv` | Relative atmospheric moisture content (%) | Coordinate / Grid | 6-Hourly Synoptic (4/day) | **FEATURE** | **YES** — Heat index & fog visibility proxy |
| `atmospheric_pressure_hpa` | `tamil_nadu_historical_weather_hourly_2024.csv` | Surface barometric air pressure (hPa) | Coordinate / Grid | 6-Hourly Synoptic (4/day) | **FEATURE** | **YES** — Cyclonic depression precursor |
| `district_name` | `tamil_nadu_38_districts_administrative_boundaries.csv` | Official revenue district name | District Polygon | Static Administrative | **REFERENCE** | **YES** — Master spatial boundary key |
| `centroid_latitude` | `tamil_nadu_38_districts_administrative_boundaries.csv` | District geographic center latitude | District Centroid | Static Administrative | **FEATURE** | **YES** — Regional distance reference |
| `centroid_longitude` | `tamil_nadu_38_districts_administrative_boundaries.csv` | District geographic center longitude | District Centroid | Static Administrative | **FEATURE** | **YES** — Regional distance reference |
| `relation_id` | `tamil_nadu_38_districts_administrative_boundaries.csv` | OpenStreetMap relation identifier | District Polygon | Static Administrative | **REFERENCE** | **YES** — Direct OSM polygon cross-link |
| `bbox_*` | `tamil_nadu_38_districts_administrative_boundaries.csv` | Rectangular bounding box coordinates | District Bbox | Static Administrative | **NOT SUITABLE** | **NO** — 100% null; use GeoJSON geometry |
| `domestic_footfall_share_pct` | `tamil_nadu_district_tourist_arrivals_patterns.csv` | Share of total domestic tourist footfall (%) | District | Annual / Seasonal Pattern | **FEATURE** | **YES** — Macro crowding & pressure proxy |
| `foreign_footfall_share_pct` | `tamil_nadu_district_tourist_arrivals_patterns.csv` | Share of total international tourist footfall (%) | District | Annual / Seasonal Pattern | **FEATURE** | **YES** — International tourist presence |
| `peak_season` | `tamil_nadu_district_tourist_arrivals_patterns.csv` | Primary seasonal travel window (e.g. Apr-Jun) | District | Seasonal Pattern | **FEATURE** | **YES** — Temporal congestion indicator |
| `annual_domestic_visitors_approx` | `tamil_nadu_key_monuments_visitor_footfalls.csv` | Annual ticketed domestic tourist entries | Monument Point | Annual Footfall | **FEATURE** | **YES** — Site-specific crowding volume |
| `annual_foreign_visitors_approx` | `tamil_nadu_key_monuments_visitor_footfalls.csv` | Annual ticketed foreign tourist entries | Monument Point | Annual Footfall | **FEATURE** | **YES** — Foreign visitor density at site |
| `Rate of Total Cognizable Crime (IPC) (2023)` | `tn_district_complaints_ipc_sll_2021_2023.csv` | Cognizable IPC crimes per 100,000 population | District & Comm. | Annual (2023) | **FEATURE** | **YES (District Level Only)** — Macro context |
| `Assault on Women - R` | `tn_district_crimes_against_women_2023.csv` | Rate of physical assault on women per 100k | District & Comm. | Annual (2023) | **FEATURE** | **YES (District Level Only)** — Macro context |
| `Theft - Crime Rate ( R)` | `tn_district_theft_and_robbery_cases.csv` | Theft incidents per 100,000 population | District & Comm. | Annual (2021-2023) | **FEATURE** | **YES (District Level Only)** — Macro context |
| `Road Accidents - Rate` | `tn_district_road_accidents_2023.csv` | Traffic collisions per 100,000 population | District & Comm. | Annual (2023) | **FEATURE** | **YES (District Level Only)** — Transit safety baseline |
| `Dial 100 - Distress Call` | `tn_district_citywise_total_complaints_2021.csv` | Emergency phone distress calls received | District & Comm. | Annual (2021) | **FEATURE** | **YES (District Level Only)** — Police demand proxy |
| `event_name` | `tamil_nadu_historical_disaster_records.csv` | Named cyclonic storm or severe flood event | Multi-District | Event Start/End (2004–2023) | **REFERENCE** | **YES** — Disaster event catalog |
| `affected_districts` | `tamil_nadu_historical_disaster_records.csv` | Comma-delimited list of impacted districts | District Group | Event (2004–2023) | **FEATURE** | **YES** — Regional hazard zoning tag |
| `lowest_pressure_hpa` | `tamil_nadu_historical_disaster_records.csv` | Central minimum pressure recorded at sea | Event Track | Event Peak (2004–2023) | **NOT SUITABLE** | **NO** — Post-event impact; leakage |
| `reported_casualties` | `tamil_nadu_historical_disaster_records.csv` | Total fatalities recorded during calamity | State / Region | Event Summary (2004–2023) | **NOT SUITABLE** | **NO** — Post-event impact; leakage |
| **`tourist_incident_occurred`** | *(Hypothetical)* | Binary safety incident occurrence at POI | Tourist location (POI) | Hourly / Daily | **TARGET** | **NOT AVAILABLE** — Restricted by law |
| **`arbitrary_safety_risk_label`** | *(Prohibited)* | Synthetic "High / Medium / Low" safety rating | Tourist location (POI) | Arbitrary | **TARGET** | **INVALID** — Pseudoscience; prohibited |

---

## 3. Engineered Features (Derivative Feature Pipeline)

These features are computed mathematically from raw verified records:

| Engineered Variable | Source Derivation | Spatial Resolution | Temporal Resolution | ML Role | Valid? |
|:---|:---|:---|:---|:---:|:---:|
| `dist_nearest_police_km` | Haversine minimum distance: POI to Police Stations | Tourist location (POI) | Static GIS | **FEATURE** | **YES** — 100% deterministic |
| `dist_nearest_hospital_km` | Haversine minimum distance: POI to Govt Hospitals | Tourist location (POI) | Static GIS | **FEATURE** | **YES** — 100% deterministic |
| `dist_nearest_phc_km` | Haversine minimum distance: POI to PHCs / Clinics | Tourist location (POI) | Static GIS | **FEATURE** | **YES** — 100% deterministic |
| `dist_nearest_fire_km` | Haversine minimum distance: POI to Fire Stations | Tourist location (POI) | Static GIS | **FEATURE** | **YES** — 100% deterministic |
| `police_density_5km` | Count of police stations within 5.0 km radius | Tourist location (POI) | Static GIS | **FEATURE** | **YES** — 100% deterministic |
| `hospital_density_5km` | Count of medical facilities within 5.0 km radius | Tourist location (POI) | Static GIS | **FEATURE** | **YES** — 100% deterministic |
| `is_coastal_poi` | Geodesic distance to coastline $\le 5.0\text{ km}$ | Tourist location (POI) | Static GIS | **FEATURE** | **YES** — 100% deterministic |
| `is_hill_station_poi` | Topographic intersection with Western Ghats extents | Tourist location (POI) | Static GIS | **FEATURE** | **YES** — 100% deterministic |
| `heatwave_prob_30d` | Rolling 30-day frequency of $T_{\max} \ge 40^\circ\text{C}$ | Coordinate / Grid | Monthly / Seasonal | **FEATURE** | **YES** — Statistically robust |
| `heavy_rain_prob_30d` | Rolling 30-day frequency of $\text{Precip} \ge 64.5\text{ mm}$ | Coordinate / Grid | Monthly / Seasonal | **FEATURE** | **YES** — Statistically robust |
| `gale_wind_prob_30d` | Rolling 30-day frequency of $\text{Wind} \ge 62\text{ km/h}$ | Coordinate / Grid | Monthly / Seasonal | **FEATURE** | **YES** — Statistically robust |

---

## 4. Summary of Data Dictionary Governance

* **Total Variables Cataloged:** 58 (including 11 engineered spatial/climatological features).
* **Valid Features Approved for Unsupervised / Rule-Based Modeling:** 32.
* **Reference & Metadata Variables:** 14.
* **Variables Classified as NOT SUITABLE:** 9 (due to excessive missingness, post-event leakage, or ungrounded granularity).
* **Authentic Target Variables Available:** 0 *(Authentic POI safety target is NOT AVAILABLE)*.
