# Supervised Cluster-Membership Classification

## Scientific interpretation

The target variable is K-Means cluster membership and is not an authentic Safe/Unsafe ground-truth label.

This stage tests whether supervised classifiers can reproduce the structure discovered by the existing K-Means model. Cluster IDs remain neutral identifiers and are not translated into safety or risk levels.

## Dataset and split

- 1,958 tourist places joined to the existing K=5 output using `place_id`; no clustering model was refit.
- 16 numerical/context input features; target: `cluster_id`, with five K-Means-derived pseudo-target classes.
- Training: 1566 places; test: 392 places (80/20 stratified split, `random_state=42`).
- Exact class counts (the source cluster sizes are verified above):

| cluster_id | training | test |
| --- | --- | --- |
| 0 | 200 | 50 |
| 1 | 593 | 148 |
| 2 | 369 | 93 |
| 3 | 112 | 28 |
| 4 | 292 | 73 |

## Preprocessing and leakage controls

- Median imputation with missingness indicators, followed by `StandardScaler`.
- The final preprocessing pipeline is fit only on the training partition, then applied unchanged to the held-out test partition.
- Cross-validation uses 5-fold `StratifiedKFold(shuffle=True, random_state=42)` on training rows only; each fold fits its own imputer and scaler through a pipeline.
- `place_id`, names, district, category, source URL, cluster output, anomaly output, and all other non-selected fields are excluded as predictors.
- The decision-tree depth candidates (4, 6, 8, unrestricted; `min_samples_leaf=5`) were compared using training-only stratified CV; the held-out test set did not select parameters.

## Results

All test metrics describe reproduction of the K-Means-derived cluster membership target, not actual safety.

| model | accuracy | macro_precision | macro_recall | macro_f1 | weighted_precision | weighted_recall | weighted_f1 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| logistic_regression | 0.9974 | 0.9931 | 0.9986 | 0.9958 | 0.9975 | 0.9974 | 0.9975 |
| random_forest | 0.9898 | 0.9875 | 0.9772 | 0.9821 | 0.9897 | 0.9898 | 0.9896 |
| gradient_boosting | 0.9872 | 0.9851 | 0.9701 | 0.977 | 0.9871 | 0.9872 | 0.9869 |
| decision_tree | 0.9719 | 0.9602 | 0.938 | 0.9475 | 0.9707 | 0.9719 | 0.9707 |

Best by held-out macro F1: **logistic_regression** (0.9958). This criterion gives each cluster equal weight despite class imbalance.

Decision Tree fitted depth: 8; leaves: 19. Selected `max_depth`: 8; `min_samples_leaf=5`.

### Cross-validation

Five-fold scores are computed using training data only; values below are mean and sample standard deviation across folds.

| model | cv_accuracy_mean | cv_accuracy_std | cv_macro_f1_mean | cv_macro_f1_std |
| --- | --- | --- | --- | --- |
| logistic_regression | 0.9943 | 0.0014 | 0.9917 | 0.0031 |
| decision_tree | 0.9815 | 0.008 | 0.9698 | 0.0127 |
| random_forest | 0.9911 | 0.0076 | 0.9846 | 0.0131 |
| gradient_boosting | 0.9904 | 0.0071 | 0.9845 | 0.0122 |

### Logistic Regression confusion matrix

Rows are actual cluster IDs; columns are predicted cluster IDs in ascending order.

| actual_cluster | 0 | 1 | 2 | 3 | 4 |
| --- | --- | --- | --- | --- | --- |
| 0 | 50 | 0 | 0 | 0 | 0 |
| 1 | 0 | 147 | 0 | 1 | 0 |
| 2 | 0 | 0 | 93 | 0 | 0 |
| 3 | 0 | 0 | 0 | 28 | 0 |
| 4 | 0 | 0 | 0 | 0 | 73 |

### Decision Tree confusion matrix

Rows are actual cluster IDs; columns are predicted cluster IDs in ascending order.

| actual_cluster | 0 | 1 | 2 | 3 | 4 |
| --- | --- | --- | --- | --- | --- |
| 0 | 50 | 0 | 0 | 0 | 0 |
| 1 | 0 | 146 | 0 | 2 | 0 |
| 2 | 0 | 0 | 92 | 1 | 0 |
| 3 | 0 | 4 | 4 | 20 | 0 |
| 4 | 0 | 0 | 0 | 0 | 73 |

### Random Forest confusion matrix

Rows are actual cluster IDs; columns are predicted cluster IDs in ascending order.

| actual_cluster | 0 | 1 | 2 | 3 | 4 |
| --- | --- | --- | --- | --- | --- |
| 0 | 50 | 0 | 0 | 0 | 0 |
| 1 | 0 | 147 | 0 | 1 | 0 |
| 2 | 0 | 0 | 93 | 0 | 0 |
| 3 | 0 | 2 | 1 | 25 | 0 |
| 4 | 0 | 0 | 0 | 0 | 73 |

### Gradient Boosting confusion matrix

Rows are actual cluster IDs; columns are predicted cluster IDs in ascending order.

| actual_cluster | 0 | 1 | 2 | 3 | 4 |
| --- | --- | --- | --- | --- | --- |
| 0 | 50 | 0 | 0 | 0 | 0 |
| 1 | 0 | 147 | 0 | 1 | 0 |
| 2 | 0 | 0 | 93 | 0 | 0 |
| 3 | 0 | 2 | 2 | 24 | 0 |
| 4 | 0 | 0 | 0 | 0 | 73 |

## Feature interpretation

Logistic Regression importance is the mean absolute coefficient across its five class-specific coefficient vectors (with the maximum also retained in the CSV); signed per-class coefficients are in `logistic_regression_class_coefficients.csv`. Tree-based importances are impurity-based feature importances. These indicate contribution to predicting cluster membership and do not establish causal relationships with danger or safety.

- Top features for `logistic_regression_mean_abs_coefficient`: `district_macro_total_cognizable_crime_ipc_sll_rate_2023_per_100k` (0.8580), `phc_count_1km` (0.7314), `hospital_count_1km` (0.7043), `weather_2024_nearest_station_mean_temperature_c` (0.6571), `hospital_count_5km` (0.6561).
- Top features for `decision_tree_importance`: `missingindicator_district_macro_total_cognizable_crime_ipc_sll_rate_2023_per_100k` (0.3154), `district_macro_total_cognizable_crime_ipc_sll_rate_2023_per_100k` (0.2772), `weather_2024_nearest_station_mean_relative_humidity_pct` (0.2267), `hospital_count_1km` (0.1430), `hospital_count_5km` (0.0171).
- Top features for `random_forest_importance`: `district_macro_total_cognizable_crime_ipc_sll_rate_2023_per_100k` (0.1217), `weather_2024_nearest_station_mean_temperature_c` (0.0960), `weather_2024_nearest_station_mean_relative_humidity_pct` (0.0895), `missingindicator_district_macro_total_cognizable_crime_ipc_sll_rate_2023_per_100k` (0.0843), `missingindicator_district_macro_road_accident_rate_2023_per_100k` (0.0818).
- Top features for `gradient_boosting_importance`: `district_macro_total_cognizable_crime_ipc_sll_rate_2023_per_100k` (0.2128), `missingindicator_district_macro_total_cognizable_crime_ipc_sll_rate_2023_per_100k` (0.2031), `weather_2024_nearest_station_mean_relative_humidity_pct` (0.1717), `missingindicator_district_macro_road_accident_rate_2023_per_100k` (0.1024), `district_macro_road_accident_rate_2023_per_100k` (0.0852).
- Full consolidated values are in `feature_importance_comparison.csv`; missingness indicators are named explicitly where generated.

## Limitations

- K-Means clusters are derived patterns, not ground-truth safety labels.
- High classification accuracy means the supervised model can reproduce K-Means structure; it does NOT prove that the tourist place is safe or unsafe.
- District-level crime/accident data is contextual, not place-specific incident data.
- Weather features are based on nearby available stations.
- Emergency-facility proximity does not establish facility quality, availability, or response time.
- The models should not be presented as predicting actual tourist safety until an appropriate validated target is available.

## Reproducibility and artifacts

- Python `3.12.10`, pandas `3.0.3`, NumPy `2.5.0`, scikit-learn `1.9.0`, joblib `1.5.3`.
- Random state is 42 for the split, all estimators, and CV fold shuffling. The split and source cluster-size checks are deterministic.
- Prediction outputs contain only test-set rows, with `place_id`, `place_name`, actual/predicted cluster IDs, and class probabilities.
- See the adjacent CSV, JSON, text, and joblib files for row-level predictions, metrics, confusion matrices, coefficients/importances, fitted models, and preprocessing.
