import requests

q = """
[out:json][timeout:60];
area["ISO3166-2"="IN-TN"][admin_level=4]->.tn;
relation["boundary"="administrative"]["admin_level"="5"](area.tn);
out tags;
"""

r = requests.post('https://overpass-api.de/api/interpreter', data={'data': q}, headers={'User-Agent': 'SafeYatri-GIS/1.0'})
print('Status:', r.status_code)
d = r.json()
print('Elements:', len(d.get('elements', [])))
for el in d.get('elements', []):
    tags = el.get('tags', {})
    print(el.get('id'), tags.get('name'), '|', tags.get('name:en'), '|', tags.get('ISO3166-2'))
