import requests
import json

overpass_endpoints = [
    "https://overpass-api.de/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter"
]

query = """
[out:json][timeout:90];
area["ISO3166-2"="IN-TN"][admin_level=4]->.tn;
(
  node["tourism"~"attraction|viewpoint|museum|zoo|theme_park"](area.tn);
  way["tourism"~"attraction|viewpoint|museum|zoo|theme_park"](area.tn);
);
out count;
"""

headers = {
    "User-Agent": "SafeYatri-TN-DataCollector/1.0 (safeyatri.research@gmail.com)",
    "Accept": "application/json"
}

success = False
for endpoint in overpass_endpoints:
    print(f"Testing endpoint: {endpoint}...")
    try:
        resp = requests.post(endpoint, data={"data": query}, headers=headers, timeout=45)
        if resp.status_code == 200:
            print("Response:", resp.json())
            success = True
            break
        else:
            print(f"Failed with status: {resp.status_code}, text: {resp.text[:200]}")
    except Exception as e:
        print(f"Error: {e}")

if not success:
    print("Could not query by area; trying bounding box or relation...")
