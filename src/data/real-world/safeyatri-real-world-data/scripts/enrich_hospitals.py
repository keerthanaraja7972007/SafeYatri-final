"""
SAFEYATRI - Hospital Infrastructure Enrichment Script
Phase 4: Enrich PARTIAL Dataset (Category 3: Hospitals / PHCs / CHCs)
Author: Senior Data Engineer & Data Acquisition Specialist
"""

import os
import sys
import json
import logging
import requests
import pandas as pd
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_EMERGENCY_DIR = os.path.join(BASE_DIR, "raw", "emergency")
SOURCE_FILES_DIR = os.path.join(BASE_DIR, "source_files")
LOGS_DIR = os.path.join(BASE_DIR, "logs")

log_file = os.path.join(LOGS_DIR, "hospitals_enrichment.log")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(log_file, encoding="utf-8"),
        logging.StreamHandler(sys.stdout)
    ]
)

HEADERS = {
    "User-Agent": "SafeYatri-HospitalEnricher/1.0 (safeyatri.research@gmail.com)",
    "Accept": "application/json"
}

from download_emergency_infrastructure import TN_DISTRICTS_CENTROIDS, assign_district, classify_facility

def enrich_hospitals():
    logging.info("Starting enrichment of Tamil Nadu Hospitals...")
    
    # Query nodes for hospitals with coordinates
    query = """
    [out:json][timeout:90];
    area["ISO3166-2"="IN-TN"][admin_level=4]->.tn;
    node["amenity"="hospital"](area.tn);
    out body;
    """

    endpoints = [
        "https://lz4.overpass-api.de/api/interpreter",
        "https://overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter"
    ]
    
    data = None
    for ep in endpoints:
        logging.info(f"Trying endpoint {ep}...")
        try:
            resp = requests.post(ep, data={"data": query}, headers=HEADERS, timeout=90)
            if resp.status_code == 200:
                data = resp.json()
                logging.info(f"Success from {ep}")
                break
            else:
                logging.warning(f"Endpoint {ep} returned {resp.status_code}")
        except Exception as e:
            logging.warning(f"Endpoint {ep} failed: {e}")

    if not data:
        raise RuntimeError("All Overpass endpoints failed for hospitals.")

    elements = data.get("elements", [])
    logging.info(f"Retrieved {len(elements)} hospital nodes from OpenStreetMap.")

    # Save raw dump
    raw_hosp_path = os.path.join(SOURCE_FILES_DIR, "osm_hospitals_enrichment_raw.json")
    with open(raw_hosp_path, "w", encoding="utf-8") as f:
        json.dump(data, f)

    new_records = []
    for el in elements:
        el_id = el.get("id")
        unique_key = f"node/{el_id}"
        tags = el.get("tags", {})
        lat = el.get("lat")
        lon = el.get("lon")
        if not lat or not lon:
            continue

        fac_type = classify_facility(tags)
        name = tags.get("name") or tags.get("name:en") or tags.get("name:ta") or f"Hospital ({unique_key})"
        district = assign_district(lat, lon, tags)
        city = tags.get("addr:city") or tags.get("addr:town") or tags.get("addr:village") or tags.get("addr:suburb") or ""
        street = tags.get("addr:street") or ""
        postcode = tags.get("addr:postcode") or ""
        phone = tags.get("phone") or tags.get("contact:phone") or tags.get("emergency:phone") or ""
        operator = tags.get("operator") or ""

        address_parts = [p for p in [street, city, district, postcode] if p]
        full_address = ", ".join(address_parts) if address_parts else f"{district}, Tamil Nadu"

        new_records.append({
            "facility_id": unique_key,
            "facility_name": name,
            "facility_type": fac_type,
            "district": district,
            "latitude": round(lat, 6),
            "longitude": round(lon, 6),
            "address": full_address,
            "city_town": city,
            "postcode": postcode,
            "phone_contact": phone,
            "operator": operator,
            "source_url": f"https://www.openstreetmap.org/node/{el_id}"
        })

    logging.info(f"Parsed {len(new_records)} hospital records.")
    new_df = pd.DataFrame(new_records)

    # Read existing master emergency CSV and append non-duplicates
    master_csv = os.path.join(RAW_EMERGENCY_DIR, "tamil_nadu_emergency_infrastructure_master.csv")
    if os.path.exists(master_csv):
        existing_df = pd.read_csv(master_csv)
        existing_ids = set(existing_df["facility_id"])
        to_add = new_df[~new_df["facility_id"].isin(existing_ids)]
        logging.info(f"Adding {len(to_add)} new hospital facilities to existing {len(existing_df)} facilities.")
        combined_df = pd.concat([existing_df, to_add], ignore_index=True)
    else:
        combined_df = new_df

    combined_df.to_csv(master_csv, index=False, encoding="utf-8")
    logging.info(f"Updated master emergency CSV: {len(combined_df)} total facilities.")

    # Re-split domain files
    hospitals_df = combined_df[combined_df["facility_type"].isin(["Government Hospital", "Private Hospital", "Primary Health Centre / Clinic", "Healthcare Facility"])]
    hospitals_path = os.path.join(RAW_EMERGENCY_DIR, "tamil_nadu_hospitals_phc.csv")
    hospitals_df.to_csv(hospitals_path, index=False, encoding="utf-8")
    logging.info(f"Updated hospitals & PHC CSV: {len(hospitals_df)} records (Breakdown: {hospitals_df['facility_type'].value_counts().to_dict()})")

    return len(new_df)

if __name__ == "__main__":
    enrich_hospitals()
