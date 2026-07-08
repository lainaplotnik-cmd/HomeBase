import React, {useEffect, useMemo, useState} from 'react';
import { createRoot } from 'react-dom/client';
import { Home, Plus, Minus, Trophy, PiggyBank, ScrollText, Settings, Users, Sparkles, PawPrint, GraduationCap, ShieldCheck } from 'lucide-react';
import './style.css';

const API_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL || '';

const fallback = {
  kids: [
    { id:'dean', name:'Dean', emoji:'🧢', age:'10 in Sept', baseAllowance:40 },
    { id:'demi', name:'Demi', emoji:'🌸', age:'8', baseAllowance:40 },
    { id:'elise', name:'Elise', emoji:'🦋', age:'7 in Nov', baseAllowance:40 },
    { id:'kristos', name:'Kristos', emoji:'🚀', age:'4 on Christmas', baseAllowance:40 },
  ],
  rules: [
    { id:'walk-charlie', active:true, type:'Earn', label:'Walk Charlie', amount:1, category:'Pet Care', icon:'🐶' },
    { id:'pokemon-raid', active:true, type:'Earn', label:'Help with Pokémon raid', amount:1, category:'Events', icon:'⚡' },
    { id:'good-grade', active:true, type:'Earn', label:'Good grade / strong improvement', amount:5, category:'School', icon:'📚' },
    { id:'kindness', active:true, type:'Earn', label:'Kindness bonus', amount:2, category:'Kindness', icon:'💛' },
    { id:'trash', active:true, type:'Deduct', label:'Left trash, plates, or wrappers', amount:-0.5, category:'Cleanliness', icon:'🧹' },
    { id:'eating-room', active:true, type:'Deduct', label:'Ate in bedroom', amount:-1, category:'Food Rules', icon:'🍽️' },
    { id:'fighting', active:true, type:'Deduct', label:'Fighting / purposely annoying', amount:-2, category:'Behavior', icon:'🌧️' },
    { id:'lying', active:true, type:'Deduct', label:'Lying', amount:-3, category:'Trust', icon:'🛑' },
    { id:'messy-room', active:true, type:'Deduct', label:'Room messy after deadline', amount:-2, category:'Cleanliness', icon:'🧺' },
  ],
  transactions: []
};

function money(n){ return `$${Number(n||0).toFixed(2).replace('.00','')}`; }
const monthKey = () => new Date().toISOString().slice(0,7);

async function api(action, payload={}){
  if(!API_URL) throw new Error('No Apps Script URL configured');
  const res = await fetch(API_URL, {method:'POST', body: JSON.stringify({action, ...payload})});
  if(!res.ok) throw new Error('API error');
  return await res.json();
}

function App(){
  const [data,setData]=useState(fallback);
  const [selected,setSelected]=useState('dean');
  const [tab,setTab]=useState('dashboard');
  const [note,setNote]=useState('');
  const [custom,setCustom]=useState({label:'',amount:''});
  const [status,setStatus]=useState(API_URL ? 'Connecting to Google Sheet…' : 'Demo mode — paste your Apps Script URL in .env later.');

  useEffect(()=>{ if(API_URL) api('getData').then(d=>{setData(d);setStatus('Connected to Google Sheet');}).catch(()=>setStatus('Could not connect — using demo data')); },[]);
  const currentKid = data.kids.find(k=>k.id===selected) || data.kids[0];
  const monthTransactions = data.transactions.filter(t=> (t.month || '').startsWith(monthKey()) );
  const kidTransactions = monthTransactions.filter(t=>t.kidId===selected);
  const summary = useMemo(()=>{
    return data.kids.map(k=>{
      const tx = monthTransactions.filter(t=>t.kidId===k.id);
      const earned = tx.filter(t=>t.amount>0).reduce((a,b)=>a+Number(b.amount),0);
      const lost = tx.filter(t=>t.amount<0).reduce((a,b)=>a+Number(b.amount),0);
      const balance = Math.max(0, Number(k.baseAllowance||40)+earned+lost);
      return {...k, earned, lost, balance, count: tx.length};
    })
  },[data]);
  const selectedSummary = summary.find(s=>s.id===selected) || summary[0];

  async function addTransaction(rule){
    const tx = { id: crypto.randomUUID(), kidId:selected, kidName:currentKid.name, label:rule.label, amount:Number(rule.amount), type:Number(rule.amount)>=0?'Earn':'Deduct', category:rule.category||'Custom', note, month:monthKey(), createdAt:new Date().toISOString(), parent:'Parent' };
    const next = {...data, transactions:[tx, ...data.transactions]};
    setData(next); setNote('');
    if(API_URL) await api('addTransaction',{transaction:tx}).catch(()=>setStatus('Saved locally only — check Apps Script URL'));
  }

  async function addCustom(){
    if(!custom.label || custom.amount==='') return;
    await addTransaction({label:custom.label, amount:Number(custom.amount), category:'Custom'});
    setCustom({label:'',amount:''});
  }

  return <div className="app">
    <aside className="sidebar">
      <div className="brand"><div className="logo"><Home size={24}/></div><div><h1>HomeBase</h1><p>Family money + values hub</p></div></div>
      {[['dashboard',Home,'Dashboard'],['ledger',ScrollText,'Ledger'],['rules',Settings,'Rules'],['goals',PiggyBank,'Goals'],['badges',Trophy,'Badges']].map(([id,Icon,label])=>
        <button key={id} onClick={()=>setTab(id)} className={tab===id?'nav active':'nav'}><Icon size={18}/>{label}</button>)}
      <div className="status">{status}</div>
    </aside>

    <main>
      <header className="topbar"><div><h2>{tab==='dashboard'?'Allowance Dashboard':tab[0].toUpperCase()+tab.slice(1)}</h2><p>Elementary-school friendly, grown-up money habits.</p></div><div className="month">{new Date().toLocaleString('default',{month:'long',year:'numeric'})}</div></header>

      <section className="kidsGrid">{summary.map(k=><button className={selected===k.id?'kid selected':'kid'} onClick={()=>setSelected(k.id)} key={k.id}><span>{k.emoji}</span><div><b>{k.name}</b><small>{k.age}</small></div><strong>{money(k.balance)}</strong></button>)}</section>

      {tab==='dashboard' && <div className="layout">
        <section className="card hero">
          <div className="heroTop"><div className="avatar">{currentKid.emoji}</div><div><h3>{currentKid.name}'s Month</h3><p>Starts with {money(currentKid.baseAllowance)}. Earns go up. Deductions can’t go below $0.</p></div></div>
          <div className="moneyRow"><div><small>Base</small><b>{money(currentKid.baseAllowance)}</b></div><div><small>Earned</small><b className="good">+{money(selectedSummary.earned)}</b></div><div><small>Deductions</small><b className="bad">{money(selectedSummary.lost)}</b></div><div><small>Current</small><b>{money(selectedSummary.balance)}</b></div></div>
          <div className="progress"><div style={{width:`${Math.min(100, selectedSummary.balance/80*100)}%`}} /></div>
        </section>

        <section className="card actions"><h3>Quick Add</h3><p className="muted">Pick a button, add a note if needed, and it logs forever.</p><input value={note} onChange={e=>setNote(e.target.value)} placeholder="Optional note, example: helped without being asked" />
          <div className="ruleList">{data.rules.filter(r=>r.active!==false).map(r=><button onClick={()=>addTransaction(r)} className={r.amount>=0?'rule earn':'rule deduct'} key={r.id}><span>{r.icon||'⭐'}</span><div>{r.label}<small>{r.category}</small></div><b>{r.amount>=0?'+':''}{money(r.amount)}</b></button>)}</div>
        </section>

        <section className="card custom"><h3>Custom Entry</h3><div className="customRow"><input placeholder="Reason" value={custom.label} onChange={e=>setCustom({...custom,label:e.target.value})}/><input placeholder="Amount" type="number" step="0.5" value={custom.amount} onChange={e=>setCustom({...custom,amount:e.target.value})}/><button onClick={addCustom}>Add</button></div></section>
      </div>}

      {tab==='ledger' && <section className="card"><h3>{currentKid.name}'s Ledger</h3><div className="ledger">{kidTransactions.length?kidTransactions.map(t=><div className="tx" key={t.id}><div><b>{t.amount>=0?<Plus size={14}/>:<Minus size={14}/>} {t.label}</b><small>{new Date(t.createdAt).toLocaleString()} · {t.category}{t.note?` · ${t.note}`:''}</small></div><strong className={t.amount>=0?'good':'bad'}>{t.amount>=0?'+':''}{money(t.amount)}</strong></div>):<p className="muted">No entries yet this month.</p>}</div></section>}

      {tab==='rules' && <section className="card"><h3>Rules / Shopping List</h3><p className="muted">Edit this in the Google Sheet Rules tab. The app will update automatically when connected.</p><div className="ruleList wide">{data.rules.map(r=><div className="rule readonly" key={r.id}><span>{r.icon}</span><div>{r.label}<small>{r.type} · {r.category}</small></div><b>{r.amount>=0?'+':''}{money(r.amount)}</b></div>)}</div></section>}

      {tab==='goals' && <section className="card coming"><PiggyBank/><h3>Savings Goals</h3><p>Add goals like Pokémon cards, a game, or a special outing. This is ready for Version 2.</p></section>}
      {tab==='badges' && <section className="card badges"><div><Trophy/><h3>Badges Preview</h3></div><div className="badgeGrid"><span><PawPrint/> Charlie Helper</span><span><GraduationCap/> Homework Hero</span><span><ShieldCheck/> Trust Builder</span><span><Sparkles/> Kindness Streak</span></div></section>}
    </main>
  </div>
}

createRoot(document.getElementById('root')).render(<App/>);
