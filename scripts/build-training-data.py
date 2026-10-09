"""Builds the /training page data from two exports that stay outside the repo.

  strava-activities.csv      activities.csv from the Strava account export
  sleevemap-activities.csv   Strava routes saved by SleeveMap (to July 2026)
  strava-routes.json         later routes from the export's GPS files, by activity id
  coros-sport-records.txt    COROS activity list (from April 2025)
  coros-routes.json          GPS tracks from COROS FIT files, keyed by start time

The Strava export is the activity list, treadmill and manual runs included.
Routes come from SleeveMap, or from COROS for later activities. COROS also adds
anything Strava doesn't have (no match within 10 minutes), such as runs after
the export.

Usage: python3 scripts/build-training-data.py <data dir>
"""
import csv, json, math, re, sys
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from pathlib import Path

from timezonefinder import TimezoneFinder

DATA = Path(sys.argv[1])
ROOT = Path(__file__).resolve().parent.parent
NZ = ZoneInfo('Pacific/Auckland')
MATCH_WINDOW_S = 600

COROS_TYPES = {
    'Outdoor Run': 'Run', 'Track Run': 'Run', 'Trail Run': 'Run', 'Indoor Run': 'Run',
    'Walk': 'Walk', 'Hike': 'Hike', 'Cycling': 'Ride',
}
STRAVA_TYPES = {'Run': 'Run', 'TrailRun': 'Run', 'VirtualRun': 'Run', 'Walk': 'Walk', 'Hike': 'Hike',
                'Ride': 'Ride', 'Velomobile': 'Ride', 'MountainBikeRide': 'Ride', 'GravelRide': 'Ride'}


def encode(coords):
    out, prev = [], [0, 0]
    for lng, lat in coords:
        for i, v in enumerate((round(lat * 1e5), round(lng * 1e5))):
            d, prev[i] = v - prev[i], v
            d = ~(d << 1) if d < 0 else d << 1
            while d >= 0x20:
                out.append(chr((0x20 | (d & 0x1F)) + 63))
                d >>= 5
            out.append(chr(d + 63))
    return ''.join(out)


def simplify(coords, tol=0.0001):
    """Douglas-Peucker, to match SleeveMap's ST_Simplify(route, 0.0001)."""
    if len(coords) < 3:
        return coords
    keep = [False] * len(coords)
    keep[0] = keep[-1] = True
    stack = [(0, len(coords) - 1)]
    while stack:
        s, e = stack.pop()
        (x1, y1), (x2, y2) = coords[s], coords[e]
        dx, dy = x2 - x1, y2 - y1
        n = math.hypot(dx, dy) or 1e-12
        best, idx = 0, None
        for i in range(s + 1, e):
            x, y = coords[i]
            d = abs(dy * x - dx * y + x2 * y1 - y2 * x1) / n
            if d > best:
                best, idx = d, i
        if idx is not None and best > tol:
            keep[idx] = True
            stack += [(s, idx), (idx, e)]
    return [c for c, k in zip(coords, keep) if k]


def num(v):
    return float(v) if v else None


# Strava, from the account export. Its header repeats some names (Distance in km,
# then in metres), so read columns by position.
sleevemap = {r['strava_id']: r['route'] for r in csv.DictReader(open(DATA / 'sleevemap-activities.csv'))}
export_routes = json.load(open(DATA / 'strava-routes.json'))
rows = list(csv.reader(open(DATA / 'strava-activities.csv', encoding='utf-8-sig')))
col = {name: i for i, name in reversed(list(enumerate(rows[0])))}  # first occurrence
activities = []
for r in rows[1:]:
    start = datetime.strptime(r[col['Activity Date']], '%b %d, %Y, %I:%M:%S %p').replace(tzinfo=timezone.utc)
    metres = num(r[17]) or (num(r[6]) or 0) * 1000
    aid = r[col['Activity ID']]
    if sleevemap.get(aid):
        route = json.loads(sleevemap[aid])['coordinates']
    else:
        route = simplify(export_routes[aid]) if aid in export_routes else None
    activities.append({
        'start': int(start.timestamp()),
        'type': STRAVA_TYPES.get(r[col['Activity Type']], 'Other'),
        'km': metres / 1000,
        'secs': int(num(r[16]) or num(r[5]) or 0),
        'climb': num(r[col['Elevation Gain']]),
        'hr': round(num(r[col['Average Heart Rate']])) if r[col['Average Heart Rate']] else None,
        'route': route,
    })
strava_starts = sorted(a['start'] for a in activities)
cutoff = strava_starts[-1]


def strava_match(start):
    return next((a for a in activities if abs(a['start'] - start) <= MATCH_WINDOW_S), None)


# COROS fills in routes Strava's export lacks, and adds anything Strava never got
text = json.load(open(DATA / 'coros-sport-records.txt'))
routes = json.load(open(DATA / 'coros-routes.json'))
for sport, body in re.findall(r'\d+\. (.+?) — \d{4}-\d\d-\d\d\n(.*?)(?=\n\n\d+\. |\Z)', text, re.S):
    start = int(re.search(r'startTimestamp=(\d+)', body).group(1))
    at = re.search(r'Start Coordinates: (-?[\d.]+), (-?[\d.]+)', body)
    at = (float(at.group(2)), float(at.group(1))) if at else None
    route = routes.get(str(start))
    route = simplify(route) if route and len(route) > 1 else None
    match = strava_match(start)
    if match:
        match['route'] = match['route'] or route
        match['at'] = at
        continue
    dist = re.search(r'Distance: ([\d.]+) (km|m)\b', body)
    dur = re.search(r'Duration: ([\d:]+)', body).group(1).split(':')
    hr = re.search(r'Avg HR: (\d+)', body)
    activities.append({
        'start': start,
        'type': COROS_TYPES.get(sport, 'Other'),
        'km': float(dist.group(1)) / (1 if dist.group(2) == 'km' else 1000) if dist else 0,
        'secs': sum(int(x) * 60 ** i for i, x in enumerate(reversed(dur))),
        'climb': None,
        'hr': int(hr.group(1)) if hr else None,
        'route': route,
        'at': at,
    })

activities.sort(key=lambda a: a['start'])

# Dates are in each activity's local time zone, looked up from where it started.
# Activities with no location (treadmill, manual) take the zone of the one before.
finder, tz = TimezoneFinder(), NZ
for a in activities:
    lng, lat = a['route'][0] if a['route'] else a.get('at') or (0, 0)
    name = finder.timezone_at(lng=lng, lat=lat) if (lng, lat) != (0, 0) else None
    if name and not name.startswith('Etc/'):
        tz = ZoneInfo(name)
    a['tz'] = tz

features = []
for a in activities:
    if a['route']:
        year = datetime.fromtimestamp(a['start'], a['tz']).year
        features.append([year, a['type'], encode(a['route'])])

summary = [
    [datetime.fromtimestamp(a['start'], a['tz']).strftime('%Y-%m-%d'), a['type'], round(a['km'], 2),
     a['secs'], None if a['climb'] is None else round(a['climb']), a.get('hr')]
    for a in activities
]

(ROOT / 'public' / 'training').mkdir(parents=True, exist_ok=True)
json.dump(features, open(ROOT / 'public' / 'training' / 'routes.json', 'w'), separators=(',', ':'))
json.dump(summary, open(ROOT / 'app' / 'training' / 'activities.json', 'w'), separators=(',', ':'))
json.dump({'syncedAt': datetime.now(timezone.utc).isoformat(timespec='seconds')},
          open(ROOT / 'app' / 'training' / 'synced.json', 'w'))
print(f'{len(activities)} activities, {sum(a["km"] for a in activities):.0f} km, '
      f'{len(features)} routes, cutoff {datetime.fromtimestamp(cutoff, timezone.utc)}')
