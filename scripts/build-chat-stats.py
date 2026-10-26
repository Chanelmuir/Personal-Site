"""Build app/<page>/stats.json from an Instagram group chat export.

Usage: python3 scripts/build-chat-stats.py <export folder with message_*.json> <page, e.g. chav>

Mostly counts. The only message text and media kept are the 10 most reacted messages
and 6 most reacted photos/videos (copied to public/<page>).
"""
import collections
import datetime
import glob
import json
import os
import re
import shutil
import subprocess
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
def norm(e):
    e = e.replace('\uFE0F', '')
    return '❤\uFE0F' if e == '❤' else e  # bare ❤ shows black on some phones

folder, page = sys.argv[1], sys.argv[2]  # e.g. ~/chav_123 chav
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

# Meta AI isn't a member, so its replies don't count
msgs = [m for m in msgs if m['sender_name'] != 'Meta AI']
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

# Coloured squares are Wordle results, not emoji anyone chose
SQUARES = set('🟩🟨⬛⬜🟥🟦🟧🟪🟫')
emojis = collections.Counter(norm(e) for m in real for e in EMOJI.findall(m['content']) if norm(e) not in SQUARES)
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

# Most reacted messages and media get shown in full. Skip screenshots of DMs from people outside the chat.
SKIP_MEDIA = {'2518273348677057.jpg', '704128799273984.jpg', '3275627849234908.jpg'}
files = {f.rsplit('/', 1)[-1]: f for f in glob.glob(f'{folder}/**/*', recursive=True)}
by_reactions = sorted(real, key=lambda m: -len(m.get('reactions', [])))
# In a small chat nearly every message tops out at the same few reactions, so a ranking means nothing
ranked = by_reactions if len(by_reactions[0].get('reactions', [])) >= 5 else []
caption = lambda m: {'name': name(m['sender_name']), 'date': m['when'].date().isoformat(), 'reactions': len(m.get('reactions', []))}
top_emojis = lambda m: [e for e, _ in collections.Counter(r['reaction'] for r in m.get('reactions', [])).most_common(3)]
top_messages = [caption(m) | {'text': m['content'], 'emojis': top_emojis(m)} for m in ranked if m['content'] and not m.get('share')][:10]

shutil.rmtree(f'public/{page}', ignore_errors=True)
os.makedirs(f'public/{page}')
top_media = []
for m in ranked:
    for x in m.get('photos', []) + m.get('videos', []):
        file = x['uri'].rsplit('/', 1)[-1]
        if file in SKIP_MEDIA or file not in files or len(top_media) == 6:
            continue
        if file.endswith('.mp4'):
            shutil.copy(files[file], f'public/{page}/{file}')
        else:
            from PIL import Image
            img = Image.open(files[file]).convert('RGB')
            img.thumbnail((800, 800))
            file = file.rsplit('.', 1)[0] + '.jpg'
            img.save(f'public/{page}/{file}', quality=82)
        top_media.append(caption(m) | {'src': f'/{page}/{file}', 'video': file.endswith('.mp4')})

# A conversation starts with the first message after 4 hours of quiet. A reply is a
# message straight after someone else's, inside a conversation.
QUIET = 4 * 3600 * 1000
starters = collections.Counter()
reply_secs = collections.defaultdict(list)
for prev, m in zip([None] + real, real):
    gap = m['timestamp_ms'] - prev['timestamp_ms'] if prev else QUIET
    if gap >= QUIET:
        starters[name(m['sender_name'])] += 1
    elif prev['sender_name'] != m['sender_name']:
        reply_secs[name(m['sender_name'])].append(gap / 1000)
median = lambda xs: sorted(xs)[len(xs) // 2]
fastest = sorted(((p, round(median(xs))) for p, xs in reply_secs.items() if len(xs) >= 50), key=lambda r: r[1])

# Longest run of days in a row with at least one message, and the longest silence
dates = sorted(datetime.date.fromisoformat(d) for d in days)
best = run = (dates[0], dates[0])
for a, b in zip(dates, dates[1:]):
    run = (run[0], b) if (b - a).days == 1 else (b, b)
    if (run[1] - run[0]) > (best[1] - best[0]):
        best = run
quiet = max(zip(real, real[1:]), key=lambda p: p[1]['timestamp_ms'] - p[0]['timestamp_ms'])

# Voice note lengths: from voice-note-lengths.tsv in the export folder (file<TAB>seconds) if it's
# there, otherwise ffprobe on the audio files the export has
lengths = {}
if os.path.exists(f'{folder}/voice-note-lengths.tsv'):
    lengths = {f: float(secs) for f, secs in (line.split('\t') for line in open(f'{folder}/voice-note-lengths.tsv'))}
voice = []
for m in msgs:
    for a in m.get('audio_files', []):
        file = a['uri'].rsplit('/', 1)[-1]
        if file not in lengths and file in files:
            probe = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', files[file]], capture_output=True, text=True)
            lengths[file] = float(probe.stdout or 0)
        if lengths.get(file):
            voice.append((name(m['sender_name']), m['when'].date().isoformat(), round(lengths[file])))
by_person = collections.defaultdict(list)
for who, _, secs in voice:
    by_person[who].append(secs)
voice_notes = voice and {
    'count': len(voice),
    'seconds': sum(v[2] for v in voice),
    'maxedOut': sum(v[2] >= 299 for v in voice),  # Instagram stops recording at 5 minutes
    'people': sorted(
        ({'name': who, 'count': len(xs), 'seconds': sum(xs), 'longest': max(xs), 'typical': median(xs)} for who, xs in by_person.items()),
        key=lambda p: -p['count'],
    ),
    'longest': [{'name': who, 'date': date, 'seconds': secs} for who, date, secs in sorted(voice, key=lambda v: -v[2])[:5]],
}

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
    'starters': starters.most_common(10),
    'conversations': sum(starters.values()),
    'fastest': fastest[:8],
    'streak': {'days': (best[1] - best[0]).days + 1, 'from': best[0].isoformat(), 'to': best[1].isoformat()},
    'quietest': {
        'days': round((quiet[1]['timestamp_ms'] - quiet[0]['timestamp_ms']) / 86_400_000, 1),
        'from': quiet[0]['when'].date().isoformat(),
        'to': quiet[1]['when'].date().isoformat(),
    },
    'topMessages': top_messages,
    'topMedia': top_media,
    'voiceNotes': voice_notes or None,
}

assert out['messages'] == sum(n for _, n in out['senders'])
assert out['messages'] == sum(map(sum, grid)) == sum(n for _, n in out['months'])
json.dump(out, open(f'app/{page}/stats.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(json.dumps({k: v for k, v in out.items() if k not in ('hours', 'months', 'senders', 'topMessages')}, ensure_ascii=False, indent=1))
