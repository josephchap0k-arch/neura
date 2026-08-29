import { useState, useRef, useEffect } from "react";

// ─── DESIGN TOKENS ──────────────────────────────────────────────────────────
const T = {
  bg:"#FFFFFF", bgSubtle:"#F7F7F7", border:"#E8E8E8", borderFocus:"#C0C0C0",
  text:"#111111", textSec:"#666666", textTert:"#A0A0A0",
  accent:"#6D28D9", accentSoft:"#F5F3FF",
};

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Icon = {
  Send:  ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Mic:   ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 19v4M8 23h8"/></svg>,
  Plus:  ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Down:  ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Eye:   ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Chat:  ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Refresh:()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
};

function NeuraLogo({ size=28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="14" fill="#6D28D9"/>
      <path d="M10 22V10l12 12V10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ─── VOICE BUTTON ─────────────────────────────────────────────────────────────
function VoiceButton({ onTranscript }) {
  const [listening, setListening] = useState(false);
  const ref = useRef(null);
  const toggle = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    if (listening) { ref.current?.stop(); setListening(false); return; }
    const r = new SR(); r.lang="es-AR"; r.interimResults=false;
    r.onresult = e => { onTranscript(e.results[0][0].transcript); setListening(false); };
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    r.onstart = () => setListening(true);
    ref.current = r; r.start();
  };
  return (
    <button onClick={toggle} title="Hablar" style={{border:"none",background:listening?"#DC2626":"transparent",borderRadius:8,padding:"6px 8px",cursor:"pointer",color:listening?"white":T.textTert,display:"flex",transition:"all .2s"}}
      onMouseEnter={e=>{if(!listening)e.currentTarget.style.color=T.accent;}} onMouseLeave={e=>{if(!listening)e.currentTarget.style.color=T.textTert;}}>
      <Icon.Mic/>
    </button>
  );
}

// ─── APP PREVIEW ──────────────────────────────────────────────────────────────
function AppPreview({ html, title }) {
  const download = () => {
    const blob = new Blob([html], {type:'text/html'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=(title||'app')+'.html'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:T.bgSubtle}}>
      {/* Preview toolbar */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 16px",background:T.bg,borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:10,height:10,borderRadius:"50%",background:"#FF5F57"}}/>
          <div style={{width:10,height:10,borderRadius:"50%",background:"#FFBD2E"}}/>
          <div style={{width:10,height:10,borderRadius:"50%",background:"#28CA41"}}/>
          <span style={{fontSize:12,color:T.textSec,marginLeft:8}}>{title||"Tu app"}</span>
        </div>
        <button onClick={download} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:7,background:T.bgSubtle,border:`1px solid ${T.border}`,color:T.textSec,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=T.borderFocus;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;}}>
          <Icon.Down/> Descargar
        </button>
      </div>
      {/* iframe */}
      <iframe srcDoc={html} style={{flex:1,border:"none",width:"100%"}} sandbox="allow-scripts allow-same-origin allow-forms" title="preview"/>
    </div>
  );
}

// ─── GENERATING STATE ─────────────────────────────────────────────────────────
function GeneratingView({ prompt }) {
  const [dots, setDots] = useState(".");
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length>=3?".":d+"."), 500);
    return ()=>clearInterval(t);
  }, []);
  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20,padding:40}}>
      <NeuraLogo size={48}/>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:18,fontWeight:600,color:T.text,marginBottom:8}}>Creando tu app{dots}</div>
        <div style={{fontSize:14,color:T.textSec,maxWidth:320}}>{prompt}</div>
      </div>
      <div style={{display:"flex",gap:6}}>
        {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:T.accent,animation:`voicePulse .8s ${i*.2}s ease-in-out infinite`,opacity:.7}}/>)}
      </div>
    </div>
  );
}

// ─── HOME ─────────────────────────────────────────────────────────────────────
function Home({ onGenerate }) {
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const textRef = useRef(null);

  const send = () => { if(text.trim()) { onGenerate(text.trim()); setText(""); } };
  const onKey = e => { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();} };
  const onInput = e => { e.target.style.height="auto"; e.target.style.height=Math.min(e.target.scrollHeight,140)+"px"; setText(e.target.value); };

  const EXAMPLES = [
    "Registro de gastos del negocio",
    "Lista de tareas con prioridades",
    "Calculadora de turnos y honorarios",
    "Seguimiento de hábitos diarios",
    "Presupuesto para cliente",
    "Inventario simple",
  ];

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 20px",overflowY:"auto"}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:14,marginBottom:48}}>
        <NeuraLogo size={56}/>
        <div style={{textAlign:"center"}}>
          <h1 style={{fontSize:32,fontWeight:700,color:T.text,letterSpacing:".06em",margin:0}}>NEURA</h1>
          <p style={{fontSize:18,color:T.textSec,margin:"8px 0 0",fontWeight:400}}>¿Qué querés crear?</p>
        </div>
      </div>

      <div style={{width:"100%",maxWidth:600,marginBottom:20}}>
        <div style={{background:T.bg,border:`1.5px solid ${focused?T.borderFocus:T.border}`,borderRadius:16,padding:"12px 12px 12px 16px",display:"flex",alignItems:"flex-end",gap:8,transition:"border-color .15s",boxShadow:focused?"0 0 0 3px rgba(109,40,217,.08)":"none"}}>
          <textarea ref={textRef} value={text} onChange={onInput} onKeyDown={onKey} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
            placeholder="Describí la app que necesitás… (ej. registrar gastos del negocio)"
            rows={1}
            style={{flex:1,background:"transparent",border:"none",resize:"none",color:T.text,fontSize:16,lineHeight:1.55,outline:"none",maxHeight:140,fontFamily:"inherit",padding:0}}/>
          <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
            <VoiceButton onTranscript={t=>{setText(p=>p?p+" "+t:t);textRef.current?.focus();}}/>
            <button onClick={send} disabled={!text.trim()}
              style={{width:40,height:40,borderRadius:12,background:text.trim()?T.accent:"#E5E7EB",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:text.trim()?"pointer":"default",color:"white",transition:"all .15s",flexShrink:0}}>
              <Icon.Send/>
            </button>
          </div>
        </div>
      </div>

      <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center",maxWidth:540}}>
        {EXAMPLES.map(ex=>(
          <button key={ex} onClick={()=>onGenerate(ex)}
            style={{padding:"8px 14px",borderRadius:20,background:T.bgSubtle,border:`1px solid ${T.border}`,color:T.textSec,fontSize:13,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=T.borderFocus;e.currentTarget.style.color=T.text;e.currentTarget.style.background=T.accentSoft;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.textSec;e.currentTarget.style.background=T.bgSubtle;}}>
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── CHAT BAR ─────────────────────────────────────────────────────────────────
function ChatBar({ onSend, isLoading, placeholder="Pedí un cambio…" }) {
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const textRef = useRef(null);
  const send = () => { if(text.trim()&&!isLoading){onSend(text.trim());setText("");} };
  const onKey = e => { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();} };

  return (
    <div style={{padding:"10px 16px 14px",background:T.bg,borderTop:`1px solid ${T.border}`,flexShrink:0}}>
      <div style={{display:"flex",alignItems:"center",gap:8,background:T.bg,border:`1.5px solid ${focused?T.borderFocus:T.border}`,borderRadius:12,padding:"8px 8px 8px 14px",transition:"border-color .15s"}}>
        <input ref={textRef} value={text} onChange={e=>setText(e.target.value)} onKeyDown={onKey} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
          placeholder={isLoading?"Actualizando…":placeholder}
          disabled={isLoading}
          style={{flex:1,background:"transparent",border:"none",color:T.text,fontSize:15,outline:"none",fontFamily:"inherit"}}/>
        <VoiceButton onTranscript={t=>{setText(p=>p?p+" "+t:t);}}/>
        <button onClick={send} disabled={!text.trim()||isLoading}
          style={{width:34,height:34,borderRadius:9,background:text.trim()&&!isLoading?T.accent:"#E5E7EB",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:text.trim()&&!isLoading?"pointer":"default",color:"white",transition:"all .15s"}}>
          {isLoading?<div style={{width:14,height:14,border:"2px solid rgba(255,255,255,.4)",borderTopColor:"white",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>:<Icon.Send/>}
        </button>
      </div>
    </div>
  );
}

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;-webkit-font-smoothing:antialiased;}
html,body,#root{height:100%;height:-webkit-fill-available;}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#fff;color:#111;overscroll-behavior:none;}
textarea,input{font-family:inherit;font-size:16px!important;}
button{font-family:inherit;}
@keyframes voicePulse{0%,100%{opacity:.4;transform:scale(.8);}50%{opacity:1;transform:scale(1.1);}}
@keyframes fadeUp{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
@keyframes spin{to{transform:rotate(360deg);}}
.fade-in{animation:fadeUp .25s ease;}
`;

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [mode, setMode] = useState("home");       // home | generating | preview
  const [html, setHtml] = useState("");
  const [title, setTitle] = useState("");
  const [conversation, setConversation] = useState([]);
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [error, setError] = useState(null);
  const [mobileTab, setMobileTab] = useState("preview"); // preview | chat
  const [isModifying, setIsModifying] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);   // UI messages

  const generate = async (prompt, convHistory) => {
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ prompt, conversation: convHistory || [] }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Error generando");
      return data;
    } catch(e) {
      throw e;
    }
  };

  const handleCreate = async (prompt) => {
    setCurrentPrompt(prompt);
    setMode("generating");
    setChatHistory([{role:"user", text:prompt}]);
    try {
      const data = await generate(prompt, []);
      setHtml(data.html);
      setTitle(data.title);
      setConversation([{role:"user",content:prompt},{role:"assistant",content:data.html}]);
      setMode("preview");
      setMobileTab("preview");
      setChatHistory(h=>[...h,{role:"neura",text:`✅ App lista: ${data.title}`}]);
    } catch(e) {
      setError(e.message);
      setMode("home");
      setChatHistory([]);
    }
  };

  const handleModify = async (prompt) => {
    setIsModifying(true);
    setChatHistory(h=>[...h,{role:"user",text:prompt}]);
    try {
      const data = await generate(prompt, conversation);
      setHtml(data.html);
      setTitle(data.title);
      setConversation(c=>[...c,{role:"user",content:prompt},{role:"assistant",content:data.html}]);
      setChatHistory(h=>[...h,{role:"neura",text:`✅ Actualizada: ${data.title}`}]);
      setMobileTab("preview");
    } catch(e) {
      setChatHistory(h=>[...h,{role:"neura",text:`❌ ${e.message}`}]);
    } finally {
      setIsModifying(false);
    }
  };

  const handleNew = () => { setMode("home"); setHtml(""); setTitle(""); setConversation([]); setChatHistory([]); };

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>
      <div style={{display:"flex",flexDirection:"column",height:"100%",height:"-webkit-fill-available",background:T.bg}}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderBottom:`1px solid ${T.border}`,flexShrink:0,background:T.bg}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <NeuraLogo size={24}/>
            <span style={{fontWeight:700,fontSize:15,letterSpacing:".08em",color:T.text}}>NEURA</span>
            {mode==="preview"&&<span style={{fontSize:12,color:T.textTert,marginLeft:4}}>Crea</span>}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {mode==="preview"&&(
              <>
                {/* Mobile tabs */}
                <div style={{display:"flex",gap:2,background:T.bgSubtle,borderRadius:8,padding:2}} className="mobile-tabs">
                  <button onClick={()=>setMobileTab("preview")} style={{padding:"5px 10px",borderRadius:6,border:"none",background:mobileTab==="preview"?T.bg:"transparent",color:mobileTab==="preview"?T.accent:T.textSec,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontFamily:"inherit"}}>
                    <Icon.Eye/> App
                  </button>
                  <button onClick={()=>setMobileTab("chat")} style={{padding:"5px 10px",borderRadius:6,border:"none",background:mobileTab==="chat"?T.bg:"transparent",color:mobileTab==="chat"?T.accent:T.textSec,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontFamily:"inherit"}}>
                    <Icon.Chat/> Chat
                  </button>
                </div>
                <button onClick={handleNew} style={{padding:"6px 12px",borderRadius:8,border:`1px solid ${T.border}`,background:T.bgSubtle,color:T.textSec,fontSize:12,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:4}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=T.borderFocus;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;}}>
                  <Icon.Plus/> Nueva
                </button>
              </>
            )}
          </div>
        </div>

        {/* Body */}
        {mode==="home" && (
          <Home onGenerate={handleCreate}/>
        )}

        {mode==="generating" && (
          <GeneratingView prompt={currentPrompt}/>
        )}

        {mode==="preview" && (
          <div style={{flex:1,overflow:"hidden",display:"flex",minHeight:0}}>
            {/* Desktop: split view */}
            <div style={{flex:"0 0 65%",borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column"}} className="desktop-preview">
              <AppPreview html={html} title={title}/>
            </div>
            <div style={{flex:1,display:"flex",flexDirection:"column"}} className="desktop-chat">
              <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:10}}>
                {chatHistory.map((m,i)=>(
                  <div key={i} className="fade-in" style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
                    <div style={{maxWidth:"85%",padding:"8px 12px",borderRadius:m.role==="user"?"14px 4px 14px 14px":"4px 14px 14px 14px",background:m.role==="user"?"#F3F4F6":T.accentSoft,color:T.text,fontSize:14,lineHeight:1.5}}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {isModifying&&<div style={{display:"flex",gap:4,padding:"8px 0"}}>{[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:T.accent,animation:`voicePulse .8s ${i*.2}s ease-in-out infinite`}}/>)}</div>}
              </div>
              <ChatBar onSend={handleModify} isLoading={isModifying} placeholder="Pedí un cambio a la app…"/>
            </div>

            {/* Mobile: tabs */}
            <div style={{position:"absolute",inset:"57px 0 0 0",display:"flex",flexDirection:"column"}} className="mobile-body">
              {mobileTab==="preview"&&<AppPreview html={html} title={title}/>}
              {mobileTab==="chat"&&(
                <>
                  <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:10}}>
                    {chatHistory.map((m,i)=>(
                      <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
                        <div style={{maxWidth:"85%",padding:"8px 12px",borderRadius:m.role==="user"?"14px 4px 14px 14px":"4px 14px 14px 14px",background:m.role==="user"?"#F3F4F6":T.accentSoft,color:T.text,fontSize:14,lineHeight:1.5}}>
                          {m.text}
                        </div>
                      </div>
                    ))}
                    {isModifying&&<div style={{display:"flex",gap:4,padding:"8px 0"}}>{[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:T.accent,animation:`voicePulse .8s ${i*.2}s ease-in-out infinite`}}/>)}</div>}
                  </div>
                  <ChatBar onSend={handleModify} isLoading={isModifying} placeholder="Pedí un cambio a la app…"/>
                </>
              )}
            </div>
          </div>
        )}

        {/* Error toast */}
        {error&&(
          <div style={{position:"fixed",bottom:80,left:"50%",transform:"translateX(-50%)",background:"#FEE2E2",border:"1px solid #FECACA",borderRadius:10,padding:"10px 16px",color:"#991B1B",fontSize:13,maxWidth:400,textAlign:"center",zIndex:100}}>
            ❌ {error}
          </div>
        )}
      </div>

      <style>{`
        .desktop-preview{display:flex!important;}
        .desktop-chat{display:flex!important;}
        .mobile-body{display:none!important;}
        .mobile-tabs{display:none!important;}
        @media(max-width:768px){
          .desktop-preview{display:none!important;}
          .desktop-chat{display:none!important;}
          .mobile-body{display:flex!important;}
          .mobile-tabs{display:flex!important;}
        }
      `}</style>
    </>
  );
}
