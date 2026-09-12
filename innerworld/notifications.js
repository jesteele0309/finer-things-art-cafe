/* Browser permissions are requested only from an explicit Enable action. */
(function(g){'use strict';
const supported=()=>('serviceWorker'in navigator)&&('PushManager'in g)&&('Notification'in g);
async function registration(){if(!supported())throw Error('This browser does not support push here. On iPhone, add INNERWORLD to your Home Screen and open it there.');return navigator.serviceWorker.ready;}
async function current(){if(!supported())return null;return (await registration()).pushManager.getSubscription();}
async function status(){const s=await current();return s?IWClient.rpc('iw_push_status',{p_endpoint:s.endpoint}):null;}
async function enable({dailyTime,timezone,collaboration}){
 if(!IWClient.config()?.pushPublicKey)throw Error('Notifications are not configured yet.');
 // Call requestPermission synchronously within the user's click/submit gesture.
 const permission=await Notification.requestPermission();if(permission!=='granted')throw Error('Notifications were not enabled. You can change this in browser settings.');
 const r=await registration(),key=IWClient.config().pushPublicKey;
 const bytes=Uint8Array.from(atob(key.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
 const existing=await r.pushManager.getSubscription();
 const s=existing||await r.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:bytes});
 try{await IWClient.rpc('iw_push_save',{p_subscription:s.toJSON(),p_time:dailyTime||null,p_timezone:timezone,p_collaboration:collaboration});}
 catch(e){if(!existing)await s.unsubscribe();throw e;}
}
async function disable(){const s=await current();if(s){await IWClient.rpc('iw_push_remove',{p_endpoint:s.endpoint});await s.unsubscribe();}}
async function test(){const s=await current();if(!s)throw Error('Enable notifications first.');await IWClient.rpc('iw_push_test',{p_endpoint:s.endpoint});}
g.IWNotifications={supported,status,enable,disable,test};
})(globalThis);
