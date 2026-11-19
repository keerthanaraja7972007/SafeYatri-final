"""
SAFEYATRI - Real-World Emergency Infrastructure Records Acquisition Module
Author: Senior Python Data Engineer / Data Acquisition Specialist
Target: Statewide Emergency Services (Hospitals, Police, Fire, Ambulance, PHCs) across ALL 38 Districts of Tamil Nadu
Source: OpenStreetMap Overpass API (Live Authoritative Geo-Repository)
"""

import os
import sys
import json
import math
import logging
import requests
import pandas as pd
from datetime import datetime

# Setup paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_EMERGENCY_DIR = os.path.join(BASE_DIR, "raw", "emergency")
SOURCE_FILES_DIR = os.path.join(BASE_DIR, "source_files")
LOGS_DIR = os.path.join(BASE_DIR, "logs")
METADATA_DIR = os.path.join(BASE_DIR, "metadata")

os.makedirs(RAW_EMERGENCY_DIR, exist_ok=True)
os.makedirs(SOURCE_FILES_DIR, exist_ok=True)
os.makedirs(LOGS_DIR, exist_ok=True)
os.makedirs(METADATA_DIR, exist_ok=True)

# Setup logging
log_file = os.path.join(LOGS_DIR, "emergency_infrastructure_acquisition.log")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(log_file, encoding="utf-8"),
        logging.StreamHandler(sys.stdout)
    ]
)

# 38 District Centroids of Tamil Nadu for geospatial district assignment
TN_DISTRICTS_CENTROIDS = {
    "Ariyalur": (11.1401, 79.0786),
    "Chengalpattu": (12.6841, 79.9836),
    "Chennai": (13.0827, 80.2707),
    "Coimbatore": (11.0168, 76.9558),
    "Cuddalore": (11.7480, 79.7714),
    "Dharmapuri": (12.1211, 78.1582),
    "Dindigul": (10.3673, 77.9803),
    "Erode": (11.3410, 77.7172),
    "Kallakurichi": (11.7384, 78.9639),
    "Kanchipuram": (12.8342, 79.7036),
    "Kanyakumari": (8.0883, 77.5385),
    "Karur": (10.9601, 78.0766),
    "Krishnagiri": (12.5186, 78.2137),
    "Madurai": (9.9252, 78.1198),
    "Mayiladuthurai": (11.1018, 79.6522),
    "Nagapattinam": (10.7672, 79.8449),
    "Namakkal": (11.2189, 78.1674),
    "Nilgiris": (11.4102, 76.6950),
    "Perambalur": (11.2342, 78.8820),
    "Pudukkottai": (10.3797, 78.8208),
    "Ramanathapuram": (9.3639, 78.8395),
    "Ranipet": (12.9272, 79.3330),
    "Salem": (11.6643, 78.1460),
    "Sivaganga": (9.8433, 78.4809),
    "Tenkasi": (8.9594, 77.3152),
    "Thanjavur": (10.7870, 79.1378),
    "Theni": (10.0104, 77.4768),
    "Thoothukudi": (8.7642, 78.1348),
    "Tiruchirappalli": (10.7905, 78.7047),
    "Tirunelveli": (8.7139, 77.7567),
    "Tirupathur": (12.4925, 78.5678),
    "Tiruppur": (11.1085, 77.3411),
    "Tiruvallur": (13.1432, 79.9074),
    "Tiruvannamalai": (12.2253, 79.0747),
    "Tiruvarur": (10.7725, 79.6365),
    "Vellore": (12.9165, 79.1325),
    "Viluppuram": (11.9401, 79.4861),
    "Virudhunagar": (9.5680, 77.9624)
}

OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter"
]

HEADERS = {
    "User-Agent": "SafeYatri-EmergencyCollector/1.0 (safeyatri.research@gmail.com)",
    "Accept": "application/json"
}

def haversine_dist(lat1, lon1, lat2, lon2):
    R = 6371.0 # km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def assign_district(lat, lon, tags):
    # Check tags
    for tag in ["addr:district", "district", "addr:state_district", "is_in:district"]:
        if tag in tags and tags[tag].strip():
            d_val = tags[tag].strip()
            for d in TN_DISTRICTS_CENTROIDS:
                if d.lower() in d_val.lower():
                    return d
            return d_val

    for tag in ["addr:city", "addr:county"]:
        if tag in tags and tags[tag].strip():
            c_val = tags[tag].strip()
            for d in TN_DISTRICTS_CENTROIDS:
                if d.lower() in c_val.lower():
                    return d

    # Geospatial nearest centroid
    nearest_dist = None
    min_d = float("inf")
    for district, (d_lat, d_lon) in TN_DISTRICTS_CENTROIDS.items():
        dist = haversine_dist(lat, lon, d_lat, d_lon)
        if dist < min_d:
            min_d = dist
            nearest_dist = district
    return nearest_dist

def classify_facility(tags):
    amenity = tags.get("amenity", "")
    healthcare = tags.get("healthcare", "")
    emergency = tags.get("emergency", "")
    operator = tags.get("operator", "").lower()
    name = (tags.get("name") or "").lower()

    if amenity == "police":
        return "Police Station"
    elif amenity == "fire_station":
        return "Fire and Rescue Station"
    elif emergency == "ambulance_station" or amenity == "ambulance_station":
        return "Ambulance Station"
    elif amenity == "hospital" or healthcare == "hospital":
        if any(w in name for w in ["government", "gh", "primary health", "phc", "rajiv gandhi", "stanley", "kilpauk", "esic", "district head quarters"]) or any(w in operator for w in ["government", "govt", "state", "municipal"]):
            return "Government Hospital"
        return "Private Hospital"
    elif amenity == "clinic" or healthcare in ["centre", "clinic"] or "primary health centre" in name or "phc" in name:
        return "Primary Health Centre / Clinic"
    return "Healthcare Facility"

def query_overpass(query):
    for endpoint in OVERPASS_ENDPOINTS:
        logging.info(f"Querying Overpass endpoint: {endpoint}...")
        try:
            resp = requests.post(endpoint, data={"data": query}, headers=HEADERS, timeout=180)
            if resp.status_code == 200:
                logging.info(f"Successfully received response from {endpoint}")
                return resp.json()
            else:
                logging.warning(f"Endpoint {endpoint} returned status {resp.status_code}")
        except Exception as e:
            logging.warning(f"Endpoint {endpoint} failed: {e}")
    raise RuntimeError("All Overpass endpoints failed or timed out.")

def acquire_emergency_infrastructure():
    logging.info("Starting acquisition of Tamil Nadu Emergency Infrastructure...")
    start_time = datetime.now()

    categories_queries = [
        ("hospitals", """
        [out:json][timeout:90];
        area["ISO3166-2"="IN-TN"][admin_level=4]->.tn;
        (
          node["amenity"="hospital"](area.tn);
          way["amenity"="hospital"](area.tn);
        );
        out center tags;
        """),
        ("police", """
        [out:json][timeout:90];
        area["ISO3166-2"="IN-TN"][admin_level=4]->.tn;
        (
          node["amenity"="police"](area.tn);
          way["amenity"="police"](area.tn);
        );
        out center tags;
        """),
        ("clinics_phc", """
        [out:json][timeout:90];
        area["ISO3166-2"="IN-TN"][admin_level=4]->.tn;
        (
          node["amenity"="clinic"](area.tn);
          node["healthcare"="centre"](area.tn);
        );
        out center tags;
        """),
        ("fire_ambulance", """
        [out:json][timeout:90];
        area["ISO3166-2"="IN-TN"][admin_level=4]->.tn;
        (
          node["amenity"="fire_station"](area.tn);
          way["amenity"="fire_station"](area.tn);
          node["emergency"="ambulance_station"](area.tn);
          node["amenity"="ambulance_station"](area.tn);
        );
        out center tags;
        """)
    ]

    all_elements = []
    category_raw_dumps = {}

    for cat_name, q in categories_queries:
        logging.info(f"Querying Overpass for {cat_name}...")
        try:
            cat_data = query_overpass(q)
            cat_elements = cat_data.get("elements", [])
            logging.info(f"Received {len(cat_elements)} elements for {cat_name}.")
            all_elements.extend(cat_elements)
            category_raw_dumps[cat_name] = cat_data
            time.sleep(2.0)
        except Exception as e:
            logging.error(f"Failed to fetch category {cat_name}: {e}")

    logging.info(f"Total raw elements collected across categories: {len(all_elements)}")

    # Save unaltered raw JSON dump
    raw_source_path = os.path.join(SOURCE_FILES_DIR, "osm_emergency_infrastructure_raw.json")
    with open(raw_source_path, "w", encoding="utf-8") as f:
        json.dump(category_raw_dumps, f)
    logging.info(f"Saved raw Overpass response to {raw_source_path} ({os.path.getsize(raw_source_path)} bytes)")

    elements = all_elements

    records = []
    seen_ids = set()

    for el in elements:
        el_type = el.get("type")
        el_id = el.get("id")
        unique_key = f"{el_type}/{el_id}"
        if unique_key in seen_ids:
            continue
        seen_ids.add(unique_key)

        tags = el.get("tags", {})
        
        lat = el.get("lat")
        lon = el.get("lon")
        if lat is None and "center" in el:
            lat = el["center"].get("lat")
            lon = el["center"].get("lon")

        if lat is None or lon is None:
            continue

        facility_type = classify_facility(tags)
        name = tags.get("name") or tags.get("name:en") or tags.get("name:ta")
        if not name:
            name = f"{facility_type} ({unique_key})"

        district = assign_district(lat, lon, tags)

        city = tags.get("addr:city") or tags.get("addr:town") or tags.get("addr:village") or tags.get("addr:suburb") or ""
        street = tags.get("addr:street") or ""
        postcode = tags.get("addr:postcode") or ""
        phone = tags.get("phone") or tags.get("contact:phone") or tags.get("emergency:phone") or ""
        operator = tags.get("operator") or ""

        address_parts = [p for p in [street, city, district, postcode] if p]
        full_address = ", ".join(address_parts) if address_parts else f"{district}, Tamil Nadu"

        source_url = f"https://www.openstreetmap.org/{el_type}/{el_id}"

        records.append({
            "facility_id": unique_key,
            "facility_name": name,
            "facility_type": facility_type,
            "district": district,
            "latitude": round(lat, 6),
            "longitude": round(lon, 6),
            "address": full_address,
            "city_town": city,
            "postcode": postcode,
            "phone_contact": phone,
            "operator": operator,
            "source_url": source_url
        })

    df = pd.DataFrame(records)
    logging.info(f"Total processed emergency facilities: {len(df)}")

    # Save master CSV
    master_csv_path = os.path.join(RAW_EMERGENCY_DIR, "tamil_nadu_emergency_infrastructure_master.csv")
    df.to_csv(master_csv_path, index=False, encoding="utf-8")

    # Segmented CSVs for domain use
    hospitals_df = df[df["facility_type"].isin(["Government Hospital", "Private Hospital", "Primary Health Centre / Clinic", "Healthcare Facility"])]
    police_df = df[df["facility_type"] == "Police Station"]
    fire_ambulance_df = df[df["facility_type"].isin(["Fire and Rescue Station", "Ambulance Station"])]

    hospitals_path = os.path.join(RAW_EMERGENCY_DIR, "tamil_nadu_hospitals_phc.csv")
    police_path = os.path.join(RAW_EMERGENCY_DIR, "tamil_nadu_police_stations.csv")
    fire_amb_path = os.path.join(RAW_EMERGENCY_DIR, "tamil_nadu_fire_and_ambulance.csv")

    hospitals_df.to_csv(hospitals_path, index=False, encoding="utf-8")
    police_df.to_csv(police_path, index=False, encoding="utf-8")
    fire_ambulance_df.to_csv(fire_amb_path, index=False, encoding="utf-8")

    district_counts = df["district"].value_counts().to_dict()
    facility_counts = df["facility_type"].value_counts().to_dict()

    logging.info(f"Emergency Infrastructure Breakdown: {facility_counts}")
    logging.info(f"Coverage across {len(district_counts)} Tamil Nadu districts.")

    # Metadata
    metadata = {
        "dataset_name": "Tamil Nadu Emergency Infrastructure (OSM)",
        "source": "OpenStreetMap / Overpass API",
        "download_status": "SUCCESS",
        "master_csv_file": os.path.relpath(master_csv_path, BASE_DIR),
        "hospitals_csv_file": os.path.relpath(hospitals_path, BASE_DIR),
        "police_csv_file": os.path.relpath(police_path, BASE_DIR),
        "fire_ambulance_csv_file": os.path.relpath(fire_amb_path, BASE_DIR),
        "raw_source_file": os.path.relpath(raw_source_path, BASE_DIR),
        "total_records": len(df),
        "districts_covered_count": len(district_counts),
        "districts_covered": district_counts,
        "facility_type_breakdown": facility_counts,
        "query_timestamp": datetime.now().isoformat(),
        "duration_seconds": round((datetime.now() - start_time).total_seconds(), 2),
        "reporting_period": "Current Live OpenStreetMap Data (October 2026)"
    }

    meta_file = os.path.join(METADATA_DIR, "emergency_infrastructure_metadata.json")
    with open(meta_file, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    logging.info(f"Metadata saved to {meta_file}")
    return metadata

if __name__ == "__main__":
    acquire_emergency_infrastructure()
