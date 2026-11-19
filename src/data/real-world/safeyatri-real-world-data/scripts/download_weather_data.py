"""
SAFEYATRI - Real-World Historical Weather Records Acquisition Module
Author: Senior Python Data Engineer / Data Acquisition Specialist
Target: Statewide Historical Meteorological Observations across ALL 38 Districts & Tourist Hubs of Tamil Nadu
Source: Open-Meteo Historical Weather Archive API (ECMWF ERA5 / IFS Reanalysis & Surface Observations)
"""

import os
import sys
import time
import json
import logging
import requests
import pandas as pd
from datetime import datetime

# Setup paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_WEATHER_DIR = os.path.join(BASE_DIR, "raw", "weather")
SOURCE_WEATHER_DIR = os.path.join(BASE_DIR, "source_files", "weather")
LOGS_DIR = os.path.join(BASE_DIR, "logs")
METADATA_DIR = os.path.join(BASE_DIR, "metadata")

os.makedirs(RAW_WEATHER_DIR, exist_ok=True)
os.makedirs(SOURCE_WEATHER_DIR, exist_ok=True)
os.makedirs(LOGS_DIR, exist_ok=True)
os.makedirs(METADATA_DIR, exist_ok=True)

# Setup logging
log_file = os.path.join(LOGS_DIR, "weather_data_acquisition.log")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(log_file, encoding="utf-8"),
        logging.StreamHandler(sys.stdout)
    ]
)

# Comprehensive list of ALL 38 Districts of Tamil Nadu + Major Climatic & Tourist Regions
LOCATIONS_TN = [
    # 38 District Headquarters
    {"name": "Ariyalur", "district": "Ariyalur", "type": "District HQ", "lat": 11.1401, "lon": 79.0786},
    {"name": "Chengalpattu", "district": "Chengalpattu", "type": "District HQ", "lat": 12.6841, "lon": 79.9836},
    {"name": "Chennai", "district": "Chennai", "type": "State Capital", "lat": 13.0827, "lon": 80.2707},
    {"name": "Coimbatore", "district": "Coimbatore", "type": "District HQ", "lat": 11.0168, "lon": 76.9558},
    {"name": "Cuddalore", "district": "Cuddalore", "type": "Coastal District HQ", "lat": 11.7480, "lon": 79.7714},
    {"name": "Dharmapuri", "district": "Dharmapuri", "type": "District HQ", "lat": 12.1211, "lon": 78.1582},
    {"name": "Dindigul", "district": "Dindigul", "type": "District HQ", "lat": 10.3673, "lon": 77.9803},
    {"name": "Erode", "district": "Erode", "type": "District HQ", "lat": 11.3410, "lon": 77.7172},
    {"name": "Kallakurichi", "district": "Kallakurichi", "type": "District HQ", "lat": 11.7384, "lon": 78.9639},
    {"name": "Kanchipuram", "district": "Kanchipuram", "type": "Heritage District HQ", "lat": 12.8342, "lon": 79.7036},
    {"name": "Nagercoil (Kanyakumari)", "district": "Kanyakumari", "type": "Southern Coastal District HQ", "lat": 8.0883, "lon": 77.5385},
    {"name": "Karur", "district": "Karur", "type": "District HQ", "lat": 10.9601, "lon": 78.0766},
    {"name": "Krishnagiri", "district": "Krishnagiri", "type": "District HQ", "lat": 12.5186, "lon": 78.2137},
    {"name": "Madurai", "district": "Madurai", "type": "Cultural Capital District HQ", "lat": 9.9252, "lon": 78.1198},
    {"name": "Mayiladuthurai", "district": "Mayiladuthurai", "type": "Delta District HQ", "lat": 11.1018, "lon": 79.6522},
    {"name": "Nagapattinam", "district": "Nagapattinam", "type": "Coastal Delta District HQ", "lat": 10.7672, "lon": 79.8449},
    {"name": "Namakkal", "district": "Namakkal", "type": "District HQ", "lat": 11.2189, "lon": 78.1674},
    {"name": "Udhagamandalam (Ooty)", "district": "Nilgiris", "type": "Hill Station District HQ", "lat": 11.4102, "lon": 76.6950},
    {"name": "Perambalur", "district": "Perambalur", "type": "District HQ", "lat": 11.2342, "lon": 78.8820},
    {"name": "Pudukkottai", "district": "Pudukkottai", "type": "District HQ", "lat": 10.3797, "lon": 78.8208},
    {"name": "Ramanathapuram", "district": "Ramanathapuram", "type": "Coastal District HQ", "lat": 9.3639, "lon": 78.8395},
    {"name": "Ranipet", "district": "Ranipet", "type": "District HQ", "lat": 12.9272, "lon": 79.3330},
    {"name": "Salem", "district": "Salem", "type": "District HQ", "lat": 11.6643, "lon": 78.1460},
    {"name": "Sivaganga", "district": "Sivaganga", "type": "District HQ", "lat": 9.8433, "lon": 78.4809},
    {"name": "Tenkasi", "district": "Tenkasi", "type": "Western Ghats District HQ", "lat": 8.9594, "lon": 77.3152},
    {"name": "Thanjavur", "district": "Thanjavur", "type": "Heritage Delta District HQ", "lat": 10.7870, "lon": 79.1378},
    {"name": "Theni", "district": "Theni", "type": "Western Ghats District HQ", "lat": 10.0104, "lon": 77.4768},
    {"name": "Thoothukudi", "district": "Thoothukudi", "type": "Port District HQ", "lat": 8.7642, "lon": 78.1348},
    {"name": "Tiruchirappalli", "district": "Tiruchirappalli", "type": "Central District HQ", "lat": 10.7905, "lon": 78.7047},
    {"name": "Tirunelveli", "district": "Tirunelveli", "type": "Southern District HQ", "lat": 8.7139, "lon": 77.7567},
    {"name": "Tirupathur", "district": "Tirupathur", "type": "District HQ", "lat": 12.4925, "lon": 78.5678},
    {"name": "Tiruppur", "district": "Tiruppur", "type": "District HQ", "lat": 11.1085, "lon": 77.3411},
    {"name": "Tiruvallur", "district": "Tiruvallur", "type": "Northern District HQ", "lat": 13.1432, "lon": 79.9074},
    {"name": "Tiruvannamalai", "district": "Tiruvannamalai", "type": "Heritage District HQ", "lat": 12.2253, "lon": 79.0747},
    {"name": "Tiruvarur", "district": "Tiruvarur", "type": "Delta District HQ", "lat": 10.7725, "lon": 79.6365},
    {"name": "Vellore", "district": "Vellore", "type": "Fort District HQ", "lat": 12.9165, "lon": 79.1325},
    {"name": "Viluppuram", "district": "Viluppuram", "type": "District HQ", "lat": 11.9401, "lon": 79.4861},
    {"name": "Virudhunagar", "district": "Virudhunagar", "type": "District HQ", "lat": 9.5680, "lon": 77.9624},
    # Key Tourist Microclimates & Destinations
    {"name": "Kodaikanal", "district": "Dindigul", "type": "Hill Station (Western Ghats)", "lat": 10.2381, "lon": 77.4892},
    {"name": "Yercaud", "district": "Salem", "type": "Hill Station (Shevaroys)", "lat": 11.7753, "lon": 78.2093},
    {"name": "Mamallapuram", "district": "Chengalpattu", "type": "Coastal UNESCO Heritage", "lat": 12.6269, "lon": 80.1932},
    {"name": "Rameswaram", "district": "Ramanathapuram", "type": "Island Pilgrim & Marine Hub", "lat": 9.2876, "lon": 79.3129},
    {"name": "Courtallam", "district": "Tenkasi", "type": "Waterfalls Spa of South India", "lat": 8.9317, "lon": 77.2750},
    {"name": "Mudumalai", "district": "Nilgiris", "type": "Wildlife Sanctuary / Tiger Reserve", "lat": 11.5833, "lon": 76.5333},
    {"name": "Valparai", "district": "Coimbatore", "type": "Anamalai Hill Station", "lat": 10.3235, "lon": 76.9554},
    {"name": "Hogenakkal", "district": "Dharmapuri", "type": "River Gorge & Waterfalls", "lat": 12.1188, "lon": 77.7770},
    {"name": "Kolli Hills", "district": "Namakkal", "type": "Eastern Ghats Hill Station", "lat": 11.2500, "lon": 78.3333},
    {"name": "Dhanushkodi", "district": "Ramanathapuram", "type": "Southern Coastal Tip", "lat": 9.1762, "lon": 79.4140}
]

OPEN_METEO_ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"

def acquire_weather():
    logging.info("Starting acquisition of Tamil Nadu Historical Weather Records from Open-Meteo...")
    start_time = datetime.now()
    
    # 1 full year historical window (2024 calendar year)
    start_date = "2024-01-01"
    end_date = "2024-12-31"

    daily_records = []
    hourly_records_sample = [] # Comprehensive hourly records for all locations

    success_locations = 0
    failed_locations = 0

    for idx, loc in enumerate(LOCATIONS_TN, 1):
        loc_name = loc["name"]
        district = loc["district"]
        lat = loc["lat"]
        lon = loc["lon"]
        loc_type = loc["type"]

        logging.info(f"[{idx}/{len(LOCATIONS_TN)}] Fetching weather for {loc_name} ({district}) [lat={lat}, lon={lon}]...")

        params = {
            "latitude": lat,
            "longitude": lon,
            "start_date": start_date,
            "end_date": end_date,
            "daily": "temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,wind_speed_10m_max,wind_direction_10m_dominant,weather_code",
            "hourly": "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m,surface_pressure,weather_code",
            "timezone": "Asia/Kolkata"
        }

        raw_filename = f"weather_2024_{district.lower().replace(' ', '_')}_{loc_name.lower().replace(' ', '_').replace('(', '').replace(')', '')}.json"
        raw_path = os.path.join(SOURCE_WEATHER_DIR, raw_filename)
        data = None

        if os.path.exists(raw_path):
            logging.info(f"Loading cached response for {loc_name} from {raw_filename}...")
            try:
                with open(raw_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
            except Exception as e:
                logging.warning(f"Could not load cache for {loc_name}: {e}")

        if not data:
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    resp = requests.get(OPEN_METEO_ARCHIVE_URL, params=params, timeout=30)
                    if resp.status_code == 200:
                        data = resp.json()
                        with open(raw_path, "w", encoding="utf-8") as f:
                            json.dump(data, f)
                        logging.info(f"Successfully fetched and cached {loc_name}")
                        time.sleep(2.0)
                        break
                    elif resp.status_code == 429:
                        logging.warning(f"Rate limited (429) on {loc_name}. Sleeping 60s before retry (attempt {attempt+1}/{max_retries})...")
                        time.sleep(60.0)
                    else:
                        logging.error(f"Failed to fetch {loc_name}: HTTP {resp.status_code} - {resp.text[:100]}")
                        time.sleep(5.0)
                except Exception as e:
                    logging.error(f"Exception downloading {loc_name}: {e}")
                    time.sleep(5.0)

        if not data or "daily" not in data:
            logging.error(f"Skipping {loc_name} due to missing data.")
            failed_locations += 1
            continue

        # Process Daily Data
        daily = data.get("daily", {})
        times = daily.get("time", [])
        t_max = daily.get("temperature_2m_max", [])
        t_min = daily.get("temperature_2m_min", [])
        t_mean = daily.get("temperature_2m_mean", [])
        precip = daily.get("precipitation_sum", [])
        w_speed = daily.get("wind_speed_10m_max", [])
        w_dir = daily.get("wind_direction_10m_dominant", [])
        w_code = daily.get("weather_code", [])

        for d_idx, dt in enumerate(times):
            daily_records.append({
                "date": dt,
                "location_name": loc_name,
                "district": district,
                "location_type": loc_type,
                "latitude": lat,
                "longitude": lon,
                "temperature_max_c": t_max[d_idx] if d_idx < len(t_max) else None,
                "temperature_min_c": t_min[d_idx] if d_idx < len(t_min) else None,
                "temperature_mean_c": t_mean[d_idx] if d_idx < len(t_mean) else None,
                "precipitation_sum_mm": precip[d_idx] if d_idx < len(precip) else None,
                "wind_speed_max_kmh": w_speed[d_idx] if d_idx < len(w_speed) else None,
                "wind_direction_dominant_deg": w_dir[d_idx] if d_idx < len(w_dir) else None,
                "weather_code": w_code[d_idx] if d_idx < len(w_code) else None,
                "source": "Open-Meteo Historical Archive (ERA5/IFS)"
            })

        # Process Hourly Data (Extract all required fields: timestamp, temp, rh, precip, wind speed, wind dir, pressure, code)
        hourly = data.get("hourly", {})
        h_times = hourly.get("time", [])
        h_temp = hourly.get("temperature_2m", [])
        h_rh = hourly.get("relative_humidity_2m", [])
        h_precip = hourly.get("precipitation", [])
        h_ws = hourly.get("wind_speed_10m", [])
        h_wd = hourly.get("wind_direction_10m", [])
        h_sp = hourly.get("surface_pressure", [])
        h_wc = hourly.get("weather_code", [])

        # Extract 4 representative hourly observations per day (00:00, 06:00, 12:00, 18:00) to create a clean, high-density structured dataset
        for h_idx, h_time in enumerate(h_times):
            if h_time.endswith("00:00") or h_time.endswith("06:00") or h_time.endswith("12:00") or h_time.endswith("18:00"):
                hourly_records_sample.append({
                    "date": h_time.split("T")[0],
                    "timestamp": h_time,
                    "location_name": loc_name,
                    "district": district,
                    "latitude": lat,
                    "longitude": lon,
                    "temperature_c": h_temp[h_idx] if h_idx < len(h_temp) else None,
                    "relative_humidity_pct": h_rh[h_idx] if h_idx < len(h_rh) else None,
                    "precipitation_mm": h_precip[h_idx] if h_idx < len(h_precip) else None,
                    "wind_speed_kmh": h_ws[h_idx] if h_idx < len(h_ws) else None,
                    "wind_direction_deg": h_wd[h_idx] if h_idx < len(h_wd) else None,
                    "atmospheric_pressure_hpa": h_sp[h_idx] if h_idx < len(h_sp) else None,
                    "weather_code": h_wc[h_idx] if h_idx < len(h_wc) else None,
                    "source": "Open-Meteo Historical Archive"
                })

        success_locations += 1

    # Convert to DataFrames
    df_daily = pd.DataFrame(daily_records)
    df_hourly = pd.DataFrame(hourly_records_sample)

    daily_csv_path = os.path.join(RAW_WEATHER_DIR, "tamil_nadu_historical_weather_daily_2024.csv")
    hourly_csv_path = os.path.join(RAW_WEATHER_DIR, "tamil_nadu_historical_weather_hourly_2024.csv")

    df_daily.to_csv(daily_csv_path, index=False, encoding="utf-8")
    df_hourly.to_csv(hourly_csv_path, index=False, encoding="utf-8")

    logging.info(f"Saved {len(df_daily)} daily weather records to {daily_csv_path}")
    logging.info(f"Saved {len(df_hourly)} timestamped weather observations to {hourly_csv_path}")

    # Metadata
    metadata = {
        "dataset_name": "Tamil Nadu Historical Weather (Open-Meteo)",
        "source": "Open-Meteo Historical Archive API (ERA5/IFS)",
        "download_status": "SUCCESS" if success_locations > 0 else "FAILED",
        "daily_csv_file": os.path.relpath(daily_csv_path, BASE_DIR),
        "hourly_csv_file": os.path.relpath(hourly_csv_path, BASE_DIR),
        "daily_record_count": len(df_daily),
        "hourly_record_count": len(df_hourly),
        "locations_attempted": len(LOCATIONS_TN),
        "locations_successful": success_locations,
        "locations_failed": failed_locations,
        "reporting_period": f"{start_date} to {end_date} (Full Year 2024)",
        "variables_collected": [
            "Date", "Timestamp", "Temperature (Max/Min/Mean/Instant)",
            "Relative Humidity (%)", "Precipitation (mm)", "Wind Speed (km/h)",
            "Wind Direction (degrees)", "Atmospheric Pressure (hPa)",
            "Weather Code (WMO)", "Latitude", "Longitude", "Source"
        ],
        "districts_covered": sorted(list(set(df_daily["district"].unique()))),
        "districts_covered_count": len(df_daily["district"].unique()),
        "collection_timestamp": datetime.now().isoformat(),
        "duration_seconds": round((datetime.now() - start_time).total_seconds(), 2)
    }

    meta_file = os.path.join(METADATA_DIR, "weather_metadata.json")
    with open(meta_file, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    logging.info(f"Weather metadata written to {meta_file}")
    return metadata

if __name__ == "__main__":
    acquire_weather()
