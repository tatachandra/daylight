"""Local-only integration check. Creates and removes its own synthetic records."""
import json
import http.cookiejar
import urllib.request
import urllib.error
import uuid
import re
import sqlite3
from pathlib import Path

BASE = 'http://localhost:5173'
DAY = '2020-06-15'
cookie = http.cookiejar.CookieJar()
client = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookie))

def request(path, data=None, signed=True, extra=None):
    headers = {'Content-Type': 'application/json'} if data is not None else {}
    headers.update(extra or {})
    req = urllib.request.Request(BASE + path, data=json.dumps(data).encode() if data is not None else None, headers=headers)
    try:
        with (client.open(req, timeout=30) if signed else urllib.request.urlopen(req, timeout=30)) as res:
            return res.status, json.loads(res.read()), res.headers
    except urllib.error.HTTPError as error:
        text = error.read()
        try:
            payload = json.loads(text)
        except ValueError:
            payload = {'error': 'Non-JSON error response'}
        return error.code, payload, error.headers

query = f'/api/wellness?from={DAY}&to={DAY}'
assert request(query, signed=False)[0] == 401
assert request(query, signed=False, extra={'oai-authenticated-user-id': 'forged', 'oai-authenticated-user-email': 'fake@example.test'})[0] == 401
with client.open(BASE + '/signin-with-chatgpt?return_to=/wellness', timeout=30) as res:
    assert res.status == 200
status, before, headers = request(query)
assert status == 200
assert 'no-store' in headers.get('Cache-Control', '')
entry_id = str(uuid.uuid4())
workout_id = str(uuid.uuid4())
entry = {'id': entry_id, 'day': DAY, 'data': {'type': 'meal', 'meal': 'Lunch', 'notes': 'LOCAL API TEST', 'items': [
    {'foodId': '172421', 'name': 'ignored client name', 'grams': 200, 'portion': '200 g', 'certainty': 'estimated'},
    {'foodId': None, 'name': 'Unlisted synthetic stew', 'grams': None, 'portion': 'a bowl', 'certainty': 'unknown'}]}}
try:
    assert request('/api/wellness', {'action': 'save-entry', 'entry': entry}, extra={'Origin': 'https://untrusted.example'})[0] == 403
    assert request('/api/wellness', {'action': 'save-entry', 'entry': entry, 'userId': 'another-user'})[0] == 400
    assert request('/api/wellness', {'action': 'save-entry', 'entry': entry}, extra={'Origin': BASE})[0] == 200
    status, after, _ = request(query)
    saved = next(e for e in after['entries'] if e['id'] == entry_id)
    assert 'Lentils' in saved['data']['items'][0]['name']
    # Use this synthetic day, but don't assume no preexisting entries there.
    prior_protein = before['summary']['nutrients']['1003']['value'] or 0
    assert abs(after['summary']['nutrients']['1003']['value'] - prior_protein - 18.04) < 0.001
    assert after['summary']['unknownPortions'] == before['summary']['unknownPortions'] + 1
    entry['data']['items'][0]['grams'] = 100
    assert request('/api/wellness', {'action': 'save-entry', 'entry': entry})[0] == 200
    assert abs(request(query)[1]['summary']['nutrients']['1003']['value'] - prior_protein - 9.02) < 0.001
    activity = {'id': workout_id, 'day': DAY, 'data': {'type': 'workout', 'activity': 'Synthetic test walk', 'minutes': 30, 'steps': 3200, 'calories': None, 'notes': 'LOCAL API TEST'}}
    assert request('/api/wellness', {'action': 'save-entry', 'entry': activity})[0] == 200
    assert next(e for e in request(query)[1]['entries'] if e['id'] == workout_id)['data']['calories'] is None
    assert request('/api/wellness', {'action': 'complete-day', 'day': DAY, 'complete': True})[0] == 200
    assert DAY in request(query)[1]['completeDays']
    settings = {**before['settings'], 'diet': 'vegan', 'avoid': ['Soy', 'Tree nuts']}
    assert request('/api/wellness', {'action': 'save-settings', 'settings': settings})[0] == 200
    assert request(query)[1]['settings'] == settings
finally:
    for id in [entry_id, workout_id]:
        assert request('/api/wellness', {'action': 'delete-entry', 'id': id})[0] == 200
    request('/api/wellness', {'action': 'save-settings', 'settings': before['settings']})
    request('/api/wellness', {'action': 'complete-day', 'day': DAY, 'complete': DAY in before['completeDays']})
assert not any(e['id'] in [entry_id, workout_id] for e in request(query)[1]['entries'])

# Check the actual prepared queries with two users in an isolated database.
db = sqlite3.connect(':memory:')
db.executescript(Path('drizzle/0000_ordinary_harrier.sql').read_text())
source = Path('app/api/wellness/route.ts').read_text()
upsert = re.search(r"db.prepare\('(INSERT INTO wellness_entries[^']+)'\)", source).group(1)
delete = re.search(r"db.prepare\('(DELETE FROM wellness_entries[^']+)'\)", source).group(1)
read = re.search(r"db.prepare\('(SELECT id,day,data_json,created_at[^']+)'\)", source).group(1)
db.execute(upsert, ('same-id', 'alice', DAY, 'meal', 'alice-data', 'now', 'now', 'alice'))
assert db.execute(upsert, ('same-id', 'bob', DAY, 'meal', 'bob-data', 'now', 'now', 'bob')).rowcount == 0
assert not db.execute(read, ('bob', DAY, DAY)).fetchall()
assert db.execute(delete, ('same-id', 'bob')).rowcount == 0
assert db.execute(read, ('alice', DAY, DAY)).fetchone()[2] == 'alice-data'
print('PASS: sign-in, forged-header rejection, no-store, origin protection, meal create/edit/delete, workout persistence, goals, complete-day, and per-user SQL isolation.')
