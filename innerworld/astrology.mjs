import * as Astronomy from 'astronomy-engine';

const BODIES=[['Sun',Astronomy.Body.Sun],['Moon',Astronomy.Body.Moon],['Mercury',Astronomy.Body.Mercury],['Venus',Astronomy.Body.Venus],['Mars',Astronomy.Body.Mars],['Jupiter',Astronomy.Body.Jupiter],['Saturn',Astronomy.Body.Saturn],['Uranus',Astronomy.Body.Uranus],['Neptune',Astronomy.Body.Neptune],['Pluto',Astronomy.Body.Pluto]];
const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const ASPECTS=[['conjunction',0,8],['sextile',60,5],['square',90,6],['trine',120,6],['opposition',180,8]];
const norm=x=>((x%360)+360)%360;
const separation=(a,b)=>{const d=Math.abs(norm(a)-norm(b));return Math.min(d,360-d)};
function ecliptic(body,date){const eq=Astronomy.Equator(body,date,Astronomy.Body.Earth,true,true);const ec=Astronomy.Ecliptic(eq.vec);return norm(ec.elon)}
function point(name,longitude){const lon=norm(longitude),signIndex=Math.floor(lon/30);return{name,longitude:+lon.toFixed(4),sign:SIGNS[signIndex],degree:+(lon%30).toFixed(2)}}
export function positions(date){return BODIES.map(([name,body])=>point(name,ecliptic(body,date)))}
export function aspects(points){const out=[];for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){const sep=separation(points[i].longitude,points[j].longitude);for(const[name,angle,orb]of ASPECTS){const delta=Math.abs(sep-angle);if(delta<=orb){out.push({a:points[i].name,b:points[j].name,type:name,orb:+delta.toFixed(2)});break}}}return out.sort((a,b)=>a.orb-b.orb)}
export function transitAspects(natal,current){const out=[];for(const t of current)for(const n of natal){const sep=separation(t.longitude,n.longitude);for(const[name,angle,orb]of ASPECTS){const delta=Math.abs(sep-angle);if(delta<=Math.min(orb,4)){out.push({transit:t.name,natal:n.name,type:name,orb:+delta.toFixed(2)});break}}}return out.sort((a,b)=>a.orb-b.orb).slice(0,12)}
export function calculateChart({birthISO,atISO}){const birth=new Date(birthISO),at=atISO?new Date(atISO):new Date();if(!Number.isFinite(birth.getTime())||!Number.isFinite(at.getTime()))throw new Error('Invalid date.');const natal=positions(birth),current=positions(at);return{system:'tropical-geocentric',birthISO:birth.toISOString(),atISO:at.toISOString(),natal,natalAspects:aspects(natal).slice(0,16),transits:current,transitAspects:transitAspects(natal,current),notice:'Astrology is used as an optional symbolic reflection lens, not a factual prediction or diagnosis.'}}
