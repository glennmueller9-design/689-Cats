import React,{useEffect,useState}from'react'
import{createRoot}from'react-dom/client'
import{createClient}from'@supabase/supabase-js'
import{Home,Cat,Heart,Users,MoreHorizontal}from'lucide-react'
import'./style.css'

const url=import.meta.env.VITE_SUPABASE_URL
const key=import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase=(url&&key)?createClient(url,key):null
const plan=[
{day:0,title:'Deckung dokumentieren',text:'Deckdatum, Deckkater, Anzahl Deckakte und Verhalten festhalten.'},
{day:2,title:'Rolligkeit kontrollieren',text:'Prüfen, ob Rufen und Paarungsstellung abgeklungen sind.'},
{day:7,title:'Gewicht erfassen',text:'Startgewicht dokumentieren und wöchentliche Kontrolle beginnen.'},
{day:21,title:'Ultraschall planen',text:'Zwischen Tag 21 und 25 ist Ultraschall sinnvoll.'},
{day:42,title:'Wurfzimmer vorbereiten',text:'Wurfbox, Waage, Tücher und Notfallnummern bereitlegen.'},
{day:60,title:'Endphase',text:'Mehrmals täglich beobachten.'},
{day:63,title:'Geburtsterminfenster',text:'Ab jetzt jederzeit mit der Geburt rechnen.'}]
const today=()=>new Date().toISOString().slice(0,10)
const add=(iso,d)=>{let x=new Date(iso+'T12:00:00');x.setDate(x.getDate()+d);return x.toISOString().slice(0,10)}
const diff=(a,b)=>Math.floor((new Date(b+'T12:00:00')-new Date(a+'T12:00:00'))/86400000)
const pretty=iso=>new Date(iso+'T12:00:00').toLocaleDateString('de-CH',{day:'2-digit',month:'2-digit',year:'numeric'})

function App(){
 const[session,setSession]=useState(null),[email,setEmail]=useState(''),[loading,setLoading]=useState(true),[view,setView]=useState('home')
 const[cats,setCats]=useState([]),[mating,setMating]=useState(null),[preg,setPreg]=useState(null),[tasks,setTasks]=useState([]),[weight,setWeight]=useState('')
 useEffect(()=>{if(!supabase){setLoading(false);return}supabase.auth.getSession().then(({data})=>{setSession(data.session);setLoading(false)});const{data:s}=supabase.auth.onAuthStateChange((_e,x)=>setSession(x));return()=>s.subscription.unsubscribe()},[])
 useEffect(()=>{if(session)load()},[session])
 async function login(e){e.preventDefault();await supabase.auth.signInWithOtp({email});alert('Magic Link wurde gesendet.')}
 async function seed(){const uid=session.user.id;const{data:ex}=await supabase.from('cats').select('id').eq('owner_id',uid).limit(1);if(ex?.length)return
 const{data:c}=await supabase.from('catteries').insert({owner_id:uid,name:'689 Cats',website:'https://www.689cats.ch'}).select().single()
 const{data:l}=await supabase.from('cats').insert({owner_id:uid,cattery_id:c.id,name:"Romida's Lillifee",call_name:'Lillifee',sex:'female',role:'queen',breed:'Maine Coon',color:'Silver Shaded',birth_date:'2024-11-04'}).select().single()
 const{data:n}=await supabase.from('cats').insert({owner_id:uid,cattery_id:c.id,name:"Country Gulliver's Nectarine",call_name:'Nectarine',sex:'male',role:'external',breed:'Maine Coon',color:'Red Silver Tabby'}).select().single()
 await supabase.from('cats').insert({owner_id:uid,cattery_id:c.id,name:'Bacari',call_name:'Bacari',sex:'male',role:'stud',breed:'Maine Coon'})
 const{data:m}=await supabase.from('matings').insert({owner_id:uid,cattery_id:c.id,queen_id:l.id,sire_id:n.id,title:'Lillifee × Nectarine',mating_date:'2026-06-28',status:'mated'}).select().single()
 const{data:p}=await supabase.from('pregnancies').insert({owner_id:uid,mating_id:m.id,start_date:'2026-06-28',status:'active'}).select().single()
 await supabase.from('tasks').insert(plan.map(x=>({owner_id:uid,pregnancy_id:p.id,title:x.title,description:x.text,due_date:add('2026-06-28',x.day),priority:x.day>=60?'high':'normal'})))}
 async function load(){await seed();const uid=session.user.id;const[{data:cs},{data:ms},{data:ps},{data:ts}]=await Promise.all([supabase.from('cats').select('*').eq('owner_id',uid).order('created_at'),supabase.from('matings').select('*').eq('owner_id',uid).order('mating_date',{ascending:false}).limit(1),supabase.from('pregnancies').select('*').eq('owner_id',uid).order('created_at',{ascending:false}).limit(1),supabase.from('tasks').select('*').eq('owner_id',uid).order('due_date')]);setCats(cs||[]);setMating(ms?.[0]||null);setPreg(ps?.[0]||null);setTasks(ts||[])}
 async function addWeight(){if(!weight||!preg)return;const l=cats.find(c=>c.call_name==='Lillifee')||cats[0];await supabase.from('weight_logs').insert({owner_id:session.user.id,cat_id:l.id,pregnancy_id:preg.id,log_date:today(),weight_kg:Number(weight)});setWeight('');load()}
 const day=preg?Math.max(0,diff(preg.start_date,today())):0,cur=[...plan].reverse().find(x=>x.day<=day)||plan[0],open=tasks.filter(x=>x.status==='open').slice(0,4)
 if(loading)return <main className="app"><div className="card">Lädt...</div></main>
 if(!supabase)return <main className="app"><div className="card warn"><h1>Supabase fehlt</h1><p>Vercel-Environment-Variablen setzen: VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY.</p></div></main>
 if(!session)return <main className="app login"><div className="brand"><div className="logo">689</div><div><h1>689 Cats</h1><p className="muted">Companion</p></div></div><form className="card" onSubmit={login}><p className="kicker">Login</p><h2>Willkommen</h2><input type="email" placeholder="E-Mail" value={email} onChange={e=>setEmail(e.target.value)} required/><button>Magic Link senden</button></form></main>
 return <main className="app"><div className="brand"><div className="logo">689</div><div><h1>689 Cats</h1><p className="muted">iPhone PWA · Foundation 0.1</p></div></div>
 {view==='home'&&<><section className="card hero"><div><p className="kicker">Heute bei 689 Cats</p><h2>Lillifee · Tag {day}</h2><p>{cur.text}</p><p className="muted">{preg?`Geburtsterminfenster: ${pretty(preg.expected_from)} – ${pretty(preg.expected_to)}`:''}</p></div><div className="day"><strong>{day}</strong><span>Tag</span></div></section><section className="card"><p className="kicker">Gewicht</p><input type="number" step="0.01" placeholder="kg" value={weight} onChange={e=>setWeight(e.target.value)}/><button onClick={addWeight}>Speichern</button></section><section className="card"><p className="kicker">Offene Aufgaben</p>{open.map(x=><div className="row" key={x.id}><span>{x.title}<br/><small className="muted">{x.due_date?pretty(x.due_date):''}</small></span><button className="secondary" onClick={async()=>{await supabase.from('tasks').update({status:'done',completed_at:new Date().toISOString()}).eq('id',x.id);load()}}>Erledigt</button></div>)}</section></>}
 {view==='cats'&&<section className="card"><p className="kicker">Katzen</p>{cats.map(c=><div className="row" key={c.id}><span><b>{c.call_name||c.name}</b><br/><small className="muted">{c.role} · {c.color||c.breed}</small></span></div>)}</section>}
 {view==='litters'&&<section className="card"><p className="kicker">Verpaarung</p><h2>{mating?.title||'Noch keine Verpaarung'}</h2><p>Deckdatum: {mating?.mating_date?pretty(mating.mating_date):'-'}</p><p className="muted">Deckkater ist pro Verpaarung frei wählbar.</p></section>}
 {view==='family'&&<section className="card"><p className="kicker">689 Family</p><h2>Käufer und Community</h2><p className="muted">Warteliste, WhatsApp-Einwilligungen und Käuferbetreuung werden hier verwaltet.</p></section>}
 {view==='more'&&<section className="card"><p className="kicker">Mehr</p><button className="secondary" onClick={()=>supabase.auth.signOut()}>Logout</button></section>}
 <nav className="nav"><button onClick={()=>setView('home')}><Home size={20}/><br/>Home</button><button onClick={()=>setView('cats')}><Cat size={20}/><br/>Katzen</button><button onClick={()=>setView('litters')}><Heart size={20}/><br/>Zucht</button><button onClick={()=>setView('family')}><Users size={20}/><br/>Family</button><button onClick={()=>setView('more')}><MoreHorizontal size={20}/><br/>Mehr</button></nav></main>}
createRoot(document.getElementById('root')).render(<App/>)
