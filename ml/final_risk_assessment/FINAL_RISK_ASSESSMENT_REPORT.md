# SAFEYATRI Final Evidence-Based Risk Assessment

"This is an evidence-based, explainable risk assessment derived from available contextual, environmental, and emergency-accessibility data. It is not a ground-truth tourist safety label because the dataset does not contain verified place-level Safe/Unsafe labels."

## Scope and target interpretation

- Source population: 1,958 tourist places; one final record per unique `place_id`.
- Existing K-Means K=5 assignment and Isolation Forest flag are joined by `place_id`; neither unsupervised model was retrained.
- The existing supervised models were trained to reproduce K-Means membership. Logistic Regression accuracy was 99.745% for reproducing that cluster structure, NOT for predicting actual tourist safety.
- K-Means clusters are unsupervised patterns, not safety labels. Cluster IDs are used only to describe group structure and compare distributions; they are not direct inputs to the score or individual category assignment.
- This assessment is an unvalidated evidence index. LOW RISK / MODERATE RISK / HIGH RISK are score bands, not verified outcomes or incident probabilities.

## Score methodology

The 0-100 index is the equal-weight mean of emergency-accessibility shortfall (50%) and contextual indicators (50%). Accessibility shortfall is 100 minus the accessibility index, so less favorable access raises the score. Equal domain weighting is an explicit transparent design choice, not a fit to ground-truth labels.
Each scored feature is converted to its empirical percentile rank across the 1,958 places. For distance features, larger values increase the adverse score; for facility counts, larger values reduce it. Higher district crime, road-accident, and historical-disaster counts increase the contextual index. Each feature has equal weight within its domain.
The score uses nine accessibility features and three contextual features. The four station-level mean weather features remain in the source/output and are described in cluster profiles, but are not assigned a risk direction or weight: annual station means have no validated adverse-weather threshold here, and unusual climate averages do not by themselves indicate a hazard.
The saved K-Means preprocessing pipeline supplies the existing median imputation values. A missing contextual value is replaced by its existing training median; missingness indicators are not scored, and missingness alone never adds risk points. Feature-contribution output records observed missingness for transparency.
The per-feature point contribution is centered on the cohort midpoint; `50 + sum(contributions)` exactly reproduces the score. A high access index means relatively favorable recorded geographic access; a high contextual index means higher-ranked contextual values, not place-specific incidents.

## Reproducible category thresholds

Thresholds use three contiguous natural-break bands: the two cuts minimize total within-band squared deviation of the complete risk-score distribution. This is a deterministic minimum-within-class-variance segmentation, not a balanced split and not a threshold learned from safety outcomes. Equal-score ties are kept together; each band must contain at least five places to support the requested representative-case check.
- Score range: 17.720747 to 78.657360.
- LOW RISK: score <= 43.631540.
- MODERATE RISK: 43.631540 < score <= 56.388321.
- HIGH RISK: score > 56.388321.

| risk_level | places | percent | risk_score_min | risk_score_max | risk_score_mean | risk_score_median | mean_accessibility_index | mean_contextual_index | isolation_forest_anomalies | isolation_forest_anomaly_percent |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| LOW RISK | 631 | 32.2268 | 17.7207 | 43.6174 | 36.9147 | 37.9738 | 73.5873 | 47.4166 | 145 | 22.9794 |
| MODERATE RISK | 682 | 34.8315 | 43.6457 | 56.3273 | 50.3388 | 50.7597 | 48.228 | 48.9057 | 52 | 7.6246 |
| HIGH RISK | 645 | 32.9418 | 56.4493 | 78.6574 | 62.4775 | 61.5254 | 28.8069 | 53.7619 | 76 | 11.7829 |

## Cluster profile interpretation

The existing profiles show tradeoffs rather than five intrinsic risk classes. Cluster 0 has longer median distances to hospitals, PHCs, and fire/rescue than overall, while its crime-context median is lower than overall and its road-accident median is higher. Cluster 1 is broadly closer to overall medians, with weaker police access and middling context. Cluster 2 has longer police/fire distances but relatively shorter median hospital/PHC distances; its crime and road-accident context fields have no observed values in the original cluster profile, so those score inputs are median-imputed. Cluster 3 has especially dense nearby police, hospital, and PHC counts and short distances, alongside higher road-accident context. Cluster 4 has dense emergency-facility coverage but a much higher district crime median and historical-disaster count, alongside lower road-accident context. These mixed patterns are why no cluster ID is directly renamed as a risk level.
The following cluster-band value is only the band containing the cluster mean of the separately computed place scores. It is not a label for every place in that cluster.

| kmeans_cluster | places | mean_risk_score | median_risk_score | cluster_mean_score_band_only | mean_accessibility_index | mean_contextual_index | isolation_forest_anomalies | anomaly_percent |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | 250 | 48.8596 | 52.6068 | MODERATE RISK | 34.8116 | 32.5307 | 65 | 26.0 |
| 1 | 741 | 54.5042 | 55.3357 | MODERATE RISK | 41.3626 | 50.3711 | 21 | 2.834 |
| 2 | 462 | 54.0237 | 54.7795 | MODERATE RISK | 39.4677 | 47.5151 | 87 | 18.8312 |
| 3 | 140 | 34.8043 | 33.4546 | LOW RISK | 81.3405 | 50.9491 | 85 | 60.7143 |
| 4 | 365 | 42.4333 | 40.9616 | LOW RISK | 79.2635 | 64.1301 | 15 | 4.1096 |

### Per-cluster rationale

- **Cluster 0**: comparatively weaker access with below-midpoint contextual indicators; access index 34.8/100, contextual index 32.5/100. Profile evidence: nearest_fire_rescue_distance_km median 49.760 (less favorable, +1.04 IQR from overall median); nearest_phc_distance_km median 7.092 (less favorable, +1.03 IQR from overall median); district_macro_road_accident_rate_2023_per_100k median 24.200 (higher contextual value, +0.34 IQR from overall median); district_macro_total_cognizable_crime_ipc_sll_rate_2023_per_100k median 13.300 (lower contextual value, -0.21 IQR from overall median). Cluster mean score 48.86 falls in the MODERATE RISK band. This is a cluster-average description only; individual places receive categories from their own feature scores.
- **Cluster 1**: comparatively weaker access and above-midpoint contextual indicators; access index 41.4/100, contextual index 50.4/100. Profile evidence: nearest_hospital_distance_km median 3.430 (less favorable, +0.29 IQR from overall median); police_count_5km median 0.000 (less favorable, -0.25 IQR from overall median); district_macro_road_accident_rate_2023_per_100k median 19.500 (higher contextual value, +0.04 IQR from overall median); district_macro_total_cognizable_crime_ipc_sll_rate_2023_per_100k median 21.500 (lower contextual value, -0.03 IQR from overall median). Cluster mean score 54.50 falls in the MODERATE RISK band. This is a cluster-average description only; individual places receive categories from their own feature scores.
- **Cluster 2**: comparatively weaker access with below-midpoint contextual indicators; access index 39.5/100, contextual index 47.5/100. Profile evidence: nearest_police_distance_km median 11.441 (less favorable, +0.57 IQR from overall median); nearest_phc_distance_km median 3.447 (less favorable, +0.26 IQR from overall median); district_listed_historical_disaster_record_count median 3.000 (higher contextual value, +0.40 IQR from overall median). Cluster mean score 54.02 falls in the MODERATE RISK band. This is a cluster-average description only; individual places receive categories from their own feature scores.
- **Cluster 3**: comparatively stronger access and above-midpoint contextual indicators; access index 81.3/100, contextual index 50.9/100. Profile evidence: hospital_count_1km median 17.000 (more favorable, +8.50 IQR from overall median); phc_count_1km median 8.000 (more favorable, +8.00 IQR from overall median); district_macro_road_accident_rate_2023_per_100k median 26.700 (higher contextual value, +0.49 IQR from overall median); district_listed_historical_disaster_record_count median 0.000 (lower contextual value, -0.20 IQR from overall median). Cluster mean score 34.80 falls in the LOW RISK band. This is a cluster-average description only; individual places receive categories from their own feature scores.
- **Cluster 4**: comparatively stronger access and above-midpoint contextual indicators; access index 79.3/100, contextual index 64.1/100. Profile evidence: police_count_5km median 31.000 (more favorable, +7.50 IQR from overall median); phc_count_1km median 3.000 (more favorable, +3.00 IQR from overall median); district_listed_historical_disaster_record_count median 6.000 (higher contextual value, +1.00 IQR from overall median); district_macro_total_cognizable_crime_ipc_sll_rate_2023_per_100k median 60.600 (higher contextual value, +0.79 IQR from overall median). Cluster mean score 42.43 falls in the LOW RISK band. This is a cluster-average description only; individual places receive categories from their own feature scores.

## Representative-case sanity check

Five places nearest the within-band median score are shown for each category. These are representative score cases, not claimed safety outcomes. Review their actual favorable and limited-access signals and contextual contributions in `representative_sanity_examples.csv` and the detailed per-place contribution file.

| place_name | district | risk_score | risk_level | kmeans_cluster | top_positive_safety_factors | top_limited_access_factors | top_contextual_risk_factors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Semmozhi Poonga | Chennai | 37.9738 | LOW RISK | 4 | Hospitals within 5 km: 241.00 (favorable relative rank 99%); Nearest fire/rescue distance: 0.44 km (favorable relative rank 98%); Police facilities within 5 km: 38.00 (favorable relative rank 97%) | No access measure ranks below its cohort midpoint | District crime context: 60.6 per 100k (relative rank 90%); District historical-disaster record count: 6.0 records (relative rank 86%) |
| Virupaksha cave | Tiruvannamalai | 37.9597 | LOW RISK | 2 | Hospitals within 1 km: 11.00 (favorable relative rank 91%); PHCs within 1 km: 5.00 (favorable relative rank 88%); Police facilities within 1 km: 1.00 (favorable relative rank 79%) | Nearest fire/rescue distance: 56.35 km (favorable relative rank 8%) | No observed contextual indicator ranks above its cohort midpoint |
| Ralliya Dam | Nilgiris | 38.0136 | LOW RISK | 0 | No access measure ranks above its cohort midpoint | Police facilities within 5 km: 0.00 (favorable relative rank 23%); Hospitals within 1 km: 0.00 (favorable relative rank 31%); PHCs within 1 km: 0.00 (favorable relative rank 33%) | No observed contextual indicator ranks above its cohort midpoint |
| Artwork (node/10120269361) | Chennai | 38.032 | LOW RISK | 4 | Nearest police distance: 0.04 km (favorable relative rank 99%); Police facilities within 1 km: 5.00 (favorable relative rank 98%); Police facilities within 5 km: 34.00 (favorable relative rank 94%) | No access measure ranks below its cohort midpoint | District crime context: 60.6 per 100k (relative rank 90%); District historical-disaster record count: 6.0 records (relative rank 86%) |
| Periyar | Chennai | 38.0391 | LOW RISK | 4 | Police facilities within 5 km: 39.00 (favorable relative rank 98%); Police facilities within 1 km: 4.00 (favorable relative rank 97%); PHCs within 1 km: 11.00 (favorable relative rank 96%) | No access measure ranks below its cohort midpoint | District crime context: 60.6 per 100k (relative rank 90%); District historical-disaster record count: 6.0 records (relative rank 86%) |
| Viewpoint (node/5237859822) | Tiruvannamalai | 50.7689 | MODERATE RISK | 2 | Hospitals within 5 km: 41.00 (favorable relative rank 73%); Police facilities within 5 km: 2.00 (favorable relative rank 62%); Nearest police distance: 3.01 km (favorable relative rank 54%) | Nearest fire/rescue distance: 56.25 km (favorable relative rank 8%); Hospitals within 1 km: 0.00 (favorable relative rank 31%); PHCs within 1 km: 0.00 (favorable relative rank 33%) | No observed contextual indicator ranks above its cohort midpoint |
| Zebra | Chengalpattu | 50.7505 | MODERATE RISK | 1 | Nearest police distance: 1.03 km (favorable relative rank 73%); Police facilities within 5 km: 3.00 (favorable relative rank 70%); Nearest fire/rescue distance: 8.82 km (favorable relative rank 67%) | Hospitals within 1 km: 0.00 (favorable relative rank 31%); PHCs within 1 km: 0.00 (favorable relative rank 33%); Police facilities within 1 km: 0.00 (favorable relative rank 37%) | District historical-disaster record count: 3.0 records (relative rank 69%); District crime context: 24.3 per 100k (relative rank 67%) |
| Keeladi Archaeological Site | Madurai | 50.7491 | MODERATE RISK | 1 | Nearest fire/rescue distance: 11.17 km (favorable relative rank 62%); Nearest PHC distance: 1.75 km (favorable relative rank 54%); Nearest hospital distance: 1.60 km (favorable relative rank 53%) | Police facilities within 5 km: 0.00 (favorable relative rank 23%); Hospitals within 1 km: 0.00 (favorable relative rank 31%); PHCs within 1 km: 0.00 (favorable relative rank 33%) | District road-accident context: 26.7 per 100k (relative rank 88%) |
| Artwork (node/10316007543) | Chennai | 50.7462 | MODERATE RISK | 4 | Police facilities within 5 km: 38.00 (favorable relative rank 97%); Hospitals within 5 km: 133.00 (favorable relative rank 89%); Nearest fire/rescue distance: 2.31 km (favorable relative rank 83%) | Hospitals within 1 km: 0.00 (favorable relative rank 31%); PHCs within 1 km: 0.00 (favorable relative rank 33%); Police facilities within 1 km: 0.00 (favorable relative rank 37%) | District crime context: 60.6 per 100k (relative rank 90%); District historical-disaster record count: 6.0 records (relative rank 86%) |
| Giraffe | Chengalpattu | 50.7888 | MODERATE RISK | 1 | Nearest police distance: 1.05 km (favorable relative rank 73%); Police facilities within 5 km: 3.00 (favorable relative rank 70%); Nearest fire/rescue distance: 8.83 km (favorable relative rank 67%) | Hospitals within 1 km: 0.00 (favorable relative rank 31%); PHCs within 1 km: 0.00 (favorable relative rank 33%); Police facilities within 1 km: 0.00 (favorable relative rank 37%) | District historical-disaster record count: 3.0 records (relative rank 69%); District crime context: 24.3 per 100k (relative rank 67%) |
| Ram Rock | Theni | 61.5254 | HIGH RISK | 1 | No access measure ranks above its cohort midpoint | Nearest police distance: 47.31 km (favorable relative rank 0%); Nearest fire/rescue distance: 53.81 km (favorable relative rank 10%); Hospitals within 5 km: 0.00 (favorable relative rank 14%) | District road-accident context: 24.2 per 100k (relative rank 80%) |
| Watch tower | Theni | 61.4998 | HIGH RISK | 0 | No access measure ranks above its cohort midpoint | Nearest PHC distance: 14.77 km (favorable relative rank 3%); Nearest fire/rescue distance: 63.20 km (favorable relative rank 6%); Nearest hospital distance: 9.66 km (favorable relative rank 13%) | District road-accident context: 24.2 per 100k (relative rank 80%) |
| Eruthu Guddai | Tirupathur | 61.4984 | HIGH RISK | 2 | No access measure ranks above its cohort midpoint | Nearest hospital distance: 12.40 km (favorable relative rank 9%); Hospitals within 5 km: 0.00 (favorable relative rank 14%); Nearest police distance: 20.63 km (favorable relative rank 15%) | No observed contextual indicator ranks above its cohort midpoint |
| Kolukkamalai sunrise viewing point | Theni | 61.4885 | HIGH RISK | 1 | No access measure ranks above its cohort midpoint | Nearest fire/rescue distance: 77.01 km (favorable relative rank 2%); Nearest police distance: 34.34 km (favorable relative rank 3%); Nearest hospital distance: 15.73 km (favorable relative rank 5%) | District road-accident context: 24.2 per 100k (relative rank 80%) |
| Katharāti Malai | Tirupathur | 61.5637 | HIGH RISK | 2 | No access measure ranks above its cohort midpoint | Nearest police distance: 24.66 km (favorable relative rank 11%); Hospitals within 5 km: 0.00 (favorable relative rank 14%); Nearest PHC distance: 7.74 km (favorable relative rank 15%) | No observed contextual indicator ranks above its cohort midpoint |

The cases are generated by a deterministic nearest-to-band-median rule. Their explanations use observed values only; missing contextual values are disclosed and do not appear as high-risk factors.

## Comparisons and interpretation

`risk_category_summary.csv` compares category counts, score distributions, component indices, Isolation Forest anomaly prevalence, K-Means cluster counts, and medians for all scored source features. Anomaly flags are comparison metadata only and never add to the score or determine a category.
Weather summaries are retained in the main output but not scored. Emergency-facility distances/counts indicate mapped geographic proximity only; they do not establish facility quality, availability, operating hours, or response time.

## Scientific limitations

- This is an evidence-based, explainable risk assessment derived from available contextual, environmental, and emergency-accessibility data. It is not a ground-truth tourist safety label because the dataset does not contain verified place-level Safe/Unsafe labels.
- K-Means clusters are unsupervised patterns. Supervised models were trained to reproduce those cluster assignments. The 99.745% Logistic Regression accuracy refers to reproducing K-Means cluster membership, NOT predicting actual tourist safety.
- District crime and accident values are contextual, not place-specific incident data. Missing district joins are median-imputed and missingness itself is not interpreted as risk.
- Emergency-facility proximity does not prove service quality, availability, operating hours, or response time.
- Weather is based on nearby available stations and annual summary values, not place-level or real-time conditions; it is not scored without validated hazard thresholds.
- Historical disaster records represent historical district context and do not guarantee future events at a tourist place.
- The score weights and natural-break bands are transparent descriptive choices without calibration to observed harm outcomes. They must not be represented as actual safety predictions, incident probabilities, or visitor guidance by themselves.

## Reproducibility and validation

- Fixed random state reference: 42; this scoring and threshold procedure itself is deterministic and uses no randomness.
- Python `3.12.10`, pandas `3.0.3`, NumPy `2.5.0`, scikit-learn `1.9.0`, joblib `1.5.3`.
- The existing K-Means, preprocessing, and Isolation Forest artifacts were loaded only; no models were fit or modified.
- Input source hashes were captured before and after output generation and verified unchanged.
- Validation requires 1,958 unique places, finite scores, exactly the three specified categories, valid cluster/anomaly IDs, contribution sums reproducing each score, and reloadable CSV/JSON outputs.

## Output files

- `final_tourist_risk_assessment.csv`
- `final_tourist_risk_assessment.json`
- `FINAL_RISK_ASSESSMENT_REPORT.md`
- `risk_score_feature_contributions.csv`
- `risk_category_summary.csv`
- `cluster_to_risk_mapping.csv`
- `representative_sanity_examples.csv`
