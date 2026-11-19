# SAFEYATRI — Pending and Inaccessible Datasets Registry

**Project:** SAFEYATRI (AI-Powered Tourist Safety Intelligence Platform for Tamil Nadu)  
**Document Type:** Gap Analysis & Pending Data Manifest  
**Last Updated:** 2026-10-01  

---

## 1. Overview & Data Collection Governance

In accordance with SAFEYATRI Data Integrity Rules:
1. Only authentic, verifiable real-world datasets are acquired.
2. No synthetic, simulated, or fabricated records have been created.
3. No arbitrary risk classifications or pseudo-incident GPS points have been invented.
4. When public sources publish data at aggregate resolution (e.g. annual district-level crime statistics), the original geographic resolution is strictly preserved.
5. If data is restricted by government privacy guidelines, security policies, or closed infrastructure, it is honestly cataloged as **PENDING / NOT AVAILABLE**.

---

## 2. Pending & Inaccessible Datasets Inventory

| Dataset | Current Status | Existing Records | Missing Coverage | Required Fields | Potential Authoritative Source | Source URL | Priority | Reason It Is Still Pending |
|:---|:---|---:|:---|:---|:---|:---|:---:|:---|
| **Incident-Level Police FIR Geocoded Micro-Data** | NOT AVAILABLE (Restricted by Law) | 12 CSVs (590+ district/commissionerate-level rows) + 3 Annual Reports (55 MB) | Exact street/point-level incident GPS coordinates across all 38 districts | Incident Date, Exact Timestamp, Lat, Lon, IPC Section, Incident Type | Tamil Nadu State Police (CCTNS Internal Portal) / NCRB | `https://eservices.tnpolice.gov.in/` | HIGH | Incident-level police FIR data with coordinates is classified/restricted under Indian privacy and citizen protection laws; only aggregated district/commissionerate statistics are legally published for public access. |
| **Real-Time 108 Ambulance Fleet GPS & Stationing Depots** | PARTIAL / PENDING | 10,166 emergency health facilities (including 9,659 hospitals & PHCs where ambulances are deployed) | Point-to-point ambulance fleet GPS telemetry and designated sub-depots | Vehicle ID, Base Depot Name, Lat, Lon, District, Contact No | GVK EMRI / Tamil Nadu Health Systems Project (TNHSP) | `https://www.tnhsp.org/` | MEDIUM | Real-time vehicle telematics and CAD dispatch locations operate on closed internal intranet networks and are not publicly exposed via open APIs. |
| **Live Turnstile / IoT Hourly Footfall Counts at Tourist Attractions** | PARTIAL / PENDING | Annual footfall figures & seasonal percentage distributions across all major districts & ASI monuments | Hourly turnstile sensor footfalls at specific monuments | Attraction Name, Timestamp, Hourly Entry Count, Domestic/Foreign Split | Archaeological Survey of India (ASI) / Tamil Nadu Tourism Development Corporation (TTDC) | `https://data.tourism.gov.in/` | MEDIUM | Tourism departments and ASI publish annual audited footfall statistics and ticket sales, but do not provide public real-time IoT or hourly turnstile data feeds. |
| **Micro-Level Urban Flood Inundation Sensor Telemetry (Ward-Level)** | PARTIAL / PENDING | 12 statewide historical calamity records + 8 official IMD Post-Cyclone Reports (28.5 MB) | Automated IoT water-level sensor telemetry across all 200 Chennai Corporation wards | Sensor ID, Ward No, Lat, Lon, Water Level (cm), Timestamp | Greater Chennai Corporation (GCC) Smart City / TNSDMA | `https://chennaicorporation.gov.in/` | LOW | Automated IoT sensor data for storm water drains is currently internal to municipal control rooms (Command and Control Centre) and lacks a public download endpoint. |

---

## 3. Recommendations for SAFEYATRI ML Phase Preparation

1. **Safety Index Formulation:** Model safety scores at the **District & Police Commissionerate level** using the 12 authentic CCTNS crime datasets (total complaints, crimes against women, thefts, robberies, road accident fatalities, suicides) normalized by population and tourist density.
2. **Tourist Vulnerability Spatial Mapping:** Use the **10,166 emergency infrastructure coordinates** (hospitals, clinics, police stations, fire stations) and **1,943 tourist destination coordinates** to compute Euclidean and network distance buffers (e.g. proximity of each tourist spot to nearest emergency healthcare and police assistance).
3. **Weather Risk Hazard Profiling:** Correlate the **17,568 daily weather records** and **70,272 synoptic observations** with seasonal tourist footfalls and historical cyclone landfall tracks (Michaung, Mandous, Nivar, Gaja, Vardah) to build seasonal hazard probability curves for coastal and hill-station hubs.
