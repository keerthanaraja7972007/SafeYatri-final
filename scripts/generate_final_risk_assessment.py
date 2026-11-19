from __future__ import annotations

import hashlib
import json
import platform
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import sklearn


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = PROJECT_ROOT / "data" / "ml" / "tourist_safety_features.csv"
DATA_JSON_PATH = PROJECT_ROOT / "data" / "ml" / "tourist_safety_features.json"
ML_DIR = PROJECT_ROOT / "ml"
OUTPUT_DIR = ML_DIR / "final_risk_assessment"
RANDOM_STATE = 42
EXPECTED_ROWS = 1958
EXPECTED_CLUSTERS = {0, 1, 2, 3, 4}

ACCESS_FEATURES = {
    "nearest_police_distance_km": {"favorable_high": False, "label": "Nearest police distance"},
    "police_count_1km": {"favorable_high": True, "label": "Police facilities within 1 km"},
    "police_count_5km": {"favorable_high": True, "label": "Police facilities within 5 km"},
    "nearest_hospital_distance_km": {"favorable_high": False, "label": "Nearest hospital distance"},
    "hospital_count_1km": {"favorable_high": True, "label": "Hospitals within 1 km"},
    "hospital_count_5km": {"favorable_high": True, "label": "Hospitals within 5 km"},
    "nearest_phc_distance_km": {"favorable_high": False, "label": "Nearest PHC distance"},
    "phc_count_1km": {"favorable_high": True, "label": "PHCs within 1 km"},
    "nearest_fire_rescue_distance_km": {"favorable_high": False, "label": "Nearest fire/rescue distance"},
}
CONTEXT_FEATURES = {
    "district_macro_total_cognizable_crime_ipc_sll_rate_2023_per_100k": "District crime context",
    "district_macro_road_accident_rate_2023_per_100k": "District road-accident context",
    "district_listed_historical_disaster_record_count": "District historical-disaster record count",
}
WEATHER_FEATURES = {
    "weather_2024_nearest_station_mean_temperature_c": "Nearby-station mean temperature (2024)",
    "weather_2024_nearest_station_mean_daily_precipitation_mm": "Nearby-station mean daily precipitation (2024)",
    "weather_2024_nearest_station_mean_daily_max_wind_speed_kmh": "Nearby-station mean daily maximum wind speed (2024)",
    "weather_2024_nearest_station_mean_relative_humidity_pct": "Nearby-station mean relative humidity (2024)",
}
SCORED_FEATURES = [*ACCESS_FEATURES, *CONTEXT_FEATURES]
ALL_FEATURES = [*SCORED_FEATURES, *WEATHER_FEATURES]
CATEGORY_ORDER = ["LOW RISK", "MODERATE RISK", "HIGH RISK"]
MIN_NATURAL_BREAK_CLASS_SIZE = 5

SOURCE_FILES = [
    DATA_PATH,
    DATA_JSON_PATH,
    ML_DIR / "training_config.json",
    ML_DIR / "preprocessing_pipeline.joblib",
    ML_DIR / "kmeans_model.joblib",
    ML_DIR / "kmeans_results.csv",
    ML_DIR / "cluster_profiles.csv",
    ML_DIR / "kmeans_metrics.csv",
    ML_DIR / "isolation_forest_model.joblib",
    ML_DIR / "isolation_forest_results.csv",
    ML_DIR / "supervised" / "model_comparison.csv",
    ML_DIR / "supervised" / "feature_importance_comparison.csv",
    ML_DIR / "supervised" / "SUPERVISED_ML_REPORT.md",
    PROJECT_ROOT / "ML_FEATURE_DATASET_REPORT.md",
    PROJECT_ROOT / "ML_TRAINING_REPORT.md",
]


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def markdown_table(frame: pd.DataFrame) -> str:
    if frame.empty:
        return "_No rows._"
    headers = [str(column) for column in frame.columns]
    rows = []
    for row in frame.itertuples(index=False, name=None):
        rows.append([
            str(value).replace("|", "\\|").replace("\n", " ")
            for value in row
        ])
    return "| " + " | ".join(headers) + " |\n| " + " | ".join(["---"] * len(headers)) + " |\n" + "\n".join(
        "| " + " | ".join(row) + " |" for row in rows
    )


def format_value(value: float, feature: str) -> str:
    if feature.endswith("_km"):
        return f"{value:.2f} km"
    if feature.endswith("_per_100k"):
        return f"{value:.1f} per 100k"
    if feature.endswith("_count"):
        return f"{value:.1f} records"
    return f"{value:.2f}"


def natural_break_thresholds(scores: np.ndarray) -> tuple[float, float]:
    """Find two contiguous score cuts minimizing total within-band squared error."""
    values = np.sort(np.asarray(scores, dtype=float))
    count = len(values)
    if count < 3 * MIN_NATURAL_BREAK_CLASS_SIZE or not np.isfinite(values).all():
        raise ValueError("Not enough finite scores to create three meaningful score bands.")

    cuts = np.flatnonzero(values[:-1] < values[1:]) + 1
    prefix = np.concatenate(([0.0], np.cumsum(values)))
    prefix_squared = np.concatenate(([0.0], np.cumsum(values * values)))

    def segment_sse(start: int, ends: np.ndarray | int) -> np.ndarray:
        ends_array = np.asarray(ends, dtype=int)
        length = ends_array - start
        sums = prefix[ends_array] - prefix[start]
        sums_squared = prefix_squared[ends_array] - prefix_squared[start]
        return np.maximum(0.0, sums_squared - (sums * sums / length))

    best_cost = np.inf
    best_cuts: tuple[int, int] | None = None
    for first in cuts:
        if first < MIN_NATURAL_BREAK_CLASS_SIZE or first > count - 2 * MIN_NATURAL_BREAK_CLASS_SIZE:
            continue
        seconds = cuts[
            (cuts >= first + MIN_NATURAL_BREAK_CLASS_SIZE)
            & (cuts <= count - MIN_NATURAL_BREAK_CLASS_SIZE)
        ]
        if not len(seconds):
            continue
        costs = (
            float(segment_sse(0, first))
            + segment_sse(first, seconds)
            + segment_sse(seconds, count)
        )
        index = int(np.argmin(costs))
        if float(costs[index]) < best_cost:
            best_cost = float(costs[index])
            best_cuts = (int(first), int(seconds[index]))

    if best_cuts is None:
        raise ValueError("Could not find three non-empty score bands.")
    first, second = best_cuts
    return (
        float((values[first - 1] + values[first]) / 2.0),
        float((values[second - 1] + values[second]) / 2.0),
    )


def assign_categories(scores: np.ndarray, thresholds: tuple[float, float]) -> np.ndarray:
    low_threshold, high_threshold = thresholds
    return np.where(
        scores <= low_threshold,
        CATEGORY_ORDER[0],
        np.where(scores <= high_threshold, CATEGORY_ORDER[1], CATEGORY_ORDER[2]),
    )


def json_value(value):
    if value is None or value is pd.NA:
        return None
    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (np.floating, float)):
        return float(value) if np.isfinite(value) else None
    if isinstance(value, (np.bool_, bool)):
        return bool(value)
    if pd.isna(value):
        return None
    return value


def save_json_records(frame: pd.DataFrame, path: Path) -> None:
    records = [
        {key: json_value(value) for key, value in record.items()}
        for record in frame.to_dict(orient="records")
    ]
    with path.open("w", encoding="utf-8", newline="\n") as destination:
        json.dump(records, destination, ensure_ascii=False, indent=2, allow_nan=False)
        destination.write("\n")


def build_explanation(row: pd.Series, feature_risk_percentiles: dict[str, float]) -> tuple[str, str, str, str]:
    safety_items = []
    limited_access_items = []
    for feature, spec in ACCESS_FEATURES.items():
        if bool(row[f"missing__{feature}"]):
            continue
        favorable_percentile = 1.0 - feature_risk_percentiles[feature]
        raw_value = float(row[feature])
        if favorable_percentile > 0.5:
            safety_items.append((favorable_percentile, f"{spec['label']}: {format_value(raw_value, feature)} (favorable relative rank {favorable_percentile:.0%})"))
        elif favorable_percentile < 0.5:
            limited_access_items.append((favorable_percentile, f"{spec['label']}: {format_value(raw_value, feature)} (favorable relative rank {favorable_percentile:.0%})"))
    safety_items.sort(key=lambda item: (-item[0], item[1]))
    limited_access_items.sort(key=lambda item: (item[0], item[1]))
    top_safety = "; ".join(item for _, item in safety_items[:3]) or "No access measure ranks above its cohort midpoint"
    top_limited_access = "; ".join(item for _, item in limited_access_items[:3]) or "No access measure ranks below its cohort midpoint"

    risk_items = []
    for feature, label in CONTEXT_FEATURES.items():
        if bool(row[f"missing__{feature}"]):
            continue
        percentile = feature_risk_percentiles[feature]
        if percentile > 0.5:
            raw_value = float(row[feature])
            risk_items.append((percentile, f"{label}: {format_value(raw_value, feature)} (relative rank {percentile:.0%})"))
    risk_items.sort(key=lambda item: (-item[0], item[1]))
    top_context = "; ".join(item for _, item in risk_items[:3]) or "No observed contextual indicator ranks above its cohort midpoint"

    missing_context = [label for feature, label in CONTEXT_FEATURES.items() if bool(row[f"missing__{feature}"])]
    missing_note = ""
    if missing_context:
        missing_note = " Missing district context was median-imputed for scoring; missingness itself did not increase the score."
    explanation = (
        f"{row['risk_level']} assessment band (index {row['risk_score']:.2f}/100). "
        f"More favorable access signals: {top_safety}. Less favorable access signals: {top_limited_access}. "
        f"Context indicators: {top_context}. "
        "District measures describe broader context, not incidents at this place; proximity does not verify facility service quality or availability."
        + missing_note
    )
    return top_safety, top_limited_access, top_context, explanation


def cluster_profile_reason(
    cluster_id: int,
    profiles: pd.DataFrame,
    access_index: float,
    context_index: float,
    mean_score: float,
    mean_category: str,
) -> str:
    cluster_profile = profiles.loc[profiles["cluster_id"].astype(int) == cluster_id].copy()
    access_contrasts = []
    context_contrasts = []
    for row in cluster_profile.itertuples(index=False):
        feature = row.feature
        if feature not in SCORED_FEATURES or pd.isna(row.robust_median_delta_iqr):
            continue
        delta = float(row.robust_median_delta_iqr)
        if feature in ACCESS_FEATURES:
            favorable_high = ACCESS_FEATURES[feature]["favorable_high"]
            favorable = delta > 0 if favorable_high else delta < 0
            destination = access_contrasts
            direction = "more favorable" if favorable else "less favorable"
        else:
            favorable = delta < 0
            destination = context_contrasts
            direction = "lower contextual value" if favorable else "higher contextual value"
        destination.append((abs(delta), f"{feature} median {float(row.median):.3f} ({direction}, {delta:+.2f} IQR from overall median)"))
    access_contrasts.sort(key=lambda item: (-item[0], item[1]))
    context_contrasts.sort(key=lambda item: (-item[0], item[1]))
    access_text = "; ".join(item for _, item in access_contrasts[:2]) or "no observed access median contrast"
    context_text = "; ".join(item for _, item in context_contrasts[:2]) or "no observed contextual median contrast"
    if access_index >= 50 and context_index >= 50:
        balance = "comparatively stronger access and above-midpoint contextual indicators"
    elif access_index >= 50 and context_index < 50:
        balance = "comparatively stronger access with below-midpoint contextual indicators"
    elif access_index < 50 and context_index >= 50:
        balance = "comparatively weaker access and above-midpoint contextual indicators"
    else:
        balance = "comparatively weaker access with below-midpoint contextual indicators"
    return (
        f"{balance}; access index {access_index:.1f}/100, contextual index {context_index:.1f}/100. "
        f"Profile evidence: {access_text}; {context_text}. Cluster mean score {mean_score:.2f} falls in the {mean_category} band. "
        "This is a cluster-average description only; individual places receive categories from their own feature scores."
    )


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    missing_sources = [path for path in SOURCE_FILES if not path.is_file()]
    if missing_sources:
        raise FileNotFoundError(f"Required existing ML artifacts are missing: {[str(path) for path in missing_sources]}")
    input_hashes_before = {path.name + ":" + str(path.parent.relative_to(PROJECT_ROOT)): sha256(path) for path in SOURCE_FILES}

    config = json.loads((ML_DIR / "training_config.json").read_text(encoding="utf-8"))
    configured_features = config["selected_features"]
    if set(configured_features) != set(ALL_FEATURES) or len(configured_features) != 16:
        raise ValueError("Existing training configuration does not match the expected 16-feature set.")
    data = pd.read_csv(DATA_PATH)
    source_json = json.loads(DATA_JSON_PATH.read_text(encoding="utf-8"))
    kmeans = joblib.load(ML_DIR / "kmeans_model.joblib")
    preprocessing = joblib.load(ML_DIR / "preprocessing_pipeline.joblib")
    isolation_model = joblib.load(ML_DIR / "isolation_forest_model.joblib")
    kmeans_results = pd.read_csv(ML_DIR / "kmeans_results.csv")
    isolation_results = pd.read_csv(ML_DIR / "isolation_forest_results.csv")
    profiles = pd.read_csv(ML_DIR / "cluster_profiles.csv")
    metrics = pd.read_csv(ML_DIR / "kmeans_metrics.csv")
    supervised_comparison = pd.read_csv(ML_DIR / "supervised" / "model_comparison.csv")
    supervised_importance = pd.read_csv(ML_DIR / "supervised" / "feature_importance_comparison.csv")
    supervised_report = (ML_DIR / "supervised" / "SUPERVISED_ML_REPORT.md").read_text(encoding="utf-8")

    if len(data) != EXPECTED_ROWS or len(source_json) != EXPECTED_ROWS:
        raise ValueError(f"Expected {EXPECTED_ROWS} source places in both CSV and JSON.")
    if data["place_id"].isna().any() or data["place_id"].duplicated().any():
        raise ValueError("Source place_id values must be present and unique.")
    json_ids = [row.get("place_id") for row in source_json]
    if len(set(json_ids)) != EXPECTED_ROWS or set(json_ids) != set(data["place_id"]):
        raise ValueError("Feature JSON and CSV do not contain the same unique place IDs.")
    if kmeans.n_clusters != 5 or int(config["selected_k"]) != 5:
        raise ValueError("The existing K-Means model/configuration is not K=5.")
    if list(preprocessing.named_steps) != ["median_imputer", "standard_scaler"]:
        raise ValueError("Unexpected saved preprocessing pipeline structure.")
    imputer = preprocessing.named_steps["median_imputer"]
    if imputer.strategy != "median" or not imputer.add_indicator:
        raise ValueError("Existing preprocessing must use median imputation and missingness indicators.")
    if imputer.feature_names_in_.tolist() != configured_features:
        raise ValueError("Saved preprocessing input features do not match the training configuration.")
    if set(metrics["k"].astype(int)) != {2, 3, 4, 5, 6}:
        raise ValueError("K-Means metrics are incomplete or inconsistent with the existing report.")
    if not np.isclose(float(supervised_comparison.loc[supervised_comparison["model"] == "logistic_regression", "accuracy"].iloc[0]), 0.9974489795918368):
        raise ValueError("The saved supervised Logistic Regression result does not match the inspected output.")
    if "not an authentic safe/unsafe ground-truth label" not in supervised_report.lower():
        raise ValueError("Supervised report is missing its cluster-membership target limitation.")
    if supervised_importance.empty:
        raise ValueError("Existing supervised feature importance output is empty.")
    if not hasattr(isolation_model, "decision_function"):
        raise ValueError("Saved Isolation Forest model could not be loaded correctly.")

    for frame, label in ((kmeans_results, "K-Means"), (isolation_results, "Isolation Forest")):
        if len(frame) != EXPECTED_ROWS or frame["place_id"].isna().any() or frame["place_id"].duplicated().any():
            raise ValueError(f"{label} output must contain 1,958 unique place IDs.")
    if kmeans_results["cluster_id"].isna().any() or set(kmeans_results["cluster_id"].astype(int)) != EXPECTED_CLUSTERS:
        raise ValueError("Existing K-Means output must contain exactly cluster IDs 0-4 with none missing.")
    if set(data["place_id"]) != set(kmeans_results["place_id"]) or set(data["place_id"]) != set(isolation_results["place_id"]):
        raise ValueError("Source, K-Means, and Isolation Forest place IDs do not match.")
    if profiles.empty or set(profiles["cluster_id"].astype(int)) != EXPECTED_CLUSTERS:
        raise ValueError("Cluster profile output does not cover all existing clusters.")

    merged = data.merge(
        kmeans_results[["place_id", "cluster_id"]].rename(columns={"cluster_id": "kmeans_cluster"}),
        on="place_id", how="inner", validate="one_to_one",
    ).merge(
        isolation_results[["place_id", "anomaly_flag", "anomaly_score"]].rename(
            columns={"anomaly_flag": "isolation_forest_anomaly", "anomaly_score": "isolation_forest_anomaly_score"}
        ),
        on="place_id", how="inner", validate="one_to_one",
    )
    if len(merged) != EXPECTED_ROWS or not merged["place_id"].is_unique:
        raise ValueError("Place-level artifact join did not preserve exactly 1,958 unique places.")
    if merged["isolation_forest_anomaly"].isna().any() or not set(merged["isolation_forest_anomaly"].astype(int)).issubset({0, 1}):
        raise ValueError("Isolation Forest flags are missing or invalid.")

    raw_features = merged[ALL_FEATURES].apply(pd.to_numeric, errors="coerce")
    if np.isinf(raw_features.to_numpy(dtype=float)).any():
        raise ValueError("Input features contain infinite values.")
    medians = dict(zip(imputer.feature_names_in_, imputer.statistics_))
    imputed = raw_features.copy()
    missing_masks = raw_features.isna()
    for feature in ALL_FEATURES:
        imputed[feature] = imputed[feature].fillna(float(medians[feature]))
    if not np.isfinite(imputed.to_numpy(dtype=float)).all():
        raise ValueError("Median-imputed feature values are not finite.")

    feature_risk_percentiles: dict[str, np.ndarray] = {}
    for feature, spec in ACCESS_FEATURES.items():
        ascending_rank = imputed[feature].rank(method="average", pct=True, ascending=True)
        feature_risk_percentiles[feature] = (1.0 - ascending_rank if spec["favorable_high"] else ascending_rank).to_numpy(dtype=float)
    for feature in CONTEXT_FEATURES:
        feature_risk_percentiles[feature] = imputed[feature].rank(method="average", pct=True, ascending=True).to_numpy(dtype=float)

    access_matrix = np.column_stack([feature_risk_percentiles[feature] for feature in ACCESS_FEATURES])
    context_matrix = np.column_stack([feature_risk_percentiles[feature] for feature in CONTEXT_FEATURES])
    access_index = (1.0 - access_matrix.mean(axis=1)) * 100.0
    context_index = context_matrix.mean(axis=1) * 100.0
    accessibility_shortfall = 100.0 - access_index
    risk_scores = 0.5 * accessibility_shortfall + 0.5 * context_index
    if not np.isfinite(risk_scores).all() or np.any((risk_scores < 0) | (risk_scores > 100)):
        raise ValueError("Risk scores must be finite and within 0-100.")
    thresholds = natural_break_thresholds(risk_scores)
    categories = assign_categories(risk_scores, thresholds)
    if set(categories) != set(CATEGORY_ORDER):
        raise ValueError("Natural-break thresholds did not produce all three requested categories.")

    output = merged.copy()
    output["accessibility_index"] = access_index
    output["contextual_index"] = context_index
    output["risk_score"] = risk_scores
    output["risk_level"] = categories
    for feature in ALL_FEATURES:
        output[f"missing__{feature}"] = missing_masks[feature].to_numpy(dtype=bool)
    top_safety_values = []
    limited_access_values = []
    top_context_values = []
    explanations = []
    for _, row in output.iterrows():
        row_percentiles = {feature: float(values[row.name]) for feature, values in feature_risk_percentiles.items()}
        top_safety, limited_access, top_context, explanation = build_explanation(row, row_percentiles)
        top_safety_values.append(top_safety)
        limited_access_values.append(limited_access)
        top_context_values.append(top_context)
        explanations.append(explanation)
    output["top_positive_safety_factors"] = top_safety_values
    output["top_limited_access_factors"] = limited_access_values
    output["top_contextual_risk_factors"] = top_context_values
    output["explanation"] = explanations
    output = output.drop(columns=[f"missing__{feature}" for feature in ALL_FEATURES])

    contribution_rows = []
    access_weight = 0.5 / len(ACCESS_FEATURES)
    context_weight = 0.5 / len(CONTEXT_FEATURES)
    for row_index, row in merged.iterrows():
        for feature in ALL_FEATURES:
            raw_value = raw_features.iloc[row_index][feature]
            source_missing = bool(missing_masks.iloc[row_index][feature])
            used_value = float(imputed.iloc[row_index][feature])
            if feature in ACCESS_FEATURES:
                direction = "higher_is_favorable" if ACCESS_FEATURES[feature]["favorable_high"] else "lower_is_favorable"
                group = "emergency_accessibility"
                weight = access_weight
                percentile = float(feature_risk_percentiles[feature][row_index])
            elif feature in CONTEXT_FEATURES:
                direction = "higher_is_more_contextual_signal"
                group = "contextual_indicators"
                weight = context_weight
                percentile = float(feature_risk_percentiles[feature][row_index])
            else:
                direction = "not_scored_no_validated_adverse_threshold"
                group = "weather_context_only"
                weight = 0.0
                percentile = np.nan
            points = 100.0 * weight * (percentile - 0.5) if weight else 0.0
            contribution_rows.append({
                "place_id": row["place_id"],
                "place_name": row["place_name"],
                "feature": feature,
                "assessment_group": group,
                "score_direction": direction,
                "raw_value": "NOT_RECORDED" if source_missing else float(raw_value),
                "imputed_value": used_value,
                "source_missing": source_missing,
                "normalized_risk_percentile": percentile,
                "composite_weight": weight,
                "weighted_score_contribution_points": points,
            })
    contributions = pd.DataFrame(contribution_rows)
    contribution_sums = contributions.groupby("place_id")["weighted_score_contribution_points"].sum().reindex(output["place_id"]).to_numpy()
    if not np.allclose(50.0 + contribution_sums, risk_scores, rtol=0, atol=1e-9):
        raise AssertionError("Per-feature contributions do not reproduce the final risk score.")

    thresholds_report = pd.DataFrame([
        {"category": "LOW RISK", "lower_bound_inclusive": float(risk_scores.min()), "upper_bound_inclusive": thresholds[0]},
        {"category": "MODERATE RISK", "lower_bound_inclusive": thresholds[0], "upper_bound_inclusive": thresholds[1]},
        {"category": "HIGH RISK", "lower_bound_inclusive": thresholds[1], "upper_bound_inclusive": float(risk_scores.max())},
    ])
    output["risk_score"] = output["risk_score"].round(6)
    output["accessibility_index"] = output["accessibility_index"].round(6)
    output["contextual_index"] = output["contextual_index"].round(6)

    cluster_rows = []
    for cluster_id in sorted(EXPECTED_CLUSTERS):
        cluster_mask = merged["kmeans_cluster"].astype(int).to_numpy() == cluster_id
        cluster_mean_score = float(risk_scores[cluster_mask].mean())
        cluster_category = str(assign_categories(np.array([cluster_mean_score]), thresholds)[0])
        cluster_profiles = profiles.loc[profiles["cluster_id"].astype(int) == cluster_id]
        expected_profile_size = int(cluster_profiles["cluster_size"].iloc[0])
        if expected_profile_size != int(cluster_mask.sum()):
            raise ValueError(f"Cluster {cluster_id} profile size does not match saved assignments.")
        cluster_access = float(access_index[cluster_mask].mean())
        cluster_context = float(context_index[cluster_mask].mean())
        cluster_anomalies = int(merged.loc[cluster_mask, "isolation_forest_anomaly"].sum())
        cluster_rows.append({
            "kmeans_cluster": cluster_id,
            "places": int(cluster_mask.sum()),
            "mean_risk_score": cluster_mean_score,
            "median_risk_score": float(np.median(risk_scores[cluster_mask])),
            "cluster_mean_score_band_only": cluster_category,
            "mean_accessibility_index": cluster_access,
            "mean_contextual_index": cluster_context,
            "isolation_forest_anomalies": cluster_anomalies,
            "anomaly_percent": 100.0 * cluster_anomalies / int(cluster_mask.sum()),
            "profile_interpretation": cluster_profile_reason(
                cluster_id, profiles, cluster_access, cluster_context, cluster_mean_score, cluster_category
            ),
        })
    cluster_mapping = pd.DataFrame(cluster_rows)

    summary_rows = []
    for category in CATEGORY_ORDER:
        mask = categories == category
        count = int(mask.sum())
        category_rows = merged.loc[mask]
        row = {
            "risk_level": category,
            "places": count,
            "percent": 100.0 * count / EXPECTED_ROWS,
            "risk_score_min": float(risk_scores[mask].min()),
            "risk_score_max": float(risk_scores[mask].max()),
            "risk_score_mean": float(risk_scores[mask].mean()),
            "risk_score_median": float(np.median(risk_scores[mask])),
            "mean_accessibility_index": float(access_index[mask].mean()),
            "mean_contextual_index": float(context_index[mask].mean()),
            "isolation_forest_anomalies": int(category_rows["isolation_forest_anomaly"].sum()),
            "isolation_forest_anomaly_percent": 100.0 * float(category_rows["isolation_forest_anomaly"].mean()),
        }
        for cluster_id in sorted(EXPECTED_CLUSTERS):
            row[f"kmeans_cluster_{cluster_id}_places"] = int((category_rows["kmeans_cluster"].astype(int) == cluster_id).sum())
        for feature in SCORED_FEATURES:
            observed = pd.to_numeric(category_rows[feature], errors="coerce").dropna()
            row[f"{feature}_median"] = float(observed.median()) if not observed.empty else "NOT_RECORDED"
        summary_rows.append(row)
    category_summary = pd.DataFrame(summary_rows)

    example_indices = []
    for category in CATEGORY_ORDER:
        selected = np.flatnonzero(categories == category)
        if len(selected) < 5:
            raise ValueError(f"Category {category} has fewer than five places for the representative-case check.")
        median_score = float(np.median(risk_scores[selected]))
        ranked = sorted(selected.tolist(), key=lambda index: (abs(float(risk_scores[index]) - median_score), str(merged.iloc[index]["place_id"])))
        example_indices.extend(ranked[:5])
    examples = output.iloc[example_indices][[
        "place_name", "district", "risk_score", "risk_level", "kmeans_cluster",
        "top_positive_safety_factors", "top_limited_access_factors", "top_contextual_risk_factors", "explanation",
    ]].copy()

    required_output_fields = {
        "place_id", "place_name", "district", "latitude", "longitude", "kmeans_cluster",
        "isolation_forest_anomaly", "risk_score", "risk_level", "top_positive_safety_factors",
        "top_limited_access_factors", "top_contextual_risk_factors", "explanation",
    }
    if not required_output_fields.issubset(output.columns):
        raise AssertionError(f"Final output is missing required columns: {sorted(required_output_fields - set(output.columns))}")
    if len(output) != EXPECTED_ROWS or output["place_id"].isna().any() or output["place_id"].duplicated().any():
        raise AssertionError("Final assessment must contain exactly 1,958 unique place IDs.")
    if output["risk_level"].isna().any() or set(output["risk_level"]) != set(CATEGORY_ORDER):
        raise AssertionError("Final risk categories are missing or invalid.")
    if output["risk_score"].isna().any() or not np.isfinite(output["risk_score"].to_numpy(dtype=float)).all():
        raise AssertionError("Final risk scores are missing or non-finite.")
    if output[["top_positive_safety_factors", "top_limited_access_factors", "top_contextual_risk_factors", "explanation"]].isna().any().any():
        raise AssertionError("Every place must have non-missing factor summaries and an explanation.")
    if int(category_summary["places"].sum()) != EXPECTED_ROWS:
        raise AssertionError("Risk category summary does not cover all source places.")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output.to_csv(OUTPUT_DIR / "final_tourist_risk_assessment.csv", index=False, na_rep="NOT_RECORDED", float_format="%.6f", encoding="utf-8")
    save_json_records(output, OUTPUT_DIR / "final_tourist_risk_assessment.json")
    contributions.to_csv(OUTPUT_DIR / "risk_score_feature_contributions.csv", index=False, na_rep="NOT_RECORDED", float_format="%.8f", encoding="utf-8")
    category_summary.to_csv(OUTPUT_DIR / "risk_category_summary.csv", index=False, na_rep="NOT_RECORDED", float_format="%.6f", encoding="utf-8")
    cluster_mapping.to_csv(OUTPUT_DIR / "cluster_to_risk_mapping.csv", index=False, na_rep="NOT_RECORDED", float_format="%.6f", encoding="utf-8")
    examples.to_csv(OUTPUT_DIR / "representative_sanity_examples.csv", index=False, na_rep="NOT_RECORDED", float_format="%.6f", encoding="utf-8")

    report_lines = [
        "# SAFEYATRI Final Evidence-Based Risk Assessment", "",
        '"This is an evidence-based, explainable risk assessment derived from available contextual, environmental, and emergency-accessibility data. It is not a ground-truth tourist safety label because the dataset does not contain verified place-level Safe/Unsafe labels."', "",
        "## Scope and target interpretation", "",
        f"- Source population: {len(data):,} tourist places; one final record per unique `place_id`.",
        f"- Existing K-Means K=5 assignment and Isolation Forest flag are joined by `place_id`; neither unsupervised model was retrained.",
        f"- The existing supervised models were trained to reproduce K-Means membership. Logistic Regression accuracy was {float(supervised_comparison.loc[supervised_comparison['model'] == 'logistic_regression', 'accuracy'].iloc[0]):.3%} for reproducing that cluster structure, NOT for predicting actual tourist safety.",
        "- K-Means clusters are unsupervised patterns, not safety labels. Cluster IDs are used only to describe group structure and compare distributions; they are not direct inputs to the score or individual category assignment.",
        "- This assessment is an unvalidated evidence index. LOW RISK / MODERATE RISK / HIGH RISK are score bands, not verified outcomes or incident probabilities.", "",
        "## Score methodology", "",
        "The 0-100 index is the equal-weight mean of emergency-accessibility shortfall (50%) and contextual indicators (50%). Accessibility shortfall is 100 minus the accessibility index, so less favorable access raises the score. Equal domain weighting is an explicit transparent design choice, not a fit to ground-truth labels.",
        "Each scored feature is converted to its empirical percentile rank across the 1,958 places. For distance features, larger values increase the adverse score; for facility counts, larger values reduce it. Higher district crime, road-accident, and historical-disaster counts increase the contextual index. Each feature has equal weight within its domain.",
        "The score uses nine accessibility features and three contextual features. The four station-level mean weather features remain in the source/output and are described in cluster profiles, but are not assigned a risk direction or weight: annual station means have no validated adverse-weather threshold here, and unusual climate averages do not by themselves indicate a hazard.",
        "The saved K-Means preprocessing pipeline supplies the existing median imputation values. A missing contextual value is replaced by its existing training median; missingness indicators are not scored, and missingness alone never adds risk points. Feature-contribution output records observed missingness for transparency.",
        "The per-feature point contribution is centered on the cohort midpoint; `50 + sum(contributions)` exactly reproduces the score. A high access index means relatively favorable recorded geographic access; a high contextual index means higher-ranked contextual values, not place-specific incidents.", "",
        "## Reproducible category thresholds", "",
        "Thresholds use three contiguous natural-break bands: the two cuts minimize total within-band squared deviation of the complete risk-score distribution. This is a deterministic minimum-within-class-variance segmentation, not a balanced split and not a threshold learned from safety outcomes. Equal-score ties are kept together; each band must contain at least five places to support the requested representative-case check.",
        f"- Score range: {risk_scores.min():.6f} to {risk_scores.max():.6f}.",
        f"- LOW RISK: score <= {thresholds[0]:.6f}.",
        f"- MODERATE RISK: {thresholds[0]:.6f} < score <= {thresholds[1]:.6f}.",
        f"- HIGH RISK: score > {thresholds[1]:.6f}.", "",
        markdown_table(category_summary[["risk_level", "places", "percent", "risk_score_min", "risk_score_max", "risk_score_mean", "risk_score_median", "mean_accessibility_index", "mean_contextual_index", "isolation_forest_anomalies", "isolation_forest_anomaly_percent"]].round(4)), "",
        "## Cluster profile interpretation", "",
        "The existing profiles show tradeoffs rather than five intrinsic risk classes. Cluster 0 has longer median distances to hospitals, PHCs, and fire/rescue than overall, while its crime-context median is lower than overall and its road-accident median is higher. Cluster 1 is broadly closer to overall medians, with weaker police access and middling context. Cluster 2 has longer police/fire distances but relatively shorter median hospital/PHC distances; its crime and road-accident context fields have no observed values in the original cluster profile, so those score inputs are median-imputed. Cluster 3 has especially dense nearby police, hospital, and PHC counts and short distances, alongside higher road-accident context. Cluster 4 has dense emergency-facility coverage but a much higher district crime median and historical-disaster count, alongside lower road-accident context. These mixed patterns are why no cluster ID is directly renamed as a risk level.",
        "The following cluster-band value is only the band containing the cluster mean of the separately computed place scores. It is not a label for every place in that cluster.", "",
        markdown_table(cluster_mapping[["kmeans_cluster", "places", "mean_risk_score", "median_risk_score", "cluster_mean_score_band_only", "mean_accessibility_index", "mean_contextual_index", "isolation_forest_anomalies", "anomaly_percent"]].round(4)), "",
        "### Per-cluster rationale", "",
    ]
    for row in cluster_mapping.itertuples(index=False):
        report_lines.append(f"- **Cluster {row.kmeans_cluster}**: {row.profile_interpretation}")
    report_lines.extend([
        "",
        "## Representative-case sanity check", "",
        "Five places nearest the within-band median score are shown for each category. These are representative score cases, not claimed safety outcomes. Review their actual favorable and limited-access signals and contextual contributions in `representative_sanity_examples.csv` and the detailed per-place contribution file.", "",
        markdown_table(examples[["place_name", "district", "risk_score", "risk_level", "kmeans_cluster", "top_positive_safety_factors", "top_limited_access_factors", "top_contextual_risk_factors"]].round(4)), "",
        "The cases are generated by a deterministic nearest-to-band-median rule. Their explanations use observed values only; missing contextual values are disclosed and do not appear as high-risk factors.", "",
        "## Comparisons and interpretation", "",
        "`risk_category_summary.csv` compares category counts, score distributions, component indices, Isolation Forest anomaly prevalence, K-Means cluster counts, and medians for all scored source features. Anomaly flags are comparison metadata only and never add to the score or determine a category.",
        "Weather summaries are retained in the main output but not scored. Emergency-facility distances/counts indicate mapped geographic proximity only; they do not establish facility quality, availability, operating hours, or response time.", "",
        "## Scientific limitations", "",
        "- This is an evidence-based, explainable risk assessment derived from available contextual, environmental, and emergency-accessibility data. It is not a ground-truth tourist safety label because the dataset does not contain verified place-level Safe/Unsafe labels.",
        "- K-Means clusters are unsupervised patterns. Supervised models were trained to reproduce those cluster assignments. The 99.745% Logistic Regression accuracy refers to reproducing K-Means cluster membership, NOT predicting actual tourist safety.",
        "- District crime and accident values are contextual, not place-specific incident data. Missing district joins are median-imputed and missingness itself is not interpreted as risk.",
        "- Emergency-facility proximity does not prove service quality, availability, operating hours, or response time.",
        "- Weather is based on nearby available stations and annual summary values, not place-level or real-time conditions; it is not scored without validated hazard thresholds.",
        "- Historical disaster records represent historical district context and do not guarantee future events at a tourist place.",
        "- The score weights and natural-break bands are transparent descriptive choices without calibration to observed harm outcomes. They must not be represented as actual safety predictions, incident probabilities, or visitor guidance by themselves.", "",
        "## Reproducibility and validation", "",
        f"- Fixed random state reference: {RANDOM_STATE}; this scoring and threshold procedure itself is deterministic and uses no randomness.",
        f"- Python `{platform.python_version()}`, pandas `{pd.__version__}`, NumPy `{np.__version__}`, scikit-learn `{sklearn.__version__}`, joblib `{joblib.__version__}`.",
        "- The existing K-Means, preprocessing, and Isolation Forest artifacts were loaded only; no models were fit or modified.",
        "- Input source hashes were captured before and after output generation and verified unchanged.",
        "- Validation requires 1,958 unique places, finite scores, exactly the three specified categories, valid cluster/anomaly IDs, contribution sums reproducing each score, and reloadable CSV/JSON outputs.", "",
        "## Output files", "",
        *[f"- `{name}`" for name in [
            "final_tourist_risk_assessment.csv", "final_tourist_risk_assessment.json",
            "FINAL_RISK_ASSESSMENT_REPORT.md", "risk_score_feature_contributions.csv",
            "risk_category_summary.csv", "cluster_to_risk_mapping.csv",
            "representative_sanity_examples.csv",
        ]],
    ])
    report_path = OUTPUT_DIR / "FINAL_RISK_ASSESSMENT_REPORT.md"
    report_path.write_text("\n".join(report_lines) + "\n", encoding="utf-8", newline="\n")

    input_hashes_after = {path.name + ":" + str(path.parent.relative_to(PROJECT_ROOT)): sha256(path) for path in SOURCE_FILES}
    if input_hashes_before != input_hashes_after:
        raise AssertionError("One or more original source/ML artifacts changed during report generation.")

    final_csv = pd.read_csv(OUTPUT_DIR / "final_tourist_risk_assessment.csv", keep_default_na=False)
    final_json = json.loads((OUTPUT_DIR / "final_tourist_risk_assessment.json").read_text(encoding="utf-8"))
    reloaded_summary = pd.read_csv(OUTPUT_DIR / "risk_category_summary.csv", keep_default_na=False)
    reloaded_mapping = pd.read_csv(OUTPUT_DIR / "cluster_to_risk_mapping.csv", keep_default_na=False)
    reloaded_contributions = pd.read_csv(OUTPUT_DIR / "risk_score_feature_contributions.csv", keep_default_na=False)
    if len(final_csv) != EXPECTED_ROWS or len(final_json) != EXPECTED_ROWS:
        raise AssertionError("Final CSV/JSON output does not contain exactly 1,958 records.")
    if final_csv["place_id"].nunique() != EXPECTED_ROWS or final_csv["risk_level"].isna().any():
        raise AssertionError("Reloaded final output has duplicate IDs or missing categories.")
    if set(final_csv["risk_level"]) != set(CATEGORY_ORDER):
        raise AssertionError("Reloaded final output contains unexpected risk labels.")
    if not np.isfinite(pd.to_numeric(final_csv["risk_score"], errors="coerce")).all():
        raise AssertionError("Reloaded risk scores are not finite.")
    if len(reloaded_summary) != 3 or len(reloaded_mapping) != 5:
        raise AssertionError("Category summary or cluster mapping is incomplete.")
    if len(reloaded_contributions) != EXPECTED_ROWS * len(ALL_FEATURES):
        raise AssertionError("Feature-contribution output has an unexpected row count.")
    if not all((OUTPUT_DIR / filename).is_file() for filename in [
        "FINAL_RISK_ASSESSMENT_REPORT.md", "final_tourist_risk_assessment.csv",
        "final_tourist_risk_assessment.json", "risk_score_feature_contributions.csv",
        "risk_category_summary.csv", "cluster_to_risk_mapping.csv",
        "representative_sanity_examples.csv",
    ]):
        raise AssertionError("One or more final output artifacts are missing.")

    print(json.dumps({
        "input_places": len(data),
        "output_places": len(final_csv),
        "risk_category_counts": {
            row.risk_level: {"count": int(row.places), "percent": round(float(row.percent), 2)}
            for row in category_summary.itertuples(index=False)
        },
        "score_range": [round(float(risk_scores.min()), 6), round(float(risk_scores.max()), 6)],
        "thresholds": {
            "low_risk_max_inclusive": round(thresholds[0], 6),
            "moderate_risk_max_inclusive": round(thresholds[1], 6),
        },
        "output_directory": OUTPUT_DIR.relative_to(PROJECT_ROOT).as_posix(),
        "validation": "PASS",
        "source_artifacts_unchanged": input_hashes_before == input_hashes_after,
    }, indent=2))


if __name__ == "__main__":
    main()
