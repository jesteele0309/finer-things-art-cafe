import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.dirname(fileURLToPath(import.meta.url));
const files=new Map([['/','index.html'],['/index.html','index.html'],['/styles.css','styles.css'],['/app.js','app.js'],['/core.js','core.js'],['/roll-a-portrait.html','roll-a-portrait.html'],['/assets/before-you-are-ready.png','assets/before-you-are-ready.png']]);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png'};
export function createApp({key=process.env.OPENAI_API_KEY,model=process.env.OPENAI_IMAGE_MODEL||'gpt-image-1',providerFetch=fetch}={}){
 let active=false,attempts=[];
 return http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Cache-Control','no-store');
  const send=(status,body)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(body));};
  const host=req.headers.host||'';
  // This development server intentionally binds to loopback only. Reject DNS rebinding.
  if(!/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host))return send(403,{error:'Local access only.'});
  const route=new URL(req.url,`http://${host}`).pathname;
  if(req.method==='GET'&&route==='/api/status')return send(200,{configured:!!key});
  if(req.method==='POST'&&route==='/api/generate'){
   if(req.headers.origin!==`http://${host}`||req.headers['content-type']!=='application/json')return send(403,{error:'Same-origin JSON requests only.'});
   if(!key)return send(503,{error:'Image service is not configured. Add a server-side API key to enable generation.'});
   attempts=attempts.filter(t=>Date.now()-t<3600000);
   if(active||attempts.length>=10)return send(429,{error:'Generation is busy or the local hourly limit is reached. Try later.'});
   let body='';try{for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>16000){send(413,{error:'Prompt is too large.'});return;}}}catch{return send(400,{error:'Could not read prompt.'});}
   let payload;try{payload=JSON.parse(body);}catch{return send(400,{error:'Invalid JSON.'});}
   if(typeof payload.prompt!=='string'||!payload.prompt.trim()||payload.prompt.length>2500||Object.keys(payload).some(k=>k!=='prompt'))return send(400,{error:'Send only a scene prompt, up to 2,500 characters.'});
   active=true;attempts.push(Date.now());
   try{const response=await providerFetch('https://api.openai.com/v1/images/generations',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model,prompt:payload.prompt,n:1,size:'1024x1536',quality:'medium'}),signal:AbortSignal.timeout(210000)});
    if(!response.ok)return send(502,{error:'The image provider could not complete this request. Check account access, billing, limits or the scene prompt. Your note was not sent.'});
    const result=await response.json();const b64=result.data?.[0]?.b64_json;if(typeof b64!=='string'||!b64.length)return send(502,{error:'No image was returned. Your prompt is preserved.'});
    send(200,{image:`data:image/png;base64,${b64}`});
   }catch{return send(502,{error:'Image service timed out or is unavailable. Your prompt is preserved.'});}finally{active=false;}return;
  }
  if(req.method!=='GET')return send(405,{error:'Method not allowed.'});
  const file=files.get(route);if(!file)return send(404,{error:'Not found.'});
  try{const bytes=await readFile(path.join(root,file));res.writeHead(200,{'Content-Type':types[path.extname(file)]});res.end(bytes);}catch{send(404,{error:'File not found.'});}
 });
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))createApp().listen(Number(process.env.PORT)||3000,'127.0.0.1',()=>console.log('INNERWORLD local development server ready.'));
