import { useState, useRef, useEffect, useCallback } from "react";

const T = {
  bg:"#FFFFFF", bgSubtle:"#F9F9F9", border:"#E5E5E5", borderFocus:"#9CA3AF",
  textPrimary:"#111111", textSec:"#6B6B6B", textTert:"#9CA3AF",
  accent:"#6D28D9", accentSoft:"#F5F3FF", userBg:"#F3F4F6",
};

const CONV_KEY = "neura-conversations-v1";
const getConvs = () => { try { return JSON.parse(localStorage.getItem(CONV_KEY)||"[]"); } catch { return []; } };
const saveConvs = (list) => { try { localStorage.setItem(CONV_KEY, JSON.stringify(list.slice(0,100))); } catch {} };
const mkId = () => Math.random().toString(36).slice(2)+Date.now().toString(36);
const mkTitle = (text) => text.slice(0,50).trim()||"Nueva conversación";

function renderMarkdown(text) {
  if (!text) return "";
  let html = text
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/```([\w]*)\n?([\s\S]*?)```/g,(_,lang,code)=>`<pre><code>${code.trim()}</code></pre>`)
    .replace(/`([^`]+)`/g,"<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g,"<em>$1</em>")
    .replace(/^#{3}\s+(.+)$/gm,"<h3>$1</h3>")
    .replace(/^#{2}\s+(.+)$/gm,"<h2>$1</h2>")
    .replace(/^#{1}\s+(.+)$/gm,"<h1>$1</h1>")
    .replace(/^\s*[-*]\s+(.+)$/gm,"<li>$1</li>")
    .replace(/\n{2,}/g,"</p><p>")
    .replace(/\n/g,"<br/>");
  return `<p>${html}</p>`.replace(/<p><\/p>/g,"");
}

const Icon = {
  Send:()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Mic: ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 19v4M8 23h8"/></svg>,
  Menu:()=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  X:   ()=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Copy:()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  Plus:()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Clip:()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.41a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>,
  File:()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  Trash:()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>,
};

function NeuraLogo({ size=28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="14" fill="#6D28D9"/>
      <path d="M10 22V10l12 12V10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── VOICE BUTTON ──────────────────────────────────────────────────────────────
function VoiceButton({ onTranscript, size="lg" }) {
  const [state, setState] = useState("idle");
  const recogRef = useRef(null);
  const gotResultRef = useRef(false);

  const toggle = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setState("error"); setTimeout(()=>setState("idle"),2000); return; }
    if (state === "listening") { recogRef.current?.stop(); setState("idle"); return; }
    gotResultRef.current = false;
    const r = new SR();
    r.lang = "es-AR"; r.continuous = false; r.interimResults = false;
    r.onstart = () => setState("listening");
    r.onresult = e => {
      gotResultRef.current = true;
      setState("transcribing");
      onTranscript(e.results[0][0].transcript);
      setTimeout(()=>setState("idle"),700);
    };
    r.onerror = ev => {
      if (ev.error==="no-speech"&&!gotResultRef.current) { setState("idle"); setTimeout(()=>toggle(),400); }
      else { setState("error"); setTimeout(()=>setState("idle"),1800); }
    };
    r.onend = () => { if (!gotResultRef.current) setState("idle"); };
    recogRef.current = r; r.start();
  };

  const isLg = size==="lg";
  const dim = isLg ? 64 : 36;
  const C = {
    idle:        { bg:"#6D28D9", shadow:"0 2px 12px rgba(109,40,217,.3)" },
    listening:   { bg:"#DC2626", shadow:"0 2px 16px rgba(220,38,38,.4)" },
    transcribing:{ bg:"#059669", shadow:"0 2px 12px rgba(5,150,105,.3)" },
    error:       { bg:"#9CA3AF", shadow:"none" },
  }[state];

  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
      <button onClick={toggle} style={{width:dim,height:dim,borderRadius:"50%",background:C.bg,border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"white",boxShadow:C.shadow,transition:"all .25s",transform:state==="listening"?"scale(1.08)":"scale(1)",animation:state==="listening"?"voicePulse 1.4s ease-in-out infinite":"none"}}>
        <Icon.Mic/>
      </button>
      {isLg&&<span style={{fontSize:12,color:T.textTert}}>
        {state==="idle"?"Hablá con Neura":state==="listening"?"Te escucho…":state==="transcribing"?"Entendiendo…":"Intentá de nuevo"}
      </span>}
    </div>
  );
}

// ── FILE ATTACHMENT ───────────────────────────────────────────────────────────
function fileToBase64(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result.split(',')[1]);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

function FilePreview({ file, onRemove }) {
  const isImage = file.type.startsWith('image/');
  const icon = isImage ? '🖼' : '📄';
  const name = file.name.length > 25 ? file.name.slice(0,22)+'...' : file.name;
  return (
    <div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 10px",borderRadius:8,background:"#EDE9FE",border:"1px solid #DDD6FE",maxWidth:"100%"}}>
      <span style={{fontSize:14}}>{icon}</span>
      <span style={{fontSize:12,color:T.accent,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</span>
      <button onClick={onRemove} style={{border:"none",background:"transparent",cursor:"pointer",color:T.textTert,display:"flex",padding:2}} onMouseEnter={e=>e.currentTarget.style.color="#EF4444"} onMouseLeave={e=>e.currentTarget.style.color=T.textTert}>
        <Icon.X/>
      </button>
    </div>
  );
}

// ── COMPOSER ──────────────────────────────────────────────────────────────────
function Composer({ onSend, isLoading, attachedFile, setAttachedFile }) {
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const textRef = useRef(null);
  const fileInputRef = useRef(null);

  const send = () => {
    if ((!text.trim() && !attachedFile) || isLoading) return;
    onSend(text.trim(), attachedFile);
    setText("");
    setAttachedFile(null);
    if (textRef.current) textRef.current.style.height = "auto";
  };
  const onKey = e => { if (e.key==="Enter"&&!e.shiftKey) { e.preventDefault(); send(); } };
  const onInput = e => { e.target.style.height="auto"; e.target.style.height=Math.min(e.target.scrollHeight,140)+"px"; setText(e.target.value); };

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['application/pdf','image/jpeg','image/png','image/webp'];
    if (!allowed.includes(file.type)) { alert('Solo se admiten PDF, JPG y PNG.'); return; }
    if (file.size > 10 * 1024 * 1024) { alert('El archivo no puede superar 10MB.'); return; }
    setAttachedFile(file);
    e.target.value = '';
  };

  const canSend = (text.trim() || attachedFile) && !isLoading;

  return (
    <div style={{padding:"12px 16px 16px",background:T.bg,borderTop:`1px solid ${T.border}`,flexShrink:0}}>
      <div style={{maxWidth:720,margin:"0 auto"}}>
        {attachedFile && (
          <div style={{marginBottom:8}}>
            <FilePreview file={attachedFile} onRemove={()=>setAttachedFile(null)}/>
          </div>
        )}
        <div style={{display:"flex",alignItems:"flex-end",gap:0,background:T.bg,border:`1.5px solid ${focused?T.borderFocus:T.border}`,borderRadius:14,transition:"border-color .15s",padding:"10px 10px 10px 12px"}}>
          <button onClick={()=>fileInputRef.current?.click()} title="Adjuntar archivo" style={{flexShrink:0,border:"none",background:"transparent",cursor:"pointer",color:T.textTert,display:"flex",padding:"0 6px 0 0",transition:"color .15s"}} onMouseEnter={e=>e.currentTarget.style.color=T.accent} onMouseLeave={e=>e.currentTarget.style.color=T.textTert}>
            <Icon.Clip/>
          </button>
          <input ref={fileInputRef} type="file" accept=".pdf,image/jpeg,image/png,image/webp" style={{display:"none"}} onChange={onFileChange}/>
          <textarea ref={textRef} value={text} onChange={onInput} onKeyDown={onKey} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
            placeholder={attachedFile?"Preguntale algo al archivo… (opcional)":"Escribí lo que necesitás…"} rows={1}
            style={{flex:1,background:"transparent",border:"none",resize:"none",color:T.textPrimary,fontSize:15,lineHeight:1.55,outline:"none",maxHeight:140,overflowY:"auto",fontFamily:"inherit",padding:0}}/>
          <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0,paddingLeft:8}}>
            <VoiceButton onTranscript={t=>{ setText(p=>p?p+" "+t:t); textRef.current?.focus(); }} size="sm"/>
            <button onClick={send} disabled={!canSend}
              style={{width:36,height:36,borderRadius:10,background:canSend?T.accent:"#E5E7EB",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:canSend?"pointer":"default",color:"white",transition:"all .15s",flexShrink:0}}>
              <Icon.Send/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── THINKING INDICATOR ────────────────────────────────────────────────────────
function ThinkingIndicator({ stage }) {
  const labels = { sending:"Recibido", thinking:"Entendiendo…", responding:"Respondiendo…" };
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20,animation:"fadeUp .2s ease"}}>
      <NeuraLogo size={28}/>
      <div style={{display:"flex",flexDirection:"column",gap:4}}>
        <div style={{display:"flex",gap:4,alignItems:"center"}}>
          {[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:T.accent,animation:`voicePulse .8s ${i*.15}s ease-in-out infinite`,opacity:.6}}/>)}
        </div>
        <span style={{fontSize:11,color:T.textTert}}>{labels[stage]||"Pensando…"}</span>
      </div>
    </div>
  );
}

// ── MESSAGE ───────────────────────────────────────────────────────────────────
function Message({ msg }) {
  const isUser = msg.role==="user";
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard?.writeText(msg.content||"").then(()=>{setCopied(true);setTimeout(()=>setCopied(false),1500);}); };
  return (
    <div style={{display:"flex",gap:12,marginBottom:20,flexDirection:isUser?"row-reverse":"row",alignItems:"flex-start"}}>
      {!isUser&&<div style={{width:28,height:28,borderRadius:"50%",flexShrink:0,marginTop:2}}><NeuraLogo size={28}/></div>}
      <div style={{maxWidth:"min(75%,600px)",minWidth:40}}>
        {msg.filePreview&&<div style={{marginBottom:6,padding:"6px 10px",borderRadius:8,background:T.accentSoft,border:`1px solid #DDD6FE`,display:"flex",alignItems:"center",gap:6}}>
          <Icon.File/><span style={{fontSize:12,color:T.accent}}>{msg.filePreview}</span>
        </div>}
        {isUser
          ? <div style={{background:T.userBg,borderRadius:"16px 4px 16px 16px",padding:"10px 14px",color:T.textPrimary,fontSize:14,lineHeight:1.6,wordBreak:"break-word"}}>{msg.content||""}</div>
          : <div>
              <div style={{color:"#111",fontSize:14,lineHeight:1.7,wordBreak:"break-word"}} dangerouslySetInnerHTML={{__html:renderMarkdown(msg.content)||"<span style='color:#9CA3AF'>▍</span>"}}/>
              {msg.content&&<div style={{display:"flex",gap:8,marginTop:8,alignItems:"center"}}>
                {msg.provider&&<span style={{fontSize:10,color:T.textTert}}>{msg.provider}</span>}
                <button onClick={copy} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 7px",borderRadius:5,background:"transparent",border:`1px solid ${copied?"#D1FAE5":"transparent"}`,color:copied?"#059669":T.textTert,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.textSec;}}
                  onMouseLeave={e=>{if(!copied){e.currentTarget.style.borderColor="transparent";e.currentTarget.style.color=T.textTert;}}}>
                  <Icon.Copy/>{copied?"Copiado":"Copiar"}
                </button>
              </div>}
            </div>
        }
      </div>
    </div>
  );
}

// ── HOME EMPTY ────────────────────────────────────────────────────────────────
function HomeEmpty({ onSend, setAttachedFile, attachedFile }) {
  const CHIPS = ["Necesito una idea de negocio","Redactá un email profesional","Explicame algo complejo","Ayudame a organizar un proyecto"];
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState("");
  const textRef = useRef(null);
  const fileInputRef = useRef(null);

  const send = () => { if(text.trim()||attachedFile) { onSend(text.trim(), attachedFile); setText(""); } };
  const onKey = e => { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();} };
  const onInput = e => { e.target.style.height="auto"; e.target.style.height=Math.min(e.target.scrollHeight,120)+"px"; setText(e.target.value); };
  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['application/pdf','image/jpeg','image/png','image/webp'];
    if (!allowed.includes(file.type)) { alert('Solo PDF, JPG y PNG.'); return; }
    if (file.size > 10*1024*1024) { alert('Máximo 10MB.'); return; }
    setAttachedFile(file);
    e.target.value = '';
  };
  const canSend = text.trim() || attachedFile;

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 20px 24px",overflowY:"auto"}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12,marginBottom:36}}>
        <NeuraLogo size={48}/>
        <div style={{textAlign:"center"}}>
          <h1 style={{fontSize:28,fontWeight:700,color:T.textPrimary,letterSpacing:".08em",margin:0}}>NEURA</h1>
          <p style={{fontSize:15,color:T.textSec,margin: