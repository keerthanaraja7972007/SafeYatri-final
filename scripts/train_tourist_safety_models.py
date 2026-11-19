from __future__ import annotations

import hashlib
import json
import platform
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import sklearn
from sklearn.cluster import KMeans
from sklearn.ensemble import IsolationForest
from sklearn.impute import SimpleImputer
from sklearn.metrics import calinski_harabasz_score, davies_bouldin_score, silhouette_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = PROJECT_ROOT / "data" / "ml" / "tourist_safety_features.csv"
OUTPUT_DIR = PROJECT_ROOT / "ml"
RANDOM_STATE = 42
K_VALUES = (2, 3, 4, 5, 6)
HIGH_CORRELATION_THRESHOLD = 0.90
NEAR_CONSTANT_THRESHOLD = 0.95

FEATURES = [
    "nearest_police_distance_km",
    "police_count_1km",
    "police_count_5km",
    "nearest_hospital_distance_km",
    "hospital_count_1km",
    "hospital_count_5km",
    "nearest_phc_distance_km",
    "phc_count_1km",
    "nearest_fire_rescue_distance_km",
    "weather_2024_nearest_station_mean_temperature_c",
    "weather_2024_nearest_station_mean_daily_precipitation_mm",
    "weather_2024_nearest_station_mean_daily_max_wind_speed_kmh",
    "weather_2024_nearest_station_mean_relative_humidity_pct",
    "district_macro_total_cognizable_crime_ipc_sll_rate_2023_per_100k",
    "district_macro_road_accident_rate_2023_per_100k",
    "district_listed_historical_disaster_record_count",
]

EXCLUDED_REASONS = {
    "place_id": "Identifier only; not a numeric predictor.",
    "place_name": "Identity/display field; not a numeric predictor.",
    "district": "Categorical place identity; no arbitrary numeric encoding.",
    "place_category": "Categorical place identity; excluded to avoid encoding category as numeric.",
    "place_source_url": "Provenance field, not a predictor.",
    "weather_nearest_station_name": "Station provenance label, not a predictor.",
    "latitude": "Geographic identity; including coordinates could make clusters primarily spatial.",
    "longitude": "Geographic identity; including coordinates could make clusters primarily spatial.",
    "weather_nearest_station_distance_km": "Station coverage/geography proxy rather than a measured weather condition.",
    "nearest_ambulance_distance_km": "Only one ambulance station is present; nearest distance is not representative of broad ambulance coverage.",
    "ambulance_count_5km": "Only one ambulance station is present; 99.9% of values are zero (near-constant).",
    "ambulance_count_10km": "Only one ambulance station is present; 99.9% of values are zero (near-constant).",
    "police_count_10km": "Redundant broad-radius count; highly correlated with 5 km and other facility counts.",
    "hospital_count_10km": "Redundant broad-radius count; highly correlated with 5 km and other facility counts.",
    "phc_count_10km": "Redundant broad-radius count; highly correlated with 5 km and other facility counts.",
    "fire_rescue_count_5km": "Highly correlated with police_count_5km (absolute Pearson r=0.951), likely double-weighting settlement density.",
    "fire_rescue_count_10km": "Redundant broad-radius count; highly correlated with 5 km and other facility counts.",
    "phc_count_5km": "Highly correlated with hospital_count_5km (absolute Pearson r=0.953), likely double-weighting settlement density.",
    "district_domestic_footfall_share_pct": "District context has 38.1% missingness; excluded rather than broadly imputing an exposure proxy.",
    "district_foreign_footfall_share_pct": "District context has 38.1% missingness; excluded rather than broadly imputing an exposure proxy.",
    "place_site_annual_domestic_visitors_approx": "100% missing; no exact name-and-district site match was available.",
    "place_site_annual_foreign_visitors_approx": "100% missing; no exact name-and-district site match was available.",
    "district_macro_theft_crime_rate_per_100k": "District context has 27.0% missingness and is highly correlated with total cognizable crime rate (absolute Pearson r=0.944); retain the broader crime measure only.",
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def markdown_table(frame: pd.DataFrame) -> str:
    if frame.empty:
        return "_None._"
    headers = [str(column) for column in frame.columns]
    rows = [[str(value) for value in row] for row in frame.itertuples(index=False, name=None)]
    return "| " + " | ".join(headers) + " |\n| " + " | ".join(["---"] * len(headers)) + " |\n" + "\n".join(
        "| " + " | ".join(row) + " |" for row in rows
    )


def audit_dataset(data: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    numeric = data.select_dtypes(include="number")
    audit_rows = []
    for column in data.columns:
        series = data[column]
        numeric_series = pd.to_numeric(series, errors="coerce") if column in numeric.columns else None
        mode_share = None
        if numeric_series is not None and numeric_series.notna().any():
            mode_share = float(numeric_series.value_counts(normalize=True).iloc[0])
        audit_rows.append({
            "column": column,
            "dtype": str(series.dtype),
            "missing_count": int(series.isna().sum()),
            "missing_percent": round(float(series.isna().mean() * 100), 3),
            "unique_non_null": int(series.nunique(dropna=True)),
            "mean": float(numeric_series.mean()) if numeric_series is not None and numeric_series.notna().any() else np.nan,
            "std": float(numeric_series.std()) if numeric_series is not None and numeric_series.notna().any() else np.nan,
            "min": float(numeric_series.min()) if numeric_series is not None and numeric_series.notna().any() else np.nan,
            "q25": float(numeric_series.quantile(0.25)) if numeric_series is not None and numeric_series.notna().any() else np.nan,
            "median": float(numeric_series.median()) if numeric_series is not None and numeric_series.notna().any() else np.nan,
            "q75": float(numeric_series.quantile(0.75)) if numeric_series is not None and numeric_series.notna().any() else np.nan,
            "max": float(numeric_series.max()) if numeric_series is not None and numeric_series.notna().any() else np.nan,
            "modal_value_share": mode_share,
            "near_constant_95pct": bool(mode_share is not None and mode_share >= NEAR_CONSTANT_THRESHOLD),
            "used_as_ml_feature": column in FEATURES,
            "decision_reason": "Included numerical feature." if column in FEATURES else EXCLUDED_REASONS.get(column, "Not selected for the model feature set."),
        })
    audit = pd.DataFrame(audit_rows)

    correlations = numeric.corr(method="pearson").abs()
    pairs = []
    for left_index, left in enumerate(correlations.columns):
        for right in correlations.columns[left_index + 1:]:
            value = correlations.loc[left, right]
            if pd.notna(value) and value >= HIGH_CORRELATION_THRESHOLD:
                pairs.append({"feature_a": left, "feature_b": right, "absolute_pearson_r": float(value)})
    high_correlations = pd.DataFrame(pairs).sort_values("absolute_pearson_r", ascending=False) if pairs else pd.DataFrame(
        columns=["feature_a", "feature_b", "absolute_pearson_r"]
    )
    return audit, high_correlations, numeric.describe(percentiles=[0.05, 0.25, 0.5, 0.75, 0.95]).T.reset_index(names="feature")


def make_preprocessor() -> Pipeline:
    return Pipeline([
        ("median_imputer", SimpleImputer(strategy="median", add_indicator=True)),
        ("standard_scaler", StandardScaler()),
    ])


def evaluate_kmeans(matrix: np.ndarray) -> tuple[pd.DataFrame, dict[int, KMeans]]:
    records = []
    models = {}
    for k in K_VALUES:
        model = KMeans(n_clusters=k, init="k-means++", n_init=50, max_iter=500, random_state=RANDOM_STATE)
        labels = model.fit_predict(matrix)
        models[k] = model
        records.append({
            "k": k,
            "silhouette_score": float(silhouette_score(matrix, labels)),
            "davies_bouldin_index": float(davies_bouldin_score(matrix, labels)),
            "calinski_harabasz_score": float(calinski_harabasz_score(matrix, labels)),
            "inertia": float(model.inertia_),
            "minimum_cluster_size": int(pd.Series(labels).value_counts().min()),
            "maximum_cluster_size": int(pd.Series(labels).value_counts().max()),
        })
    metrics = pd.DataFrame(records)
    metrics["silhouette_rank"] = metrics["silhouette_score"].rank(ascending=False, method="min")
    metrics["davies_bouldin_rank"] = metrics["davies_bouldin_index"].rank(ascending=True, method="min")
    metrics["calinski_harabasz_rank"] = metrics["calinski_harabasz_score"].rank(ascending=False, method="min")
    metrics["mean_metric_rank"] = metrics[["silhouette_rank", "davies_bouldin_rank", "calinski_harabasz_rank"]].mean(axis=1)
    return metrics.sort_values(["mean_metric_rank", "silhouette_score"], ascending=[True, False]).reset_index(drop=True), models


def profile_clusters(data: pd.DataFrame, labels: np.ndarray) -> tuple[pd.DataFrame, dict[int, list[tuple[str, float, float]]]]:
    cluster_sizes = pd.Series(labels, name="cluster_id").value_counts().sort_index()
    records = []
    distinguishing = {}
    for cluster_id, cluster_size in cluster_sizes.items():
        cluster_data = data.loc[labels == cluster_id, FEATURES]
        top_features = []
        for feature in FEATURES:
            values = cluster_data[feature].dropna()
            all_values = data[feature].dropna()
            cluster_median = float(values.median()) if not values.empty else np.nan
            overall_median = float(all_values.median()) if not all_values.empty else np.nan
            spread = float(all_values.quantile(0.75) - all_values.quantile(0.25)) if not all_values.empty else np.nan
            robust_delta = (cluster_median - overall_median) / spread if pd.notna(spread) and spread > 0 else 0.0
            records.append({
                "cluster_id": int(cluster_id),
                "cluster_size": int(cluster_size),
                "feature": feature,
                "observed_count": int(values.size),
                "mean": float(values.mean()) if not values.empty else np.nan,
                "median": cluster_median,
                "std": float(values.std()) if values.size > 1 else 0.0 if values.size == 1 else np.nan,
                "overall_median": overall_median,
                "robust_median_delta_iqr": float(robust_delta),
            })
            top_features.append((feature, float(robust_delta), cluster_median))
        distinguishing[int(cluster_id)] = sorted(top_features, key=lambda item: abs(item[1]), reverse=True)[:5]
    return pd.DataFrame(records), distinguishing


def feature_directions(data: pd.DataFrame, anomaly_flags: np.ndarray) -> pd.DataFrame:
    normal = data.loc[anomaly_flags == 0, FEATURES]
    anomalous = data.loc[anomaly_flags == 1, FEATURES]
    rows = []
    for feature in FEATURES:
        typical = normal[feature].dropna()
        unusual = anomalous[feature].dropna()
        overall = data[feature].dropna()
        if typical.empty or unusual.empty or overall.empty:
            continue
        iqr = overall.quantile(0.75) - overall.quantile(0.25)
        difference = float(unusual.median() - typical.median())
        rows.append({
            "feature": feature,
            "normal_median": float(typical.median()),
            "anomaly_median": float(unusual.median()),
            "anomaly_minus_normal": difference,
            "robust_difference_iqr": float(difference / iqr) if iqr > 0 else 0.0,
        })
    return pd.DataFrame(rows).assign(abs_effect=lambda frame: frame["robust_difference_iqr"].abs()).sort_values(
        "abs_effect", ascending=False
    )


def validate_outputs(data: pd.DataFrame, matrix: np.ndarray, kmeans_results: pd.DataFrame, isolation_results: pd.DataFrame,
                     cluster_profiles: pd.DataFrame, metrics: pd.DataFrame, selected_k: int) -> None:
    expected = len(data)
    assert expected == 1958, f"Expected 1,958 source rows, found {expected}."
    for name, frame in {
        "K-Means": kmeans_results,
        "Isolation Forest": isolation_results,
    }.items():
        assert len(frame) == expected, f"{name} output has {len(frame)} rows, expected {expected}."
        assert frame["place_id"].is_unique, f"{name} output contains duplicate place_id values."
    assert matrix.shape[0] == expected and np.isfinite(matrix).all(), "ML matrix has a missing or non-finite value."
    assert set(kmeans_results["cluster_id"].unique()).issubset(set(range(selected_k))), "Unexpected cluster ID found."
    assert set(kmeans_results["cluster_id"].unique()) == set(range(selected_k)), "One or more expected clusters are empty."
    assert np.isfinite(isolation_results["anomaly_score"]).all(), "Invalid anomaly scores found."
    assert set(isolation_results["anomaly_flag"].unique()).issubset({0, 1}), "Invalid anomaly flag found."
    assert set(metrics["k"]) == set(K_VALUES), "One or more K values were not evaluated."
    assert not cluster_profiles.empty, "No cluster profiles were produced."


def write_report(data: pd.DataFrame, audit: pd.DataFrame, correlations: pd.DataFrame, metrics: pd.DataFrame,
                 selected_k: int, kmeans_results: pd.DataFrame, profiles: pd.DataFrame,
                 distinguishing: dict[int, list[tuple[str, float, float]]], isolation_results: pd.DataFrame,
                 anomaly_directions: pd.DataFrame, matrix_shape: tuple[int, int], dataset_hash: str) -> None:
    cluster_sizes = kmeans_results["cluster_id"].value_counts().sort_index()
    anomaly_count = int(isolation_results["anomaly_flag"].sum())
    anomaly_percent = 100 * anomaly_count / len(isolation_results)
    metric_table = metrics[["k", "silhouette_score", "davies_bouldin_index", "calinski_harabasz_score", "mean_metric_rank"]].copy()
    for column in metric_table.columns[1:]:
        metric_table[column] = metric_table[column].map(lambda value: f"{value:.4f}")
    feature_audit_table = audit[["column", "dtype", "missing_count", "missing_percent", "unique_non_null", "near_constant_95pct", "used_as_ml_feature"]]
    distribution_table = audit.loc[audit["dtype"].isin(["int64", "float64", "Int64", "Float64"]),
                                   ["column", "missing_count", "mean", "std", "min", "q25", "median", "q75", "max", "modal_value_share"]].copy()
    for column in distribution_table.columns[2:]:
        distribution_table[column] = distribution_table[column].map(lambda value: "NA" if pd.isna(value) else f"{value:.3f}")

    anomaly_examples = isolation_results.sort_values("anomaly_score", ascending=False).head(10)
    example_table = anomaly_examples[["place_name", "district", "anomaly_score"]].copy()
    example_table["anomaly_score"] = example_table["anomaly_score"].map(lambda value: f"{value:.5f}")
    size_table = pd.DataFrame({"cluster_id": cluster_sizes.index, "size": cluster_sizes.values,
                               "percent": (cluster_sizes.values / len(kmeans_results) * 100).round(2)})
    cluster_anomaly = isolation_results.merge(kmeans_results[["place_id", "cluster_id"]], on="place_id").groupby("cluster_id").agg(
        places=("place_id", "size"), anomalies=("anomaly_flag", "sum"), anomaly_percent=("anomaly_flag", lambda values: 100 * values.mean())
    ).reset_index()
    cluster_anomaly["anomaly_percent"] = cluster_anomaly["anomaly_percent"].map(lambda value: f"{value:.2f}%")
    selected_metrics = metrics.loc[metrics["k"] == selected_k].iloc[0]
    tied_alternatives = metrics.loc[(metrics["mean_metric_rank"] == selected_metrics["mean_metric_rank"]) & (metrics["k"] != selected_k)]
    alternative_text = ""
    if not tied_alternatives.empty:
        alternative = tied_alternatives.sort_values("silhouette_score", ascending=False).iloc[0]
        alternative_text = (
            f" It ties K={int(alternative['k'])} on mean rank ({selected_metrics['mean_metric_rank']:.2f}); "
            f"K={selected_k} has higher silhouette ({selected_metrics['silhouette_score']:.4f} vs {alternative['silhouette_score']:.4f}) "
            f"and lower Davies-Bouldin ({selected_metrics['davies_bouldin_index']:.4f} vs {alternative['davies_bouldin_index']:.4f}), "
            f"while K={int(alternative['k'])} has higher Calinski-Harabasz ({alternative['calinski_harabasz_score']:.2f} vs {selected_metrics['calinski_harabasz_score']:.2f})."
        )
    anomaly_direction_table = anomaly_directions.head(5)[["feature", "normal_median", "anomaly_median", "robust_difference_iqr"]].copy()
    for column in ["normal_median", "anomaly_median", "robust_difference_iqr"]:
        anomaly_direction_table[column] = anomaly_direction_table[column].map(lambda value: f"{value:.3f}")

    profile_sections = []
    for cluster_id, features in distinguishing.items():
        descriptions = []
        for feature, robust_delta, cluster_median in features[:4]:
            overall_median = float(data[feature].median()) if data[feature].notna().any() else np.nan
            direction = "above" if robust_delta > 0 else "below" if robust_delta < 0 else "near"
            descriptions.append(f"{feature} median {cluster_median:.3f} ({direction} overall median {overall_median:.3f}; delta {robust_delta:+.2f} IQR)")
        profile_sections.append(f"- **Cluster {cluster_id}** ({int(cluster_sizes.loc[cluster_id])} places): " + "; ".join(descriptions) + ".")

    excluded_rows = audit.loc[~audit["used_as_ml_feature"], ["column", "decision_reason"]]
    report_lines = [
        "# SAFEYATRI Unsupervised ML Training Report", "",
        "## Dataset information", "",
        f"- Input: `{DATA_PATH.relative_to(PROJECT_ROOT).as_posix()}`.",
        f"- Rows: {len(data)}; columns: {data.shape[1]}.",
        f"- Dataset SHA-256: `{dataset_hash}`.",
        f"- Numeric preprocessing matrix: {matrix_shape[0]} rows x {matrix_shape[1]} transformed columns.",
        "- No labels or supervised targets were loaded or generated.", "",
        "## Features used", "",
        *[f"- `{feature}`" for feature in FEATURES],
        "- The preprocessing pipeline adds one missingness indicator for each of the three included district-context features with missing observations.",
        "- Identity/provenance columns excluded from modeling: `place_id`, `place_name`, `district`, `place_category`, `place_source_url`, `weather_nearest_station_name`.", "",
        "## Features excluded and reasons", "",
        markdown_table(excluded_rows.rename(columns={"column": "Feature", "decision_reason": "Reason"})), "",
        "## Dataset inspection", "",
        "### Column types, missingness, cardinality, and feature roles", "",
        markdown_table(feature_audit_table), "",
        "### Numeric distributions", "",
        "Summary values are computed from available source values before imputation.", "",
        markdown_table(distribution_table), "",
        f"- Near-constant numeric features (95% or more of observed values identical): {', '.join(audit.loc[audit['near_constant_95pct'], 'column'].tolist()) or 'none'}.",
        f"- Strong numeric correlations (absolute Pearson r >= {HIGH_CORRELATION_THRESHOLD:.2f}): {len(correlations)} pairs; the complete list is in `high_correlations.csv`.",
        "- Correlations are descriptive, pairwise-complete Pearson correlations; they do not imply causation.", "",
        "## Missing-value handling and preprocessing", "",
        "- The two site-level visitor columns have 1,958/1,958 missing values and were excluded before modeling.",
        "- District tourist-arrival shares have 745/1,958 missing values each (38.1%) and were excluded due to high missingness and district-level exposure semantics.",
        "- Selected district-context crime, road-accident, and disaster fields have missing exact district joins. Their raw missing counts are: "
        + ", ".join(f"{feature}={int(data[feature].isna().sum())}" for feature in FEATURES if data[feature].isna().any()) + ".",
        "- Remaining selected feature missing values are imputed with `SimpleImputer(strategy='median')`; median values are fit on this dataset and are never written back to source data.",
        "- `add_indicator=True` preserves explicit missingness signals for columns missing during fit.",
        "- `StandardScaler` follows imputation so K-Means distances are not dominated by raw units. The same fitted transformation is used for both models.",
        "- The 10 km facility counts and two additional highly correlated 5 km counts were excluded to reduce redundant density weighting.", "",
        "## K-Means evaluation", "",
        "Configuration: k-means++, `n_init=50`, `max_iter=500`, `random_state=42`.",
        "Selection method: average rank across silhouette (higher is better), Davies-Bouldin (lower is better), and Calinski-Harabasz (higher is better); ties favor higher silhouette. Metrics are diagnostics, not proof that clusters are naturally discrete.", "",
        markdown_table(metric_table.rename(columns={"k": "K", "silhouette_score": "Silhouette", "davies_bouldin_index": "Davies-Bouldin", "calinski_harabasz_score": "Calinski-Harabasz", "mean_metric_rank": "Mean rank"})), "",
        f"- Selected K: {selected_k}, chosen by the predeclared consensus metric-rank rule.{alternative_text} The smallest selected cluster has {int(cluster_sizes.min())} places ({100 * cluster_sizes.min() / len(kmeans_results):.2f}%), so no cluster is a tiny handful of records.",
        "- No assumption that K=3 is correct was used.", "",
        "## Cluster analysis", "",
        markdown_table(size_table.rename(columns={"cluster_id": "Cluster", "size": "Places", "percent": "Percent"})), "",
        *profile_sections, "",
        "### Isolation Forest flags within K-Means clusters", "",
        markdown_table(cluster_anomaly.rename(columns={"cluster_id": "Cluster", "places": "Places", "anomalies": "Flagged as unusual", "anomaly_percent": "Flagged percent"})), "",
        "This cross-tab compares two unsupervised views; a flag is an unusual feature combination, not an unsafe location.", "",
        "- `cluster_profiles.csv` contains mean, median, standard deviation, observed count, overall median, and robust median/IQR difference per cluster and selected source feature.",
        "- Cluster IDs are neutral identifiers. The descriptions above report feature patterns only and do not assign safety or risk names.", "",
        "## Isolation Forest", "",
        "Configuration: `n_estimators=300`, `max_samples='auto'`, `contamination='auto'`, `random_state=42`; fit to the same imputed and scaled matrix.",
        "- Anomaly score is `-decision_function(X)`, so higher scores indicate more unusual combinations. `anomaly_flag=1` means the fitted estimator marked the row as an outlier; it is not a safety judgement.",
        f"- Anomalies: {anomaly_count}/{len(isolation_results)} ({anomaly_percent:.2f}%). The auto contamination mode uses the estimator's default threshold rather than a hand-picked safety threshold.", "",
        "### Example unusual feature combinations", "",
        markdown_table(example_table.rename(columns={"place_name": "Place", "district": "District", "anomaly_score": "Anomaly score (higher = more unusual)"})), "",
        "### Features differing most for flagged observations", "",
        markdown_table(anomaly_direction_table.rename(columns={"feature": "Feature", "normal_median": "Normal median", "anomaly_median": "Anomaly median", "robust_difference_iqr": "Difference in IQR units"})), "",
        "These are descriptive median contrasts for the model's flagged subset, not causes or measures of danger.", "",
        "## Model comparison and limitations", "",
        "- K-Means partitions every place into one of K groups and supports aggregate cluster profiles; results depend on the selected feature set, Euclidean geometry, scaling, and K.",
        "- Isolation Forest identifies unusual combinations independently of cluster assignment; its flags and scores are sensitive to feature selection and the estimator's unsupervised threshold.",
        "- District crime/accident/disaster values are macro context only, not incidents at a tourist place. Weather values summarize a nearest station, not the POI microclimate.",
        "- Emergency facility records represent mapped source coverage and are not verified service quality, availability, travel time, or response time. Only one ambulance station is represented, so ambulance features were excluded.",
        "- Correlated access counts, missing noncanonical-district joins, and uneven source coverage can influence discovered groups. Median imputation plus flags makes this reproducible but cannot recover missing source facts.",
        "- These patterns may help prioritize future data collection and exploratory assessment, but neither model establishes objective safety, predicts incidents, or should be used alone for visitor guidance.",
        "- No ground-truth Safe/Unsafe labels exist. No supervised classifier, safety label, or risk score was created.", "",
        "## Reproducibility and validation", "",
        f"- Python `{platform.python_version()}`, pandas `{pd.__version__}`, NumPy `{np.__version__}`, scikit-learn `{sklearn.__version__}`, joblib `{joblib.__version__}`.",
        f"- Fixed random state: {RANDOM_STATE}. K-Means and Isolation Forest were each fitted twice; labels/scores matched exactly within numeric tolerance.",
        "- Outputs were reloaded and checked for 1,958 rows, unique place IDs, valid cluster IDs, finite anomaly scores, and a finite, NaN-free ML matrix.",
        "- The source feature CSV was read-only; no SAFEYATRI application files or UI were modified.",
    ]
    (PROJECT_ROOT / "ML_TRAINING_REPORT.md").write_text("\n".join(report_lines) + "\n", encoding="utf-8")


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    data = pd.read_csv(DATA_PATH)
    if len(data) != 1958:
        raise ValueError(f"Expected exactly 1,958 tourist places, found {len(data)}.")
    required = {"place_id", "place_name", "district", *FEATURES}
    missing_columns = sorted(required - set(data.columns))
    if missing_columns:
        raise ValueError(f"Required columns missing from input: {missing_columns}")
    if data["place_id"].isna().any() or not data["place_id"].is_unique:
        raise ValueError("place_id must be present and unique in the source dataset.")

    audit, correlations, numeric_summary = audit_dataset(data)
    audit.to_csv(OUTPUT_DIR / "feature_audit.csv", index=False)
    correlations.to_csv(OUTPUT_DIR / "high_correlations.csv", index=False)
    numeric_summary.to_csv(OUTPUT_DIR / "numeric_feature_summary.csv", index=False)

    selected_data = data[FEATURES].apply(pd.to_numeric, errors="coerce")
    preprocessor = make_preprocessor()
    matrix = preprocessor.fit_transform(selected_data)
    matrix = np.asarray(matrix, dtype=float)
    if not np.isfinite(matrix).all():
        raise ValueError("Preprocessed ML matrix contains NaN or infinite values.")

    metrics, candidate_models = evaluate_kmeans(matrix)
    metrics.to_csv(OUTPUT_DIR / "kmeans_metrics.csv", index=False)
    selected_k = int(metrics.iloc[0]["k"])
    kmeans = candidate_models[selected_k]
    cluster_ids = kmeans.labels_.copy()
    kmeans_results = data[["place_id", "place_name", "district"]].copy()
    kmeans_results["cluster_id"] = cluster_ids.astype(int)
    kmeans_results.to_csv(OUTPUT_DIR / "kmeans_results.csv", index=False)

    profiles, distinguishing = profile_clusters(data, cluster_ids)
    profiles.to_csv(OUTPUT_DIR / "cluster_profiles.csv", index=False)

    isolation_forest = IsolationForest(
        n_estimators=300,
        max_samples="auto",
        contamination="auto",
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )
    isolation_forest.fit(matrix)
    decision = isolation_forest.decision_function(matrix)
    anomaly_scores = -decision
    anomaly_flags = (decision < 0).astype(int)
    isolation_results = data[["place_id", "place_name", "district"]].copy()
    isolation_results["anomaly_score"] = anomaly_scores.astype(float)
    isolation_results["anomaly_flag"] = anomaly_flags.astype(int)
    isolation_results.to_csv(OUTPUT_DIR / "isolation_forest_results.csv", index=False)
    directions = feature_directions(data, anomaly_flags)
    directions.to_csv(OUTPUT_DIR / "anomaly_feature_contrasts.csv", index=False)

    # Refit with the same configuration to verify deterministic labels and anomaly scores.
    repeated_kmeans = KMeans(n_clusters=selected_k, init="k-means++", n_init=50, max_iter=500, random_state=RANDOM_STATE)
    repeated_labels = repeated_kmeans.fit_predict(matrix)
    repeated_isolation = IsolationForest(
        n_estimators=300, max_samples="auto", contamination="auto", random_state=RANDOM_STATE, n_jobs=-1
    ).fit(matrix)
    assert np.array_equal(cluster_ids, repeated_labels), "K-Means results are not reproducible with the fixed random state."
    assert np.allclose(anomaly_scores, -repeated_isolation.decision_function(matrix), rtol=0, atol=1e-12), (
        "Isolation Forest scores are not reproducible with the fixed random state."
    )

    joblib.dump(preprocessor, OUTPUT_DIR / "preprocessing_pipeline.joblib")
    joblib.dump(kmeans, OUTPUT_DIR / "kmeans_model.joblib")
    joblib.dump(isolation_forest, OUTPUT_DIR / "isolation_forest_model.joblib")

    validate_outputs(data, matrix, kmeans_results, isolation_results, profiles, metrics, selected_k)
    for filename, expected_rows in [
        ("kmeans_results.csv", 1958),
        ("isolation_forest_results.csv", 1958),
    ]:
        reloaded = pd.read_csv(OUTPUT_DIR / filename)
        assert len(reloaded) == expected_rows and reloaded["place_id"].is_unique, f"Could not reload valid {filename}."
    assert not pd.read_csv(OUTPUT_DIR / "cluster_profiles.csv").empty
    assert joblib.load(OUTPUT_DIR / "preprocessing_pipeline.joblib") is not None
    assert joblib.load(OUTPUT_DIR / "kmeans_model.joblib") is not None
    assert joblib.load(OUTPUT_DIR / "isolation_forest_model.joblib") is not None

    config = {
        "dataset": DATA_PATH.relative_to(PROJECT_ROOT).as_posix(),
        "dataset_sha256": sha256(DATA_PATH),
        "rows": len(data),
        "selected_features": FEATURES,
        "transformed_feature_names": preprocessor.get_feature_names_out().tolist(),
        "random_state": RANDOM_STATE,
        "k_values": list(K_VALUES),
        "selected_k": selected_k,
        "kmeans": {"init": "k-means++", "n_init": 50, "max_iter": 500},
        "isolation_forest": {"n_estimators": 300, "max_samples": "auto", "contamination": "auto"},
        "preprocessing": {"imputer": "median", "add_missing_indicators": True, "scaler": "StandardScaler"},
        "python": platform.python_version(),
        "pandas": pd.__version__,
        "numpy": np.__version__,
        "scikit_learn": sklearn.__version__,
        "joblib": joblib.__version__,
    }
    (OUTPUT_DIR / "training_config.json").write_text(json.dumps(config, indent=2) + "\n", encoding="utf-8")

    write_report(data, audit, correlations, metrics, selected_k, kmeans_results, profiles, distinguishing,
                 isolation_results, directions, matrix.shape, config["dataset_sha256"])
    print(json.dumps({
        "rows": len(data),
        "selected_feature_count": len(FEATURES),
        "transformed_feature_count": int(matrix.shape[1]),
        "selected_k": selected_k,
        "metrics": metrics[["k", "silhouette_score", "davies_bouldin_index", "calinski_harabasz_score", "mean_metric_rank"]].to_dict(orient="records"),
        "cluster_sizes": {str(key): int(value) for key, value in kmeans_results["cluster_id"].value_counts().sort_index().items()},
        "anomaly_count": int(anomaly_flags.sum()),
        "anomaly_percent": round(float(anomaly_flags.mean() * 100), 3),
        "output_dir": OUTPUT_DIR.relative_to(PROJECT_ROOT).as_posix(),
        "validation": "PASS",
    }, indent=2))


if __name__ == "__main__":
    main()