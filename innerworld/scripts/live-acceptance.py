"""Production API acceptance with disposable, pre-provisioned test accounts.

Credentials are read from a separate private file, never logged or committed.
This sends only synthetic sample material. --generate makes three billable image
requests. Run cleanup for the recorded fixture IDs after collecting evidence.
"""
import argparse, base64, hashlib, json, pathlib, time, urllib.error, urllib.request, uuid

p = argparse.ArgumentParser()
p.add_argument('--credentials', required=True)
p.add_argument('--output', required=True)
p.add_argument('--origin', default='https://innerworld-web-production.up.railway.app')
p.add_argument('--generate', action='store_true')
p.add_argument('--finish', action='store_true', help='Resume remaining checks from the saved sample snapshot')
args = p.parse_args()
if args.generate and args.finish:
    p.error('--generate needs a complete fresh run; it cannot be combined with --finish')
out = pathlib.Path(args.output)
out.mkdir(parents=True, exist_ok=True)
out.chmod(0o700)
checks = json.loads((out/'results.json').read_text()) if args.finish and (out/'results.json').exists() else []
users = json.loads(pathlib.Path(args.credentials).read_text())
tokens = {}

def check(name, passed=True):
    checks[:] = [c for c in checks if c['name'] != name]
    checks.append({'name': name, 'passed': bool(passed)})
    (out / 'results.json').write_text(json.dumps(checks, indent=2))
    print(('PASS ' if passed else 'FAIL ') + name, flush=True)
    assert passed, name

def http(url, data=None, headers=None, method=None, binary=False, expect=(200,201,204)):
    h = dict(headers or {})
    if data is not None and not isinstance(data, bytes):
        data = json.dumps(data).encode()
        h['Content-Type'] = 'application/json'
    req = urllib.request.Request(url, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(req, timeout=175 if args.generate else 45) as r:
            status, body = r.status, r.read()
    except urllib.error.HTTPError as e:
        status, body = e.code, e.read()
    if status not in expect:
        message = body.decode(errors='replace')[:400]
        raise RuntimeError(f'Unexpected HTTP {status} at {url.split("?")[0]}: {message}')
    return body if binary else json.loads(body) if body else None

cfg = http(args.origin+'/api/config')
su, pk = cfg['supabaseUrl'], cfg['supabaseKey']

def headers(i):
    return {'apikey': pk, 'Authorization': 'Bearer '+tokens[i]}

def api(i, path, data, expect=(200,)):
    return http(args.origin+path, data, {**(headers(i) if i is not None else {}), 'Origin': args.origin}, expect=expect)

def rpc(i, name, data=None, expect=(200,204)):
    return http(su+'/rest/v1/rpc/'+name, data or {}, headers(i), expect=expect)

for i, u in enumerate(users):
    s = http(su+'/auth/v1/token?grant_type=password', {'email':u['email'], 'password':u['password']}, {'apikey':pk})
    assert s['user']['id'] == u['id']
    tokens[i] = s['access_token']
check('Three isolated accounts authenticate through production Supabase Auth')

if args.finish:
    checks=json.loads((out/'results.json').read_text())
    loaded=http(su+'/rest/v1/iw_studio_snapshots?select=revision,document',headers=headers(0))
    doc=loaded[0]['document']
    path=doc['pieces'][0]['imagePath']
    space=json.loads((out/'fixture.json').read_text())['space']
    scene=rpc(0,'iw_space_read',{'p_space':space})
    print('Resuming cloud conflict, sharing and revocation checks.',flush=True)
else:
    m = api(0, '/api/membership', {})
    check('Production gateway resolves free account membership', m['member'] is False)
    chart = api(0, '/api/astrology', {'consent':True, 'birth':{'date':'1990-01-15','time':'12:00','timezone':'America/New_York','lat':40.7128,'lng':-74.006}})
    check('Production astrology computes timezone, ten planets and twelve houses', len(chart['natal'])==10 and len(chart['houses'])==12 and chart['birthISO']=='1990-01-15T17:00:00.000Z')

    space = rpc(0,'iw_space_create',{'p_title':'Disposable release acceptance'})
    (out/'fixture.json').write_text(json.dumps({'space':space,'users':[u['id'] for u in users]}))
    invite = rpc(0,'create_innerworld_relationship_invite',{'p_space_id':space,'p_email':users[1]['email']})
    rpc(2,'accept_innerworld_relationship_invite',{'p_token':invite},expect=(400,403))
    check('A restricted invitation rejects a different signed-in account')
    assert rpc(1,'accept_innerworld_relationship_invite',{'p_token':invite}) == space
    check('The invited second account can join')
    rpc(0,'iw_space_contribute',{'p_space':space,'p_body':'One red vessel, with space around it.','p_consent':True})
    rpc(1,'iw_space_contribute',{'p_space':space,'p_body':'One blue vessel, beside an open window.','p_consent':True})
    scene = rpc(0,'iw_space_read',{'p_space':space})
    rpc(0,'iw_space_prompt_checked',{'p_space':space,'p_version':scene['version'],'p_prompt':'An editorial still life of two different handmade vessels on a linen-covered table, muted red and blue, daylight from an open window. No text.'})
    scene = rpc(0,'iw_space_read',{'p_space':space})
    for i in [0,1]: rpc(i,'iw_space_approve',{'p_space':space,'p_version':scene['version']})
    scene = rpc(1,'iw_space_read',{'p_space':space})
    check('Both accounts approve the identical stored scene version', all(m['approvedVersion']==scene['version'] for m in scene['members']))
    api(2,'/api/shared/generate',{'spaceId':space,'version':scene['version'],'consent':True,'requestId':str(uuid.uuid4())},expect=(403,404))
    check('A third account cannot generate in the private shared space')

    if args.generate:
        reflection = api(0,'/api/interpret',{'requestId':str(uuid.uuid4()),'consent':True,'theme':'rest','experience':'A synthetic acceptance example: making time for a quiet creative practice.','mood':'quiet','visual_language':{'medium':'tactile collage','palette':'terracotta','motifs':['window','bowl']}})
        check('Real production reflection returns structured interpretation and visual concept', all(reflection.get(k) for k in ['title','line','reflection','visual_concept','why_this']))
        request_id = str(uuid.uuid4())
        generated = api(0,'/api/generate',{'requestId':request_id,'consent':True,'prompt':reflection['visual_concept'],'references':[]})
        data = base64.b64decode(generated['image'].split(',')[1])
        check('Real production image generation returns a PNG', data[:8]==bytes([137,80,78,71,13,10,26,10]))
        (out/'generated.png').write_bytes(data)
        api(0,'/api/generate',{'requestId':request_id,'consent':True,'prompt':reflection['visual_concept']},expect=(409,))
        check('Reusing a request ID does not trigger another provider request')
    else:
        data = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jYwAAAABJRU5ErkJggg==')

    path = users[0]['id']+'/pieces/'+hashlib.sha256(data).hexdigest()+'.png'
    http(su+'/storage/v1/object/innerworld-private/'+path,data,{**headers(0),'Content-Type':'image/png','x-upsert':'false'})
    loaded = http(su+'/storage/v1/object/authenticated/innerworld-private/'+path,headers=headers(0),binary=True)
    check('Artwork survives upload and independent private storage retrieval', loaded==data)
    http(su+'/storage/v1/object/authenticated/innerworld-private/'+path,headers=headers(1),expect=(400,403,404))
    check('Another authenticated account cannot read private artwork')

    piece_id, chapter_id = str(uuid.uuid4()),str(uuid.uuid4())
    doc={'app':'the-finer-things','version':6,'profile':{'name':'Release test','references':[]},'pieces':[{'id':piece_id,'date':'2026-09-11','theme':'rest','title':'Synthetic saved artwork','line':'A public line','note':'PRIVATE_ACCEPTANCE_NOTE','kind':'ai' if args.generate else 'imported','imagePath':path}], 'chapters':[{'id':chapter_id,'title':'Acceptance chapter','description':'Synthetic sample','ids':[piece_id]}]}
    revision=rpc(0,'iw_save_studio',{'p_document':doc,'p_revision':0})
    loaded=http(su+'/rest/v1/iw_studio_snapshots?select=revision,document',headers=headers(0))
    check('Cloud archive round trip preserves journal and chapter order', loaded[0]['document']==doc and loaded[0]['revision']==revision)
rpc(0,'iw_save_studio',{'p_document':doc,'p_revision':0},expect=(409,))
check('A stale device upload is rejected')
other=http(su+'/rest/v1/iw_studio_snapshots?select=revision,document&user_id=eq.'+users[0]['id'],headers=headers(1))
check('Cloud snapshots remain isolated across accounts', other==[])

share=rpc(0,'iw_share_create_card',{'p_title':'Synthetic saved artwork','p_line':'A public line','p_path':path,'p_days':1})
card=api(None,'/api/share',{'token':share})
check('Anonymous art card contains only image, title and chosen line',set(card)=={'image','title','line'} and 'PRIVATE_ACCEPTANCE_NOTE' not in json.dumps(card))
shares=http(su+'/rest/v1/iw_share_cards?select=id',headers=headers(0))
rpc(0,'iw_share_revoke',{'p_id':shares[0]['id']})
api(None,'/api/share',{'token':share},expect=(404,))
check('Revoking a share immediately blocks subsequent public retrieval')

if args.generate:
    generated=api(1,'/api/shared/generate',{'spaceId':space,'version':scene['version'],'consent':True,'requestId':str(uuid.uuid4())})
    shared_id=generated['id']
    for i in [0,1]:
        result=api(i,'/api/shared/image',{'spaceId':space,'pieceId':shared_id})
        assert result['image'].startswith('data:image/png;base64,')
    check('Both consenting accounts can retrieve real shared generated artwork')
    rpc(1,'iw_space_revoke',{'p_space':space})
    api(0,'/api/shared/image',{'spaceId':space,'pieceId':shared_id},expect=(403,404))
    check('Consent withdrawal blocks existing shared artwork retrieval')
    edit=api(2,'/api/generate',{'requestId':str(uuid.uuid4()),'consent':True,'prompt':'Keep this synthetic composition. Change one vessel to cobalt blue. No text.','references':['data:image/png;base64,'+base64.b64encode(data).decode()]})
    edited=base64.b64decode(edit['image'].split(',')[1])
    check('Real reference-image editing returns a new PNG',edited[:8]==data[:8] and edited!=data)
    (out/'edited.png').write_bytes(edited)
else:
    rpc(1,'iw_space_revoke',{'p_space':space})
    api(0,'/api/shared/generate',{'spaceId':space,'version':scene['version'],'consent':True,'requestId':str(uuid.uuid4())},expect=(403,404))
    check('Withdrawn consent prevents generation')

for i in range(3):
    http(su+'/auth/v1/logout',data={},headers=headers(i))
check('Acceptance sessions signed out')
print(f'Completed {len(checks)} live API acceptance checks.',flush=True)
