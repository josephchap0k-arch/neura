module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS') return res.status(200).end();
  if(req.method!=='POST') return res.status(405).end();
  const body = typeof req.body==='string'?JSON.parse(req.body):req.body;
  const {messages=[],system='',model='auto',stream:doStream=true}=body||{};
  const P={claude:{key:process.env.ANTHROPIC_API_KEY,model:'claude-haiku-4-5-20251001',name:'Claude'},gpt:{key:process.env.OPENAI_API_KEY,model:'gpt-4o-mini',name:'GPT'},gemini:{key:process.env.GEMINI_API_KEY,model:'gemini-2.0-flash',name:'Gemini'},grok:{key:process.env.GROK_API_KEY,model:'grok-3-mini',name:'Grok'},deepseek:{key:process.env.DEEPSEEK_API_KEY,model:'deepseek-chat',name:'DeepSeek'},kimi:{key:process.env.KIMI_API_KEY,model:'moonshot-v1-8k',name:'Kimi'}};
  function resolve(m){if(m==='auto'||!P[m]){for(const p of['claude','gpt','gemini','deepseek','grok','kimi']){if(P[p].key)return p;}return null;}return P[m]?.key?m:null;}
  const pid=resolve(model);
  if(!pid) return res.status(503).json({error:'No AI provider configured'});
  const prov=P[pid];
  const SYS=system||'Sos NEURA. Prompt Master invisible. Interpreta la intencion del usuario y responde directamente con criterio experto. Nunca cuestionarios. Nunca preguntas antes de responder. Voseo argentino.';
  const msgs=messages.map(m=>({role:m.role==='assistant'?'assistant':'user',content:String(m.content||'').slice(0,8000)})).filter(m=>m.content);
  try{
    if(pid==='claude'){
      const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':prov.key,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:prov.model,max_tokens:1500,system:SYS,messages:msgs,stream:doStream})});
      if(!r.ok) throw new Error('Claude '+r.status);
      if(doStream){res.setHeader('Content-Type','text/event-stream');res.setHeader('Cache-Control','no-cache,no-transform');res.setHeader('X-Provider',prov.name);const rd=r.body.getReader();const dc=new TextDecoder();try{while(true){const{done,value}=await rd.read();if(done)break;res.write(dc.decode(value,{stream:true}));}}finally{rd.releaseLock();}return res.end();}
      const d=await r.json();return res.json({reply:d.content?.[0]?.text||'',provider:prov.name});
    }
    const OA={gpt:'https://api.openai.com/v1/chat/completions',deepseek:'https://api.deepseek.com/v1/chat/completions',grok:'https://api.x.ai/v1/chat/completions',kimi:'https://api.moonshot.cn/v1/chat/completions'};
    if(OA[pid]){
      const r=await fetch(OA[pid],{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+prov.key},body:JSON.stringify({model:prov.model,messages:[{role:'system',content:SYS},...msgs],stream:doStream})});
      if(!r.ok) throw new Error(prov.name+' '+r.status);
      if(doStream){res.setHeader('Content-Type','text/event-stream');res.setHeader('Cache-Control','no-cache,no-transform');res.setHeader('X-Provider',prov.name);res.write('data: {"x_provider":"'+prov.name+'"}\n\n');const rd=r.body.getReader();const dc=new TextDecoder();try{while(true){const{done,value}=await rd.read();if(done)break;res.write(dc.decode(value,{stream:true}));}}finally{rd.releaseLock();}return res.end();}
      const d=await r.json();return res.json({reply:d.choices?.[0]?.message?.content||'',provider:prov.name});
    }
    if(pid==='gemini'){
      const contents=msgs.map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:m.content}]}));
      const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+prov.model+':generateContent?key='+prov.key,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({systemInstruction:{parts:[{text:SYS}]},contents})});
      if(!r.ok) throw new Error('Gemini '+r.status);
      const d=await r.json();return res.json({reply:d.candidates?.[0]?.content?.parts?.[0]?.text||'',provider:prov.name});
    }
  }catch(e){if(!res.headersSent) res.status(500).json({error:e.message,provider:prov?.name});}
};
