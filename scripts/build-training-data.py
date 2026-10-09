"""Builds the /training page data from two exports that stay outside the repo.

  sleevemap-activities.csv   Strava history saved by SleeveMap (to July 2026)
  coros-sport-records.txt    COROS activity list (from April 2025)
  coros-routes.json          GPS tracks from COROS FIT files, keyed by start time

Strava stops when its API changed in July 2026, so COROS takes over from the last
Strava activity. Before that, COROS only adds activities Strava never had
(no match within 10 minutes), such as indoor runs.

Usage: python3 scripts/build-training-data.py <data dir>
"""
import csv, json, math, re, sys
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from pathlib import Path

DATA = Path(sys.argv[1])
ROOT = Path(__file__).resolve().parent.parent
NZ = ZoneInfo('Pacific/Auckland')
MATCH_WINDOW_S = 600

COROS_TYPES = {
    'Outdoor Run': 'Run', 'Track Run': 'Run', 'Trail Run': 'Run', 'Indoor Run': 'Run',
    'Walk': 'Walk', 'Hike': 'Hike', 'Cycling': 'Ride',
}
STRAVA_TYPES = {'Run': 'Run', 'TrailRun': 'Run', 'VirtualRun': 'Run', 'Walk': 'Walk', 'Hike': 'Hike',
                'Ride': 'Ride', 'MountainBikeRide': 'Ride', 'GravelRide': 'Ride'}


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


activities = []

# Strava, via SleeveMap
for r in csv.DictReader(open(DATA / 'sleevemap-activities.csv')):
    start = datetime.fromisoformat(r['start_date'].replace('+00', '+00:00'))
    activities.append({
        'start': int(start.timestamp()),
        'type': STRAVA_TYPES.get(r['type'], 'Other'),
        'km': float(r['distance_m'] or 0) / 1000,
        'secs': int(float(r['moving_time_s'] or 0)),
        'climb': float(r['elevation_m'] or 0),
        'route': json.loads(r['route'])['coordinates'] if r['route'] else None,
    })
strava_starts = sorted(a['start'] for a in activities)
cutoff = strava_starts[-1]

# COROS
text = json.load(open(DATA / 'coros-sport-records.txt'))
routes = json.load(open(DATA / 'coros-routes.json'))
for sport, body in re.findall(r'\d+\. (.+?) — \d{4}-\d\d-\d\d\n(.*?)(?=\n\n\d+\. |\Z)', text, re.S):
    start = int(re.search(r'startTimestamp=(\d+)', body).group(1))
    if start <= cutoff + 60:
        near = [s for s in strava_starts if abs(s - start) <= MATCH_WINDOW_S]
        if near:
            continue
    dist = re.search(r'Distance: ([\d.]+) (km|m)\b', body)
    dur = re.search(r'Duration: ([\d:]+)', body).group(1).split(':')
    hr = re.search(r'Avg HR: (\d+)', body)
    route = routes.get(str(start))
    activities.append({
        'start': start,
        'type': COROS_TYPES.get(sport, 'Other'),
        'km': float(dist.group(1)) / (1 if dist.group(2) == 'km' else 1000) if dist else 0,
        'secs': sum(int(x) * 60 ** i for i, x in enumerate(reversed(dur))),
        'climb': None,
        'hr': int(hr.group(1)) if hr else None,
        'route': simplify(route) if route and len(route) > 1 else None,
    })

activities.sort(key=lambda a: a['start'])

features = []
for a in activities:
    if a['route']:
        year = datetime.fromtimestamp(a['start'], NZ).year
        features.append([year, a['type'], encode(a['route'])])

summary = [
    [datetime.fromtimestamp(a['start'], NZ).strftime('%Y-%m-%d'), a['type'], round(a['km'], 2),
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
