import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const app = document.getElementById('app')
const cfg = {
  url: window.CATS_SUPABASE_URL || '',
  key: window.CATS_SUPABASE_ANON_KEY || ''
}
const configured = cfg.url.startsWith('https://') && cfg.url.includes('.supabase.co') && cfg.key.length > 40 && !cfg.url.includes('DEIN-PROJEKT')
const supabase = configured ? createClient(cfg.url, cfg.key) : null

const state = { session:null, view:'home', cats:[], mating:null, pregnancy:null, tasks:[] }
const plan = [
  {day:0,title:'Deckung dokumentieren',text:'Deckdatum, Deckkater, Anzahl Deckakte und Verhalten festhalten.'},
  {day:2,title:'Rolligkeit kontrollieren',text:'Prüfen, ob Rufen und Paarungsstellung abgeklungen sind.'},
  {day:7,title:'Gewicht erfassen',text:'Startgewicht dokumentieren und wöchentliche Kontrolle beginnen.'},
  {day:21,title:'Ultraschall planen',text:'Zwischen Tag 21 und 25 ist Ultraschall sinnvoll.'},
  {day:42,title:'Wurfzimmer vorbereiten',text:'Wurfbox, Waage, Tücher und Notfallnummern bereitlegen.'},
  {day:60,title:'Endphase',text:'Mehrmals täglich beobachten.'},
  {day:63,title:'Geburtsterminfenster',text:'Ab jetzt jederzeit mit der Geburt rechnen.'}
]
const today=()=>new Date().toISOString().slice(0,10)
const addDays=(iso,d)=>{let x=new Date(iso+'T12:00:00');x.setDate(x.getDate()+d);return x.toISOString().slice(0,10)}
const diffDays=(a,b)=>Math.floor((new Date(b+'T12:00:00')-new Date(a+'T12:00:00'))/86400000)
const pretty=iso=>new Date(iso+'T12:00:00').toLocaleDateString('de-CH',{day:'2-digit',month:'2-digit',year:'numeric'})
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))

function shell(html){ app.innerHTML=`<div class="brand"><div class="logo">689</div><div><h1>689 Cats</h1><p class="muted">Companion · Foundation 0.2</p></div></div>${html}` }
function nav(){return `<nav class="nav"><button data-view="home">Home</button><button data-view="cats">Katzen</button><button data-view="zucht">Zucht</button><button data-view="family">Family</button><button data-view="more">Mehr</button></nav>`}
function bindNav(){document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{state.view=b.dataset.view;render()})}

function renderConfigError(){shell(`<section class="card warn"><p class="kicker">Konfiguration fehlt</p><h2>config.js prüfen</h2><p>URL und Key müssen in Anführungszeichen stehen.</p><pre>window.CATS_SUPABASE_URL = "https://dein-projekt.supabase.co";
window.CATS_SUPABASE_ANON_KEY = "dein-anon-public-key";</pre></section>`)}
function renderLogin(){shell(`<form id="loginForm" class="card login"><p class="kicker">Login</p><h2>Willkommen</h2><p class="muted">Du erhältst einen Magic Link per E-Mail.</p><input id="email" type="email" placeholder="E-Mail" required/><button>Magic Link senden</button></form>`);document.getElementById('loginForm').onsubmit=async e=>{e.preventDefault();const email=document.getElementById('email').value;const{error}=await supabase.auth.signInWithOtp({email});alert(error?error.message:'Magic Link wurde gesendet. Öffne ihn im selben Safari-Browser.')}}

function pregnancyDay(){return state.pregnancy?Math.max(0,diffDays(state.pregnancy.start_date,today())):0}
function currentPlan(){const d=pregnancyDay();return [...plan].reverse().find(x=>x.day<=d)||plan[0]}

function renderHome(){const d=pregnancyDay(), cur=currentPlan(), open=state.tasks.filter(x=>x.status==='open').slice(0,4);shell(`
<section class="card hero"><div><p class="kicker">Heute bei 689 Cats</p><h2>Lillifee · Tag ${d}</h2><p>${esc(cur.text)}</p><p class="muted">Geburtsterminfenster: ${state.pregnancy?pretty(state.pregnancy.expected_from)+' – '+pretty(state.pregnancy.expected_to):'Noch nicht verfügbar'}</p></div><div class="day"><strong>${d}</strong><span>Tag</span></div></section>
<section class="card"><p class="kicker">Gewicht</p><input id="weightInput" type="number" step="0.01" placeholder="kg"/><button id="saveWeight">Speichern</button></section>
<section class="card"><p class="kicker">Offene Aufgaben</p>${open.length?open.map(x=>`<div class="row"><span>${esc(x.title)}<br><small class="muted">${x.due_date?pretty(x.due_date):''}</small></span><button class="secondary doneTask" data-id="${x.id}">Erledigt</button></div>`).join(''):'<p class="muted">Keine offenen Aufgaben.</p>'}</section>${nav()}`);bindNav();document.getElementById('saveWeight').onclick=saveWeight;document.querySelectorAll('.doneTask').forEach(b=>b.onclick=async()=>{await supabase.from('tasks').update({status:'done',completed_at:new Date().toISOString()}).eq('id',b.dataset.id);await loadData()})}
function renderCats(){shell(`<section class="card"><p class="kicker">Katzen</p>${state.cats.map(c=>`<div class="row"><span><b>${esc(c.call_name||c.name)}</b><br><small class="muted">${esc(c.role)} · ${esc(c.color||c.breed)}</small></span><span class="gold">🐾</span></div>`).join('')}</section>${nav()}`);bindNav()}
function renderZucht(){shell(`<section class="card"><p class="kicker">Verpaarung</p><h2>${esc(state.mating?.title||'Noch keine Verpaarung')}</h2><p>Deckdatum: ${state.mating?.mating_date?pretty(state.mating.mating_date):'-'}</p><p class="muted">Deckkater ist pro Verpaarung frei wählbar.</p></section>${nav()}`);bindNav()}
function renderFamily(){shell(`<section class="card"><p class="kicker">689 Family</p><h2>Käufer und Community</h2><p class="muted">Warteliste, WhatsApp-Einwilligungen und Käuferbetreuung werden hier verwaltet.</p></section>${nav()}`);bindNav()}
function renderMore(){shell(`<section class="card ok"><p class="kicker">System</p><h2>Foundation 0.2 läuft</h2><p class="muted">Stabile Vanilla-PWA ohne JSX und ohne src-Ordner.</p><button id="logout" class="secondary">Logout</button></section><section class="card"><p class="kicker">Diagnose</p><p>Session: ${state.session?'aktiv':'keine'}</p><p>Katzen geladen: ${state.cats.length}</p></section>${nav()}`);bindNav();document.getElementById('logout').onclick=async()=>{await supabase.auth.signOut();state.session=null;renderLogin()}}

function render(){if(!configured)return renderConfigError();if(!state.session)return renderLogin();if(state.view==='cats')return renderCats();if(state.view==='zucht')return renderZucht();if(state.view==='family')return renderFamily();if(state.view==='more')return renderMore();return renderHome()}

async function seedIfNeeded(){const uid=state.session.user.id;const{data:ex,error:e0}=await supabase.from('cats').select('id').eq('owner_id',uid).limit(1);if(e0)throw e0;if(ex?.length)return
const{data:cattery,error:e1}=await supabase.from('catteries').insert({owner_id:uid,name:'689 Cats',website:'https://www.689cats.ch'}).select().single();if(e1)throw e1
const{data:l,error:e2}=await supabase.from('cats').insert({owner_id:uid,cattery_id:cattery.id,name:"Romida's Lillifee",call_name:'Lillifee',sex:'female',role:'queen',breed:'Maine Coon',color:'Silver Shaded',birth_date:'2024-11-04'}).select().single();if(e2)throw e2
const{data:n,error:e3}=await supabase.from('cats').insert({owner_id:uid,cattery_id:cattery.id,name:"Country Gulliver's Nectarine",call_name:'Nectarine',sex:'male',role:'external',breed:'Maine Coon',color:'Red Silver Tabby'}).select().single();if(e3)throw e3
await supabase.from('cats').insert({owner_id:uid,cattery_id:cattery.id,name:'Bacari',call_name:'Bacari',sex:'male',role:'stud',breed:'Maine Coon'})
const{data:m,error:e4}=await supabase.from('matings').insert({owner_id:uid,cattery_id:cattery.id,queen_id:l.id,sire_id:n.id,title:'Lillifee × Nectarine',mating_date:'2026-06-28',status:'mated'}).select().single();if(e4)throw e4
const{data:p,error:e5}=await supabase.from('pregnancies').insert({owner_id:uid,mating_id:m.id,start_date:'2026-06-28',status:'active'}).select().single();if(e5)throw e5
await supabase.from('tasks').insert(plan.map(x=>({owner_id:uid,pregnancy_id:p.id,title:x.title,description:x.text,due_date:addDays('2026-06-28',x.day),priority:x.day>=60?'high':'normal'})))}

async function loadData(){try{shell(`<section class="card"><p class="kicker">Lädt</p><h2>Verbinde mit Supabase...</h2></section>`);await seedIfNeeded();const uid=state.session.user.id;const [a,b,c,d]=await Promise.all([supabase.from('cats').select('*').eq('owner_id',uid).order('created_at'),supabase.from('matings').select('*').eq('owner_id',uid).order('mating_date',{ascending:false}).limit(1),supabase.from('pregnancies').select('*').eq('owner_id',uid).order('created_at',{ascending:false}).limit(1),supabase.from('tasks').select('*').eq('owner_id',uid).order('due_date')]);[a,b,c,d].forEach(r=>{if(r.error)throw r.error});state.cats=a.data||[];state.mating=b.data?.[0]||null;state.pregnancy=c.data?.[0]||null;state.tasks=d.data||[];render()}catch(err){shell(`<section class="card warn"><p class="kicker">Fehlerdiagnose</p><h2>Supabase lädt nicht korrekt</h2><p>${esc(err.message)}</p><p class="muted">Prüfe: Schema V1.0 ausgeführt, RLS-Policies vorhanden, config.js korrekt.</p></section>`)}}
async function saveWeight(){const input=document.getElementById('weightInput');if(!input.value||!state.pregnancy)return;const l=state.cats.find(c=>c.call_name==='Lillifee')||state.cats[0];const{error}=await supabase.from('weight_logs').insert({owner_id:state.session.user.id,cat_id:l.id,pregnancy_id:state.pregnancy.id,log_date:today(),weight_kg:Number(input.value)});if(error)alert(error.message);else await loadData()}
async function init(){try{if(!configured)return renderConfigError();const{data,error}=await supabase.auth.getSession();if(error)throw error;state.session=data.session;supabase.auth.onAuthStateChange((_e,s)=>{state.session=s;if(s)loadData();else render()});if(state.session)await loadData();else render()}catch(err){shell(`<section class="card warn"><p class="kicker">Startfehler</p><h2>Die App konnte nicht starten</h2><p>${esc(err.message)}</p></section>`)}}
init()
