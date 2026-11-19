# SAFEYATRI Unsupervised ML Training Report

## Dataset information

- Input: `data/ml/tourist_safety_features.csv`.
- Rows: 1958; columns: 39.
- Dataset SHA-256: `7887e5cd4a2bb81a1b7757c617ca5f6441549a94c586be14f93e87e93dc04478`.
- Numeric preprocessing matrix: 1958 rows x 19 transformed columns.
- No labels or supervised targets were loaded or generated.

## Features used

- `nearest_police_distance_km`
- `police_count_1km`
- `police_count_5km`
- `nearest_hospital_distance_km`
- `hospital_count_1km`
- `hospital_count_5km`
- `nearest_phc_distance_km`
- `phc_count_1km`
- `nearest_fire_rescue_distance_km`
- `weather_2024_nearest_station_mean_temperature_c`
- `weather_2024_nearest_station_mean_daily_precipitation_mm`
- `weather_2024_nearest_station_mean_daily_max_wind_speed_kmh`
- `weather_2024_nearest_station_mean_relative_humidity_pct`
- `district_macro_total_cognizable_crime_ipc_sll_rate_2023_per_100k`
- `district_macro_road_accident_rate_2023_per_100k`
- `district_listed_historical_disaster_record_count`
- The preprocessing pipeline adds one missingness indicator for each of the three included district-context features with missing observations.
- Identity/provenance columns excluded from modeling: `place_id`, `place_name`, `district`, `place_category`, `place_source_url`, `weather_nearest_station_name`.

## Features excluded and reasons

| Feature | Reason |
| --- | --- |
| place_id | Identifier only; not a numeric predictor. |
| place_name | Identity/display field; not a numeric predictor. |
| district | Categorical place identity; no arbitrary numeric encoding. |
| latitude | Geographic identity; including coordinates could make clusters primarily spatial. |
| longitude | Geographic identity; including coordinates could make clusters primarily spatial. |
| place_category | Categorical place identity; excluded to avoid encoding category as numeric. |
| place_source_url | Provenance field, not a predictor. |
| weather_nearest_station_name | Station provenance label, not a predictor. |
| police_count_10km | Redundant broad-radius count; highly correlated with 5 km and other facility counts. |
| hospital_count_10km | Redundant broad-radius count; highly correlated with 5 km and other facility counts. |
| phc_count_5km | Highly correlated with hospital_count_5km (absolute Pearson r=0.953), likely double-weighting settlement density. |
| phc_count_10km | Redundant broad-radius count; highly correlated with 5 km and other facility counts. |
| fire_rescue_count_5km | Highly correlated with police_count_5km (absolute Pearson r=0.951), likely double-weighting settlement density. |
| fire_rescue_count_10km | Redundant broad-radius count; highly correlated with 5 km and other facility counts. |
| nearest_ambulance_distance_km | Only one ambulance station is present; nearest distance is not representative of broad ambulance coverage. |
| ambulance_count_5km | Only one ambulance station is present; 99.9% of values are zero (near-constant). |
| ambulance_count_10km | Only one ambulance station is present; 99.9% of values are zero (near-constant). |
| weather_nearest_station_distance_km | Station coverage/geography proxy rather than a measured weather condition. |
| district_domestic_footfall_share_pct | District context has 38.1% missingness; excluded rather than broadly imputing an exposure proxy. |
| district_foreign_footfall_share_pct | District context has 38.1% missingness; excluded rather than broadly imputing an exposure proxy. |
| place_site_annual_domestic_visitors_approx | 100% missing; no exact name-and-district site match was available. |
| place_site_annual_foreign_visitors_approx | 100% missing; no exact name-and-district site match was available. |
| district_macro_theft_crime_rate_per_100k | District context has 27.0% missingness and is highly correlated with total cognizable crime rate (absolute Pearson r=0.944); retain the broader crime measure only. |

## Dataset inspection

### Column types, missingness, cardinality, and feature roles

| column | dtype | missing_count | missing_percent | unique_non_null | near_constant_95pct | used_as_ml_feature |
| --- | --- | --- | --- | --- | --- | --- |
| place_id | str | 0 | 0.0 | 1958 | False | False |
| place_name | str | 0 | 0.0 | 1850 | False | False |
| district | str | 0 | 0.0 | 38 | False | False |
| latitude | float64 | 0 | 0.0 | 1953 | False | False |
| longitude | float64 | 0 | 0.0 | 1952 | False | False |
| place_category | str | 0 | 0.0 | 9 | False | False |
| place_source_url | str | 18 | 0.919 | 1940 | False | False |
| weather_nearest_station_name | str | 0 | 0.0 | 48 | False | False |
| nearest_police_distance_km | float64 | 0 | 0.0 | 1759 | False | True |
| police_count_1km | int64 | 0 | 0.0 | 10 | False | True |
| police_count_5km | int64 | 0 | 0.0 | 48 | False | True |
| police_count_10km | int64 | 0 | 0.0 | 85 | False | False |
| nearest_hospital_distance_km | float64 | 0 | 0.0 | 1636 | False | True |
| hospital_count_1km | int64 | 0 | 0.0 | 39 | False | True |
| hospital_count_5km | int64 | 0 | 0.0 | 217 | False | True |
| hospital_count_10km | int64 | 0 | 0.0 | 308 | False | False |
| nearest_phc_distance_km | float64 | 0 | 0.0 | 1664 | False | True |
| phc_count_1km | int64 | 0 | 0.0 | 27 | False | True |
| phc_count_5km | int64 | 0 | 0.0 | 157 | False | False |
| phc_count_10km | int64 | 0 | 0.0 | 243 | False | False |
| nearest_fire_rescue_distance_km | float64 | 0 | 0.0 | 1885 | False | True |
| fire_rescue_count_5km | int64 | 0 | 0.0 | 10 | False | False |
| fire_rescue_count_10km | int64 | 0 | 0.0 | 14 | False | False |
| nearest_ambulance_distance_km | float64 | 0 | 0.0 | 1935 | False | False |
| ambulance_count_5km | int64 | 0 | 0.0 | 2 | True | False |
| ambulance_count_10km | int64 | 0 | 0.0 | 2 | True | False |
| weather_nearest_station_distance_km | float64 | 0 | 0.0 | 1895 | False | False |
| weather_2024_nearest_station_mean_temperature_c | float64 | 0 | 0.0 | 48 | False | True |
| weather_2024_nearest_station_mean_daily_precipitation_mm | float64 | 0 | 0.0 | 47 | False | True |
| weather_2024_nearest_station_mean_daily_max_wind_speed_kmh | float64 | 0 | 0.0 | 47 | False | True |
| weather_2024_nearest_station_mean_relative_humidity_pct | float64 | 0 | 0.0 | 48 | False | True |
| district_domestic_footfall_share_pct | float64 | 745 | 38.049 | 18 | False | False |
| district_foreign_footfall_share_pct | float64 | 745 | 38.049 | 18 | False | False |
| place_site_annual_domestic_visitors_approx | float64 | 1958 | 100.0 | 0 | False | False |
| place_site_annual_foreign_visitors_approx | float64 | 1958 | 100.0 | 0 | False | False |
| district_macro_total_cognizable_crime_ipc_sll_rate_2023_per_100k | float64 | 495 | 25.281 | 25 | False | True |
| district_macro_road_accident_rate_2023_per_100k | float64 | 495 | 25.281 | 26 | False | True |
| district_macro_theft_crime_rate_per_100k | float64 | 529 | 27.017 | 21 | False | False |
| district_listed_historical_disaster_record_count | float64 | 298 | 15.22 | 6 | False | True |

### Numeric distributions

Summary values are computed from available source values before imputation.

| column | missing_count | mean | std | min | q25 | median | q75 | max | modal_value_share |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| latitude | 0 | 11.214 | 1.624 | 8.078 | 10.078 | 11.422 | 12.832 | 13.719 | 0.001 |
| longitude | 0 | 78.677 | 1.231 | 76.307 | 77.510 | 78.686 | 80.009 | 80.338 | 0.001 |
| nearest_police_distance_km | 0 | 8.864 | 10.549 | 0.010 | 0.941 | 4.100 | 13.736 | 57.214 | 0.002 |
| police_count_1km | 0 | 0.568 | 1.224 | 0.000 | 0.000 | 0.000 | 1.000 | 9.000 | 0.740 |
| police_count_5km | 0 | 6.226 | 11.652 | 0.000 | 0.000 | 1.000 | 4.000 | 47.000 | 0.466 |
| police_count_10km | 0 | 14.232 | 26.431 | 0.000 | 0.000 | 2.000 | 8.000 | 91.000 | 0.330 |
| nearest_hospital_distance_km | 0 | 3.962 | 4.787 | 0.024 | 0.510 | 1.910 | 5.719 | 25.422 | 0.003 |
| hospital_count_1km | 0 | 2.761 | 5.946 | 0.000 | 0.000 | 0.000 | 2.000 | 50.000 | 0.615 |
| hospital_count_5km | 0 | 37.577 | 62.045 | 0.000 | 0.000 | 4.000 | 53.000 | 283.000 | 0.278 |
| hospital_count_10km | 0 | 91.490 | 145.981 | 0.000 | 2.000 | 15.000 | 122.000 | 480.000 | 0.116 |
| nearest_phc_distance_km | 0 | 3.681 | 4.049 | 0.006 | 0.649 | 2.183 | 5.422 | 23.044 | 0.002 |
| phc_count_1km | 0 | 1.763 | 3.967 | 0.000 | 0.000 | 0.000 | 1.000 | 35.000 | 0.658 |
| phc_count_5km | 0 | 24.752 | 40.488 | 0.000 | 0.000 | 2.000 | 35.000 | 175.000 | 0.271 |
| phc_count_10km | 0 | 66.363 | 110.236 | 0.000 | 3.000 | 8.000 | 58.000 | 382.000 | 0.085 |
| nearest_fire_rescue_distance_km | 0 | 23.183 | 21.707 | 0.043 | 4.172 | 17.886 | 34.913 | 125.600 | 0.002 |
| fire_rescue_count_5km | 0 | 0.879 | 1.903 | 0.000 | 0.000 | 0.000 | 1.000 | 9.000 | 0.736 |
| fire_rescue_count_10km | 0 | 1.809 | 3.541 | 0.000 | 0.000 | 0.000 | 1.000 | 13.000 | 0.651 |
| nearest_ambulance_distance_km | 0 | 244.946 | 78.335 | 4.423 | 200.960 | 269.004 | 311.300 | 385.234 | 0.001 |
| ambulance_count_5km | 0 | 0.001 | 0.023 | 0.000 | 0.000 | 0.000 | 0.000 | 1.000 | 0.999 |
| ambulance_count_10km | 0 | 0.001 | 0.023 | 0.000 | 0.000 | 0.000 | 0.000 | 1.000 | 0.999 |
| weather_nearest_station_distance_km | 0 | 16.423 | 13.642 | 0.000 | 3.853 | 13.569 | 25.446 | 69.112 | 0.002 |
| weather_2024_nearest_station_mean_temperature_c | 0 | 26.496 | 4.037 | 15.640 | 27.637 | 28.225 | 28.361 | 29.126 | 0.189 |
| weather_2024_nearest_station_mean_daily_precipitation_mm | 0 | 4.415 | 0.950 | 3.030 | 3.802 | 4.400 | 4.702 | 7.535 | 0.189 |
| weather_2024_nearest_station_mean_daily_max_wind_speed_kmh | 0 | 17.376 | 4.251 | 7.861 | 16.233 | 17.340 | 18.851 | 33.163 | 0.189 |
| weather_2024_nearest_station_mean_relative_humidity_pct | 0 | 74.766 | 4.667 | 65.323 | 70.137 | 76.484 | 77.165 | 83.018 | 0.189 |
| district_domestic_footfall_share_pct | 745 | 8.720 | 4.880 | 1.400 | 3.900 | 7.600 | 14.800 | 14.800 | 0.313 |
| district_foreign_footfall_share_pct | 745 | 13.721 | 13.588 | 0.100 | 1.200 | 5.400 | 32.400 | 32.400 | 0.313 |
| place_site_annual_domestic_visitors_approx | 1958 | NA | NA | NA | NA | NA | NA | NA | NA |
| place_site_annual_foreign_visitors_approx | 1958 | NA | NA | NA | NA | NA | NA | NA | NA |
| district_macro_total_cognizable_crime_ipc_sll_rate_2023_per_100k | 495 | 29.335 | 19.385 | 6.000 | 13.300 | 23.000 | 60.600 | 60.600 | 0.260 |
| district_macro_road_accident_rate_2023_per_100k | 495 | 17.471 | 7.988 | 7.800 | 8.200 | 18.800 | 24.200 | 35.300 | 0.260 |
| district_macro_theft_crime_rate_per_100k | 529 | 22.368 | 20.575 | 5.800 | 8.500 | 10.300 | 56.100 | 56.100 | 0.266 |
| district_listed_historical_disaster_record_count | 298 | 2.643 | 2.416 | 0.000 | 1.000 | 1.000 | 6.000 | 7.000 | 0.308 |

- Near-constant numeric features (95% or more of observed values identical): ambulance_count_5km, ambulance_count_10km.
- Strong numeric correlations (absolute Pearson r >= 0.90): 22 pairs; the complete list is in `high_correlations.csv`.
- Correlations are descriptive, pairwise-complete Pearson correlations; they do not imply causation.

## Missing-value handling and preprocessing

- The two site-level visitor columns have 1,958/1,958 missing values and were excluded before modeling.
- District tourist-arrival shares have 745/1,958 missing values each (38.1%) and were excluded due to high missingness and district-level exposure semantics.
- Selected district-context crime, road-accident, and disaster fields have missing exact district joins. Their raw missing counts are: district_macro_total_cognizable_crime_ipc_sll_rate_2023_per_100k=495, district_macro_road_accident_rate_2023_per_100k=495, district_listed_historical_disaster_record_count=298.
- Remaining selected feature missing values are imputed with `SimpleImputer(strategy='median')`; median values are fit on this dataset and are never written back to source data.
- `add_indicator=True` preserves explicit missingness signals for columns missing during fit.
- `StandardScaler` follows imputation so K-Means distances are not dominated by raw units. The same fitted transformation is used for both models.
- The 10 km facility counts and two additional highly correlated 5 km counts were excluded to reduce redundant density weighting.

## K-Means evaluation

Configuration: k-means++, `n_init=50`, `max_iter=500`, `random_state=42`.
Selection method: average rank across silhouette (higher is better), Davies-Bouldin (lower is better), and Calinski-Harabasz (higher is better); ties favor higher silhouette. Metrics are diagnostics, not proof that clusters are naturally discrete.

| K | Silhouette | Davies-Bouldin | Calinski-Harabasz | Mean rank |
| --- | --- | --- | --- | --- |
| 5 | 0.3214 | 1.2999 | 618.2966 | 2.0000 |
| 4 | 0.3101 | 1.3344 | 652.9942 | 2.0000 |
| 6 | 0.2960 | 1.3181 | 584.8403 | 3.3333 |
| 2 | 0.2907 | 1.3453 | 634.5106 | 3.3333 |
| 3 | 0.2757 | 1.4594 | 622.3461 | 4.3333 |

- Selected K: 5, chosen by the predeclared consensus metric-rank rule. It ties K=4 on mean rank (2.00); K=5 has higher silhouette (0.3214 vs 0.3101) and lower Davies-Bouldin (1.2999 vs 1.3344), while K=4 has higher Calinski-Harabasz (652.99 vs 618.30). The smallest selected cluster has 140 places (7.15%), so no cluster is a tiny handful of records.
- No assumption that K=3 is correct was used.

## Cluster analysis

| Cluster | Places | Percent |
| --- | --- | --- |
| 0 | 250 | 12.77 |
| 1 | 741 | 37.84 |
| 2 | 462 | 23.6 |
| 3 | 140 | 7.15 |
| 4 | 365 | 18.64 |

- **Cluster 0** (250 places): weather_2024_nearest_station_mean_temperature_c median 15.658 (below overall median 28.225; delta -17.36 IQR); weather_2024_nearest_station_mean_daily_precipitation_mm median 6.695 (above overall median 4.400; delta +2.55 IQR); weather_2024_nearest_station_mean_daily_max_wind_speed_kmh median 11.705 (below overall median 17.340; delta -2.15 IQR); nearest_fire_rescue_distance_km median 49.760 (above overall median 17.886; delta +1.04 IQR).
- **Cluster 1** (741 places): weather_2024_nearest_station_mean_relative_humidity_pct median 73.187 (below overall median 76.484; delta -0.47 IQR); weather_2024_nearest_station_mean_daily_precipitation_mm median 4.120 (below overall median 4.400; delta -0.31 IQR); nearest_hospital_distance_km median 3.430 (above overall median 1.910; delta +0.29 IQR); police_count_5km median 0.000 (below overall median 1.000; delta -0.25 IQR).
- **Cluster 2** (462 places): weather_2024_nearest_station_mean_daily_precipitation_mm median 3.545 (below overall median 4.400; delta -0.95 IQR); nearest_police_distance_km median 11.441 (above overall median 4.100; delta +0.57 IQR); weather_2024_nearest_station_mean_daily_max_wind_speed_kmh median 18.362 (above overall median 17.340; delta +0.39 IQR); weather_2024_nearest_station_mean_temperature_c median 27.996 (below overall median 28.225; delta -0.32 IQR).
- **Cluster 3** (140 places): hospital_count_1km median 17.000 (above overall median 0.000; delta +8.50 IQR); phc_count_1km median 8.000 (above overall median 0.000; delta +8.00 IQR); hospital_count_5km median 112.000 (above overall median 4.000; delta +2.04 IQR); weather_2024_nearest_station_mean_relative_humidity_pct median 68.829 (below overall median 76.484; delta -1.09 IQR).
- **Cluster 4** (365 places): police_count_5km median 31.000 (above overall median 1.000; delta +7.50 IQR); phc_count_1km median 3.000 (above overall median 0.000; delta +3.00 IQR); hospital_count_5km median 129.000 (above overall median 4.000; delta +2.36 IQR); hospital_count_1km median 4.000 (above overall median 0.000; delta +2.00 IQR).

### Isolation Forest flags within K-Means clusters

| Cluster | Places | Flagged as unusual | Flagged percent |
| --- | --- | --- | --- |
| 0 | 250 | 65 | 26.00% |
| 1 | 741 | 21 | 2.83% |
| 2 | 462 | 87 | 18.83% |
| 3 | 140 | 85 | 60.71% |
| 4 | 365 | 15 | 4.11% |

This cross-tab compares two unsupervised views; a flag is an unusual feature combination, not an unsafe location.

- `cluster_profiles.csv` contains mean, median, standard deviation, observed count, overall median, and robust median/IQR difference per cluster and selected source feature.
- Cluster IDs are neutral identifiers. The descriptions above report feature patterns only and do not assign safety or risk names.

## Isolation Forest

Configuration: `n_estimators=300`, `max_samples='auto'`, `contamination='auto'`, `random_state=42`; fit to the same imputed and scaled matrix.
- Anomaly score is `-decision_function(X)`, so higher scores indicate more unusual combinations. `anomaly_flag=1` means the fitted estimator marked the row as an outlier; it is not a safety judgement.
- Anomalies: 273/1958 (13.94%). The auto contamination mode uses the estimator's default threshold rather than a hand-picked safety threshold.

### Example unusual feature combinations

| Place | District | Anomaly score (higher = more unusual) |
| --- | --- | --- |
| அரிச்சல் முனை | Ramanathapuram | 0.11438 |
| Danushkodi panorama | Ramanathapuram | 0.11438 |
| Beach (way/967037520) | Ramanathapuram | 0.11207 |
| Beach (way/967037519) | Ramanathapuram | 0.10650 |
| Rajiv Gandhi Statue | Pudukkottai | 0.10596 |
| Pasumpon Muthuramalinga Statue | Pudukkottai | 0.10507 |
| Ambedkar | Pudukkottai | 0.10414 |
| St. Thyagaraja's birthplace | Tiruvarur | 0.10110 |
| Attraction (way/1486693657) | Tirunelveli | 0.10084 |
| St. Muthuswami Dikshitar's birthplace | Tiruvarur | 0.09912 |

### Features differing most for flagged observations

| Feature | Normal median | Anomaly median | Difference in IQR units |
| --- | --- | --- | --- |
| hospital_count_1km | 0.000 | 3.000 | 1.500 |
| phc_count_1km | 0.000 | 1.000 | 1.000 |
| district_macro_road_accident_rate_2023_per_100k | 16.100 | 24.200 | 0.506 |
| nearest_fire_rescue_distance_km | 17.278 | 30.468 | 0.429 |
| nearest_phc_distance_km | 2.368 | 0.650 | -0.360 |

These are descriptive median contrasts for the model's flagged subset, not causes or measures of danger.

## Model comparison and limitations

- K-Means partitions every place into one of K groups and supports aggregate cluster profiles; results depend on the selected feature set, Euclidean geometry, scaling, and K.
- Isolation Forest identifies unusual combinations independently of cluster assignment; its flags and scores are sensitive to feature selection and the estimator's unsupervised threshold.
- District crime/accident/disaster values are macro context only, not incidents at a tourist place. Weather values summarize a nearest station, not the POI microclimate.
- Emergency facility records represent mapped source coverage and are not verified service quality, availability, travel time, or response time. Only one ambulance station is represented, so ambulance features were excluded.
- Correlated access counts, missing noncanonical-district joins, and uneven source coverage can influence discovered groups. Median imputation plus flags makes this reproducible but cannot recover missing source facts.
- These patterns may help prioritize future data collection and exploratory assessment, but neither model establishes objective safety, predicts incidents, or should be used alone for visitor guidance.
- No ground-truth Safe/Unsafe labels exist. No supervised classifier, safety label, or risk score was created.

## Reproducibility and validation

- Python `3.12.10`, pandas `3.0.3`, NumPy `2.5.0`, scikit-learn `1.9.0`, joblib `1.5.3`.
- Fixed random state: 42. K-Means and Isolation Forest were each fitted twice; labels/scores matched exactly within numeric tolerance.
- Outputs were reloaded and checked for 1,958 rows, unique place IDs, valid cluster IDs, finite anomaly scores, and a finite, NaN-free ML matrix.
- The source feature CSV was read-only; no SAFEYATRI application files or UI were modified.
