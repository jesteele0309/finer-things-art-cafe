import webpush from 'web-push';

// Restrict destinations before the HTTP client sees a user-supplied endpoint.
export function validSubscription(s) {
  try {
    const u = new URL(s.endpoint);
    const host = /^(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|web\.push\.apple\.com|[a-z0-9-]+\.notify\.windows\.com)$/.test(u.hostname);
    return host && u.protocol==='https:' && !u.port && !u.username && !u.password && !u.hash && s.endpoint.length<=2048
      && /^[A-Za-z0-9_-]{87}=?$/.test(s.keys?.p256dh||'') && /^[A-Za-z0-9_-]{22}(==)?$/.test(s.keys?.auth||'');
  } catch { return false; }
}

export function pushPayload(job) {
  const href = /^#between\/[a-f0-9-]{36}$/.test(job.href||'') ? job.href : job.kind==='daily' ? '#today' : '#notifications';
  return JSON.stringify({title:'INNERWORLD',body:job.kind==='daily'?'A little room for your creative practice.':job.kind==='test'?'Notifications are ready on this device.':'There is an update in your shared studio.',href,tag:'iw-'+job.id});
}

export function createPushWorker({gate,env,send=webpush.sendNotification.bind(webpush),log=console.warn}) {
  const enabled=!!(env.VAPID_PUBLIC_KEY&&env.VAPID_PRIVATE_KEY&&env.VAPID_SUBJECT);
  let busy=false;
  async function tick(){
    if(!enabled||busy)return;
    busy=true;
    try {
      const jobs=await gate('push_claim');
      for(const job of jobs){
        let status='sent';
        if(!validSubscription(job.subscription))status='invalid';
        else try{
          await send(job.subscription,pushPayload(job),{vapidDetails:{subject:env.VAPID_SUBJECT,publicKey:env.VAPID_PUBLIC_KEY,privateKey:env.VAPID_PRIVATE_KEY},TTL:900,timeout:10000,urgency:'normal'});
        }catch(e){status=[404,410].includes(e.statusCode)?'gone':'retry';}
        await gate('push_finish',{id:job.id,lease:job.lease,status});
      }
    } catch { log('INNERWORLD notification delivery will retry.'); }
    finally { busy=false; }
  }
  function start(){if(!enabled)return()=>{};const t=setInterval(tick,60000);t.unref();void tick();return()=>clearInterval(t);}
  return {enabled,tick,start};
}
