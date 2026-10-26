"""Build app/chav/stats.json from an Instagram group chat export.

Usage: python3 scripts/build-chat-stats.py <export folder with message_*.json>

Only counts go into the output, never message text, since the chat isn't just mine.
"""
import collections
import datetime
import glob
import json
import re
import sys
from zoneinfo import ZoneInfo

NZ = ZoneInfo('Pacific/Auckland')

# Instagram writes UTF-8 bytes as if they were Latin-1
def fix(s):
    try:
        return s.encode('latin-1').decode('utf-8')
    except (UnicodeEncodeError, UnicodeDecodeError):
        return s

# Notices Instagram puts in the chat as if someone sent them
NOTICE = re.compile(
    r'liked a message$|^Reacted .* to your message|reacted .* to your message|sent an attachment\.$'
    r'|to the group\.$|left the group\.$|from the group\.$|started a video chat$|set the nickname for|named the group'
)
EMOJI = re.compile(
    '(?:[\U0001F1E6-\U0001F1FF]{2}'
    '|[\U0001F000-\U0001FAFF☀-➿⬀-⯿⌀-⏿][️\U0001F3FB-\U0001F3FF]*'
    '(?:‍[\U0001F000-\U0001FAFF☀-➿♀♂][️\U0001F3FB-\U0001F3FF]*)*)'
)
# Treat ❤ and ❤️ (and other emoji with or without the variation selector) as one
norm = lambda e: e.replace('️', '')

folder = sys.argv[1]
msgs = []
for f in sorted(glob.glob(f'{folder}/message_*.json')):
    msgs += json.load(open(f, encoding='utf-8'))['messages']
msgs.sort(key=lambda m: m['timestamp_ms'])

for m in msgs:
    m['sender_name'] = fix(m['sender_name'])
    m['content'] = fix(m.get('content', ''))
    m['when'] = datetime.datetime.fromtimestamp(m['timestamp_ms'] / 1000, NZ)
    for r in m.get('reactions', []):
        r['reaction'] = norm(fix(r['reaction']))
        r['actor'] = fix(r['actor'])

real = [m for m in msgs if not (m['content'] and NOTICE.search(m['content'])) and not m.get('is_unsent')]

# First names only, plus a last initial where two people share one
def short(full):
    if full == 'Instagram User':
        return 'Deleted account'
    parts = full.split()
    if len(parts) > 1 and all(len(p) == 1 for p in parts[:-1]):  # "T A M A R A 🌸"
        return full
    return parts[0].title() if parts[0].isupper() else parts[0]

everyone = {m['sender_name'] for m in msgs} | {r['actor'] for m in msgs for r in m.get('reactions', [])}
firsts = collections.Counter(short(n) for n in everyone)
def name(full):
    s = short(full)
    parts = full.split()
    return f'{s} {parts[-1][0]}.' if firsts[s] > 1 and len(parts) > 1 else s

sent = collections.Counter(name(m['sender_name']) for m in real)
received = collections.Counter()
given = collections.Counter()
reactions = collections.Counter()
for m in msgs:
    for r in m.get('reactions', []):
        received[name(m['sender_name'])] += 1
        given[name(r['actor'])] += 1
        reactions[r['reaction']] += 1

emojis = collections.Counter(norm(e) for m in real for e in EMOJI.findall(m['content']))
months = collections.Counter(m['when'].strftime('%Y-%m') for m in real)
days = collections.Counter(m['when'].date().isoformat() for m in real)
grid = [[0] * 24 for _ in range(7)]  # Monday first
for m in real:
    grid[m['when'].weekday()][m['when'].hour] += 1

# Night owl: biggest share of their messages between 11pm and 4am, among people with 100+
def share(person, hours):
    mine = [m for m in real if name(m['sender_name']) == person]
    return sum(m['when'].hour in hours for m in mine) / len(mine)
regulars = [p for p, n in sent.items() if n >= 100]
owl = max(regulars, key=lambda p: share(p, {23, 0, 1, 2, 3}))
bird = max(regulars, key=lambda p: share(p, {5, 6, 7}))

first_month, last_month = min(months), max(months)
all_months = []
y, mo = map(int, first_month.split('-'))
while f'{y}-{mo:02d}' <= last_month:
    all_months.append(f'{y}-{mo:02d}')
    y, mo = (y + 1, 1) if mo == 12 else (y, mo + 1)

busiest_day, busiest_count = days.most_common(1)[0]
media = sum(len(m.get('photos', [])) + len(m.get('videos', [])) + len(m.get('audio_files', [])) for m in msgs)

out = {
    'from': real[0]['when'].date().isoformat(),
    'to': real[-1]['when'].date().isoformat(),
    'messages': len(real),
    'people': len(sent),
    'reactions': sum(reactions.values()),
    'media': media,
    'links': sum('share' in m for m in msgs),
    'activeDays': len(days),
    'busiestDay': {'date': busiest_day, 'messages': busiest_count},
    'mostReacted': max(len(m.get('reactions', [])) for m in msgs),
    'nightOwl': {'name': owl, 'share': round(share(owl, {23, 0, 1, 2, 3}), 3)},
    'earlyBird': {'name': bird, 'share': round(share(bird, {5, 6, 7}), 3)},
    'senders': sent.most_common(),
    'received': received.most_common(10),
    'given': given.most_common(10),
    'topReactions': reactions.most_common(10),
    'topEmojis': emojis.most_common(12),
    'months': [[mo, months[mo]] for mo in all_months],
    'hours': grid,
}

assert out['messages'] == sum(n for _, n in out['senders'])
assert out['messages'] == sum(map(sum, grid)) == sum(n for _, n in out['months'])
json.dump(out, open('app/chav/stats.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(json.dumps({k: v for k, v in out.items() if k not in ('hours', 'months', 'senders')}, ensure_ascii=False, indent=1))
