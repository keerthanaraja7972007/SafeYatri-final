from __future__ import annotations

import json
import platform
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import sklearn
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeClassifier, export_text


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = PROJECT_ROOT / "data" / "ml" / "tourist_safety_features.csv"
KMEANS_RESULTS_PATH = PROJECT_ROOT / "ml" / "kmeans_results.csv"
OUTPUT_DIR = PROJECT_ROOT / "ml" / "supervised"
RANDOM_STATE = 42
CLASSES = np.arange(5)
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


def make_pipeline(classifier) -> Pipeline:
    return Pipeline([
        ("median_imputer", SimpleImputer(strategy="median", add_indicator=True)),
        ("standard_scaler", StandardScaler()),
        ("classifier", classifier),
    ])


def markdown_table(frame: pd.DataFrame, include_index: bool = False) -> str:
    table = frame.reset_index() if include_index else frame
    headers = [str(column) for column in table.columns]
    rows = [[str(value) for value in row] for row in table.itertuples(index=False, name=None)]
    return "| " + " | ".join(headers) + " |\n| " + " | ".join(["---"] * len(headers)) + " |\n" + "\n".join(
        "| " + " | ".join(row) + " |" for row in rows
    )


def metrics_for(y_true: np.ndarray, y_pred: np.ndarray) -> dict[str, float]:
    report = classification_report(y_true, y_pred, labels=CLASSES, output_dict=True, zero_division=0)
    return {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "macro_precision": float(report["macro avg"]["precision"]),
        "macro_recall": float(report["macro avg"]["recall"]),
        "macro_f1": float(report["macro avg"]["f1-score"]),
        "weighted_precision": float(report["weighted avg"]["precision"]),
        "weighted_recall": float(report["weighted avg"]["recall"]),
        "weighted_f1": float(report["weighted avg"]["f1-score"]),
    }


def cv_summary(pipeline: Pipeline, x_train: pd.DataFrame, y_train: pd.Series, cv: StratifiedKFold) -> dict[str, float]:
    accuracy = cross_val_score(pipeline, x_train, y_train, cv=cv, scoring="accuracy", n_jobs=-1)
    macro_f1 = cross_val_score(pipeline, x_train, y_train, cv=cv, scoring="f1_macro", n_jobs=-1)
    return {
        "cv_accuracy_mean": float(accuracy.mean()),
        "cv_accuracy_std": float(accuracy.std(ddof=1)),
        "cv_macro_f1_mean": float(macro_f1.mean()),
        "cv_macro_f1_std": float(macro_f1.std(ddof=1)),
    }


def save_confusion_matrix(name: str, y_true: np.ndarray, y_pred: np.ndarray) -> np.ndarray:
    matrix = confusion_matrix(y_true, y_pred, labels=CLASSES)
    frame = pd.DataFrame(matrix, index=CLASSES, columns=CLASSES)
    frame.index.name = "actual_cluster"
    frame.columns = [f"predicted_cluster_{cluster_id}" for cluster_id in CLASSES]
    frame.to_csv(OUTPUT_DIR / f"{name}_confusion_matrix.csv")
    return matrix


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    places = pd.read_csv(DATA_PATH)
    assignments = pd.read_csv(KMEANS_RESULTS_PATH)[["place_id", "cluster_id"]]

    assert len(places) == 1958, f"Expected 1,958 places, found {len(places)}."
    assert places["place_id"].notna().all() and places["place_id"].is_unique, "Source place_id values must be present and unique."
    assert len(assignments) == 1958, f"Expected 1,958 cluster assignments, found {len(assignments)}."
    assert assignments["place_id"].notna().all() and assignments["place_id"].is_unique, "K-Means place_id values must be present and unique."
    assert assignments["cluster_id"].notna().all(), "K-Means cluster IDs must not be missing."
    assert set(assignments["cluster_id"].astype(int).unique()) == set(CLASSES), "Expected exactly the K=5 classes 0-4."
    assert set(places["place_id"]) == set(assignments["place_id"]), "Feature rows and cluster assignments do not match by place_id."
    cluster_sizes = assignments["cluster_id"].astype(int).value_counts().sort_index()
    expected_sizes = {0: 250, 1: 741, 2: 462, 3: 140, 4: 365}
    assert cluster_sizes.to_dict() == expected_sizes, f"Unexpected cluster sizes: {cluster_sizes.to_dict()}"

    data = places.merge(assignments, on="place_id", how="inner", validate="one_to_one")
    assert len(data) == 1958 and data["place_id"].is_unique
    required = {"place_id", "place_name", *FEATURES, "cluster_id"}
    assert required.issubset(data.columns), f"Missing required columns: {sorted(required - set(data.columns))}"
    x = data[FEATURES].apply(pd.to_numeric, errors="coerce")
    y = data["cluster_id"].astype(int)
    assert x.shape == (1958, 16), f"Unexpected feature matrix shape: {x.shape}"
    assert "cluster_id" not in FEATURES and not any("anomaly" in feature.lower() for feature in FEATURES)
    assert x.notna().any(axis=0).all(), "At least one input feature is entirely missing."

    train_indices, test_indices = train_test_split(
        np.arange(len(data)), test_size=0.20, random_state=RANDOM_STATE, stratify=y
    )
    x_train, x_test = x.iloc[train_indices], x.iloc[test_indices]
    y_train, y_test = y.iloc[train_indices], y.iloc[test_indices]
    train_data, test_data = data.iloc[train_indices], data.iloc[test_indices]
    split_counts = pd.DataFrame({
        "training": y_train.value_counts().reindex(CLASSES, fill_value=0),
        "test": y_test.value_counts().reindex(CLASSES, fill_value=0),
    })
    split_counts.index.name = "cluster_id"
    split_counts.to_csv(OUTPUT_DIR / "split_class_counts.csv")
    assert len(train_indices) + len(test_indices) == 1958
    assert set(y_train.unique()) == set(CLASSES) and set(y_test.unique()) == set(CLASSES)

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
    candidate_depths = (4, 6, 8, None)
    tree_cv_rows = []
    for depth in candidate_depths:
        candidate = make_pipeline(DecisionTreeClassifier(
            random_state=RANDOM_STATE, max_depth=depth, min_samples_leaf=5
        ))
        scores = cross_val_score(candidate, x_train, y_train, cv=cv, scoring="f1_macro", n_jobs=-1)
        tree_cv_rows.append({
            "max_depth": "unrestricted" if depth is None else depth,
            "min_samples_leaf": 5,
            "macro_f1_mean": float(scores.mean()),
            "macro_f1_std": float(scores.std(ddof=1)),
        })
    tree_complexity = pd.DataFrame(tree_cv_rows)
    tree_complexity.to_csv(OUTPUT_DIR / "decision_tree_complexity_cv.csv", index=False)
    best_tree_row = max(range(len(tree_cv_rows)), key=lambda index: tree_cv_rows[index]["macro_f1_mean"])
    selected_depth_value = candidate_depths[best_tree_row]

    classifiers = {
        "logistic_regression": LogisticRegression(max_iter=2000, random_state=RANDOM_STATE),
        "decision_tree": DecisionTreeClassifier(
            random_state=RANDOM_STATE, max_depth=selected_depth_value, min_samples_leaf=5
        ),
        "random_forest": RandomForestClassifier(
            n_estimators=300, random_state=RANDOM_STATE, n_jobs=-1, class_weight="balanced_subsample"
        ),
        "gradient_boosting": GradientBoostingClassifier(
            n_estimators=100, learning_rate=0.1, max_depth=3, random_state=RANDOM_STATE
        ),
    }
    cv_results = {}
    for name, classifier in classifiers.items():
        cv_results[name] = cv_summary(make_pipeline(classifier), x_train, y_train, cv)
    cv_results["decision_tree"].update({
        "selected_max_depth": "unrestricted" if selected_depth_value is None else selected_depth_value,
        "min_samples_leaf": 5,
    })

    preprocessor = Pipeline([
        ("median_imputer", SimpleImputer(strategy="median", add_indicator=True)),
        ("standard_scaler", StandardScaler()),
    ])
    x_train_matrix = np.asarray(preprocessor.fit_transform(x_train), dtype=float)
    x_test_matrix = np.asarray(preprocessor.transform(x_test), dtype=float)
    assert np.isfinite(x_train_matrix).all() and np.isfinite(x_test_matrix).all(), "Final ML matrices contain NaN or infinity."
    feature_names = preprocessor.get_feature_names_out().tolist()
    joblib.dump(preprocessor, OUTPUT_DIR / "preprocessing_pipeline.joblib")

    comparison_rows = []
    importance = pd.DataFrame({"feature": feature_names})
    coefficient_rows = []
    result_files = []
    confusion_matrices = {}
    fitted_models = {}

    for name, classifier in classifiers.items():
        classifier.fit(x_train_matrix, y_train)
        fitted_models[name] = classifier
        predictions = classifier.predict(x_test_matrix).astype(int)
        probabilities = classifier.predict_proba(x_test_matrix)
        assert set(np.unique(predictions)).issubset(set(CLASSES)), f"{name} predicted an unexpected cluster ID."
        assert probabilities.shape == (len(test_data), len(CLASSES)) and np.isfinite(probabilities).all()
        assert np.allclose(probabilities.sum(axis=1), 1.0, atol=1e-8)

        test_metrics = metrics_for(y_test.to_numpy(), predictions)
        cv_metrics = cv_results[name]
        comparison_rows.append({
            "model": name,
            **test_metrics,
            **cv_metrics,
            "tree_depth": int(classifier.get_depth()) if name == "decision_tree" else None,
            "tree_leaves": int(classifier.get_n_leaves()) if name == "decision_tree" else None,
        })
        result = test_data[["place_id", "place_name"]].copy().reset_index(drop=True)
        result["actual_cluster"] = y_test.to_numpy()
        result["predicted_cluster"] = predictions
        for class_index, cluster_id in enumerate(CLASSES):
            result[f"probability_cluster_{cluster_id}"] = probabilities[:, class_index]
        result_path = OUTPUT_DIR / f"{name}_results.csv"
        result.to_csv(result_path, index=False)
        result_files.append(result_path)
        confusion_matrices[name] = save_confusion_matrix(name, y_test.to_numpy(), predictions)
        joblib.dump(classifier, OUTPUT_DIR / f"{name}_model.joblib")

        if name == "logistic_regression":
            coefficients = classifier.coef_
            importance["logistic_regression_mean_abs_coefficient"] = np.abs(coefficients).mean(axis=0)
            importance["logistic_regression_max_abs_coefficient"] = np.abs(coefficients).max(axis=0)
            for class_index, cluster_id in enumerate(classifier.classes_):
                for feature, value in zip(feature_names, coefficients[class_index]):
                    coefficient_rows.append({
                        "feature": feature,
                        "cluster_class": int(cluster_id),
                        "coefficient": float(value),
                        "absolute_coefficient": float(abs(value)),
                    })
        else:
            importance[f"{name}_importance"] = classifier.feature_importances_

    joblib.dump(fitted_models["logistic_regression"], OUTPUT_DIR / "logistic_regression_model.joblib")
    importance.to_csv(OUTPUT_DIR / "feature_importance_comparison.csv", index=False)
    pd.DataFrame(coefficient_rows).to_csv(OUTPUT_DIR / "logistic_regression_class_coefficients.csv", index=False)
    comparison = pd.DataFrame(comparison_rows).sort_values("macro_f1", ascending=False)
    comparison.to_csv(OUTPUT_DIR / "model_comparison.csv", index=False)
    cv_payload = {
        name: {key: (value.item() if isinstance(value, np.generic) else value) for key, value in metrics.items()}
        for name, metrics in cv_results.items()
    }
    (OUTPUT_DIR / "cross_validation_results.json").write_text(json.dumps(cv_payload, indent=2) + "\n", encoding="utf-8")
    (OUTPUT_DIR / "decision_tree_rules.txt").write_text(
        export_text(fitted_models["decision_tree"], feature_names=feature_names) + "\n", encoding="utf-8"
    )

    assert int(split_counts["training"].sum()) == len(train_indices)
    assert int(split_counts["test"].sum()) == len(test_indices)
    assert all(matrix.shape == (5, 5) and int(matrix.sum()) == len(test_indices) for matrix in confusion_matrices.values())
    for path in result_files:
        reloaded = pd.read_csv(path)
        assert len(reloaded) == len(test_indices) and reloaded["place_id"].is_unique
        assert reloaded[["actual_cluster", "predicted_cluster"]].isin(CLASSES).all().all()
    assert len(pd.read_csv(OUTPUT_DIR / "feature_importance_comparison.csv")) == len(feature_names)
    assert pd.read_csv(OUTPUT_DIR / "model_comparison.csv").shape[0] == 4
    assert joblib.load(OUTPUT_DIR / "preprocessing_pipeline.joblib") is not None
    for name in classifiers:
        assert joblib.load(OUTPUT_DIR / f"{name}_model.joblib") is not None

    top_features = {}
    for column in [
        "logistic_regression_mean_abs_coefficient", "decision_tree_importance",
        "random_forest_importance", "gradient_boosting_importance",
    ]:
        top = importance.nlargest(5, column)[["feature", column]]
        top_features[column] = [
            {"feature": row.feature, "importance": float(getattr(row, column))}
            for row in top.itertuples(index=False)
        ]
    best_model = comparison.iloc[0]
    report_lines = [
        "# Supervised Cluster-Membership Classification", "",
        "## Scientific interpretation", "",
        "The target variable is K-Means cluster membership and is not an authentic Safe/Unsafe ground-truth label.", "",
        "This stage tests whether supervised classifiers can reproduce the structure discovered by the existing K-Means model. Cluster IDs remain neutral identifiers and are not translated into safety or risk levels.", "",
        "## Dataset and split", "",
        "- 1,958 tourist places joined to the existing K=5 output using `place_id`; no clustering model was refit.",
        "- 16 numerical/context input features; target: `cluster_id`, with five K-Means-derived pseudo-target classes.",
        f"- Training: {len(train_indices)} places; test: {len(test_indices)} places (80/20 stratified split, `random_state=42`).",
        "- Exact class counts (the source cluster sizes are verified above):", "",
        markdown_table(split_counts, include_index=True), "",
        "## Preprocessing and leakage controls", "",
        "- Median imputation with missingness indicators, followed by `StandardScaler`.",
        "- The final preprocessing pipeline is fit only on the training partition, then applied unchanged to the held-out test partition.",
        "- Cross-validation uses 5-fold `StratifiedKFold(shuffle=True, random_state=42)` on training rows only; each fold fits its own imputer and scaler through a pipeline.",
        "- `place_id`, names, district, category, source URL, cluster output, anomaly output, and all other non-selected fields are excluded as predictors.",
        "- The decision-tree depth candidates (4, 6, 8, unrestricted; `min_samples_leaf=5`) were compared using training-only stratified CV; the held-out test set did not select parameters.", "",
        "## Results", "",
        "All test metrics describe reproduction of the K-Means-derived cluster membership target, not actual safety.", "",
        markdown_table(comparison[["model", "accuracy", "macro_precision", "macro_recall", "macro_f1", "weighted_precision", "weighted_recall", "weighted_f1"]].round(4)), "",
        f"Best by held-out macro F1: **{best_model['model']}** ({best_model['macro_f1']:.4f}). This criterion gives each cluster equal weight despite class imbalance.", "",
        f"Decision Tree fitted depth: {fitted_models['decision_tree'].get_depth()}; leaves: {fitted_models['decision_tree'].get_n_leaves()}. Selected `max_depth`: {cv_results['decision_tree']['selected_max_depth']}; `min_samples_leaf=5`.", "",
        "### Cross-validation", "",
        "Five-fold scores are computed using training data only; values below are mean and sample standard deviation across folds.", "",
        markdown_table(pd.DataFrame([
            {"model": name, **{key: values[key] for key in ("cv_accuracy_mean", "cv_accuracy_std", "cv_macro_f1_mean", "cv_macro_f1_std")}}
            for name, values in cv_results.items()
        ]).round(4)), "",
    ]
    for name, matrix in confusion_matrices.items():
        report_lines.extend([
            f"### {name.replace('_', ' ').title()} confusion matrix", "",
            "Rows are actual cluster IDs; columns are predicted cluster IDs in ascending order.", "",
            markdown_table(pd.DataFrame(matrix, index=CLASSES, columns=CLASSES).rename_axis("actual_cluster"), include_index=True), "",
        ])
    report_lines.extend([
        "## Feature interpretation", "",
        "Logistic Regression importance is the mean absolute coefficient across its five class-specific coefficient vectors (with the maximum also retained in the CSV); signed per-class coefficients are in `logistic_regression_class_coefficients.csv`. Tree-based importances are impurity-based feature importances. These indicate contribution to predicting cluster membership and do not establish causal relationships with danger or safety.", "",
    ])
    for method, features in top_features.items():
        report_lines.append(f"- Top features for `{method}`: " + ", ".join(f"`{item['feature']}` ({item['importance']:.4f})" for item in features) + ".")
    report_lines.extend([
        "- Full consolidated values are in `feature_importance_comparison.csv`; missingness indicators are named explicitly where generated.", "",
        "## Limitations", "",
        "- K-Means clusters are derived patterns, not ground-truth safety labels.",
        "- High classification accuracy means the supervised model can reproduce K-Means structure; it does NOT prove that the tourist place is safe or unsafe.",
        "- District-level crime/accident data is contextual, not place-specific incident data.",
        "- Weather features are based on nearby available stations.",
        "- Emergency-facility proximity does not establish facility quality, availability, or response time.",
        "- The models should not be presented as predicting actual tourist safety until an appropriate validated target is available.", "",
        "## Reproducibility and artifacts", "",
        f"- Python `{platform.python_version()}`, pandas `{pd.__version__}`, NumPy `{np.__version__}`, scikit-learn `{sklearn.__version__}`, joblib `{joblib.__version__}`.",
        "- Random state is 42 for the split, all estimators, and CV fold shuffling. The split and source cluster-size checks are deterministic.",
        "- Prediction outputs contain only test-set rows, with `place_id`, `place_name`, actual/predicted cluster IDs, and class probabilities.",
        "- See the adjacent CSV, JSON, text, and joblib files for row-level predictions, metrics, confusion matrices, coefficients/importances, fitted models, and preprocessing.",
    ])
    (OUTPUT_DIR / "SUPERVISED_ML_REPORT.md").write_text("\n".join(report_lines) + "\n", encoding="utf-8")

    print(json.dumps({
        "rows": len(data),
        "features": len(FEATURES),
        "training_samples": len(train_indices),
        "test_samples": len(test_indices),
        "training_counts": split_counts["training"].astype(int).to_dict(),
        "test_counts": split_counts["test"].astype(int).to_dict(),
        "cluster_sizes": cluster_sizes.astype(int).to_dict(),
        "models": comparison[["model", "accuracy", "macro_precision", "macro_recall", "macro_f1", "weighted_f1"]].to_dict(orient="records"),
        "best_by_macro_f1": str(best_model["model"]),
        "cross_validation": cv_payload,
        "output_dir": OUTPUT_DIR.relative_to(PROJECT_ROOT).as_posix(),
        "validation": "PASS",
    }, indent=2, default=lambda value: int(value) if isinstance(value, np.integer) else float(value)))


if __name__ == "__main__":
    main()
