# SAFEYATRI Data Import Report

## Integrated records

- Tourist places: 1940; 3 source rows matching the preserved seed were excluded.
- Emergency facilities: 10164; 2 duplicate source records were excluded.
- Original seed records and Supabase records are preserved; runtime services append only nonduplicate integrated rows.

## Emergency facility types

| Source facility type | Integrated count |
| --- | ---: |
| Ambulance Station | 1 |
| Fire and Rescue Station | 60 |
| Government Hospital | 704 |
| Police Station | 445 |
| Primary Health Centre / Clinic | 4198 |
| Private Hospital | 4756 |

## District coverage

Counts below are computed only from the integrated tourist-place and emergency-facility records, excluding seed and database-only rows. The 56 labels are retained exactly as supplied and include aliases/localities; they are not a canonical list of 56 Tamil Nadu administrative districts.

| Source district/location label | Tourist places | Emergency facilities |
| --- | ---: | ---: |
| Ariyalur | 2 | 71 |
| Avadi | 0 | 1 |
| Chengalpattu | 110 | 429 |
| Chennai | 379 | 987 |
| Cherangode | 0 | 1 |
| Coimbatore | 59 | 513 |
| Cuddalore | 80 | 210 |
| Dharmapuri | 19 | 163 |
| Dindigul | 25 | 192 |
| Erode | 32 | 539 |
| Kallakurichi | 3 | 92 |
| Kancheepuram | 0 | 128 |
| Kanchipuram | 9 | 216 |
| Kanniyakumari | 0 | 178 |
| Kanyakumari | 168 | 46 |
| Karaikal | 0 | 3 |
| Karur | 7 | 145 |
| Krishnagiri | 24 | 116 |
| Madurai | 84 | 348 |
| Mayiladuthurai | 34 | 19 |
| Nagapattinam | 35 | 151 |
| Nagercoil | 0 | 2 |
| Namakkal | 12 | 184 |
| Nilgiris | 122 | 132 |
| Perambalur | 7 | 115 |
| Periyapatti | 0 | 1 |
| Puducherry | 0 | 2 |
| Pudukkottai | 31 | 181 |
| Ramanathapuram | 46 | 253 |
| Ranipet | 35 | 36 |
| Salem | 51 | 595 |
| Sivaganga | 9 | 265 |
| Tamil Nadu | 0 | 1 |
| Tenkasi | 59 | 130 |
| Thanjavur | 14 | 490 |
| Theni | 148 | 309 |
| Thiruvallur | 0 | 70 |
| Thiruvananthapuram | 0 | 1 |
| Thiruvarur | 0 | 69 |
| Thoothukkudi | 0 | 57 |
| Thoothukudi | 43 | 258 |
| Tiruchirapalli | 0 | 1 |
| Tiruchirappalli | 28 | 326 |
| Tirunelveli | 35 | 481 |
| Tirupathur | 51 | 5 |
| Tirupattur | 0 | 126 |
| Tiruppur | 9 | 220 |
| Tiruvallur | 23 | 192 |
| Tiruvannamalai | 30 | 180 |
| Tiruvarur | 11 | 168 |
| Tuticorin | 0 | 31 |
| Udumalpet | 0 | 1 |
| Vellore | 67 | 261 |
| Villupuram | 0 | 12 |
| Viluppuram | 24 | 222 |
| Virudhunagar | 15 | 239 |

## Encoding audit

- Checked all 1943 source tourist rows for common UTF-8-as-Latin mojibake signatures and Unicode replacement characters.
- Affected source records: 0 (none detected).
- Tamil labels are valid Unicode in the source CSV; no repair or guessed translation was applied.

## Validation and limits

- Coordinates were range-checked but not independently field-verified.
- The standalone emergency JSON is fetched only when emergency facilities are requested; it is not part of the initial JavaScript bundle.
- District coverage reflects the supplied integrated records only; it does not imply equal or complete coverage across districts.
- No ML training or scoring was started.
