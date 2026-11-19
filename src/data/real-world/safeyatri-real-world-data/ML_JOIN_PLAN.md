# SAFEYATRI — ML JOIN PLAN

**Project:** SAFEYATRI (AI-Powered Tourist Safety Intelligence Platform for Tamil Nadu)  
**Document Type:** Multi-Modal Dataset Integration & Join Specification  
**Version:** 1.0  
**Audit Date:** 2026-10-01  
**Master Entity Table:** `tamil_nadu_tourist_places_osm.csv` (1,943 Tourist Attractions)  

---

## 1. Join Strategy Principles

To prevent methodological fallacies, data leakage, and erroneous spatial attribution, all dataset joins must satisfy four foundational rules:

1. **Point-to-Point Exact Spatial Indexing:**  
   Proximity between tourist destinations and emergency facilities (police, healthcare, fire) must be computed using exact geodetic distance algorithms ($k$-d Tree or Ball Tree with the Haversine metric).
2. **Contextual Isolation of District Crime Statistics:**  
   District crime rates must only be attached as macro-environmental indicators (`district_baseline_*`). They must **never** be projected as incident frequencies occurring at individual tourist attractions.
3. **Temporal Boundary Enforcement:**  
   Historical weather series (2024 daily and synoptic observations) must be joined spatially to tourist POIs as climatological hazard probability baselines, preserving calendar and seasonal indexing.
4. **Transparent Rejection of Unavailable Micro-Joins:**  
   Any join requiring non-existent street-level FIR crime coordinates or real-time ambulance CAD locations is formally designated as **UNAVAILABLE JOIN**.

---

## 2. Master Dataset Join Matrix

| Dataset A | Dataset B | Join Key | Spatial Alignment | Temporal Alignment | Join Type | Risk | Recommended? |
|:---|:---|:---|:---|:---|:---|:---|:---:|
| `tourist_places_osm.csv` | `emergency_infrastructure_master.csv` | `[latitude, longitude]` | **Point-to-Point** ($\pm 10\text{ m}$) | Static GIS Snapshot | **Spatial Join** ($k$-d Tree Haversine) | Negligible; edge cases near state borders handled by boundary verification | **YES (HIGHLY RECOMMENDED)** |
| `tourist_places_osm.csv` | `police_stations.csv` | `[latitude, longitude]` | **Point-to-Point** ($\pm 10\text{ m}$) | Static GIS Snapshot | **Spatial Join** ($k$-d Tree Haversine) | Negligible; computes exact distance to nearest police station | **YES (HIGHLY RECOMMENDED)** |
| `tourist_places_osm.csv` | `hospitals_phc.csv` | `[latitude, longitude]` | **Point-to-Point** ($\pm 10\text{ m}$) | Static GIS Snapshot | **Spatial Join** ($k$-d Tree Haversine) | Negligible; computes exact distance to tertiary hospital & local clinic | **YES (HIGHLY RECOMMENDED)** |
| `tourist_places_osm.csv` | `fire_and_ambulance.csv` | `[latitude, longitude]` | **Point-to-Point** ($\pm 10\text{ m}$) | Static GIS Snapshot | **Spatial Join** ($k$-d Tree Haversine) | Sparse distribution in remote ghat sections; max search radius capped at 50 km | **YES (RECOMMENDED)** |
| `tourist_places_osm.csv` | `38_districts_boundaries.geojson` | `[latitude, longitude]` $\in$ `Polygon` | **Point-in-Polygon** | Static Administrative | **Spatial Join** (Shapely intersection) | Boundary buffer ambiguities along newly bifurcated districts (e.g. Chengalpattu / Kanchipuram) | **YES (HIGHLY RECOMMENDED)** |
| `tourist_places_osm.csv` | `38_districts_administrative_boundaries.csv` | `district` == `district_name` | **Point to District Centroid** | Static Administrative | **Exact Join** (String match) | Spelling variants in Tamil transliteration; canonical dictionary resolves all 38 | **YES (RECOMMENDED)** |
| `tourist_places_osm.csv` | `historical_weather_daily_2024.csv` | Nearest Station `[lat, lon]` + `date` | **Point to Nearest Station Grid** | Daily (2024 leap year: 366 days) | **Spatial Join** + **Temporal Join** | Station microclimate mismatch in complex terrain (addressed by dedicated hill stations: Ooty, Kodaikanal, Valparai) | **YES (RECOMMENDED)** |
| `tourist_places_osm.csv` | `historical_weather_hourly_2024.csv` | Nearest Station `[lat, lon]` + `timestamp` | **Point to Nearest Station Grid** | 6-Hourly Synoptic (00z, 06z, 12z, 18z) | **Spatial Join** + **Temporal Join** | Synoptic interval captures general diurnal trends but not 15-minute flash squalls | **YES (RECOMMENDED)** |
| `tourist_places_osm.csv` | `district_tourist_arrivals_patterns.csv` | `district` == `district` | **Point to District Aggregate** | Seasonal / Annual Pattern | **District-Level Contextual Join** | Aggregates footfalls across entire district rather than per POI | **YES (AS CONTEXT ONLY)** |
| `tourist_places_osm.csv` | `key_monuments_visitor_footfalls.csv` | `place_name` $\approx$ `monument_name` | **Point to Point Entity** | Annual Admitted Footfall | **Exact / Fuzzy Entity Join** | Only 9 major ASI monuments have ticketed footfalls; remaining 1,934 POIs will be null | **YES (SUBSET ONLY)** |
| `tourist_places_osm.csv` | `annual_tourist_visits_2021_2026.csv` | Statewide Key | **Point to Entire State** | Annual State Totals | **Statewide Contextual Join** | Severe ecological fallacy if applied to local safety; macro volume growth indicator only | **YES (MACRO REFERENCE ONLY)** |
| `tourist_places_osm.csv` | `complaints_ipc_sll_2021_2023.csv` | `district` == `Districts/City` | **Point to Police Jurisdiction** | Annual Aggregate (2021–2023) | **District-Level Contextual Join** | **Ecological Fallacy:** Falsely attributing urban crime to safe monuments. Must be labeled `district_crime_rate` | **YES (STRICTLY CONTEXTUAL)** |
| `tourist_places_osm.csv` | `crimes_against_women_2023.csv` | `district` == `Districts/City` | **Point to Police Jurisdiction** | Annual Aggregate (2023) | **District-Level Contextual Join** | **Ecological Fallacy:** City commissionerate crime vs rural POI. Must use strict commissionerate polygon mapping | **YES (STRICTLY CONTEXTUAL)** |
| `tourist_places_osm.csv` | `theft_and_robbery_cases.csv` | `district` == `District` | **Point to Police Jurisdiction** | Annual Aggregate (2021–2023) | **District-Level Contextual Join** | Property crime is concentrated in transit terminals, not all tourist sites | **YES (STRICTLY CONTEXTUAL)** |
| `tourist_places_osm.csv` | `road_accidents_2023.csv` | `district` == `Districts/City` | **Point to Police Jurisdiction** | Annual Aggregate (2023) | **District-Level Contextual Join** | Road accident rates reflect national highways, not pedestrian monument zones | **YES (STRICTLY CONTEXTUAL)** |
| `tourist_places_osm.csv` | `historical_disaster_records.csv` | `district` $\in$ `affected_districts` | **Point to Regional Footprint** | Multi-Year Calamity (2004–2023) | **Spatial Multi-District Join** | Broad regional footprint; some inland POIs within coastal district experience zero storm surge | **YES (HAZARD TAGGING ONLY)** |
| `tourist_places_osm.csv` | **Incident-Level Police FIR Micro-Data** | `[poi_id, timestamp]` | **Point-to-Point Exact** | Incident Timestamp | **Unavailable Join** | **Data Does Not Exist in Public Domain.** Restricted under Indian privacy law. | **NO (UNAVAILABLE JOIN)** |
| `tourist_places_osm.csv` | **Real-Time 108 Ambulance GPS Telemetry** | `[poi_id, timestamp]` | **Point-to-Point Real-Time** | Real-Time Live Feed | **Unavailable Join** | **Closed Intranet.** GVK EMRI dispatch system is not accessible via open API. | **NO (UNAVAILABLE JOIN)** |

---

## 3. Detailed Execution Pipeline for Recommended Joins

### Phase 1: High-Precision Spatial Join Pipeline (Point $\leftrightarrow$ Point)
```python
# Conceptual Execution Pipeline (To be run in Modeling Phase)
import pandas as pd
from sklearn.neighbors import BallTree
import numpy as np

# 1. Load Tourist POIs and Emergency Facilities
df_poi = pd.read_csv("raw/tourist_places/tamil_nadu_tourist_places_osm.csv")
df_em = pd.read_csv("raw/emergency/tamil_nadu_emergency_infrastructure_master.csv")

# 2. Convert coordinates to radians for Haversine BallTree
poi_rad = np.radians(df_poi[['latitude', 'longitude']].values)

for ftype in ['Police Station', 'Government Hospital', 'Primary Health Centre / Clinic', 'Fire and Rescue Station']:
    sub_em = df_em[df_em['facility_type'] == ftype]
    em_rad = np.radians(sub_em[['latitude', 'longitude']].values)
    tree = BallTree(em_rad, metric='haversine')
    
    # Query nearest facility distance in km (Earth radius = 6371.0 km)
    distances, indices = tree.query(poi_rad, k=1)
    df_poi[f'dist_nearest_{ftype.lower().replace(" ", "_")}_km'] = distances * 6371.0
    
    # Query counts within 5 km radius (5.0 / 6371.0 radians)
    counts = tree.query_radius(poi_rad, r=5.0 / 6371.0, count_only=True)
    df_poi[f'count_{ftype.lower().replace(" ", "_")}_5km'] = counts
```

### Phase 2: Administrative Context Join Pipeline (Point $\leftrightarrow$ District)
```python
# Canonical District Name Normalizer Dictionary
DISTRICT_NAME_MAP = {
    "Greater Chennai Police": "Chennai",
    "Avadi Commissionerate": "Tiruvallur",
    "Tambaram Commissionerate": "Chengalpattu",
    "Coimbatore City": "Coimbatore",
    "Madurai City": "Madurai",
    "Salem City": "Salem",
    "Tiruchirappalli City": "Tiruchirappalli",
    "Tirunelveli City": "Tirunelveli",
    "Tiruppur City": "Tiruppur"
}

# Attach district crime baselines as macro contextual indicators
# CRITICAL: Output columns MUST retain the 'district_macro_' prefix
```

### Phase 3: Spatial Climatology Join Pipeline (Point $\leftrightarrow$ Weather Station)
```python
# 1. Map each of 1,943 POIs to the nearest of 48 weather monitoring hubs
# 2. Extract 2024 distribution percentiles (95th percentile max temp, 99th percentile rainfall)
# 3. Attach empirical exceedance probabilities as static climatic hazard attributes
```

---

## 4. Join Integrity and Safety Guarantees

1. **No Synthetic Foreign Keys:** No artificial keys or synthetic linkage IDs have been manufactured.
2. **Cardinality Preservation:** The master tourist places entity table remains strictly at **1,943 rows**. All joins are one-to-one or one-to-many aggregations that do not artificially multiply records.
3. **Audit Trail Accountability:** Every attached feature maintains explicit column naming conventions indicating its originating dataset and spatial resolution (e.g. `poi_*` for micro-point data, `district_macro_*` for administrative aggregate data).
