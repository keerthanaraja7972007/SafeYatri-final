# SAFEYATRI Dataset Integration Map

## Existing SAFEYATRI data architecture discovered

- The app preserves `src/data/touristPlacesSeed.ts` as offline baseline data and uses Supabase-backed services where configured.
- Tourist records are loaded through the shared tourist service, which paginates Supabase results and merges nonduplicate integrated places. The integrated records are fetched from `public/data/realWorldTouristPlaces.json` only when requested.
- Emergency facilities are fetched from `public/data/realWorldEmergencyServices.json` only when requested; neither full JSON asset is bundled into initial JavaScript.
- Supabase rows and seed entries are preserved. Runtime reads merge integrated records without writing or replacing existing data.

## Real-world datasets inspected

Total datasets inventoried: 30.

| Dataset | Category | Record count | SAFEYATRI destination | Classification |
| --- | --- | ---: | --- | --- |
| Tamil Nadu Tourist Places Osm | Tourist Places | 1943 | Tourist places feed | DIRECTLY INTEGRATABLE |
| Tn District Citywise Ipc Crimes 2019 2021 | Crime / Safety | 48 | Reference data / future analytics | REFERENCE ONLY |
| Tn District Citywise Total Complaints 2021 | Crime / Safety | 48 | Reference data / future analytics | REFERENCE ONLY |
| Tn District Complaints Ipc Sll 2021 2023 | Crime / Safety | 51 | Reference data / future analytics | REFERENCE ONLY |
| Tn District Crimes Against Women 2023 | Crime / Safety | 51 | Reference data / future analytics | REFERENCE ONLY |
| Tn District Deaths Crime Negligence | Crime / Safety | 48 | Reference data / future analytics | REFERENCE ONLY |
| Tn District Murder Homicide Negligence 2023 | Crime / Safety | 51 | Reference data / future analytics | REFERENCE ONLY |
| Tn District Road Accidents 2023 | Crime / Safety | 51 | Reference data / future analytics | REFERENCE ONLY |
| Tn District Road Accident Deaths 2019 2021 | Crime / Safety | 46 | Reference data / future analytics | REFERENCE ONLY |
| Tn District Sexual Harassment 2021 | Crime / Safety | 48 | Reference data / future analytics | REFERENCE ONLY |
| Tn District Suicides 2023 | Crime / Safety | 49 | Reference data / future analytics | REFERENCE ONLY |
| Tn District Theft And Robbery Cases | Crime / Safety | 48 | Reference data / future analytics | REFERENCE ONLY |
| Tn District Total Complaints 2023 | Crime / Safety | 51 | Reference data / future analytics | REFERENCE ONLY |
| Tn Crime Review Compendium 2023 | Crime / Safety (Official PDF) | 1 | Reference data / future analytics | REFERENCE ONLY |
| Tn Crime Statistics 2023 | Crime / Safety (Official PDF) | 1 | Reference data / future analytics | REFERENCE ONLY |
| Tn Crime Statistics Report 2021 | Crime / Safety (Official PDF) | 1 | Reference data / future analytics | REFERENCE ONLY |
| Tamil Nadu Historical Weather Daily 2024 | Historical Weather | 17568 | Reference data / future analytics | REFERENCE ONLY |
| Tamil Nadu Historical Weather Hourly 2024 | Historical Weather | 70272 | Reference data / future analytics | REFERENCE ONLY |
| Tamil Nadu Emergency Infrastructure Master | Emergency Infrastructure | 10166 | Emergency services feed | DIRECTLY INTEGRATABLE |
| Tamil Nadu Fire And Ambulance | Emergency Infrastructure | 61 | Reference data / future analytics | REFERENCE ONLY |
| Tamil Nadu Hospitals Phc | Emergency Infrastructure | 9659 | Reference data / future analytics | REFERENCE ONLY |
| Tamil Nadu Police Stations | Emergency Infrastructure | 446 | Reference data / future analytics | REFERENCE ONLY |
| Tamil Nadu Annual Tourist Visits 2021 2026 | Tourism Context Data | 6 | Reference data / future analytics | REFERENCE ONLY |
| Tamil Nadu District Tourist Arrivals Patterns | Tourism Context Data | 20 | Reference data / future analytics | REFERENCE ONLY |
| Tamil Nadu Key Monuments Visitor Footfalls | Tourism Context Data | 9 | Reference data / future analytics | REFERENCE ONLY |
| India Tourism Data Compendium 2024 | Tourism Context (Official PDF) | 1 | Reference data / future analytics | REFERENCE ONLY |
| India Tourism Data Compendium 2025 | Tourism Context (Official PDF) | 1 | Reference data / future analytics | REFERENCE ONLY |
| India Tourism Statistics 2023 | Tourism Context (Official PDF) | 1 | Reference data / future analytics | REFERENCE ONLY |
| Tamil Nadu Historical Disaster Records | Disaster / Environmental Safety | 12 | Reference data / future analytics | REFERENCE ONLY |
| Imd Report Cyclone Burevi 2020 | Disaster / Environmental Safety (Official PDF) | 1 | Reference data / future analytics | REFERENCE ONLY |

## Mapping strategy

- Keep `src/data/touristPlacesSeed.ts` unchanged; merge the 1,940 integrated OSM places into offline fallback and Supabase reads after excluding normalized name/district matches.
- Merge the 10,164 integrated emergency facilities into fallback and Supabase reads after excluding repeated normalized name/district/coordinate identities; do not write or overwrite database records.
- Explore supports name, city/source-location and district search, category/district filters, and paginated selection. SafetyMap supports source-backed filters/search, URL place/district selection, and caps map pins at 200 while keeping the full list selectable.
- Admin reports integrated-only counts by the verbatim source district/location labels. The raw labels include aliases and localities and are not asserted to be a canonical administrative district set.
- Emergency facility lookup is on-demand, paginated in the UI, searchable, and filterable by source facility subtype including PHC/clinic.
- Keep weather, crime, tourism statistics, disaster, and geographic context datasets in reference-only mode for future analytics and ML feature engineering.
- Do not train or score ML models during this phase; this is dataset integration only.

## Excluded datasets

- Crime datasets remain reference-only because they are district-level aggregated counts, not per-tourist-place records.
- Weather, tourism statistics, and disaster datasets remain reference-only because they are trend or context datasets rather than direct app-place records.
- Geographic boundary datasets are reference-only for district enrichment and map context, not app data entries.
