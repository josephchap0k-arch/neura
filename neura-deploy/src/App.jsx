neura.jsximport { useState, useRef, useEffect } from "react";

const SUPABASE_URL      = "https://qrjabnoghrjiukkdbgap.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_ANON_KEY";
const USE_SUPABASE      = !SUPABASE_ANON_KEY.startsWith("YOUR_");
const SIDEBAR_W         = 232;

const NEURA_SYSTEM = `You are NEURA — a Cognitive Operating System, not a chatbot.
Transform goals into executable systems. Diagnose operational problems, build acquisition pipelines, orchestrate agents, optimize workflows.
SYSTEM IDENTITY: operational, alive, dynamic. Use: SISTEMA ACTIVO / PIPELINE GENERADO / MODO EJECUCIÓN / AGENTES ACTIVOS.
Avoid: assistant tone, motivational clichés, "I can help", "Here are ideas".
PIPELINE THINKING: Tráfico → Atención → Captura → Calificación → Conversión → Retención → Expansión.
Every interaction produces at least ONE executable output. AUTO-BUILD without unnecessary permission.
FORMAT: OBJETIVO → DIAGNÓSTICO → SISTEMA GENERADO → OUTPUTS → PRÓXIMA FASE
LANGUAGE: Auto-detect. Respond in same language. Spanish LATAM / Argentine voseo when appropriate.
RULE: NEURA builds, orchestrates and optimizes operational execution systems.`;

const MODES = {
  contextual:{label:"Contextual",sub:"Memoria activa",   color:"#00E5FF",prompt:"MODO CONTEXTUAL: Priorizá memoria y continuidad entre operaciones."},
  learner:   {label:"Aprendiz",  sub:"Enseñanza",        color:"#4488ff",prompt:"MODO APRENDIZ: Respuestas pedagógicas, paso a paso, con ejemplos."},
  expert:    {label:"Experto",   sub:"Precisión",         color:"#aa44ff",prompt:"MODO EXPERTO: Directo al punto. Sin preamble. Solo ejecución."},
  master:    {label:"Maestro",   sub:"Visión sistémica",  color:"#00E5FF",prompt:"MODO MAESTRO: Pensamiento sistémico, visión global, conexiones no obvias."},
};

const I = {
  Plus:    ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  Search:  ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.6"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  Memory:  ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="8" rx="2" stroke="currentColor" strokeWidth="1.6"/><rect x="2" y="14" width="20" height="8" rx="2" stroke="currentColor" strokeWidth="1.6"/><circle cx="6" cy="6" r="1" fill="currentColor"/><circle cx="6" cy="18" r="1" fill="currentColor"/></svg>,
  Book:    ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" strokeWidth="1.6"/></svg>,
  Send:    ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Close:   ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  Mic:     ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="9" y="2" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.6"/><path d="M19 10a7 7 0 01-14 0M12 19v3M8 22h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  Image:   ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.6"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Clip:    ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  ChevD:   ()=><svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  ArrowUp: ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Back:    ()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  LogOut:  ()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

function Logo({size=28}) {
  return (
    <svg width={size} height={Math.round(size*.87)} viewBox="0 0 32 28" fill="none" style={{overflow:"visible"}}>
      <defs>
        <linearGradient id="lg" x1="10%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#35D8FF"/><stop offset="100%" stopColor="#7B4DFF"/>
        </linearGradient>
        <radialGradient id="gb" cx="50%" cy="92%" r="45%">
          <stop offset="0%" stopColor="#35D8FF" stopOpacity=".9"/><stop offset="100%" stopColor="#35D8FF" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <path d="M16,2 C16.6,1 17.8,1 18.2,2 L30,24 C30.5,25 30,27 28.8,27 L3.2,27 C2,27 1.5,25 2,24 Z" fill="url(#lg)" stroke="rgba(53,216,255,.3)" strokeWidth=".6"/>
      <path d="M16,8 L24,22 L8,22 Z" fill="none" stroke="rgba(53,216,255,.5)" strokeWidth="1" strokeLinejoin="round"/>
      <ellipse cx="16" cy="26" rx="10" ry="2.5" fill="url(#gb)"/>
      <path d="M13.5,5 C14.5,3.2 17.5,3.2 18.5,5" stroke="rgba(255,255,255,.55)" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

const sg = async k => { try{const r=await window.storage.get(k);return r?JSON.parse(r.value):null;}catch{return null;} };
const ss = async (k,v) => { try{await window.storage.set(k,JSON.stringify(v));}catch{} };
const sd = async k => { try{await window.storage.delete(k);}catch{} };

const sb = {
  h:()=>({Authorization:`Bearer ${SUPABASE_ANON_KEY}`,"Content-Type":"application/json",apikey:SUPABASE_ANON_KEY,"Prefer":"return=representation"}),
  ah:t=>({Authorization:`Bearer ${t}`,"Content-Type":"application/json",apikey:SUPABASE_ANON_KEY,"Prefer":"return=representation"}),
  async req(path,opts={}){const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{...opts,headers:{...this.h(),...(opts.headers||{})}});return r.ok?r.json():null;},
  async signIn(e,p){const r=await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`,{method:"POST",headers:this.h(),body:JSON.stringify({email:e,password:p})});return r.json();},
  async signUp(e,p){const r=await fetch(`${SUPABASE_URL}/auth/v1/signup`,{method:"POST",headers:this.h(),body:JSON.stringify({email:e,password:p})});return r.json();},
  async signOut(t){await fetch(`${SUPABASE_URL}/auth/v1/logout`,{method:"POST",headers:this.ah(t)});},
  async refresh(rt){const r=await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,{method:"POST",headers:this.h(),body:JSON.stringify({refresh_token:rt})});return r.json();},
  select:(t,p="")=>sb.req(`${t}?${p}`),
  insert:(t,b)=>sb.req(t,{method:"POST",body:JSON.stringify(b)}),
  update:(t,id,b)=>sb.req(`${t}?id=eq.${id}`,{method:"PATCH",body:JSON.stringify(b)}),
  delete:(t,id)=>sb.req(`${t}?id=eq.${id}`,{method:"DELETE"}),
};

const store = {
  uid:null,
  async getProjects(){
    if(USE_SUPABASE&&this.uid){try{return await sb.select("projects",`user_id=eq.${this.uid}&order=updated_at.desc`)||[];}catch{}}
    return await sg("neura-projects")||[];
  },
  async saveProject(p){
    const all=await sg("neura-projects")||[]; const i=all.findIndex(x=>x.id===p.id); const now=new Date().toISOString();
    if(i>=0)all[i]={...all[i],...p,updatedAt:now};else all.unshift({...p,createdAt:now,updatedAt:now});
    await ss("neura-projects",all);
    if(USE_SUPABASE&&this.uid){try{await sb.insert("projects",{id:p.id,user_id:this.uid,title:p.title,status:p.status||"LIVE"});}catch{}}
  },
  async updateProject(id,u){
    const all=await sg("neura-projects")||[]; const i=all.findIndex(x=>x.id===id);
    if(i>=0){all[i]={...all[i],...u,updatedAt:new Date().toISOString()};await ss("neura-projects",all);}
    if(USE_SUPABASE&&this.uid){try{await sb.update("projects",id,{status:u.status,last_summary:u.lastSummary});}catch{}}
  },
  async deleteProject(id){await ss("neura-projects",(await sg("neura-projects")||[]).filter(p=>p.id!==id));await sd(`neura-msgs-${id}`);},
  async getMessages(pid){return await sg(`neura-msgs-${pid}`)||[];},
  async saveMessages(pid,msgs){await ss(`neura-msgs-${pid}`,msgs.map(m=>({role:m.role,content:m.content||null,type:m.type||null,intent:m.intent||null,routes:m.routes||null,resolved:m.resolved||false,resolvedLabel:m.resolvedLabel||null,createdAt:m.createdAt||new Date().toISOString()})));},
  async appendMsg(pid,m){if(USE_SUPABASE&&this.uid){try{await sb.insert("messages",{project_id:pid,user_id:this.uid,role:m.role,content:m.content||""});}catch{}}},
  async getTasks(){return await sg("neura-tasks")||[];},
  async addTask(t){const all=await sg("neura-tasks")||[];all.unshift(t);await ss("neura-tasks",all);return t;},
  async updateTask(id,u){await ss("neura-tasks",(await sg("neura-tasks")||[]).map(t=>t.id===id?{...t,...u}:t));},
  async deleteTask(id){await ss("neura-tasks",(await sg("neura-tasks")||[]).filter(t=>t.id!==id));},
};

const genId  = ()=>Math.random().toString(36).slice(2,10)+Date.now().toString(36);
const timeAgo = ts => {
  if(!ts)return""; const d=(Date.now()-new Date(ts).getTime())/1000;
  if(d<60)return"ahora"; if(d<3600)return`${Math.floor(d/60)}m`;
  if(d<86400)return`${Math.floor(d/3600)}h`; return`${Math.floor(d/86400)}d`;
};
const buildTitle = t => t.slice(0,50).trim()||"Nueva operación";
const AGENT_KW = {mkt:["marketing","campaña","marca","contenido","ads","tráfico"],ventas:["ventas","clientes","conversión","leads"],ops:["sistema","proceso","automatización","flujo"]};
const detectAgents = t => Object.entries(AGENT_KW).filter(([,kws])=>kws.some(k=>t.toLowerCase().includes(k))).map(([a])=>a);

const THINKING_MSGS = ["Analizando sistema...","Construyendo pipeline...","Activando agentes...","Generando estructura...","Procesando operación...","Calibrando estrategia..."];

function ThinkingState() {
  const [i,setI]=useState(0);
  useEffect(()=>{const t=setInterval(()=>setI(p=>(p+1)%THINKING_MSGS.length),2200);return()=>clearInterval(t);},[]);
  return(
    <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:20,animation:"fadeUp .3s ease"}}>
      <div style={{flexShrink:0,marginTop:4}}><Logo size={22}/></div>
      <div style={{padding:"12px 16px",borderRadius:"4px 16px 16px 16px",background:"rgba(255,255,255,.04)",border:"1px solid rgba(0,229,255,.1)",display:"flex",alignItems:"center",gap:8}}>
        <span style={{width:6,height:6,borderRadius:"50%",background:"#00E5FF",display:"inline-block",animation:"blink 1.4s ease-in-out infinite"}}/>
        <span style={{fontSize:13,fontFamily:"'DM Sans',sans-serif",color:"#606880",fontStyle:"italic"}}>{THINKING_MSGS[i]}</span>
      </div>
    </div>
  );
}

function Bubble({msg}) {
  const isUser=msg.role==="user";
  if(msg.type==="routes")return null;
  return(
    <div style={{display:"flex",justifyContent:isUser?"flex-end":"flex-start",marginBottom:18,animation:"fadeUp .3s ease"}}>
      {!isUser&&<div style={{flexShrink:0,marginRight:10,marginTop:4}}><Logo size={22}/></div>}
      <div style={{maxWidth:"80%",padding:"12px 16px",borderRadius:isUser?"16px 4px 16px 16px":"4px 16px 16px 16px",background:isUser?"linear-gradient(135deg,#1a2a8c,#5030b0)":"rgba(255,255,255,.04)",border:isUser?"none":"1px solid rgba(255,255,255,.06)",color:"#E8EEF8",fontSize:14,fontFamily:"'DM Sans',sans-serif",lineHeight:1.65,wordBreak:"break-word",whiteSpace:"pre-wrap"}}>
        {msg.imagePreview&&<img src={msg.imagePreview} alt="" style={{width:"100%",maxWidth:280,borderRadius:8,marginBottom:8,display:"block"}}/>}
        {msg.content}
      </div>
    </div>
  );
}

function Routes({msg,onSelect}) {
  const [hov,setHov]=useState(null);
  if(msg.resolved)return(
    <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:18}}>
      <div style={{flexShrink:0,marginTop:4}}><Logo size={22}/></div>
      <div style={{padding:"10px 14px",borderRadius:"4px 16px 16px 16px",background:"rgba(0,229,255,.05)",border:"1px solid rgba(0,229,255,.1)",fontSize:13,fontFamily:"'DM Sans',sans-serif",color:"#6a7090"}}>
        Enfoque: <span style={{color:"#00E5FF",fontWeight:500}}>{msg.resolvedLabel}</span>
      </div>
    </div>
  );
  return(
    <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:20,animation:"fadeUp .3s ease"}}>
      <div style={{flexShrink:0,marginTop:4}}><Logo size={22}/></div>
      <div style={{flex:1,maxWidth:"85%"}}>
        <div style={{marginBottom:10,display:"flex",alignItems:"center",gap:7}}>
          <span style={{width:4,height:4,borderRadius:"50%",background:"#00E5FF",display:"inline-block",animation:"blink 2s infinite"}}/>
          <span style={{fontSize:10,fontFamily:"'Syne',sans-serif",letterSpacing:".12em",color:"#00E5FF",opacity:.7}}>RUTAS COGNITIVAS</span>
          <span style={{fontSize:11,color:"#404860",fontFamily:"'DM Sans',sans-serif"}}>· {msg.intent}</span>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {(msg.routes||[]).map((r,i)=>(
            <button key={r.id||i} onClick={()=>onSelect(r)} onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)}
              style={{textAlign:"left",padding:"11px 14px",borderRadius:9,background:hov===i?"rgba(0,229,255,.06)":"rgba(255,255,255,.025)",border:`1px solid ${hov===i?"rgba(0,229,255,.25)":"rgba(255,255,255,.07)"}`,transition:"all .18s ease",display:"flex",alignItems:"center",gap:12,cursor:"pointer"}}>
              <span style={{width:20,height:20,borderRadius:5,background:hov===i?"rgba(0,229,255,.12)":"rgba(255,255,255,.04)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontFamily:"'Syne',sans-serif",color:hov===i?"#00E5FF":"#404060",fontWeight:700,flexShrink:0,transition:"all .18s ease"}}>{i+1}</span>
              <div>
                <div style={{fontSize:11,fontFamily:"'Syne',sans-serif",fontWeight:600,letterSpacing:".06em",color:hov===i?"#E8EEF8":"#7080a0",marginBottom:2,transition:"all .18s ease"}}>{r.label&&r.label.toUpperCase()}</div>
                <div style={{fontSize:13,fontFamily:"'DM Sans',sans-serif",color:hov===i?"#B8C2E8":"#505870",transition:"all .18s ease"}}>{r.description}</div>
              </div>
            </button>
          ))}
        </div>
        <div style={{marginTop:8,fontSize:11,color:"#282838",fontFamily:"'DM Sans',sans-serif"}}>Seleccioná un enfoque para continuar.</div>
      </div>
    </div>
  );
}

function Sidebar({onNew,projects=[],tasks=[],onOpen,onSignOut,session,onOpenCodex}) {
  const [view,setView]=useState(null);
  const [q,setQ]=useState("");
  const user=session?.user?.email?.split("@")[0]||"Usuario";
  const init=user[0].toUpperCase();
  const recent=[...projects].sort((a,b)=>((b.updatedAt||b.updated_at||"")>=(a.updatedAt||a.updated_at||""))?1:-1).slice(0,7);
  const results=q?projects.filter(p=>(p.title||"").toLowerCase().includes(q.toLowerCase())):[];
  const AC="#00E5FF"; const BD="rgba(0,229,255,.1)"; const BASE="rgba(5,7,19,.95)";

  const go=p=>{onOpen&&onOpen(p);setView(null);};

  const SBHeader=({label})=>(
    <div style={{borderBottom:`1px solid ${BD}`,flexShrink:0}}>
      <div style={{padding:"14px 16px 10px",display:"flex",alignItems:"center",gap:10,borderBottom:`1px solid ${BD}`}}>
        <Logo size={20}/><span style={{fontFamily:"'Orbitron',monospace",fontWeight:700,fontSize:12,letterSpacing:".2em",color:"#F4F7FF"}}>NEURA</span>
      </div>
      <button onClick={()=>setView(null)} style={{display:"flex",alignItems:"center",gap:7,padding:"9px 14px",color:"#606880",fontSize:12,fontFamily:"'DM Sans',sans-serif",width:"100%",transition:"all .15s ease",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.color=AC} onMouseLeave={e=>e.currentTarget.style.color="#606880"}>
        <I.Back/>{label}
      </button>
    </div>
  );

  const SBFooter=()=>(
    <div style={{padding:"10px 14px",borderTop:`1px solid ${BD}`,display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
      <div style={{width:26,height:26,borderRadius:"50%",background:"rgba(0,229,255,.1)",border:`1px solid ${BD}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontFamily:"'Syne',sans-serif",fontWeight:700,color:AC,flexShrink:0}}>{init}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:12,fontFamily:"'DM Sans',sans-serif",color:"#B8C2E8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user[0].toUpperCase()+user.slice(1)}</div>
        <div style={{fontSize:10,color:"#333355",fontFamily:"'DM Sans',sans-serif",marginTop:1}}>Plan Maestro</div>
      </div>
      {USE_SUPABASE&&onSignOut&&<button onClick={onSignOut} style={{color:"#333",flexShrink:0,transition:"all .2s ease",display:"flex",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.color="#ff6b6b"} onMouseLeave={e=>e.currentTarget.style.color="#333"}><I.LogOut/></button>}
    </div>
  );

  const RecentList=({pick})=>(
    <>
      {recent.length>0&&<div style={{fontSize:9,fontFamily:"'Syne',sans-serif",letterSpacing:".16em",color:"#252535",padding:"8px 16px 4px"}}>RECIENTE</div>}
      {recent.map(p=>(
        <button key={p.id} onClick={()=>pick(p)} style={{width:"calc(100% - 8px)",margin:"0 4px",textAlign:"left",padding:"7px 10px",borderRadius:7,display:"flex",flexDirection:"column",gap:2,background:"transparent",transition:"all .15s ease",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.04)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <div style={{display:"flex",alignItems:"center",gap:5,minWidth:0}}>
            {p.status==="LIVE"&&<span style={{width:4,height:4,borderRadius:"50%",background:AC,flexShrink:0,animation:"blink 2s infinite",display:"inline-block"}}/>}
            <span style={{fontSize:12,fontFamily:"'DM Sans',sans-serif",color:"#7880a8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{p.title}</span>
          </div>
          <span style={{fontSize:10,color:"#252535",paddingLeft:p.status==="LIVE"?10:0}}>{timeAgo(p.updatedAt||p.updated_at||p.createdAt)}</span>
        </button>
      ))}
    </>
  );

  if(view==="search")return(
    <div style={{width:SIDEBAR_W,flexShrink:0,display:"flex",flexDirection:"column",background:BASE,borderRight:`1px solid ${BD}`,zIndex:20}}>
      <SBHeader label="Buscar chat"/>
      <div style={{padding:"10px 12px 6px",flexShrink:0}}>
        <div style={{position:"relative"}}>
          <span style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",color:"#606880",display:"flex",pointerEvents:"none"}}><I.Search/></span>
          <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar..." style={{width:"100%",background:"rgba(255,255,255,.04)",border:`1px solid ${BD}`,borderRadius:8,padding:"8px 10px 8px 32px",color:"#E8EEF8",fontSize:13,fontFamily:"'DM Sans',sans-serif"}}/>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",scrollbarWidth:"none"}}>
        {q&&!results.length?<div style={{padding:20,textAlign:"center",fontSize:12,color:"#404060",fontFamily:"'DM Sans',sans-serif"}}>Sin resultados</div>
        :q?results.map(p=>(<button key={p.id} onClick={()=>go(p)} style={{width:"100%",textAlign:"left",padding:"9px 14px",background:"transparent",display:"flex",flexDirection:"column",gap:2,transition:"all .15s ease",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.04)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><span style={{fontSize:12,color:"#B8C2E8",fontFamily:"'DM Sans',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.title}</span></button>))
        :<RecentList pick={go}/>}
      </div>
      <SBFooter/>
    </div>
  );

  if(view==="memory")return(
    <div style={{width:SIDEBAR_W,flexShrink:0,display:"flex",flexDirection:"column",background:BASE,borderRight:`1px solid ${BD}`,zIndex:20}}>
      <SBHeader label={`Memoria · ${projects.length} op${projects.length!==1?"s":""}`}/>
      <div style={{flex:1,overflowY:"auto",padding:"6px 4px",scrollbarWidth:"none"}}>
        {!projects.length?<div style={{padding:24,textAlign:"center",fontSize:12,color:"#404060",fontFamily:"'DM Sans',sans-serif"}}>Las conversaciones aparecerán aquí.</div>
        :projects.map(p=>(<button key={p.id} onClick={()=>go(p)} style={{width:"100%",textAlign:"left",padding:"9px 12px",borderRadius:8,background:"transparent",border:"1px solid transparent",display:"flex",flexDirection:"column",gap:3,marginBottom:2,transition:"all .15s ease",cursor:"pointer"}} onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,.04)";e.currentTarget.style.borderColor=BD;}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor="transparent";}}>
          <div style={{display:"flex",alignItems:"center",gap:6,minWidth:0}}>
            {p.status==="LIVE"&&<span style={{width:4,height:4,borderRadius:"50%",background:AC,flexShrink:0,animation:"blink 2s infinite",display:"inline-block"}}/>}
            <span style={{fontSize:12,fontFamily:"'DM Sans',sans-serif",color:"#B8C2E8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1,fontWeight:500}}>{p.title}</span>
          </div>
          <span style={{fontSize:9,color:"#252535",paddingLeft:p.status==="LIVE"?10:0}}>{timeAgo(p.updatedAt||p.updated_at||p.createdAt||"")}</span>
        </button>))}
      </div>
      <div style={{padding:"10px 12px",flexShrink:0,borderTop:`1px solid ${BD}`}}>
        <button onClick={()=>{onNew();setView(null);}} style={{width:"100%",padding:"8px",borderRadius:8,background:"rgba(0,229,255,.06)",border:`1px solid ${BD}`,color:AC,fontSize:11,fontFamily:"'Syne',sans-serif",letterSpacing:".08em",transition:"all .2s ease",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(0,229,255,.1)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(0,229,255,.06)"}>+ NUEVA OPERACIÓN</button>
      </div>
      <SBFooter/>
    </div>
  );

  if(view==="library")return(
    <div style={{width:SIDEBAR_W,flexShrink:0,display:"flex",flexDirection:"column",background:BASE,borderRight:`1px solid ${BD}`,zIndex:20}}>
      <SBHeader label="Base de Conocimiento"/>
      <div style={{flex:1,padding:12,overflowY:"auto",scrollbarWidth:"none"}}>
        {[{l:"Sistemas",v:projects.length,d:"Operaciones y pipelines"},{l:"Documentos",v:0,d:"PDFs y textos"},{l:"Outputs",v:0,d:"Resultados generados"}].map((c,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:10,borderRadius:8,marginBottom:4,border:`1px solid ${BD}`,background:"rgba(255,255,255,.02)"}}>
            <div style={{width:28,height:28,borderRadius:7,background:"rgba(0,229,255,.06)",display:"flex",alignItems:"center",justifyContent:"center",color:c.v>0?AC:"#404060",flexShrink:0}}><I.Book/></div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontFamily:"'DM Sans',sans-serif",color:"#B8C2E8",fontWeight:500}}>{c.l}</div>
              <div style={{fontSize:10,color:"#404060",fontFamily:"'DM Sans',sans-serif",marginTop:1}}>{c.d}</div>
            </div>
            <span style={{fontSize:11,fontFamily:"'Syne',sans-serif",color:c.v>0?AC:"#252535",fontWeight:600}}>{c.v}</span>
          </div>
        ))}
        <div style={{marginTop:12,padding:12,borderRadius:8,background:"rgba(0,229,255,.03)",border:`1px solid ${BD}`}}>
          <div style={{fontSize:11,color:"#404060",fontFamily:"'DM Sans',sans-serif",lineHeight:1.6,textAlign:"center"}}>El conocimiento que generes con NEURA se organiza aquí automáticamente.</div>
        </div>
      </div>
      <SBFooter/>
    </div>
  );

  return(
    <div style={{width:SIDEBAR_W,flexShrink:0,display:"flex",flexDirection:"column",background:BASE,borderRight:`1px solid ${BD}`,zIndex:20,overflow:"hidden"}}>
      <div style={{padding:"14px 16px 10px",display:"flex",alignItems:"center",gap:10,borderBottom:`1px solid ${BD}`,flexShrink:0}}>
        <Logo size={20}/><span style={{fontFamily:"'Orbitron',monospace",fontWeight:700,fontSize:12,letterSpacing:".2em",color:"#F4F7FF"}}>NEURA</span>
      </div>
      <div style={{padding:"10px 10px 6px",flexShrink:0}}>
        <button onClick={onNew} style={{width:"100%",display:"flex",alignItems:"center",gap:9,padding:"9px 14px",borderRadius:9,background:"rgba(0,229,255,.08)",border:"1px solid rgba(0,229,255,.18)",color:"#E8EEF8",fontSize:13,fontFamily:"'DM Sans',sans-serif",fontWeight:500,transition:"all .18s ease",cursor:"pointer"}} onMouseEnter={e=>{e.currentTarget.style.background="rgba(0,229,255,.13)";e.currentTarget.style.borderColor=AC;}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(0,229,255,.08)";e.currentTarget.style.borderColor="rgba(0,229,255,.18)";}}><I.Plus/> Nuevo chat</button>
      </div>
      <div style={{padding:"4px 8px",flexShrink:0}}>
        {[{k:"search",l:"Buscar chat",Ic:I.Search},{k:"library",l:"Base de Conocimiento",Ic:I.Book},{k:"memory",l:"Memoria",Ic:I.Memory}].map(({k,l,Ic})=>(
          <button key={k} onClick={()=>setView(k)} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:7,background:"transparent",color:"#6a7090",fontSize:13,fontFamily:"'DM Sans',sans-serif",transition:"all .15s ease",textAlign:"left",cursor:"pointer"}} onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,.04)";e.currentTarget.style.color="#B8C2E8";}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="#6a7090";}}>
            <span style={{opacity:.55,flexShrink:0}}><Ic/></span><span>{l}</span>
          </button>
        ))}
        {/* CODEX — vista de automatización */}
        <button onClick={onOpenCodex} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:7,background:"rgba(123,77,255,.08)",border:"1px solid rgba(123,77,255,.2)",color:"#B45CFF",fontSize:13,fontFamily:"'DM Sans',sans-serif",transition:"all .15s ease",textAlign:"left",cursor:"pointer",marginTop:4}} onMouseEnter={e=>{e.currentTarget.style.background="rgba(123,77,255,.14)";e.currentTarget.style.color="#c060ff";}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(123,77,255,.08)";e.currentTarget.style.color="#B45CFF";}}>
          <span style={{opacity:.8,flexShrink:0,fontSize:13}}>⚡</span><span style={{fontWeight:500}}>CODEX</span>
          <span style={{marginLeft:"auto",fontSize:9,fontFamily:"'Syne',sans-serif",letterSpacing:".08em",opacity:.6}}>AUTO</span>
        </button>
      </div>
      <div style={{height:1,background:"rgba(255,255,255,.04)",margin:"6px 14px",flexShrink:0}}/>
      <div style={{flex:1,overflowY:"auto",scrollbarWidth:"none",minHeight:0,padding:"0 4px"}}>
        <RecentList pick={onOpen}/>
        {!recent.length&&<div style={{padding:16,textAlign:"center",fontSize:11,color:"#1e1e2e",fontFamily:"'DM Sans',sans-serif",lineHeight:1.6}}>Los chats aparecerán aquí</div>}
      </div>
      <SBFooter/>
    </div>
  );
}

function CodexWorkspace({onBack}) {
  const [inp,setInp]=useState("");
  const [result,setResult]=useState(null);
  const [loading,setLoading]=useState(false);
  const [connectors,setConnectors]=useState({gmail:true,slack:true,drive:false,whatsapp:false,stripe:false});
  const APPS=[{id:"gmail",icon:"📧",l:"Gmail"},{id:"slack",icon:"💬",l:"Slack"},{id:"drive",icon:"🗂",l:"Drive"},{id:"whatsapp",icon:"📱",l:"WhatsApp"},{id:"stripe",icon:"💳",l:"Stripe"}];
  const VT="#B45CFF";
  const run=(action)=>{
    if(!inp.trim()&&action!=="apps"){setResult("⚠ Describí la automatización primero.");return;}
    setLoading(true);setResult(null);
    setTimeout(()=>{
      const active=Object.entries(connectors).filter(([,v])=>v).map(([k])=>k).join(", ");
      const res={
        simulate:`TRIGGER: "${inp.slice(0,35)}..."\n↓\nIA AGENT: Analiza → clasifica → genera respuesta\n↓\nACCIÓN: Ejecutar en ${active||"plataformas conectadas"}\n\n✓ Simulación completada — Score: 87/100\n📊 Cobertura: Alta | Velocidad: Óptima`,
        apps:`⚙ Conectores activos: ${active||"ninguno"}\nActivá los que necesitás en el panel inferior.`,
        create:`⚡ AUTOMATIZACIÓN CREADA\n\nNombre: Auto-${inp.slice(0,18)}\nEstado: ACTIVO\nPipeline: Trigger → IA → Acción (${active||"sin conectores"})\n\n→ Monitoreable desde Memoria.`,
      }[action];
      setResult(res);setLoading(false);
    },1400);
  };
  const BD2="rgba(123,77,255,.15)";
  const nodes=[{l:"TRIGGER",s:"Evento",x:20,c:"#35D8FF",ic:"⚡"},{l:"IA AGENT",s:"Procesa",x:190,c:"#00E5FF",ic:"🧠"},{l:"ACCIÓN",s:"Ejecuta",x:360,c:VT,ic:"🎯"}];
  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,background:"#050713",overflow:"hidden"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",height:50,background:"rgba(5,7,19,.97)",borderBottom:"1px solid rgba(123,77,255,.2)",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:6,color:"#4050a0",fontSize:13,fontFamily:"'DM Sans',sans-serif",transition:"all .2s ease",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.color="#8090d0"} onMouseLeave={e=>e.currentTarget.style.color="#4050a0"}><I.Back/>Inicio</button>
          <div style={{width:1,height:14,background:"rgba(255,255,255,.06)"}}/>
          <span style={{fontSize:9,fontFamily:"'Syne',sans-serif",letterSpacing:".15em",color:VT,opacity:.8}}>⚡ CODEX</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:5,background:"rgba(123,77,255,.08)",border:"1px solid rgba(123,77,255,.2)"}}>
          <span style={{width:4,height:4,borderRadius:"50%",background:VT,animation:"blink 2s infinite",display:"inline-block"}}/>
          <span style={{fontSize:9,fontFamily:"'Syne',sans-serif",letterSpacing:".1em",color:VT}}>MOTOR DE AUTOMATIZACIÓN</span>
        </div>
      </div>
      {/* Body */}
      <div style={{flex:1,overflowY:"auto",padding:20,scrollbarWidth:"none"}}>
        <div style={{maxWidth:800,margin:"0 auto",display:"flex",flexDirection:"column",gap:14}}>
          {/* Canvas */}
          <div style={{background:"rgba(255,255,255,.02)",border:"1px solid rgba(123,77,255,.15)",borderRadius:14,padding:"18px 20px"}}>
            <div style={{fontSize:9,fontFamily:"'Syne',sans-serif",letterSpacing:".14em",color:VT,opacity:.6,marginBottom:14}}>CANVAS COGNITIVO</div>
            <svg width="100%" height="110" viewBox="0 0 520 100" style={{overflow:"visible"}}>
              <defs><marker id="ca" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3z" fill="rgba(0,229,255,.45)"/></marker></defs>
              <line x1="132" y1="50" x2="188" y2="50" stroke="rgba(0,229,255,.3)" strokeWidth="1.5" strokeDasharray="4,3" markerEnd="url(#ca)"/>
              <line x1="302" y1="50" x2="358" y2="50" stroke="rgba(123,77,255,.3)" strokeWidth="1.5" strokeDasharray="4,3" markerEnd="url(#ca)"/>
              {nodes.map((n,i)=>(
                <g key={i} transform={`translate(${n.x},15)`}>
                  <rect width="112" height="70" rx="10" fill="rgba(255,255,255,.03)" stroke={n.c} strokeWidth="1.2" strokeOpacity=".3"/>
                  <text x="10" y="26" fill={n.c} fontSize="16">{n.ic}</text>
                  <text x="32" y="24" fill={n.c} fontSize="9" fontFamily="Syne,sans-serif" fontWeight="700" letterSpacing="1">{n.l}</text>
                  <text x="10" y="54" fill="rgba(255,255,255,.35)" fontSize="10" fontFamily="DM Sans,sans-serif">{n.s}</text>
                  <circle cx="56" cy="74" r="3" fill={n.c} opacity=".5" style={{animation:"blink 2s ease-in-out infinite"}}/>
                </g>
              ))}
            </svg>
          </div>
          {/* Input */}
          <div style={{background:"rgba(255,255,255,.02)",border:"1px solid rgba(0,229,255,.1)",borderRadius:14,padding:"18px 20px"}}>
            <div style={{fontSize:9,fontFamily:"'Syne',sans-serif",letterSpacing:".14em",color:"#00E5FF",opacity:.6,marginBottom:12}}>INSTRUCCIÓN</div>
            <textarea value={inp} onChange={e=>setInp(e.target.value)} placeholder="Decime qué querés automatizar..." rows={2}
              style={{width:"100%",background:"rgba(255,255,255,.04)",border:"1px solid rgba(0,229,255,.15)",borderRadius:10,padding:"12px 14px",color:"#E8EEF8",fontSize:14,fontFamily:"'DM Sans',sans-serif",resize:"none",lineHeight:1.55,marginBottom:12}}/>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {[{l:"▶ SIMULAR",a:"simulate",bg:"rgba(0,229,255,.08)",bc:"rgba(0,229,255,.25)",c:"#00E5FF"},
                {l:"⚙ CONECTAR APPS",a:"apps",bg:"rgba(255,255,255,.04)",bc:"rgba(255,255,255,.1)",c:"#B8C2E8"},
                {l:"⚡ CREAR AUTO",a:"create",bg:"linear-gradient(135deg,rgba(53,216,255,.12),rgba(123,77,255,.18))",bc:"rgba(123,77,255,.3)",c:"#E8EEF8"}
              ].map(({l,a,bg,bc,c})=>(
                <button key={a} onClick={()=>run(a)} style={{padding:"9px 16px",borderRadius:8,background:bg,border:`1px solid ${bc}`,color:c,fontSize:12,fontFamily:"'Syne',sans-serif",letterSpacing:".06em",fontWeight:600,cursor:"pointer",transition:"all .2s ease"}} onMouseEnter={e=>e.currentTarget.style.opacity=".75"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>{l}</button>
              ))}
            </div>
            {loading&&<div style={{marginTop:14,display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderRadius:10,background:"rgba(255,255,255,.03)",border:"1px solid rgba(0,229,255,.1)"}}>
              <span style={{width:6,height:6,borderRadius:"50%",background:"#00E5FF",display:"inline-block",animation:"blink 1.2s ease-in-out infinite"}}/><span style={{fontSize:13,color:"#606880",fontStyle:"italic"}}>Construyendo automatización...</span>
            </div>}
            {result&&<div style={{marginTop:14,padding:"14px 16px",borderRadius:10,background:"rgba(0,229,255,.04)",border:"1px solid rgba(0,229,255,.15)",animation:"fadeUp .3s ease"}}>
              <div style={{fontSize:9,fontFamily:"'Syne',sans-serif",letterSpacing:".12em",color:"#00E5FF",marginBottom:8,opacity:.7}}>PIPELINE GENERADO</div>
              <div style={{fontSize:13,color:"#B8C2E8",lineHeight:1.6,whiteSpace:"pre-wrap"}}>{result}</div>
            </div>}
          </div>
          {/* Connectors */}
          <div style={{background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.06)",borderRadius:14,padding:"18px 20px"}}>
            <div style={{fontSize:9,fontFamily:"'Syne',sans-serif",letterSpacing:".14em",color:"#606880",marginBottom:14}}>PANEL DE CONECTORES</div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              {APPS.map(({id,icon,l})=>{
                const on=connectors[id];
                return(<button key={id} onClick={()=>setConnectors(p=>({...p,[id]:!p[id]}))}
                  style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,padding:"14px 18px",borderRadius:12,background:on?"rgba(0,229,255,.06)":"rgba(255,255,255,.02)",border:`1px solid ${on?"rgba(0,229,255,.25)":"rgba(255,255,255,.06)"}`,color:on?"#E8EEF8":"#404060",transition:"all .2s ease",cursor:"pointer",minWidth:72}}>
                  <span style={{fontSize:20}}>{icon}</span>
                  <span style={{fontSize:10,fontFamily:"'DM Sans',sans-serif",fontWeight:500}}>{l}</span>
                  <span style={{fontSize:8,fontFamily:"'Syne',sans-serif",letterSpacing:".08em",color:on?"#00E5FF":"#252535"}}>{on?"ACTIVO":"OFF"}</span>
                </button>);
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Home({onSend,selectedMode,onMode,isThinking}) {
  const [input,setInput]=useState("");
  const [focused,setFocused]=useState(false);
  const [img,setImg]=useState(null);
  const fileRef=useRef(null);
  const modeKeys=Object.keys(MODES);

  const handleFile=f=>{
    if(!f||!f.type.startsWith("image/"))return;
    const r=new FileReader(); r.onload=e=>setImg({base64:e.target.result.split(",")[1],mediaType:f.type,preview:e.target.result}); r.readAsDataURL(f);
  };
  const send=()=>{ if(!input.trim()&&!img)return; onSend(input.trim(),img); setInput(""); setImg(null); };

  return(
    <div style={{flex:1,position:"relative",overflow:"hidden",display:"flex",flexDirection:"column",background:"#050713"}}>
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 70% 60% at 55% 40%,rgba(53,216,255,.09) 0%,transparent 55%)",zIndex:0}}/>
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 70% 60% at 70% 35%,rgba(123,77,255,.14) 0%,transparent 60%)",zIndex:0}}/>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"0 32px 20px",position:"relative",zIndex:1}}>
        <div style={{marginBottom:18,animation:isThinking?"orbThink 1.1s ease-in-out infinite":"orbBreath 4s ease-in-out infinite",willChange:"transform,filter"}}>
          <Logo size={68}/>
        </div>
        <div style={{fontFamily:"'Orbitron',monospace",fontSize:34,fontWeight:700,letterSpacing:".3em",color:"#F4F7FF",marginBottom:6,textAlign:"center",textShadow:"0 0 14px rgba(53,216,255,.15)"}}>NEURA</div>
        <div style={{fontSize:11,color:"#8D96C8",letterSpacing:".26em",fontFamily:"'Syne',sans-serif",marginBottom:28,textAlign:"center"}}>SISTEMA OPERATIVO COGNITIVO</div>
        <div style={{width:"100%",maxWidth:600,marginBottom:14}}>
          {img&&(
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,padding:"7px 12px",borderRadius:9,background:"rgba(255,107,107,.05)",border:"1px solid rgba(255,107,107,.14)"}}>
              <img src={img.preview} alt="" style={{width:26,height:26,objectFit:"cover",borderRadius:5}}/>
              <span style={{flex:1,fontSize:10,fontFamily:"'Syne',sans-serif",letterSpacing:".1em",color:"#ff6b6b"}}>ASSET LISTO</span>
              <button onClick={()=>setImg(null)} style={{color:"#ff6b6b",display:"flex",cursor:"pointer"}}><I.Close/></button>
            </div>
          )}
          <div style={{background:"rgba(255,255,255,.055)",backdropFilter:"blur(24px)",border:`1px solid ${focused?"rgba(0,229,255,.55)":"rgba(120,150,255,.28)"}`,borderRadius:16,padding:"18px 18px 12px",boxShadow:focused?"0 0 40px rgba(0,229,255,.1)":"0 8px 40px rgba(0,0,0,.35)",transition:"all .3s ease"}}>
            <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} placeholder={img?"Agregá contexto...":"¿Qué querés construir hoy?"} rows={1} style={{width:"100%",background:"transparent",border:"none",color:"#F4F7FF",fontSize:16,fontFamily:"'DM Sans',sans-serif",resize:"none",lineHeight:1.5,maxHeight:120,overflow:"auto",fontWeight:300,marginBottom:12,letterSpacing:".01em",cursor:"text"}} onInput={e=>{e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,120)+"px";}}/>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{handleFile(e.target.files?.[0]);e.target.value="";}}/>
              {[{Ic:I.Clip,a:()=>fileRef.current&&fileRef.current.click()},{Ic:I.Mic,a:()=>{}}].map(({Ic,a},i)=>(
                <button key={i} onClick={a} style={{width:32,height:32,borderRadius:8,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.06)",display:"flex",alignItems:"center",justifyContent:"center",color:"#6F789F",transition:"all .2s ease",cursor:"pointer"}} onMouseEnter={e=>{e.currentTarget.style.background="rgba(0,229,255,.08)";e.currentTarget.style.color="#00E5FF";}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,.05)";e.currentTarget.style.color="#6F789F";}}><Ic/></button>
              ))}
              <div style={{flex:1}}/>
              <button onClick={()=>{const keys=modeKeys;onMode(keys[(keys.indexOf(selectedMode)+1)%keys.length]);}} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:7,background:"rgba(0,229,255,.05)",border:"1px solid rgba(0,229,255,.12)",color:MODES[selectedMode].color,fontSize:11,fontFamily:"'Syne',sans-serif",letterSpacing:".06em",transition:"all .18s ease",opacity:.8,cursor:"pointer"}} onMouseEnter={e=>{e.currentTarget.style.opacity="1";e.currentTarget.style.borderColor="rgba(0,229,255,.3)";}} onMouseLeave={e=>{e.currentTarget.style.opacity=".8";e.currentTarget.style.borderColor="rgba(0,229,255,.12)";}}>
                {MODES[selectedMode].label}<I.ChevD/>
              </button>
              <button onClick={send} disabled={!input.trim()&&!img} style={{width:38,height:38,borderRadius:"50%",background:(input.trim()||img)?"linear-gradient(135deg,#35D8FF,#7B4DFF)":"rgba(255,255,255,.05)",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s ease",color:"#fff",opacity:(input.trim()||img)?1:.25,boxShadow:(input.trim()||img)?"0 0 22px rgba(0,229,255,.35)":"none",cursor:"pointer"}}><I.ArrowUp/></button>
            </div>
          </div>
        </div>
        <div style={{width:"100%",maxWidth:600,display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
          {modeKeys.map(k=>{
            const m=MODES[k]; const sel=selectedMode===k;
            return(
              <button key={k} onClick={()=>onMode(k)} style={{padding:"12px 10px 16px",borderRadius:10,background:sel?"rgba(0,229,255,.07)":"rgba(255,255,255,.02)",border:`1px solid ${sel?"rgba(0,229,255,.28)":"rgba(255,255,255,.06)"}`,textAlign:"left",transition:"all .2s ease",display:"flex",flexDirection:"column",gap:5,position:"relative",cursor:"pointer"}} onMouseEnter={e=>{if(!sel){e.currentTarget.style.background="rgba(0,229,255,.04)";e.currentTarget.style.borderColor="rgba(0,229,255,.15)";} }} onMouseLeave={e=>{if(!sel){e.currentTarget.style.background="rgba(255,255,255,.02)";e.currentTarget.style.borderColor="rgba(255,255,255,.06)";}}}>
                <div style={{width:5,height:5,borderRadius:"50%",background:sel?m.color:"rgba(255,255,255,.15)",boxShadow:sel?`0 0 6px ${m.color}`:"none",transition:"all .2s ease"}}/>
                <div style={{fontSize:11,fontFamily:"'DM Sans',sans-serif",color:sel?"#F4F7FF":"#7080a0",fontWeight:sel?600:400,marginBottom:1}}>{m.label}</div>
                <div style={{fontSize:10,fontFamily:"'DM Sans',sans-serif",color:"#3a3a5a",lineHeight:1.4}}>{m.sub}</div>
              </button>
            );
          })}
        </div>
        <div style={{marginTop:20,fontSize:11,color:"#7F88B8",fontFamily:"'DM Sans',sans-serif",letterSpacing:".04em"}}>Neura está listo para ayudarte</div>
      </div>
    </div>
  );
}

const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700&family=Syne:wght@400;700&family=DM+Sans:wght@300;400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0;border:0;outline:none;background:none;}
button{cursor:pointer;} textarea,input{cursor:text;outline:none;}
@keyframes fadeUp{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
@keyframes blink{0%,100%{opacity:.3;}50%{opacity:1;}}
@keyframes orbBreath{0%,100%{transform:translateY(0);filter:drop-shadow(0 0 18px rgba(53,216,255,.5)) drop-shadow(0 0 40px rgba(123,77,255,.35));}50%{transform:translateY(-6px);filter:drop-shadow(0 0 30px rgba(53,216,255,.75)) drop-shadow(0 0 65px rgba(123,77,255,.55));}}
@keyframes orbThink{0%,100%{transform:translateY(0) scale(1);}50%{transform:translateY(-4px) scale(1.04);}}
::-webkit-scrollbar{display:none;}
`;

export default function NEURA() {
  const [authReady,setAuthReady]=useState(false);
  const [session,setSession]=useState(null);
  const [authMode,setAuthMode]=useState("login");
  const [authEmail,setAuthEmail]=useState("");
  const [authPass,setAuthPass]=useState("");
  const [authErr,setAuthErr]=useState("");
  const [authLoad,setAuthLoad]=useState(false);
  const [projects,setProjects]=useState([]);
  const [tasks,setTasks]=useState([]);
  const [messages,setMessages]=useState([]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const [activeProject,setActiveProject]=useState(null);
  const [showWelcome,setShowWelcome]=useState(true);
  const [showCodex,setShowCodex]=useState(false);
  const [selectedMode,setSelectedMode]=useState("contextual");
  const [attachedImage,setAttachedImage]=useState(null);
  const [activeAgents,setActiveAgents]=useState([]);
  const chatRef=useRef(null);
  const projRef=useRef(null);

  useEffect(()=>{projRef.current=activeProject;},[activeProject]);
  useEffect(()=>{ if(chatRef.current)chatRef.current.scrollTop=chatRef.current.scrollHeight;},[messages,loading]);

  useEffect(()=>{
    (async()=>{
      try{
        if(USE_SUPABASE){
          try{
            const saved=await sg("neura-session");
            if(saved&&saved.refresh_token){
              const r=await sb.refresh(saved.refresh_token);
              if(r&&r.access_token){store.uid=r.user.id;await ss("neura-session",r);setSession(r);}
            }
          }catch(e){console.warn(e);}
        }else{
          try{
            const [ps,ts]=await Promise.all([store.getProjects(),store.getTasks()]);
            setProjects(Array.isArray(ps)?ps:[]);
            setTasks(Array.isArray(ts)?ts:[]);
          }catch(e){console.warn(e);}
          setSession({user:{id:"local",email:"usuario@neura.app"}});
        }
      }catch(e){console.warn(e);}
      finally{setAuthReady(true);}
    })();
  },[]);

  const signIn=async()=>{
    setAuthLoad(true);setAuthErr("");
    try{const r=await sb.signIn(authEmail,authPass);if(r.error){setAuthErr(r.error.message||"Error.");return;}store.uid=r.user.id;await ss("neura-session",r);setSession(r);const [ps,ts]=await Promise.all([store.getProjects(),store.getTasks()]);setProjects(Array.isArray(ps)?ps:[]);setTasks(Array.isArray(ts)?ts:[]);}
    catch{setAuthErr("Error de conexión.");}finally{setAuthLoad(false);}
  };
  const signUp=async()=>{
    setAuthLoad(true);setAuthErr("");
    try{const r=await sb.signUp(authEmail,authPass);if(r.error){setAuthErr(r.error.message||"Error.");return;}setAuthErr("✓ Verificá tu email.");}
    catch{setAuthErr("Error de conexión.");}finally{setAuthLoad(false);}
  };
  const signOut=async()=>{
    if(session&&session.access_token)await sb.signOut(session.access_token).catch(()=>{});
    await sd("neura-session");setSession(null);setProjects([]);setTasks([]);setMessages([]);setActiveProject(null);setShowWelcome(true);
  };

  const createProject=async firstMsg=>{
    const p={id:genId(),title:buildTitle(firstMsg),status:"LIVE",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
    try{await store.saveProject(p);}catch(e){console.warn(e);}
    setProjects(prev=>[p,...prev]);projRef.current=p;setActiveProject(p);return p;
  };

  const openProject=async p=>{
    setActiveProject(p);projRef.current=p;
    try{const msgs=await store.getMessages(p.id);setMessages(Array.isArray(msgs)?msgs:[]);}catch{setMessages([]);}
    setShowWelcome(false);
  };

  const newChat=()=>{setActiveProject(null);projRef.current=null;setMessages([]);setShowWelcome(true);setShowCodex(false);};

  const sendMessage=async text=>{
    const txt=(text!==undefined?text:input).trim();
    if((!txt&&!attachedImage)||loading)return;
    setInput("");setShowWelcome(false);
    const isVis=!!attachedImage;
    const img=attachedImage;setAttachedImage(null);

    const userMsg={role:"user",content:txt,imagePreview:img&&img.preview?img.preview:null,_imgBase64:img&&img.base64?img.base64:null,_imgMediaType:img&&img.mediaType?img.mediaType:null,createdAt:new Date().toISOString()};
    const hist=[...messages,userMsg];
    setMessages(hist);setLoading(true);

    const ERR={net:"⚠️ Sin conexión. Verificá tu red e intentá nuevamente.",time:"⚠️ NEURA tardó demasiado. Reintentá.",lim:"⚠️ Capacidad temporal agotada. Esperá unos minutos.",auth:"⚠️ Error de autenticación. Recargá la app.",gen:"⚠️ NEURA no pudo completar la operación. Reintentá."};
    const addReply=c=>setMessages(p=>[...p,{role:"assistant",content:c,createdAt:new Date().toISOString()}]);

    let done=false;
    const safety=setTimeout(()=>{if(!done){setLoading(false);setActiveAgents([]);addReply(ERR.time);}},25000);

    try{
      let proj=projRef.current;
      try{
        if(!proj&&txt)proj=await createProject(txt);
        if(proj)await store.saveMessages(proj.id,hist);
        if(proj)await store.appendMsg(proj.id,{role:"user",content:txt});
      }catch(e){console.warn("[N] storage:",e&&e.message);}

      const det=detectAgents(txt+(isVis?" visual design":""));
      setActiveAgents(det);

      const raw=hist.filter(m=>m.type!=="routes"&&(m.role==="user"||m.role==="assistant"));
      const alt=[];
      for(const m of raw){const prev=alt[alt.length-1];if(prev&&prev.role===m.role)alt[alt.length-1]=m;else alt.push(m);}
      const api=alt.slice(-8).map(m=>{
        if(m._imgBase64)return{role:"user",content:[{type:"image",source:{type:"base64",media_type:m._imgMediaType,data:m._imgBase64}},{type:"text",text:m.content||"Analiza."}]};
        return{role:m.role,content:m.content||"..."};
      });
      if(!api.length){addReply(ERR.gen);return;}

      const modePrompt=MODES[selectedMode]&&MODES[selectedMode].prompt?MODES[selectedMode].prompt:"";
      const sys=modePrompt?NEURA_SYSTEM+"\n\n"+modePrompt:NEURA_SYSTEM;

      let res,data;
      try{
        res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:sys,messages:api})});
        data=await res.json().catch(()=>null);
      }catch(netErr){console.error("[N] net:",netErr&&netErr.message);addReply(ERR.net);return;}

      if(!res.ok||!data){
        const t=data&&(data.type||data.error&&data.error.type)||"";const s=res.status;
        if(s===401||t.includes("auth")){addReply(ERR.auth);return;}
        if(s===429||t.includes("limit")||t.includes("exceeded")){addReply(ERR.lim);return;}
        addReply(ERR.gen);return;
      }

      const raw2=data&&data.content&&data.content[0]&&data.content[0].text?data.content[0].text:"";
      if(!raw2){addReply(ERR.gen);return;}

      let aMsg={role:"assistant",content:raw2,createdAt:new Date().toISOString()};
      if(raw2.trimStart().startsWith("{")&&raw2.includes("__neura_routes")){
        try{
          const parsed=JSON.parse(raw2.trim());
          if(parsed.__neura_routes===true&&Array.isArray(parsed.routes)&&parsed.routes.length)
            aMsg={role:"assistant",type:"routes",intent:parsed.intent||"",routes:parsed.routes,resolved:false,createdAt:new Date().toISOString()};
        }catch(je){console.warn("[N] json:",je&&je.message);}
      }

      const final=[...hist,aMsg];
      setMessages(final);
      const all=[...new Set([...det,...detectAgents(raw2)])];setActiveAgents(all);

      try{
        if(proj){
          await store.saveMessages(proj.id,final);
          if(!aMsg.type)await store.appendMsg(proj.id,{role:"assistant",content:raw2});
          await store.updateProject(proj.id,{status:"LIVE",lastSummary:raw2.replace(/[#*●→↓━]/g,"").trim().slice(0,80),activeAgents:all});
        }
      }catch(e){console.warn("[N] save:",e&&e.message);}

    }catch(e){console.error("[N]:",e&&e.message);addReply(ERR.gen);}
    finally{done=true;clearTimeout(safety);setLoading(false);setTimeout(()=>setActiveAgents([]),5000);}
  };

  const selectRoute=(routeMsg,route)=>{
    setMessages(p=>p.map(m=>m===routeMsg?{...m,resolved:true,resolvedLabel:route.label}:m));
    sendMessage("Enfoque: "+route.label+" — "+route.description+". Procedé.");
  };

  if(!authReady)return(
    <><style>{CSS}</style>
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#050713"}}>
      <div style={{fontFamily:"'Orbitron',monospace",fontSize:24,fontWeight:700,color:"#00E5FF",letterSpacing:".15em",animation:"blink 1.5s ease-in-out infinite"}}>NEURA</div>
    </div></>
  );

  if(USE_SUPABASE&&!session)return(
    <><style>{CSS}</style>
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#050713"}}>
      <div style={{width:"100%",maxWidth:380,padding:32,borderRadius:20,background:"rgba(255,255,255,.04)",border:"1px solid rgba(0,229,255,.1)",backdropFilter:"blur(20px)"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <Logo size={36}/><br/>
          <div style={{fontFamily:"'Orbitron',monospace",fontWeight:700,fontSize:15,letterSpacing:".25em",color:"#F4F7FF",marginTop:10}}>NEURA</div>
          <div style={{fontSize:11,color:"#606880",fontFamily:"'DM Sans',sans-serif",marginTop:4}}>{authMode==="login"?"INICIAR SESIÓN":"CREAR CUENTA"}</div>
        </div>
        <input type="email" placeholder="Email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")(authMode==="login"?signIn:signUp)();}} style={{width:"100%",background:"rgba(255,255,255,.05)",border:"1px solid rgba(0,229,255,.15)",borderRadius:10,padding:"12px 14px",color:"#E8EEF8",fontSize:14,fontFamily:"'DM Sans',sans-serif",marginBottom:10,display:"block"}}/>
        <input type="password" placeholder="Contraseña" value={authPass} onChange={e=>setAuthPass(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")(authMode==="login"?signIn:signUp)();}} style={{width:"100%",background:"rgba(255,255,255,.05)",border:"1px solid rgba(0,229,255,.15)",borderRadius:10,padding:"12px 14px",color:"#E8EEF8",fontSize:14,fontFamily:"'DM Sans',sans-serif",marginBottom:10,display:"block"}}/>
        {authErr&&<div style={{fontSize:12,color:authErr.startsWith("✓")?"#00E5FF":"#ff6b6b",fontFamily:"'DM Sans',sans-serif",marginBottom:10,textAlign:"center"}}>{authErr}</div>}
        <button onClick={authMode==="login"?signIn:signUp} disabled={authLoad} style={{width:"100%",padding:13,borderRadius:10,background:"linear-gradient(135deg,#35D8FF,#7B4DFF)",color:"#fff",fontSize:14,fontFamily:"'Syne',sans-serif",fontWeight:700,letterSpacing:".08em",opacity:authLoad?.5:1,marginBottom:10,cursor:"pointer"}}>{authLoad?"...":(authMode==="login"?"INGRESAR":"CREAR CUENTA")}</button>
        <button onClick={()=>{setAuthMode(m=>m==="login"?"register":"login");setAuthErr("");}} style={{width:"100%",fontSize:12,color:"#606880",fontFamily:"'DM Sans',sans-serif",textAlign:"center",padding:6,cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.color="#00E5FF"} onMouseLeave={e=>e.currentTarget.style.color="#606880"}>{authMode==="login"?"¿No tenés cuenta? Registrate":"¿Ya tenés cuenta? Ingresá"}</button>
      </div>
    </div></>
  );

  const mode=MODES[selectedMode];

  return(
    <><style>{CSS}</style>
    <div style={{display:"flex",height:"100vh",overflow:"hidden",background:"#050713",color:"#E8EEF8"}}>
      <Sidebar onNew={newChat} projects={projects} tasks={tasks} onOpen={openProject} onSignOut={USE_SUPABASE?signOut:null} session={session} onOpenCodex={()=>{setShowCodex(true);setShowWelcome(false);}}/>
      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,position:"relative"}}>
        {showCodex?(
          <CodexWorkspace onBack={newChat}/>
        ):showWelcome?(
          <Home onSend={(t,img)=>{if(img){setAttachedImage(img);setTimeout(()=>sendMessage(t||""),50);}else sendMessage(t);}} selectedMode={selectedMode} onMode={setSelectedMode} isThinking={loading}/>
        ):(
          <>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",height:50,background:"rgba(5,7,19,.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(0,229,255,.07)",flexShrink:0}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <button onClick={newChat} style={{display:"flex",alignItems:"center",gap:6,color:"#4050a0",fontSize:13,fontFamily:"'DM Sans',sans-serif",transition:"all .2s ease",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.color="#8090d0"} onMouseLeave={e=>e.currentTarget.style.color="#4050a0"}><I.Back/>Inicio</button>
                {activeProject&&<><div style={{width:1,height:14,background:"rgba(255,255,255,.06)"}}/><span style={{fontSize:11,fontFamily:"'Syne',sans-serif",letterSpacing:".07em",color:"#00E5FF",maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{activeProject.title}</span></>}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                {activeAgents.slice(0,3).map(a=><div key={a} style={{fontSize:9,fontFamily:"'Syne',sans-serif",fontWeight:700,color:"#00E5FF",letterSpacing:".06em",padding:"2px 7px",borderRadius:4,background:"rgba(0,229,255,.08)",border:"1px solid rgba(0,229,255,.2)"}}>{a.toUpperCase()}</div>)}
                <div style={{display:"flex",alignItems:"center",gap:4,padding:"3px 9px",borderRadius:5,background:"rgba(0,229,255,.06)",border:"1px solid rgba(0,229,255,.12)"}}>
                  <div style={{width:4,height:4,borderRadius:"50%",background:"#00E5FF",opacity:.7}}/>
                  <span style={{fontSize:9,fontFamily:"'Syne',sans-serif",letterSpacing:".1em",color:"#00E5FF",opacity:.8}}>{mode.label.toUpperCase()}</span>
                </div>
              </div>
            </div>
            <div ref={chatRef} style={{flex:1,overflowY:"auto",padding:"24px 20px",scrollbarWidth:"none",background:"#050713"}}>
              <div style={{maxWidth:760,margin:"0 auto"}}>
                {messages.map((m,i)=>m.type==="routes"?<Routes key={i} msg={m} onSelect={r=>selectRoute(m,r)}/>:<Bubble key={i} msg={m}/>)}
                {loading&&<ThinkingState/>}
              </div>
            </div>
            <div style={{padding:"12px 20px 16px",background:"rgba(5,7,19,.96)",backdropFilter:"blur(20px)",borderTop:"1px solid rgba(0,229,255,.07)",flexShrink:0}}>
              <div style={{maxWidth:760,margin:"0 auto"}}>
                {attachedImage&&(
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,padding:"7px 12px",borderRadius:9,background:"rgba(255,107,107,.05)",border:"1px solid rgba(255,107,107,.14)"}}>
                    <img src={attachedImage.preview} alt="" style={{width:26,height:26,objectFit:"cover",borderRadius:5}}/>
                    <span style={{flex:1,fontSize:10,fontFamily:"'Syne',sans-serif",letterSpacing:".1em",color:"#ff6b6b"}}>ASSET EN COLA</span>
                    <button onClick={()=>setAttachedImage(null)} style={{color:"#ff6b6b",display:"flex",cursor:"pointer"}}><I.Close/></button>
                  </div>
                )}
                <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",borderRadius:14,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)"}}>
                  <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}}} placeholder="Decime qué querés lograr..." rows={1} disabled={loading} style={{flex:1,background:"transparent",border:"none",color:"#E8EEF8",fontSize:14,fontFamily:"'DM Sans',sans-serif",resize:"none",lineHeight:1.6,maxHeight:120,overflow:"auto",opacity:loading?.5:1,cursor:"text"}} onInput={e=>{e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,120)+"px";}}/>
                  <button onClick={()=>sendMessage()} disabled={(!input.trim()&&!attachedImage)||loading} style={{width:34,height:34,borderRadius:9,background:(!input.trim()&&!attachedImage)||loading?"rgba(255,255,255,.05)":"linear-gradient(135deg,#35D8FF,#7B4DFF)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .2s ease",opacity:(!input.trim()&&!attachedImage)||loading?.2:1,color:"#fff",boxShadow:input.trim()?"0 0 16px rgba(0,229,255,.3)":"none",cursor:"pointer"}}><I.Send/></button>
                </div>
                <div style={{textAlign:"center",marginTop:6,fontSize:9,color:"#141620",fontFamily:"'Syne',sans-serif",letterSpacing:".12em"}}>NEURA · SISTEMA OPERATIVO COGNITIVO</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div></>
  );
}