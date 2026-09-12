import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const code=await readFile(new URL('../client.js',import.meta.url),'utf8');
const original={access_token:'expired',refresh_token:'refresh',expires_at:Date.now()/1000+3600};
function client(fetcher,hash=''){
 const store=new Map([['innerworld-supabase-session-v1',JSON.stringify(original)]]),listeners={};
 const context={fetch:fetcher,Response,AbortSignal,URLSearchParams,location:{hash,pathname:'/',origin:'https://studio.example'},history:{replaceState(){}},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},sessionStorage:{getItem:()=>null,removeItem(){}},navigator:{locks:{request:async(_,fn)=>fn()}},addEventListener:(e,fn)=>listeners[e]=fn};
 vm.runInNewContext(code,context);return{api:context.IWClient,store,listeners};
}
const json=(d,status=200)=>new Response(JSON.stringify(d),{status});
test('authenticated API refreshes one rejected token and preserves request identity',async()=>{
 const sent=[];let refreshes=0;
 const {api}=client(async(url,o)=>{
  if(url==='./api/config')return json({supabaseUrl:'https://db.example',supabaseKey:'public'});
  if(url.includes('/token?')){refreshes++;return json({access_token:'fresh',refresh_token:'next',expires_in:3600});}
  sent.push({auth:o.headers.Authorization,body:o.body});return o.headers.Authorization==='Bearer fresh'?json({ok:true}):json({error:'Expired'},401);
 });
 await api.init();assert.equal((await api.api('/api/generate',{requestId:'same-id'})).ok,true);
 assert.equal(refreshes,1);assert.equal(sent.length,2);assert.equal(sent[0].body,sent[1].body);
});
test('cross-tab signout removes the stale in-memory session',async()=>{
 const c=client(async()=>json({supabaseUrl:'https://db.example',supabaseKey:'public'}));await c.api.init();
 c.store.delete('innerworld-supabase-session-v1');c.listeners.storage({key:'innerworld-supabase-session-v1'});
 await assert.rejects(c.api.api('/api/membership'),/Sign in first/);
});
test('expired sign-in links produce an actionable message',async()=>{
 const c=client(async()=>json({supabaseUrl:'https://db.example',supabaseKey:'public'}),'#error=access_denied&error_description=expired');
 await assert.rejects(c.api.init(),/Request a fresh sign-in email/);
});
