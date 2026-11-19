"""
SAFEYATRI - Real-World Tamil Nadu Tourist Places Acquisition Module
Author: Senior Python Data Engineer / Data Acquisition Specialist
Target: Comprehensive Tourist Destinations across all 38 Districts of Tamil Nadu
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
RAW_TOURIST_DIR = os.path.join(BASE_DIR, "raw", "tourist_places")
SOURCE_FILES_DIR = os.path.join(BASE_DIR, "source_files")
LOGS_DIR = os.path.join(BASE_DIR, "logs")
METADATA_DIR = os.path.join(BASE_DIR, "metadata")

os.makedirs(RAW_TOURIST_DIR, exist_ok=True)
os.makedirs(SOURCE_FILES_DIR, exist_ok=True)
os.makedirs(LOGS_DIR, exist_ok=True)
os.makedirs(METADATA_DIR, exist_ok=True)

# Setup logging
log_file = os.path.join(LOGS_DIR, "tourist_places_acquisition.log")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(log_file, encoding="utf-8"),
        logging.StreamHandler(sys.stdout)
    ]
)

# Coordinates of all 38 District Headquarters of Tamil Nadu for geospatial district mapping
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
    "https://lz4.overpass-api.de/api/interpreter",
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter"
]

HEADERS = {
    "User-Agent": "SafeYatri-TN-DataCollector/1.0 (safeyatri.research@gmail.com)",
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
    # Check if district is explicitly in tags
    for tag in ["addr:district", "district", "addr:state_district", "is_in:district"]:
        if tag in tags and tags[tag].strip():
            d_val = tags[tag].strip()
            # Match against known 38 districts
            for d in TN_DISTRICTS_CENTROIDS:
                if d.lower() in d_val.lower():
                    return d
            return d_val

    # Check city / county tags
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

def determine_category(tags):
    if "tourism" in tags:
        return f"tourism_{tags['tourism']}"
    elif "historic" in tags:
        return f"historic_{tags['historic']}"
    elif "natural" in tags:
        return f"natural_{tags['natural']}"
    elif "leisure" in tags:
        return f"leisure_{tags['leisure']}"
    elif "amenity" in tags and tags["amenity"] == "place_of_worship":
        return f"religious_heritage_{tags.get('religion', 'temple')}"
    return "tourist_attraction"

def query_overpass(query):
    for endpoint in OVERPASS_ENDPOINTS:
        logging.info(f"Querying Overpass endpoint: {endpoint}...")
        try:
            resp = requests.post(endpoint, data={"data": query}, headers=HEADERS, timeout=120)
            if resp.status_code == 200:
                logging.info(f"Successfully received response from {endpoint}")
                return resp.json()
            else:
                logging.warning(f"Endpoint {endpoint} returned status {resp.status_code}")
        except Exception as e:
            logging.warning(f"Endpoint {endpoint} failed: {e}")
    raise RuntimeError("All Overpass endpoints failed or timed out.")

def acquire_tourist_places():
    logging.info("Starting acquisition of Tamil Nadu Tourist Places via Overpass API...")
    start_time = datetime.now()

    # Comprehensive query for Tamil Nadu tourist places
    # We query nodes and ways with center coordinates
    overpass_query = """
    [out:json][timeout:180];
    area["ISO3166-2"="IN-TN"][admin_level=4]->.tn;
    (
      // Tourist attractions, viewpoints, museums, zoos, theme parks
      node["tourism"~"attraction|viewpoint|museum|zoo|theme_park|aquarium|artwork|picnic_site"](area.tn);
      way["tourism"~"attraction|viewpoint|museum|zoo|theme_park|aquarium|artwork|picnic_site"](area.tn);

      // Historic sites, monuments, forts, ruins, heritage
      node["historic"~"monument|memorial|castle|fort|archaeological_site|ruins|heritage|building"](area.tn);
      way["historic"~"monument|memorial|castle|fort|archaeological_site|ruins|heritage|building"](area.tn);

      // Beaches, waterfalls, peaks
      node["natural"~"beach|waterfall|peak|cave_entrance"](area.tn);
      way["natural"~"beach|waterfall"](area.tn);

      // Nature reserves and parks
      node["leisure"~"nature_reserve|park|water_park"](area.tn);
      way["leisure"~"nature_reserve|water_park"](area.tn);

      // Notable Heritage Temples and Historic Places of Worship
      node["amenity"="place_of_worship"]["historic"](area.tn);
      node["amenity"="place_of_worship"]["heritage"](area.tn);
      node["amenity"="place_of_worship"]["tourism"](area.tn);
    );
    out center tags;
    """

    raw_data = query_overpass(overpass_query)
    elements = raw_data.get("elements", [])
    logging.info(f"Retrieved {len(elements)} raw elements from OpenStreetMap.")

    # Save raw unaltered response
    raw_source_path = os.path.join(SOURCE_FILES_DIR, "osm_tourist_places_raw.json")
    with open(raw_source_path, "w", encoding="utf-8") as f:
        json.dump(raw_data, f)
    logging.info(f"Raw Overpass response saved to {raw_source_path} ({os.path.getsize(raw_source_path)} bytes)")

    # Extract structured records
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
        
        # Coordinates
        lat = el.get("lat")
        lon = el.get("lon")
        if lat is None and "center" in el:
            lat = el["center"].get("lat")
            lon = el["center"].get("lon")

        if lat is None or lon is None:
            continue

        # Place name
        name = tags.get("name") or tags.get("name:en") or tags.get("name:ta")
        if not name:
            # Fallback to category description if unnamed landmark
            cat_desc = tags.get("tourism") or tags.get("historic") or tags.get("natural") or "Unnamed Heritage Site"
            name = f"{cat_desc.replace('_', ' ').title()} ({unique_key})"

        # District
        district = assign_district(lat, lon, tags)
        
        # Place Category
        category = determine_category(tags)

        # Geographic location / address details
        city = tags.get("addr:city") or tags.get("addr:town") or tags.get("addr:village") or tags.get("addr:suburb") or ""
        street = tags.get("addr:street") or ""
        postcode = tags.get("addr:postcode") or ""
        geo_location = f"{name}, {city}, {district}, Tamil Nadu".replace(" ,", "")

        # Source URL
        source_url = f"https://www.openstreetmap.org/{el_type}/{el_id}"

        records.append({
            "place_id": unique_key,
            "place_name": name,
            "name_ta": tags.get("name:ta", ""),
            "latitude": round(lat, 6),
            "longitude": round(lon, 6),
            "district": district,
            "place_category": category,
            "geographic_location": geo_location,
            "city_town": city,
            "postcode": postcode,
            "source_url": source_url,
            "osm_tags": json.dumps({k: v for k, v in tags.items() if k in ["tourism", "historic", "natural", "leisure", "heritage", "wikidata", "wikipedia", "opening_hours", "website"]})
        })

    df = pd.DataFrame(records)
    logging.info(f"Processed {len(df)} authentic tourist place records across Tamil Nadu.")

    # Save to CSV and JSON in raw/tourist_places/
    csv_path = os.path.join(RAW_TOURIST_DIR, "tamil_nadu_tourist_places_osm.csv")
    json_path = os.path.join(RAW_TOURIST_DIR, "tamil_nadu_tourist_places_osm.json")

    df.to_csv(csv_path, index=False, encoding="utf-8")
    df.to_json(json_path, orient="records", indent=2, force_ascii=False)

    # Calculate district-wise coverage
    district_counts = df["district"].value_counts().to_dict()
    category_counts = df["place_category"].value_counts().to_dict()

    logging.info(f"Statewide coverage across {len(district_counts)} districts.")

    # Generate metadata
    metadata = {
        "dataset_name": "Tamil Nadu Comprehensive Tourist Places (OSM)",
        "source": "OpenStreetMap / Overpass API",
        "download_status": "SUCCESS",
        "csv_file": os.path.relpath(csv_path, BASE_DIR),
        "json_file": os.path.relpath(json_path, BASE_DIR),
        "raw_source_file": os.path.relpath(raw_source_path, BASE_DIR),
        "total_records": len(df),
        "districts_covered_count": len(district_counts),
        "districts_covered": district_counts,
        "categories_breakdown": category_counts,
        "bounding_box": {
            "min_lat": float(df["latitude"].min()),
            "max_lat": float(df["latitude"].max()),
            "min_lon": float(df["longitude"].min()),
            "max_lon": float(df["longitude"].max())
        },
        "query_timestamp": datetime.now().isoformat(),
        "duration_seconds": round((datetime.now() - start_time).total_seconds(), 2),
        "reporting_period": "Current Live OpenStreetMap Data (October 2026)"
    }

    meta_file = os.path.join(METADATA_DIR, "tourist_places_metadata.json")
    with open(meta_file, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    logging.info(f"Metadata written to {meta_file}")
    return metadata

if __name__ == "__main__":
    acquire_tourist_places()
