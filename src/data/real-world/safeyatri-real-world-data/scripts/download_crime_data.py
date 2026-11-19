"""
SAFEYATRI - Real-World Crime and Safety Records Acquisition Module
Author: Senior Python Data Engineer / Data Acquisition Specialist
Target: Tamil Nadu Statewide & District-wise Crime Records
Sources: Tamil Nadu State Police (CCTNS / SCRB) via OpenCity / Official Reports
"""

import os
import sys
import json
import logging
import requests
import pandas as pd
from datetime import datetime

# Setup paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_CRIME_DIR = os.path.join(BASE_DIR, "raw", "crime")
SOURCE_FILES_DIR = os.path.join(BASE_DIR, "source_files")
LOGS_DIR = os.path.join(BASE_DIR, "logs")
METADATA_DIR = os.path.join(BASE_DIR, "metadata")

os.makedirs(RAW_CRIME_DIR, exist_ok=True)
os.makedirs(SOURCE_FILES_DIR, exist_ok=True)
os.makedirs(LOGS_DIR, exist_ok=True)
os.makedirs(METADATA_DIR, exist_ok=True)

# Setup logging
log_file = os.path.join(LOGS_DIR, "crime_data_acquisition.log")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(log_file, encoding="utf-8"),
        logging.StreamHandler(sys.stdout)
    ]
)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
}

# Real-world authentic official Tamil Nadu crime datasets
CRIME_DATASETS = [
    # 2023 State Police CCTNS Releases
    {
        "id": "tn_crime_2023_total_complaints",
        "title": "Tamil Nadu District-wise Total Complaints Registered (IPC & SLL) - 2023",
        "filename": "tn_district_total_complaints_2023.csv",
        "url": "https://data.opencity.in/dataset/178dac25-3381-4fd3-8793-66b77ffd549a/resource/a3182369-525a-4b77-8c53-0473f8ffcb09/download/tn_2023_total_complaints.csv",
        "format": "CSV",
        "reporting_period": "2023",
        "source": "Tamil Nadu State Police / CCTNS via OpenCity",
        "geographic_coverage": "All 38 Districts & Police Commissionerates of Tamil Nadu",
        "is_tabular": True
    },
    {
        "id": "tn_crime_2021_2023_totals",
        "title": "Tamil Nadu District-wise Total Complaints (IPC & SLL) - 2021 to 2023",
        "filename": "tn_district_complaints_ipc_sll_2021_2023.csv",
        "url": "https://data.opencity.in/dataset/178dac25-3381-4fd3-8793-66b77ffd549a/resource/899d2a98-20fc-4627-b202-a04a5aef387e/download/tn_2023_ipc_sll_2021_23_totals.csv",
        "format": "CSV",
        "reporting_period": "2021-2023",
        "source": "Tamil Nadu State Police / CCTNS via OpenCity",
        "geographic_coverage": "All 38 Districts & Police Commissionerates of Tamil Nadu",
        "is_tabular": True
    },
    {
        "id": "tn_crime_2023_murder_homicide_negligence",
        "title": "Tamil Nadu District-wise Cases of Murder, Homicide and Negligence Causing Deaths - 2023",
        "filename": "tn_district_murder_homicide_negligence_2023.csv",
        "url": "https://data.opencity.in/dataset/178dac25-3381-4fd3-8793-66b77ffd549a/resource/155446ea-d156-4738-908c-30b1bba80234/download/tn_2023_muder_homicide_negligence.csv",
        "format": "CSV",
        "reporting_period": "2023",
        "source": "Tamil Nadu State Police / CCTNS via OpenCity",
        "geographic_coverage": "All 38 Districts & Police Commissionerates of Tamil Nadu",
        "is_tabular": True
    },
    {
        "id": "tn_crime_2023_road_accidents",
        "title": "Tamil Nadu District-wise Cases and Deaths by Road and Other Accidents - 2023",
        "filename": "tn_district_road_accidents_2023.csv",
        "url": "https://data.opencity.in/dataset/178dac25-3381-4fd3-8793-66b77ffd549a/resource/592526f1-9412-4916-9198-74acf9d76c77/download/tn_2023_road_accidents.csv",
        "format": "CSV",
        "reporting_period": "2023",
        "source": "Tamil Nadu State Police / CCTNS via OpenCity",
        "geographic_coverage": "All 38 Districts & Police Commissionerates of Tamil Nadu",
        "is_tabular": True
    },
    {
        "id": "tn_crime_2023_crimes_against_women",
        "title": "Tamil Nadu District-wise Crimes Against Women - 2023",
        "filename": "tn_district_crimes_against_women_2023.csv",
        "url": "https://data.opencity.in/dataset/178dac25-3381-4fd3-8793-66b77ffd549a/resource/65ec76d5-44dc-4b69-ade3-95c2f9b4b813/download/tn_2023_crimes_against_women.csv",
        "format": "CSV",
        "reporting_period": "2023",
        "source": "Tamil Nadu State Police / CCTNS via OpenCity",
        "geographic_coverage": "All 38 Districts & Police Commissionerates of Tamil Nadu",
        "is_tabular": True
    },
    {
        "id": "tn_crime_2023_suicides",
        "title": "Tamil Nadu District-wise Suicide Deaths - 2023",
        "filename": "tn_district_suicides_2023.csv",
        "url": "https://data.opencity.in/dataset/178dac25-3381-4fd3-8793-66b77ffd549a/resource/d8aa90b6-7e32-4e4b-bf43-e913cf20a019/download/tn_2023_suicides.csv",
        "format": "CSV",
        "reporting_period": "2023",
        "source": "Tamil Nadu State Police / CCTNS via OpenCity",
        "geographic_coverage": "All 38 Districts & Police Commissionerates of Tamil Nadu",
        "is_tabular": True
    },
    # 2019-2021 Detailed Crime Tables
    {
        "id": "tn_crime_2019_2021_ipc_crimes",
        "title": "Tamil Nadu District and Citywise IPC Crimes - 2019 to 2021",
        "filename": "tn_district_citywise_ipc_crimes_2019_2021.csv",
        "url": "https://data.opencity.in/dataset/1ae54d8f-6cbd-4cda-9021-d46314f2b17c/resource/2a6b9737-9ddb-4393-a3f5-db9a770014ff/download/8e47b896-53f4-4e9e-bda7-f23b7dbe23f2.csv",
        "format": "CSV",
        "reporting_period": "2019-2021",
        "source": "Tamil Nadu State Police / SCRB via OpenCity",
        "geographic_coverage": "All Tamil Nadu Districts and Cities",
        "is_tabular": True
    },
    {
        "id": "tn_crime_2021_total_complaints",
        "title": "Tamil Nadu District and Citywise Total Complaints - 2021",
        "filename": "tn_district_citywise_total_complaints_2021.csv",
        "url": "https://data.opencity.in/dataset/1ae54d8f-6cbd-4cda-9021-d46314f2b17c/resource/742ba1d4-7e33-48f6-b417-f8bbc24ea33f/download/7c1dfb74-70a9-45a3-939b-1f5bf949c10a.csv",
        "format": "CSV",
        "reporting_period": "2021",
        "source": "Tamil Nadu State Police / SCRB via OpenCity",
        "geographic_coverage": "All Tamil Nadu Districts and Cities",
        "is_tabular": True
    },
    {
        "id": "tn_crime_theft_and_robbery",
        "title": "Tamil Nadu District and Citywise Total Theft and Robbery Cases",
        "filename": "tn_district_theft_and_robbery_cases.csv",
        "url": "https://data.opencity.in/dataset/1ae54d8f-6cbd-4cda-9021-d46314f2b17c/resource/d342a54b-9e23-4d32-b435-86bff65dbc2a/download/b770d6df-25a7-4053-8b70-3484e4b9c79a.csv",
        "format": "CSV",
        "reporting_period": "2019-2021",
        "source": "Tamil Nadu State Police / SCRB via OpenCity",
        "geographic_coverage": "All Tamil Nadu Districts and Cities",
        "is_tabular": True
    },
    {
        "id": "tn_crime_sexual_harassment_2021",
        "title": "Tamil Nadu District and Citywise Sexual Harassment Cases Data - 2021",
        "filename": "tn_district_sexual_harassment_2021.csv",
        "url": "https://data.opencity.in/dataset/1ae54d8f-6cbd-4cda-9021-d46314f2b17c/resource/d33de71f-2a48-4a39-8de1-d54717515737/download/f3a241ff-63be-41e7-9110-7d4475214bb1.csv",
        "format": "CSV",
        "reporting_period": "2021",
        "source": "Tamil Nadu State Police / SCRB via OpenCity",
        "geographic_coverage": "All Tamil Nadu Districts and Cities",
        "is_tabular": True
    },
    {
        "id": "tn_crime_deaths_crime_negligence",
        "title": "Tamil Nadu District and Citywise Deaths due to Crime and Negligence",
        "filename": "tn_district_deaths_crime_negligence.csv",
        "url": "https://data.opencity.in/dataset/1ae54d8f-6cbd-4cda-9021-d46314f2b17c/resource/4e55bc7c-7d4c-4241-a854-8df6458beda0/download/9e487b59-d50e-462f-b0c9-bfe7fde85ff3.csv",
        "format": "CSV",
        "reporting_period": "2019-2021",
        "source": "Tamil Nadu State Police / SCRB via OpenCity",
        "geographic_coverage": "All Tamil Nadu Districts and Cities",
        "is_tabular": True
    },
    {
        "id": "tn_crime_road_accident_deaths_2019_2021",
        "title": "Tamil Nadu District and Citywise Road Accident Deaths in 2019 to 2021",
        "filename": "tn_district_road_accident_deaths_2019_2021.csv",
        "url": "https://data.opencity.in/dataset/1ae54d8f-6cbd-4cda-9021-d46314f2b17c/resource/7c5ba9d8-955b-4ffd-96af-45f352e223bc/download/67aec008-462b-40af-9373-4e02c9570f4a.csv",
        "format": "CSV",
        "reporting_period": "2019-2021",
        "source": "Tamil Nadu State Police / SCRB via OpenCity",
        "geographic_coverage": "All Tamil Nadu Districts and Cities",
        "is_tabular": True
    },
    # Official Government Reports (PDFs)
    {
        "id": "tn_crime_review_compendium_2023_pdf",
        "title": "Tamil Nadu Crime Review Compendium 2023 (Official State Police Publication)",
        "filename": "tn_crime_review_compendium_2023.pdf",
        "url": "https://data.opencity.in/dataset/178dac25-3381-4fd3-8793-66b77ffd549a/resource/59e69ea1-b129-4857-a79d-a40fbcacd2ed/download/tn_cr_compendium_2023.pdf",
        "format": "PDF",
        "reporting_period": "2023",
        "source": "Tamil Nadu State Police (Official Compendium)",
        "geographic_coverage": "Statewide Tamil Nadu",
        "is_tabular": False
    },
    {
        "id": "tn_crime_statistics_2023_pdf",
        "title": "Tamil Nadu Crime Statistics 2023 (Official Annual Release)",
        "filename": "tn_crime_statistics_2023.pdf",
        "url": "https://data.opencity.in/dataset/178dac25-3381-4fd3-8793-66b77ffd549a/resource/af64a5fb-296c-4729-b591-846757d2be8a/download/tn_cr_statistics_2023.pdf",
        "format": "PDF",
        "reporting_period": "2023",
        "source": "Tamil Nadu State Police (Official Statistics)",
        "geographic_coverage": "Statewide Tamil Nadu",
        "is_tabular": False
    },
    {
        "id": "tn_crime_statistics_report_2021_pdf",
        "title": "Tamil Nadu Crime Statistics Report 2021 (Official Police Publication)",
        "filename": "tn_crime_statistics_report_2021.pdf",
        "url": "https://data.opencity.in/dataset/1ae54d8f-6cbd-4cda-9021-d46314f2b17c/resource/ebdff980-5111-4205-b900-27904a1c3e48/download/bc01883a-c56f-433e-ba09-19b7b57f940b.pdf",
        "format": "PDF",
        "reporting_period": "2021",
        "source": "Tamil Nadu State Police (Annual Crime Report)",
        "geographic_coverage": "Statewide Tamil Nadu",
        "is_tabular": False
    }
]

def download_file(url, target_path):
    """Download a file with streaming and error handling."""
    resp = requests.get(url, headers=HEADERS, stream=True, timeout=60)
    resp.raise_for_status()
    with open(target_path, "wb") as f:
        for chunk in resp.iter_content(chunk_size=65536):
            if chunk:
                f.write(chunk)
    return os.path.getsize(target_path)

def acquire_crime_data():
    logging.info("Starting acquisition of Tamil Nadu Crime and Safety Records...")
    results = []

    for item in CRIME_DATASETS:
        target_raw = os.path.join(RAW_CRIME_DIR, item["filename"])
        target_source = os.path.join(SOURCE_FILES_DIR, item["filename"])
        
        logging.info(f"Downloading [{item['title']}] from {item['url']}...")
        start_time = datetime.now()
        
        try:
            bytes_downloaded = download_file(item["url"], target_raw)
            # Copy to source_files directory to preserve pristine original
            import shutil
            shutil.copyfile(target_raw, target_source)
            
            record_count = None
            columns = []
            if item["is_tabular"]:
                try:
                    df = pd.read_csv(target_raw)
                    record_count = len(df)
                    columns = list(df.columns)
                    logging.info(f"Successfully loaded CSV with {record_count} rows and {len(columns)} columns.")
                except Exception as csv_err:
                    logging.warning(f"Could not parse CSV for record count: {csv_err}")
            
            result_meta = {
                "dataset_id": item["id"],
                "dataset_name": item["title"],
                "filename": item["filename"],
                "raw_path": os.path.relpath(target_raw, BASE_DIR),
                "source_path": os.path.relpath(target_source, BASE_DIR),
                "format": item["format"],
                "download_status": "SUCCESS",
                "bytes": bytes_downloaded,
                "record_count": record_count,
                "columns": columns,
                "source_url": item["url"],
                "official_source": item["source"],
                "geographic_coverage": item["geographic_coverage"],
                "reporting_period": item["reporting_period"],
                "collected_at": datetime.now().isoformat(),
                "duration_seconds": round((datetime.now() - start_time).total_seconds(), 2),
                "error": None
            }
            results.append(result_meta)
            logging.info(f"Downloaded {item['filename']} ({bytes_downloaded} bytes, {record_count} records)")
            
        except Exception as e:
            logging.error(f"Failed downloading {item['title']}: {e}")
            result_meta = {
                "dataset_id": item["id"],
                "dataset_name": item["title"],
                "filename": item["filename"],
                "raw_path": None,
                "source_path": None,
                "format": item["format"],
                "download_status": "FAILED",
                "bytes": 0,
                "record_count": 0,
                "columns": [],
                "source_url": item["url"],
                "official_source": item["source"],
                "geographic_coverage": item["geographic_coverage"],
                "reporting_period": item["reporting_period"],
                "collected_at": datetime.now().isoformat(),
                "duration_seconds": round((datetime.now() - start_time).total_seconds(), 2),
                "error": str(e)
            }
            results.append(result_meta)

    # Save metadata
    meta_path = os.path.join(METADATA_DIR, "crime_datasets_metadata.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    logging.info(f"Crime data metadata saved to {meta_path}")

    # Summary
    success_count = sum(1 for r in results if r["download_status"] == "SUCCESS")
    logging.info(f"Completed Crime Acquisition: {success_count}/{len(CRIME_DATASETS)} datasets downloaded successfully.")
    return results

if __name__ == "__main__":
    acquire_crime_data()
