import test from 'node:test';
import assert from 'node:assert/strict';
import {validSubscription,pushPayload,createPushWorker} from '../push.mjs';
const subscription={endpoint:'https://fcm.googleapis.com/fcm/send/sample',keys:{p256dh:'B'.repeat(87),auth:'a'.repeat(22)}};
const env={VAPID_SUBJECT:'https://studio.example',VAPID_PUBLIC_KEY:'test-public',VAPID_PRIVATE_KEY:'test-private'};
test('push destinations reject local addresses, credentials, redirects and lookalike hosts',()=>{
 assert.equal(validSubscription(subscription),true);
 for(const endpoint of ['http://127.0.0.1/','https://fcm.googleapis.com.evil.example/path','https://fcm.googleapis.com@evil.example/','https://fcm.googleapis.com:8443/path','https://fcm.googleapis.com/path#x'])assert.equal(validSubscription({...subscription,endpoint}),false);
 assert.equal(validSubscription({...subscription,keys:{}}),false);
});
test('push previews exclude private event fields and external navigation',()=>{
 const body=JSON.parse(pushPayload({id:'1',kind:'collaboration',href:'https://evil.example',title:'PRIVATE_TITLE',body:'PRIVATE_NOTE',image:'PRIVATE_IMAGE'}));
 assert.equal(body.href,'#notifications');assert.ok(!JSON.stringify(body).includes('PRIVATE_'));
});
test('delivery outcome acknowledges the exact lease and expires dead subscriptions',async()=>{
 const outcomes=[],sends=[];
 const jobs=[{id:'1',lease:'l1',kind:'daily',subscription},{id:'2',lease:'l2',kind:'test',subscription},{id:'3',lease:'l3',kind:'daily',subscription:{...subscription,endpoint:'http://127.0.0.1/'}}];
 const gate=async(action,d)=>action==='push_claim'?jobs:outcomes.push(d);
 const send=async(s,p)=>{sends.push(p);if(sends.length===2)throw {statusCode:410};};
 await createPushWorker({env,gate,send}).tick();
 assert.equal(sends.length,2);assert.deepEqual(outcomes,[{id:'1',lease:'l1',status:'sent'},{id:'2',lease:'l2',status:'gone'},{id:'3',lease:'l3',status:'invalid'}]);
});
test('transient failures retry, secrets stay out of logs and missing keys disable delivery',async()=>{
 let finished;const logs=[];
 const gate=async(action,d)=>action==='push_claim'?[{id:'1',lease:'l1',kind:'daily',subscription}]:(finished=d);
 await createPushWorker({env,gate,send:async()=>{throw {statusCode:503,message:'SECRET'};},log:s=>logs.push(s)}).tick();
 assert.equal(finished.status,'retry');assert.ok(!JSON.stringify(logs).includes('SECRET'));
 let called=false;await createPushWorker({env:{},gate:async()=>called=true}).tick();assert.equal(called,false);
});
