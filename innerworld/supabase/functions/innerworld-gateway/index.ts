import {createClient} from 'npm:@supabase/supabase-js@2';
const headers={'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const json=(s:number,d:unknown)=>new Response(JSON.stringify(d),{status:s,headers});
const uuid=(s:unknown)=>typeof s==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(s);
const reject=(s:number,m:string)=>Object.assign(new Error(m),{status:s});
Deno.serve(async(req:Request)=>{
 if(req.method!=='POST')return json(405,{error:'Use POST.'});
 try{
  const supplied=req.headers.get('x-innerworld-gateway')||'';
  if(supplied.length<40||supplied.length>256)return json(401,{error:'Unauthorized gateway.'});
  const url=Deno.env.get('SUPABASE_URL')!,service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,anon=Deno.env.get('SUPABASE_ANON_KEY')!;
  const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(supplied)))].map(x=>x.toString(16).padStart(2,'0')).join('');
  const allowed=await admin.rpc('iw_gateway_auth',{p_hash:hash});if(allowed.error||allowed.data!==true)return json(401,{error:'Unauthorized gateway.'});
  const reader=req.body?.getReader();if(!reader)return json(400,{error:'Body required.'});let size=0;const chunks:Uint8Array[]=[];while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>17000000){await reader.cancel();return json(413,{error:'Request too large.'});}chunks.push(value);}const bytes=new Uint8Array(size);let off=0;for(const c of chunks){bytes.set(c,off);off+=c.length;}let b:any;try{b=JSON.parse(new TextDecoder().decode(bytes));}catch{return json(400,{error:'Invalid JSON.'});}
  if(!b||typeof b!=='object'||Array.isArray(b))return json(400,{error:'Invalid request.'});
  const rpc=async(name:string,args:unknown)=>{const r=await admin.rpc(name,args as any);if(r.error)throw reject(['PT409','40001','23505'].includes(r.error.code)?409:403,'The requested record is unavailable, changed, or lacks current consent.');return r.data;};
  const readImage=async(path:string)=>{const {data,error}=await admin.storage.from('innerworld-private').download(path);if(error||!data||data.size>12000000||!['image/png','image/jpeg','image/webp'].includes(data.type))throw reject(404,'Artwork unavailable.');const a=new Uint8Array(await data.arrayBuffer());let binary='';for(let i=0;i<a.length;i+=32768)binary+=String.fromCharCode(...a.subarray(i,i+32768));return 'data:'+data.type+';base64,'+btoa(binary);};
  if(b.action==='billing_ready')return json(200,{ready:await rpc('iw_billing_ready',{})});
  if(b.action==='push_claim')return json(200,await rpc('iw_push_claim',{}));
  if(b.action==='push_finish'){if(!uuid(b.id)||!uuid(b.lease)||!['sent','retry','gone','invalid'].includes(b.status))return json(400,{error:'Invalid delivery result.'});await rpc('iw_push_finish',{p_id:b.id,p_lease:b.lease,p_status:b.status});return json(200,{ok:true});}
  if(b.action==='share'){
   if(!/^[a-f0-9]{48}$/.test(b.token||''))return json(404,{error:'Share unavailable.'});
   const card=await rpc('iw_share_resolve',{p_token:b.token});if(!card)return json(404,{error:'This share expired or was revoked.'});
   const image=await readImage(card.imagePath);const still=await rpc('iw_share_resolve',{p_token:b.token});if(!still)return json(404,{error:'This share expired or was revoked.'});return json(200,{title:card.title,line:card.line,image});
  }
  const auth=req.headers.get('authorization')||'';if(!auth.startsWith('Bearer '))return json(401,{error:'Sign in first.'});
  const client=createClient(url,anon,{global:{headers:{Authorization:auth}},auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error}=await client.auth.getUser();if(error||!user)return json(401,{error:'Session expired. Sign in again.'});
  if(b.action==='member'){const s=await rpc('refresh_innerworld_subscription_for_user',{p_user_id:user.id});return json(200,{subscription:s,member:!!s&&['monthly','annual'].includes(s.plan)&&['active','trialing'].includes(s.status)&&Date.parse(s.current_period_end)>Date.now()});}
  if(b.action==='quota'){
   if(!['image','reflection'].includes(b.kind)||!uuid(b.requestId))return json(400,{error:'Invalid usage request.'});
   const q=await rpc('iw_reserve_request',{p_uid:user.id,p_kind:b.kind,p_request:b.requestId});if(!q?.allowed)return json(q?.duplicate?409:429,{error:q?.duplicate?'This request was already submitted. Check the result before retrying.':'Your daily request limit has been reached.',...q});return json(200,q);
  }
  if(!uuid(b.spaceId))return json(400,{error:'Invalid space.'});
  if(b.action==='shared_image'){
   if(!uuid(b.pieceId))return json(400,{error:'Invalid artwork.'});
   const r=await client.rpc('iw_space_read',{p_space:b.spaceId});const p=r.data?.pieces?.find((x:any)=>x.id===b.pieceId);if(r.error||!p)return json(404,{error:'Shared artwork is unavailable or consent was withdrawn.'});
   const image=await readImage(p.imagePath);const again=await client.rpc('iw_space_read',{p_space:b.spaceId});if(again.error||!again.data?.pieces?.some((x:any)=>x.id===b.pieceId))return json(404,{error:'Consent changed while loading this artwork.'});return json(200,{title:p.title,line:p.line,image});
  }
  if(!Number.isSafeInteger(b.version)||b.version<0)return json(400,{error:'Invalid scene version.'});
  if(b.action==='shared_context')return json(200,await rpc('iw_space_concept_context',{p_uid:user.id,p_space:b.spaceId,p_version:b.version}));
  const args={p_uid:user.id,p_space:b.spaceId,p_version:b.version};
  if(b.action==='shared_prompt'){
   const prompt=await rpc('iw_space_generate_context',args);const old=await admin.from('iw_relationship_pieces').select('id').eq('space_id',b.spaceId).eq('consent_version',b.version).limit(1);if(old.data?.length)return json(409,{error:'This version already has an artwork. Revise the scene to make another.'});return json(200,{prompt});
  }
  if(b.action==='shared_finish'){
   await rpc('iw_space_generate_context',args);if(typeof b.image!=='string'||b.image.length>16500000||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(b.image))return json(400,{error:'Invalid shared image.'});
   const data=Uint8Array.from(atob(b.image.slice(22)),c=>c.charCodeAt(0));if(data.length>12000000||![137,80,78,71,13,10,26,10].every((n,i)=>data[i]===n))return json(400,{error:'Invalid PNG.'});
   const path='shared/'+b.spaceId+'/'+crypto.randomUUID()+'.png';const upload=await admin.storage.from('innerworld-private').upload(path,data,{contentType:'image/png',upsert:false});if(upload.error)throw reject(503,'Could not store shared artwork.');
   try{const id=await rpc('iw_space_finish',{...args,p_path:path});return json(200,{id});}catch(e){await admin.storage.from('innerworld-private').remove([path]);throw e;}
  }
  return json(400,{error:'Unknown action.'});
 }catch(e){return json(e?.status||503,{error:e?.status?e.message:'The private service could not complete this request.'});}
});
