import { useState, useRef, useEffect, useCallback } from "react";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const T = {
  bg:        "#FFFFFF",
  bgSubtle:  "#F9F9F9",
  bgInput:   "#FFFFFF",
  border:    "#E5E5E5",
  borderFocus:"#9CA3AF",
  textPrimary:"#111111",
  textSec:   "#6B6B6B",
  textTert:  "#9CA3AF",
  accent:    "#6D28D9",
  accentSoft:"#F5F3FF",
  userBg:    "#F3F4F6",
  neuraText: "#111111",
};

// ─── PROVIDERS CONFIG ─────────────────────────────────────────────────────────
const PROVIDERS = [
  { id:"auto",     label:"✨ Automático",  sub:"NEURA elige",     enabled: true  },
  { id:"claude",   label:"Claude",         sub:"Anthropic",       enabled: true  },
  { id:"gpt",      label:"GPT",            sub:"OpenAI",          enabled: false },
  { id:"gemini",   label:"Gemini",         sub:"Google",          enabled: false },
  { id:"grok",     label:"Grok",           sub:"xAI",             enabled: false },
  { id:"deepseek", label:"DeepSeek",       sub:"DeepSeek",        enabled: false },
  { id:"kimi",     label:"Kimi",           sub:"Moonshot",        enabled: false },
];

// ─── STORAGE HELPERS ──────────────────────────────────────────────────────────
const CONV_KEY = "neura-conversations-v1";
const getConvs = () => { try { return JSON.parse(localStorage.getItem(CONV_KEY)||"[]"); } catch { return []; } };
const saveConvs = (list) => { try { localStorage.setItem(CONV_KEY, JSON.stringify(list.slice(0,100))); } catch {} };
const mkId = () => Math.random().toString(36).slice(2)+Date.now().toString(36);
const mkTitle = (text) => text.slice(0,50).trim()||"Nueva conversación";

// ─── MARKDOWN RENDERER (minimal) ──────────────────────────────────────────────
function renderMarkdown(text) {
  if (!text) return "";
  let html = text
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/```([\w]*)\n?([\s\S]*?)```/g, (_,lang,code)=>`<pre><code class="lang-${lang}">${code.trim()}</code></pre>`)
    .replace(/\`([^\`]+)\`/g,"<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g,"<em>$1</em>")
    .replace(/^#{3}\s+(.+)$/gm,"<h3>$1</h3>")
    .replace(/^#{2}\s+(.+)$/gm,"<h2>$1</h2>")
    .replace(/^#{1}\s+(.+)$/gm,"<h1>$1</h1>")
    .replace(/^\s*[-*]\s+(.+)$/gm,"<li>$1</li>")
    .replace(/(<li>.*<\/li>)/s,"<ul>$1</ul>")
    .replace(/\n{2,}/g,"</p><p>")
    .replace(/\n/g,"<br/>");
  return `<p>${html}</p>`.replace(/<p><\/p>/g,"").replace(/<p>(<h[123]>)/g,"$1").replace(/(<\/h[123]>)<\/p>/g,"$1");
}

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Icon = {
  Plus: ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Send: ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Mic:  ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 19v4M8 23h8"/></svg>,
  Menu: ()=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  X:    ()=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Copy: ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  Chev:()=><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>,
  Clip: ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.41a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>,
  Trash:()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
};

// ─── NEURA LOGO ───────────────────────────────────────────────────────────────
function NeuraLogo({ size=28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="14" fill="#6D28D9"/>
      <path d="M10 22V10l12 12V10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ─── MODEL CHIPS — visible horizontal selector ────────────────────────────────
const PROVIDER_INFO = {
  auto:     "Neura elige por vos la IA más adecuada para cada pedido.",
  claude:   "Usar Claude para esta conversación.",
  gpt:      "Usar GPT para esta conversación.",
  gemini:   "Usar Gemini para esta conversación.",
  grok:     "Usar Grok para esta conversación.",
  deepseek: "Usar DeepSeek para esta conversación.",
  kimi:     "Usar Kimi para esta conversación.",
};

function ModelChips({ value, onChange }) {
  const [tooltip, setTooltip] = useState(null);
  return (
    <div>
      {/* Label */}
      <div style={{fontSize:10,color:T.textTert,letterSpacing:".06em",marginBottom:7,fontWeight:500,textTransform:"uppercase"}}>
        Cerebro
      </div>
      {/* Chips row — scrollable on mobile */}
      <div style={{display:"flex",gap:5,overflowX:"auto",scrollbarWidth:"none",msOverflowStyle:"none",paddingBottom:2,WebkitOverflowScrolling:"touch"}}>
        {PROVIDERS.map(p=>{
          const sel = value===p.id;
          return(
            <button key={p.id}
              onClick={()=>p.enabled&&onChange(p.id)}
              onMouseEnter={()=>setTooltip(p.id)}
              onMouseLeave={()=>setTooltip(null)}
              title={PROVIDER_INFO[p.id]}
              style={{
                flexShrink:0,
                display:"flex",alignItems:"center",gap:4,
                padding:"5px 11px",borderRadius:20,
                background: sel?"#111111":T.bgSubtle,
                border: `1px solid ${sel?"#111111":T.border}`,
                color: sel?"#FFFFFF":p.enabled?T.textSec:T.textTert,
                fontSize:12,fontFamily:"inherit",
                cursor:p.enabled?"pointer":"default",
                opacity:p.enabled?1:.5,
                transition:"all .15s ease",
                whiteSpace:"nowrap",
                fontWeight: sel?500:400,
              }}
            >
              {p.id==="auto"&&<span style={{fontSize:11}}>✨</span>}
              <span>{p.id==="auto"?"Automático":p.label}</span>
            </button>
          );
        })}
      </div>
      {/* Active model tooltip */}
      <div style={{marginTop:6,fontSize:11,color:T.textTert,minHeight:14,transition:"opacity .15s",opacity:tooltip?1:.6}}>
        {tooltip ? PROVIDER_INFO[tooltip] : (value==="auto" ? "Neura elige por vos la IA más adecuada." : `Usando ${PROVIDERS.find(p=>p.id===value)?.label||value} para esta conversación.`)}
      </div>
    </div>
  );
}

// Keep ModelSelector as alias for backwards compat
function ModelSelector({ value, onChange }) {
  return <ModelChips value={value} onChange={onChange}/>;
}

// ─── VOICE BUTTON ─────────────────────────────────────────────────────────────
function VoiceButton({ onTranscript, size="lg" }) {
  const [state, setState] = useState("idle"); // idle | listening | transcribing | error
  const recogRef = useRef(null);

  const toggle = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Tu navegador no soporta reconocimiento de voz. Probá Chrome."); return; }
    if (state === "listening") {
      recogRef.current?.stop();
      setState("idle");
      return;
    }
    const r = new SR();
    r.lang = "es-AR";
    r.continuous = false;
    r.interimResults = false;
    r.onstart = () => setState("listening");
    r.onresult = e => {
      setState("transcribing");
      const t = e.results[0][0].transcript;
      onTranscript(t);
      setTimeout(()=>setState("idle"),600);
    };
    r.onerror = () => { setState("error"); setTimeout(()=>setState("idle"),1500); };
    r.onend = () => { if(state!=="transcribing") setState("idle"); };
    recogRef.current = r;
    r.start();
  };

  const isLg = size === "lg";
  const dim = isLg ? 64 : 36;
  const colors = {
    idle:        { bg: "#6D28D9", color: "white", shadow: "0 2px 12px rgba(109,40,217,.3)" },
    listening:   { bg: "#DC2626", color: "white", shadow: "0 2px 16px rgba(220,38,38,.4)" },
    transcribing:{ bg: "#059669", color: "white", shadow: "0 2px 12px rgba(5,150,105,.3)" },
    error:       { bg: "#9CA3AF", color: "white", shadow: "none" },
  };
  const c = colors[state];

  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
      <button onClick={toggle} title={state==="listening"?"Detener":"Hablar"}
        style={{width:dim,height:dim,borderRadius:"50%",background:c.bg,border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:c.color,boxShadow:c.shadow,transition:"all .25s ease",transform:state==="listening"?"scale(1.08)":"scale(1)",animation:state==="listening"?"voicePulse 1.4s ease-in-out infinite":"none"}}>
        <Icon.Mic/>
      </button>
      {isLg&&<span style={{fontSize:12,color:T.textTert,fontWeight:400}}>
        {state==="idle"?"Hablá con Neura":state==="listening"?"Te escucho…":state==="transcribing"?"Entendiendo…":"Intente de nuevo"}
      </span>}
    </div>
  );
}

// ─── MESSAGE BUBBLE ───────────────────────────────────────────────────────────
function Message({ msg, onCopy }) {
  const isUser = msg.role === "user";
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard?.writeText(msg.content||"").then(()=>{setCopied(true);setTimeout(()=>setCopied(false),1500);});
  };

  return (
    <div style={{display:"flex",gap:12,marginBottom:20,flexDirection:isUser?"row-reverse":"row",alignItems:"flex-start"}}>
      {!isUser&&<div style={{width:28,height:28,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",marginTop:2}}><NeuraLogo size={28}/></div>}
      <div style={{maxWidth:"min(75%, 600px)",minWidth:40}}>
        {isUser
          ? <div style={{background:T.userBg,borderRadius:"16px 4px 16px 16px",padding:"10px 14px",color:T.textPrimary,fontSize:14,lineHeight:1.6,wordBreak:"break-word"}}>{msg.content}</div>
          : <div>
              <div style={{color:T.neuraText,fontSize:14,lineHeight:1.7,wordBreak:"break-word"}} dangerouslySetInnerHTML={{__html:renderMarkdown(msg.content)||"<span style='color:#9CA3AF'>▍</span>"}}/>
              {msg.content&&<div style={{display:"flex",gap:8,marginTop:8,alignItems:"center"}}>
                {msg.provider&&<span style={{fontSize:10,color:T.textTert,fontFamily:"inherit"}}>{msg.provider}</span>}
                <button onClick={copy} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 7px",borderRadius:5,background:"transparent",border:`1px solid ${copied?"#D1FAE5":"transparent"}`,color:copied?"#059669":T.textTert,fontSize:11,cursor:"pointer",transition:"all .15s",fontFamily:"inherit"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.textSec;}} onMouseLeave={e=>{if(!copied){e.currentTarget.style.borderColor="transparent";e.currentTarget.style.color=T.textTert;}}}>
                  <Icon.Copy/>{copied?"Copiado":"Copiar"}
                </button>
              </div>}
            </div>
        }
      </div>
    </div>
  );
}

// ─── CHAT COMPOSER ────────────────────────────────────────────────────────────
function Composer({ onSend, isLoading, model, onModelChange }) {
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const textRef = useRef(null);

  const send = () => {
    const t = text.trim();
    if (!t || isLoading) return;
    onSend(t);
    setText("");
    if (textRef.current) textRef.current.style.height = "auto";
  };

  const onKey = e => { if (e.key==="Enter"&&!e.shiftKey) { e.preventDefault(); send(); } };
  const onInput = e => {
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
    setText(e.target.value);
  };

  return (
    <div style={{padding:"12px 16px 16px",background:T.bg,borderTop:`1px solid ${T.border}`,flexShrink:0}}>
      <div style={{maxWidth:720,margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"flex-end",gap:0,background:T.bg,border:`1.5px solid ${focused?T.borderFocus:T.border}`,borderRadius:14,transition:"border-color .15s",padding:"10px 10px 10px 14px"}}>
          <textarea ref={textRef} value={text} onChange={onInput} onKeyDown={onKey} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
            placeholder="Escribí lo que necesitás…" rows={1}
            style={{flex:1,background:"transparent",border:"none",resize:"none",color:T.textPrimary,fontSize:15,lineHeight:1.55,outline:"none",maxHeight:140,overflowY:"auto",fontFamily:"inherit",padding:0}}
          />
          <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0,paddingLeft:8}}>
            <VoiceButton onTranscript={t=>{ setText(p=>p?p+" "+t:t); textRef.current?.focus(); }} size="sm"/>
            <button onClick={send} disabled={!text.trim()||isLoading}
              style={{width:36,height:36,borderRadius:10,background:text.trim()&&!isLoading?T.accent:"#E5E7EB",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:text.trim()&&!isLoading?"pointer":"default",color:"white",transition:"all .15s",flexShrink:0}}>
              <Icon.Send/>
            </button>
          </div>
        </div>
        <div style={{marginTop:10}}>
          <ModelChips value={model} onChange={onModelChange}/>
        </div>
      </div>
    </div>
  );
}

// ─── HOME EMPTY STATE ─────────────────────────────────────────────────────────
function HomeEmpty({ onSend, model, onModelChange }) {
  const CHIPS = ["Necesito una idea de negocio","Redactá un email profesional","Explicame algo complejo","Ayudame a organizar un proyecto"];
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState("");
  const [voiceState, setVoiceState] = useState("idle");
  const textRef = useRef(null);

  const send = () => { if(text.trim()) { onSend(text.trim()); setText(""); } };
  const onKey = e => { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();} };
  const onInput = e => { e.target.style.height="auto"; e.target.style.height=Math.min(e.target.scrollHeight,120)+"px"; setText(e.target.value); };

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 20px 24px",overflowY:"auto"}}>
      {/* Brand */}
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12,marginBottom:40}}>
        <NeuraLogo size={48}/>
        <div style={{textAlign:"center"}}>
          <h1 style={{fontSize:28,fontWeight:700,color:T.textPrimary,letterSpacing:".08em",margin:0}}>NEURA</h1>
          <p style={{fontSize:15,color:T.textSec,margin:"6px 0 0",fontWeight:400}}>¿Qué necesitás?</p>
        </div>
      </div>

      {/* Voice CTA */}
      <div style={{marginBottom:32}}>
        <VoiceButton onTranscript={t=>{setText(p=>p?p+" "+t:t);textRef.current?.focus();}} size="lg"/>
      </div>

      {/* Text input */}
      <div style={{width:"100%",maxWidth:560,marginBottom:16}}>
        <div style={{background:T.bg,border:`1.5px solid ${focused?T.borderFocus:T.border}`,borderRadius:14,padding:"10px 10px 10px 14px",display:"flex",alignItems:"flex-end",gap:8,transition:"border-color .15s"}}>
          <textarea ref={textRef} value={text} onChange={onInput} onKeyDown={onKey} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
            placeholder="o escribí lo que necesitás…" rows={1}
            style={{flex:1,background:"transparent",border:"none",resize:"none",color:T.textPrimary,fontSize:15,lineHeight:1.55,outline:"none",maxHeight:120,fontFamily:"inherit",padding:0}}
          />
          <button onClick={send} disabled={!text.trim()} style={{width:36,height:36,borderRadius:10,background:text.trim()?T.accent:"#E5E7EB",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:text.trim()?"pointer":"default",color:"white",transition:"all .15s",flexShrink:0}}>
            <Icon.Send/>
          </button>
        </div>
        <div style={{marginTop:14}}>
          <ModelChips value={model} onChange={onModelChange}/>
        </div>
      </div>

      {/* Chips */}
      <div style={{display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center",maxWidth:500}}>
        {CHIPS.map(c=>(
          <button key={c} onClick={()=>onSend(c)} style={{padding:"7px 13px",borderRadius:20,background:T.bgSubtle,border:`1px solid ${T.border}`,color:T.textSec,fontSize:12,cursor:"pointer",transition:"all .15s",fontFamily:"inherit",whiteSpace:"nowrap"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=T.borderFocus;e.currentTarget.style.color=T.textPrimary;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.textSec;}}>
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({ convs, activeId, onNew, onSelect, onDelete, onClose, isMobile }) {
  const groups = { Hoy: [], Ayer: [], "Esta semana": [], Antes: [] };
  const now = new Date();
  convs.forEach(c => {
    const d = new Date(c.updatedAt||c.createdAt);
    const diffDays = (now - d) / (1000*60*60*24);
    if (diffDays < 1) groups.Hoy.push(c);
    else if (diffDays < 2) groups.Ayer.push(c);
    else if (diffDays < 7) groups["Esta semana"].push(c);
    else groups.Antes.push(c);
  });

  return (
    <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",background:T.bg,borderRight:`1px solid ${T.border}`,overflow:"hidden"}}>
      {/* Header */}
      <div style={{padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,borderBottom:`1px solid ${T.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <NeuraLogo size={22}/>
          <span style={{fontWeight:700,fontSize:14,letterSpacing:".1em",color:T.textPrimary}}>NEURA</span>
        </div>
        {isMobile&&<button onClick={onClose} style={{color:T.textTert,cursor:"pointer",display:"flex"}}><Icon.X/></button>}
      </div>

      {/* New chat */}
      <div style={{padding:"10px 12px",flexShrink:0}}>
        <button onClick={onNew} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"9px 12px",borderRadius:9,background:T.accentSoft,border:`1px solid #DDD6FE`,color:T.accent,fontSize:13,fontWeight:500,cursor:"pointer",transition:"all .15s",fontFamily:"inherit"}} onMouseEnter={e=>e.currentTarget.style.background="#EDE9FE"} onMouseLeave={e=>e.currentTarget.style.background=T.accentSoft}>
          <Icon.Plus/> Nuevo chat
        </button>
      </div>

      {/* Conversation list */}
      <div style={{flex:1,overflowY:"auto",padding:"0 8px",scrollbarWidth:"none"}}>
        {Object.entries(groups).map(([group,items])=>items.length===0?null:(
          <div key={group} style={{marginBottom:8}}>
            <div style={{fontSize:10,fontWeight:600,color:T.textTert,letterSpacing:".08em",padding:"6px 8px 3px",textTransform:"uppercase"}}>{group}</div>
            {items.map(c=>(
              <div key={c.id} style={{display:"flex",alignItems:"center",gap:1,borderRadius:8,background:activeId===c.id?"#F5F3FF":"transparent",marginBottom:1}} onMouseEnter={e=>{if(activeId!==c.id)e.currentTarget.style.background=T.bgSubtle;}} onMouseLeave={e=>{if(activeId!==c.id)e.currentTarget.style.background="transparent";}}>
                <button onClick={()=>onSelect(c.id)} style={{flex:1,textAlign:"left",padding:"7px 8px",borderRadius:8,color:activeId===c.id?T.accent:T.textSec,fontSize:13,cursor:"pointer",background:"transparent",border:"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:"inherit",fontWeight:activeId===c.id?500:400}}>
                  {c.title||"Sin título"}
                </button>
                <button onClick={e=>{e.stopPropagation();onDelete(c.id);}} style={{flexShrink:0,padding:"6px",color:T.textTert,background:"transparent",border:"none",cursor:"pointer",borderRadius:6,display:"none"}} className="del-btn" onMouseEnter={e=>e.currentTarget.style.color="#EF4444"} onMouseLeave={e=>e.currentTarget.style.color=T.textTert}>
                  <Icon.Trash/>
                </button>
              </div>
            ))}
          </div>
        ))}
        {convs.length===0&&<div style={{padding:"20px 8px",textAlign:"center",fontSize:12,color:T.textTert,lineHeight:1.6}}>Tus conversaciones aparecerán acá</div>}
      </div>

      {/* Footer */}
      <div style={{padding:"10px 14px 14px",borderTop:`1px solid ${T.border}`,flexShrink:0}}>
        <div style={{fontSize:11,color:T.textTert,textAlign:"center"}}>neura.ar</div>
      </div>
    </div>
  );
}

// ─── INSTALL PWA BANNER ───────────────────────────────────────────────────────
function InstallBanner({ onDismiss }) {
  const [step, setStep] = useState(null);
  return (
    <div style={{position:"fixed",bottom:80,left:"50%",transform:"translateX(-50%)",width:"calc(100% - 32px)",maxWidth:400,background:T.bg,border:`1px solid ${T.border}`,borderRadius:14,padding:"14px 16px",boxShadow:"0 4px 24px rgba(0,0,0,.08)",zIndex:200}}>
      {!step
        ? <>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
              <span style={{fontSize:13,fontWeight:600,color:T.textPrimary}}>Tené Neura siempre a mano</span>
              <button onClick={onDismiss} style={{color:T.textTert,cursor:"pointer",display:"flex"}}><Icon.X/></button>
            </div>
            <p style={{fontSize:12,color:T.textSec,marginBottom:12}}>Agregala a tu pantalla de inicio y usala como una app.</p>
            <button onClick={()=>setStep("ios")} style={{width:"100%",padding:"9px",borderRadius:9,background:T.accent,border:"none",color:"white",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>Ver cómo instalar</button>
          </>
        : <>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <span style={{fontSize:13,fontWeight:600,color:T.textPrimary}}>Instalá NEURA</span>
              <button onClick={onDismiss} style={{color:T.textTert,cursor:"pointer",display:"flex"}}><Icon.X/></button>
            </div>
            {["1. Tocá el botón Compartir (cuadrado con flecha)","2. Elegí «Añadir a pantalla de inicio»","3. Tocá Agregar"].map((s,i)=>(
              <div key={i} style={{display:"flex",gap:10,marginBottom:8,alignItems:"flex-start"}}>
                <div style={{width:22,height:22,borderRadius:"50%",background:T.accentSoft,color:T.accent,fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{i+1}</div>
                <span style={{fontSize:12,color:T.textSec,lineHeight:1.5}}>{s.slice(3)}</span>
              </div>
            ))}
          </>
      }
    </div>
  );
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;-webkit-font-smoothing:antialiased;}
html,body,#root{height:100%;height:-webkit-fill-available;}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Inter",sans-serif;background:#fff;color:#111;overscroll-behavior:none;min-height:100vh;min-height:-webkit-fill-available;}
textarea,input{font-family:inherit;font-size:16px!important;}
button{font-family:inherit;cursor:pointer;}
::-webkit-scrollbar{width:4px;height:4px;}
::-webkit-scrollbar-track{background:transparent;}
::-webkit-scrollbar-thumb{background:#E5E5E5;border-radius:4px;}
::-webkit-scrollbar-thumb:hover{background:#C0C0C0;}
.del-btn{display:none!important;}
[style*="borderRadius:8px"]:hover .del-btn,[style*="borderRadius: 8px"]:hover .del-btn{display:flex!important;}
pre{background:#F9F9F9;border:1px solid #E5E5E5;border-radius:8px;padding:14px;overflow-x:auto;margin:10px 0;}
code{font-family:"SF Mono","Fira Code",monospace;font-size:13px;background:#F3F4F6;padding:1px 5px;border-radius:3px;}
pre code{background:transparent;padding:0;}
h1,h2,h3{margin:12px 0 6px;color:#111;}
h1{font-size:18px;}h2{font-size:16px;}h3{font-size:15px;}
ul,ol{padding-left:20px;margin:6px 0;}
li{margin:3px 0;}
p{margin:4px 0;}
@keyframes voicePulse{0%,100%{box-shadow:0 0 0 0 rgba(109,40,217,.3);}50%{box-shadow:0 0 0 10px rgba(109,40,217,0);}}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
@keyframes spin{to{transform:rotate(360deg);}}
.msg-in{animation:fadeUp .2s ease;}
`;

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [convs, setConvs] = useState(getConvs);
  const [activeId, setActiveId] = useState(null);
  const [model, setModel] = useState("auto");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const bottomRef = useRef(null);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  // Active conversation
  const activeConv = convs.find(c=>c.id===activeId)||null;
  const messages = activeConv?.messages||[];

  // Show PWA install banner on iOS Safari
  useEffect(()=>{
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode:standalone)').matches;
    const dismissed = localStorage.getItem("neura-install-dismissed");
    if (isIOS && !isStandalone && !dismissed) {
      setTimeout(()=>setShowInstall(true), 3000);
    }
  },[]);

  // Auto-scroll
  useEffect(()=>{
    bottomRef.current?.scrollIntoView({behavior:"smooth"});
  },[messages.length, loading]);

  const newChat = () => { setActiveId(null); setSidebarOpen(false); };

  const updateConv = (id, updater) => {
    setConvs(prev => {
      const updated = prev.map(c => c.id===id ? updater(c) : c);
      saveConvs(updated);
      return updated;
    });
  };

  const deleteConv = (id) => {
    setConvs(prev => {
      const updated = prev.filter(c=>c.id!==id);
      saveConvs(updated);
      return updated;
    });
    if (activeId===id) setActiveId(null);
  };

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;

    // Create conversation if needed
    let convId = activeId;
    if (!convId) {
      convId = mkId();
      const newConv = { id:convId, title:mkTitle(text), messages:[], model, createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() };
      setConvs(prev => { const updated=[newConv,...prev]; saveConvs(updated); return updated; });
      setActiveId(convId);
    }

    // Add user message
    const userMsg = { role:"user", content:text, id:mkId() };
    updateConv(convId, c=>({...c, messages:[...c.messages,userMsg], updatedAt:new Date().toISOString(), title:c.messages.length===0?mkTitle(text):c.title }));
    setLoading(true);

    // Build history for API
    const hist = [...(convs.find(c=>c.id===convId)?.messages||[]), userMsg];
    const apiMsgs = hist.map(m=>({role:m.role,content:m.content})).slice(-20);

    // Streaming placeholder
    const aId = mkId();
    updateConv(convId, c=>({...c, messages:[...c.messages,{role:"assistant",content:"",id:aId,provider:""}] }));

    try {
      const res = await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:apiMsgs,model,stream:true})});
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "", reply = "", detectedProvider = "";
      const providerHeader = res.headers.get("X-Provider");
      if (providerHeader) detectedProvider = providerHeader;

      while (true) {
        const {done,value} = await reader.read();
        if (done) break;
        buf += dec.decode(value,{stream:true});
        const lines = buf.split("\n");
        buf = lines.pop()||"";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data==="[DONE]") break;
          try {
            const evt = JSON.parse(data);
            // Anthropic format
            if (evt.type==="content_block_delta"&&evt.delta?.type==="text_delta") {
              reply += evt.delta.text;
              updateConv(convId,c=>({...c,messages:c.messages.map(m=>m.id===aId?{...m,content:reply,provider:detectedProvider}:m)}));
            }
            // OpenAI format
            if (evt.choices?.[0]?.delta?.content) {
              reply += evt.choices[0].delta.content;
              updateConv(convId,c=>({...c,messages:c.messages.map(m=>m.id===aId?{...m,content:reply,provider:detectedProvider}:m)}));
            }
            // Provider info
            if (evt.x_provider) detectedProvider = evt.x_provider;
          } catch {}
        }
      }
      if (!reply) throw new Error("Respuesta vacía");
    } catch (err) {
      updateConv(convId, c=>({...c,messages:c.messages.map(m=>m.id===aId?{...m,content:`Lo siento, hubo un problema: ${err.message}. Reintentá.`}:m)}));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <div style={{display:"flex",height:"100%",height:"-webkit-fill-available",background:T.bg}}>

        {/* ── DESKTOP SIDEBAR ── */}
        <div style={{width:260,flexShrink:0,display:"none",height:"100%"}} className="desktop-sidebar">
          <Sidebar convs={convs} activeId={activeId} onNew={newChat} onSelect={id=>{setActiveId(id);}} onDelete={deleteConv} isMobile={false}/>
        </div>

        {/* ── MOBILE SIDEBAR OVERLAY ── */}
        {sidebarOpen&&<>
          <div onClick={()=>setSidebarOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.3)",zIndex:300}} className="mobile-only"/>
          <div style={{position:"fixed",left:0,top:0,bottom:0,width:280,zIndex:301}} className="mobile-only">
            <Sidebar convs={convs} activeId={activeId} onNew={newChat} onSelect={id=>{setActiveId(id);setSidebarOpen(false);}} onDelete={deleteConv} onClose={()=>setSidebarOpen(false)} isMobile={true}/>
          </div>
        </>}

        {/* ── MAIN ── */}
        <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,height:"100%",overflow:"hidden"}}>
          {/* Mobile header */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderBottom:`1px solid ${T.border}`,flexShrink:0}} className="mobile-header">
            <button onClick={()=>setSidebarOpen(true)} style={{color:T.textSec,display:"flex",cursor:"pointer",padding:4,borderRadius:7,background:"transparent",border:"none"}} onMouseEnter={e=>e.currentTarget.style.background=T.bgSubtle} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <Icon.Menu/>
            </button>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <NeuraLogo size={22}/>
              <span style={{fontWeight:700,fontSize:14,letterSpacing:".1em",color:T.textPrimary}}>{activeConv?.title||"NEURA"}</span>
            </div>
            <button onClick={newChat} style={{color:T.accent,display:"flex",cursor:"pointer",padding:4,borderRadius:7,background:"transparent",border:"none"}}>
              <Icon.Plus/>
            </button>
          </div>

          {/* Desktop header */}
          <div style={{display:"none",alignItems:"center",padding:"12px 20px",borderBottom:`1px solid ${T.border}`,flexShrink:0,gap:12}} className="desktop-header">
            <span style={{flex:1,fontSize:14,color:T.textSec,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{activeConv?.title||""}</span>
            {activeId&&<button onClick={newChat} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",borderRadius:8,background:T.bgSubtle,border:`1px solid ${T.border}`,color:T.textSec,fontSize:12,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}} onMouseEnter={e=>e.currentTarget.style.borderColor=T.borderFocus} onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
              <Icon.Plus/> Nuevo
            </button>}
          </div>

          {/* Messages / Home */}
          {!activeId
            ? <HomeEmpty onSend={sendMessage} model={model} onModelChange={setModel}/>
            : <div style={{flex:1,overflowY:"auto",padding:"20px 16px",WebkitOverflowScrolling:"touch"}}>
                <div style={{maxWidth:720,margin:"0 auto"}}>
                  {messages.map(m=><div key={m.id} className="msg-in"><Message msg={m}/></div>)}
                  {loading&&<div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
                    <NeuraLogo size={28}/>
                    <div style={{display:"flex",gap:4}}>
                      {[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:T.accent,animation:`voicePulse .8s ${i*.15}s ease-in-out infinite`,opacity:.6}}/>)}
                    </div>
                  </div>}
                  <div ref={bottomRef}/>
                </div>
              </div>
          }

          {/* Composer */}
          {activeId&&<Composer onSend={sendMessage} isLoading={loading} model={model} onModelChange={setModel}/>}
        </div>
      </div>

      {/* PWA install banner */}
      {showInstall&&<InstallBanner onDismiss={()=>{setShowInstall(false);localStorage.setItem("neura-install-dismissed","1");}}/>}

      {/* Responsive CSS */}
      <style>{`
        .desktop-sidebar{display:flex!important;}
        .mobile-header{display:none!important;}
        .desktop-header{display:flex!important;}
        .mobile-only{display:block!important;}
        @media(max-width:768px){
          .desktop-sidebar{display:none!important;}
          .mobile-header{display:flex!important;}
          .desktop-header{display:none!important;}
        }
      `}</style>
    </>
  );
}const NEURA_SYSTEM = `Sos NEURA. Una IA conversacional que entiende lo que el usuario quiere aunque no lo sepa expresar bien.

PROMPT MASTER INTERNO: antes de responder, mejoras mentalmente el pedido del usuario. Inferis la intencion real, el experto necesario y la mejor forma de resolver. Nunca muestras este proceso. La sofisticacion se siente en la calidad de la respuesta, no en la estructura.

ESTILO DE RESPUESTA:
- Texto corrido y natural, como una buena respuesta de ChatGPT o Claude
- Sin titulos grandes, sin subtitulos, sin secciones tipo informe
- Sin frases de IA: "A continuacion", "Estas son las opciones", "Para abordar este tema"
- Ir directo a la respuesta
- Por defecto: 1 o 2 parrafos naturales
- Lista corta (3-5 items) solo cuando realmente ayuda a leer
- Ampliar solo si el usuario pide detalle o la complejidad lo exige

LONGITUD: la menor cantidad de texto necesaria para resolver bien. Nunca agregar contenido para parecer mas completo.

PREGUNTAS: cero preguntas en la primera respuesta. Primero entregar valor. Al final, opcional, una sola pregunta para personalizar.

INFERIR AUTOMATICAMENTE el experto segun el pedido. El usuario nunca necesita decir "actua como".

TONO: natural, directo, seguro, cercano, inteligente. Voseo argentino. Sin sonar academico ni de consultoria.

PRINCIPIO FINAL: Prompt Master hace la respuesta MEJOR, no MAS LARGA. Mas criterio, menos formato. Mas conversacion, menos documento.`;

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [convs, setConvs] = useState(getConvs);
  const [activeId, setActiveId] = useState(null);
  const [model, setModel] = useState("auto");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const bottomRef = useRef(null);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  // Active conversation
  const activeConv = convs.find(c=>c.id===activeId)||null;
  const messages = activeConv?.messages||[];

  // Show PWA install banner on iOS Safari
  useEffect(()=>{
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode:standalone)').matches;
    const dismissed = localStorage.getItem("neura-install-dismissed");
    if (isIOS && !isStandalone && !dismissed) {
      setTimeout(()=>setShowInstall(true), 3000);
    }
  },[]);

  // Auto-scroll
  useEffect(()=>{
    bottomRef.current?.scrollIntoView({behavior:"smooth"});
  },[messages.length, loading]);

  const newChat = () => { setActiveId(null); setSidebarOpen(false); };

  const updateConv = (id, updater) => {
    setConvs(prev => {
      const updated = prev.map(c => c.id===id ? updater(c) : c);
      saveConvs(updated);
      return updated;
    });
  };

  const deleteConv = (id) => {
    setConvs(prev => {
      const updated = prev.filter(c=>c.id!==id);
      saveConvs(updated);
      return updated;
    });
    if (activeId===id) setActiveId(null);
  };

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;

    // Create conversation if needed
    let convId = activeId;
    if (!convId) {
      convId = mkId();
      const newConv = { id:convId, title:mkTitle(text), messages:[], model, createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() };
      setConvs(prev => { const updated=[newConv,...prev]; saveConvs(updated); return updated; });
      setActiveId(convId);
    }

    // Add user message
    const userMsg = { role:"user", content:text, id:mkId() };
    updateConv(convId, c=>({...c, messages:[...c.messages,userMsg], updatedAt:new Date().toISOString(), title:c.messages.length===0?mkTitle(text):c.title }));
    setLoading(true);

    // Build history for API
    const hist = [...(convs.find(c=>c.id===convId)?.messages||[]), userMsg];
    const apiMsgs = hist.map(m=>({role:m.role,content:m.content})).slice(-20);

    // Streaming placeholder
    const aId = mkId();
    updateConv(convId, c=>({...c, messages:[...c.messages,{role:"assistant",content:"",id:aId,provider:""}] }));

    try {
      const res = await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:apiMsgs,model,stream:true})});
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "", reply = "", detectedProvider = "";
      const providerHeader = res.headers.get("X-Provider");
      if (providerHeader) detectedProvider = providerHeader;

      while (true) {
        const {done,value} = await reader.read();
        if (done) break;
        buf += dec.decode(value,{stream:true});
        const lines = buf.split("\n");
        buf = lines.pop()||"";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data==="[DONE]") break;
          try {
            const evt = JSON.parse(data);
            // Anthropic format
            if (evt.type==="content_block_delta"&&evt.delta?.type==="text_delta") {
              reply += evt.delta.text;
              updateConv(convId,c=>({...c,messages:c.messages.map(m=>m.id===aId?{...m,content:reply,provider:detectedProvider}:m)}));
            }
            // OpenAI format
            if (evt.choices?.[0]?.delta?.content) {
              reply += evt.choices[0].delta.content;
              updateConv(convId,c=>({...c,messages:c.messages.map(m=>m.id===aId?{...m,content:reply,provider:detectedProvider}:m)}));
            }
            // Provider info
            if (evt.x_provider) detectedProvider = evt.x_provider;
          } catch {}
        }
      }
      if (!reply) throw new Error("Respuesta vacía");
    } catch (err) {
      updateConv(convId, c=>({...c,messages:c.messages.map(m=>m.id===aId?{...m,content:`Lo siento, hubo un problema: ${err.message}. Reintentá.`}:m)}));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <div style={{display:"flex",height:"100%",height:"-webkit-fill-available",background:T.bg}}>

        {/* ── DESKTOP SIDEBAR ── */}
        <div style={{width:260,flexShrink:0,display:"none",height:"100%"}} className="desktop-sidebar">
          <Sidebar convs={convs} activeId={activeId} onNew={newChat} onSelect={id=>{setActiveId(id);}} onDelete={deleteConv} isMobile={false}/>
        </div>

        {/* ── MOBILE SIDEBAR OVERLAY ── */}
        {sidebarOpen&&<>
          <div onClick={()=>setSidebarOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.3)",zIndex:300}} className="mobile-only"/>
          <div style={{position:"fixed",left:0,top:0,bottom:0,width:280,zIndex:301}} className="mobile-only">
            <Sidebar convs={convs} activeId={activeId} onNew={newChat} onSelect={id=>{setActiveId(id);setSidebarOpen(false);}} onDelete={deleteConv} onClose={()=>setSidebarOpen(false)} isMobile={true}/>
          </div>
        </>}

        {/* ── MAIN ── */}
        <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,height:"100%",overflow:"hidden"}}>
          {/* Mobile header */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderBottom:`1px solid ${T.border}`,flexShrink:0}} className="mobile-header">
            <button onClick={()=>setSidebarOpen(true)} style={{color:T.textSec,display:"flex",cursor:"pointer",padding:4,borderRadius:7,background:"transparent",border:"none"}} onMouseEnter={e=>e.currentTarget.style.background=T.bgSubtle} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <Icon.Menu/>
            </button>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <NeuraLogo size={22}/>
              <span style={{fontWeight:700,fontSize:14,letterSpacing:".1em",color:T.textPrimary}}>{activeConv?.title||"NEURA"}</span>
            </div>
            <button onClick={newChat} style={{color:T.accent,display:"flex",cursor:"pointer",padding:4,borderRadius:7,background:"transparent",border:"none"}}>
              <Icon.Plus/>
            </button>
          </div>

          {/* Desktop header */}
          <div style={{display:"none",alignItems:"center",padding:"12px 20px",borderBottom:`1px solid ${T.border}`,flexShrink:0,gap:12}} className="desktop-header">
            <span style={{flex:1,fontSize:14,color:T.textSec,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{activeConv?.title||""}</span>
            {activeId&&<button onClick={newChat} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",borderRadius:8,background:T.bgSubtle,border:`1px solid ${T.border}`,color:T.textSec,fontSize:12,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}} onMouseEnter={e=>e.currentTarget.style.borderColor=T.borderFocus} onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
              <Icon.Plus/> Nuevo
            </button>}
          </div>

          {/* Messages / Home */}
          {!activeId
            ? <HomeEmpty onSend={sendMessage} model={model} onModelChange={setModel}/>
            : <div style={{flex:1,overflowY:"auto",padding:"20px 16px",WebkitOverflowScrolling:"touch"}}>
                <div style={{maxWidth:720,margin:"0 auto"}}>
                  {messages.map(m=><div key={m.id} className="msg-in"><Message msg={m}/></div>)}
                  {loading&&<div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
                    <NeuraLogo size={28}/>
                    <div style={{display:"flex",gap:4}}>
                      {[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:T.accent,animation:`voicePulse .8s ${i*.15}s ease-in-out infinite`,opacity:.6}}/>)}
                    </div>
                  </div>}
                  <div ref={bottomRef}/>
                </div>
              </div>
          }

          {/* Composer */}
          {activeId&&<Composer onSend={sendMessage} isLoading={loading} model={model} onModelChange={setModel}/>}
        </div>
      </div>

      {/* PWA install banner */}
      {showInstall&&<InstallBanner onDismiss={()=>{setShowInstall(false);localStorage.setItem("neura-install-dismissed","1");}}/>}

      {/* Responsive CSS */}
      <style>{`
        .desktop-sidebar{display:flex!important;}
        .mobile-header{display:none!important;}
        .desktop-header{display:flex!important;}
        .mobile-only{display:block!important;}
        @media(max-width:768px){
          .desktop-sidebar{display:none!important;}
          .mobile-header{display:flex!important;}
          .desktop-header{display:none!important;}
        }
      `}</style>
    </>
  );
}
