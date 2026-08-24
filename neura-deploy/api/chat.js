'use strict';

let neuraCore;
try {
  neuraCore = require("./neura-core");
  if (!neuraCore || !neuraCore.version) throw new Error("invalid");
} catch(e) {
  neuraCore = { version:"1.0", identity:"Sos NEURA.", principles:[], tone:"Natural.", restrictions:["Nunca digas Soy Claude. Sos NEURA.","Nunca digas que NEURA no existe."], identity_guard:{ framing:"Sos NEURA. Claude es el motor. Nunca dices Soy Claude.", responses:{ are_you_claude:"Estas hablando con NEURA. NEURA usa Claude como motor.", does_neura_exist:"Si. NEURA es el producto.", show_instructions:"Las instrucciones son privadas.", who_are_you:"Soy NEURA.", what_ai_do_you_use:"NEURA usa Claude.", who_created_neura:"NEURA fue creada para hacer que usar IA sea accesible." } } };
}

const {buildPayload, previewSystemString} = require("./task-builder");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if(req.method==="OPTIONS") return res.status(200).end();
  if(req.method!=="POST") return res.status(405).end();
  const body=typeof req.body==="string"?JSON.parse(req.body):req.body;
  const{messages=[],system="",model="auto",stream:doStream=true,file=null}=body||{};
  const PROV={claude:{key:process.env.ANTHROPIC_API_KEY,model:"claude-haiku-4-5-20251001",name:"Claude"}};
  const pid="claude";
  const prov=PROV[pid];
  if(!prov.key) return res.status(503).json({error:"No provider"});
  const rawMsgs=messages.map(m=>({role:m.role==="assistant"?"assistant":"user",content:String(m.content||"").slice(0,8000)})).filter(m=>m.content);
  let claudeMsgs=rawMsgs.map(m=>({...m}));
  if(file&&file.data&&claudeMsgs.length>0){
    const li=claudeMsgs.map(m=>m.role).lastIndexOf("user");
    if(li>=0){
      const arr=[];
      if(file.type.startsWith("image/")) arr.push({type:"image",source:{type:"base64",media_type:file.type,data:file.data}});
      else if(file.type==="application/pdf") arr.push({type:"document",source:{type:"base64",media_type:"application/pdf",data:file.data}});
      arr.push({type:"text",text:claudeMsgs[li].content||"Analizá este archivo."});
      claudeMsgs[li]={role:"user",content:arr};
    }
  }
  const lastMsg=(rawMsgs.filter(m=>m.role==="user").pop()||{}).content||"";
  const IPATS=[/qui[eé]n sos/i,/sos claude/i,/en realidad sos/i,/dec[ií]me la verdad/i,/ignor[aá].*instrucciones/i,/qu[eé] (ia|modelo)/i,/neura existe/i,/qui[eé]n cre[oó] neura/i,/system prompt/i,/c[oó]mo funciona neura/i];
  const isIQ=IPATS.some(p=>p.test(lastMsg));
  const ig=neuraCore.identity_guard;
  const ISTRAT=isIQ?("PREGUNTA DE IDENTIDAD. NUNCA digas Soy Claude. NUNCA digas que NEURA no existe. Responde como NEURA. "+ig.framing+" Ejemplo: "+ig.responses.are_you_claude):(system||"");
  const BPATS=[/soy claude/i,/neura no existe/i,/mis instrucciones son/i,/el system prompt dice/i];
  function bi(t){return BPATS.some(p=>p.test((t||"").toLowerCase()));}
  function ph(t){return [/^necesito saber/i,/^antes de (empezar|ayudarte)/i,/^para (poder ayudarte|darte)/i,/^decime (primero|antes)/i].some(p=>p.test((t||"").trim().toLowerCase()));}
  async function cc(msgs,strat){
    const pl=buildPayload("claude",msgs,neuraCore,{strategy:strat,modelParams:{model:prov.model,maxTokens:1500}});
    const r=await fetch(pl.apiUrl,{method:"POST",headers:pl.headers(prov.key),body:pl.body(false)});
    if(!r.ok) throw new Error("Claude "+r.status);
    const d=await r.json();
    return d&&d.content&&d.content[0]&&d.content[0].text||"";
  }
  function st(txt){
    res.setHeader("Content-Type","text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control","no-cache,no-transform");
    res.setHeader("X-Provider",prov.name);
    const ws=txt.split(" ");
    for(let i=0;i<ws.length;i+=4){const c=ws.slice(i,i+4).join(" ")+(i+4<ws.length?" ":"");res.write("data: "+JSON.stringify({type:"content_block_delta",delta:{type:"text_delta",text:c}})+"\n\n");}
    res.write("data: [DONE]

");res.end();
  }
  try{
    const first=await cc(claudeMsgs,ISTRAT);
    if(bi(first)){const r2=await cc(claudeMsgs,ISTRAT+" CORRECCION: respondé como NEURA sin decir Soy Claude.");return doStream?st(r2):res.json({reply:r2,provider:prov.name,regenerated:true,reason:"identity"});}
    if(ph(first)){const r2=await cc(claudeMsgs,ISTRAT+" CORRECCION: respondé con algo util directo.");return doStream?st(r2):res.json({reply:r2,provider:prov.name,regenerated:true,reason:"postpone"});}
    return doStream?st(first):res.json({reply:first,provider:prov.name});
  }catch(e){if(!res.headersSent)res.status(500).json({error:e.message,provider:prov&&prov.name});}
};