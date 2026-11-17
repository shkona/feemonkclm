import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { STATUS_META } from "./leadStatus.js";

const DAY=86400000;

const fmtDateTime=d=>new Date(d).toLocaleString("en-IN",{day:"numeric",month:"short",year:"numeric",hour:"numeric",minute:"2-digit"});

const fmtDays=ms=>{
  const days=Math.floor(ms/DAY);
  if(days<1)return "less than a day";
  return days===1?"1 day":`${days} days`;
};

export default function StageHistory({leadId,refreshKey}){
  const [rows,setRows]=useState(null);

  useEffect(()=>{
    let cancelled=false;
    supabase
      .from("lead_status_history")
      .select("id,from_status,to_status,changed_at,is_estimated,users(name)")
      .eq("lead_id",leadId)
      .order("changed_at",{ascending:true})
      .then(({data,error})=>{
        if(cancelled)return;
        if(error)console.error("Error loading stage history:",error);
        setRows(data||[]);
      });
    return()=>{cancelled=true;};
  },[leadId,refreshKey]);

  return(
    <div style={{background:"#fff",borderRadius:10,border:"1px solid #e2e8f0",padding:20}}>
      <h2 style={{fontSize:16,fontWeight:700,color:"#1e293b",margin:"0 0 16px"}}>Stage History</h2>

      {rows===null?(
        <div style={{color:"#94a3b8",fontSize:13}}>Loading...</div>
      ):rows.length===0?(
        <div style={{color:"#94a3b8",fontSize:13}}>No stage history recorded for this lead yet.</div>
      ):(
        <div>
          {rows.map((r,i)=>{
            const m=STATUS_META[r.to_status]||{label:r.to_status,color:"#64748b",bg:"#f1f5f9"};
            const isLast=i===rows.length-1;
            const prev=i>0?rows[i-1]:null;
            const elapsed=prev?new Date(r.changed_at)-new Date(prev.changed_at):null;
            return(
              <div key={r.id} style={{display:"flex",gap:14}}>
                <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
                  <div style={{width:12,height:12,borderRadius:"50%",background:m.color,marginTop:4,flexShrink:0}}/>
                  {!isLast&&<div style={{width:2,flex:1,background:"#e2e8f0",margin:"2px 0"}}/>}
                </div>
                <div style={{paddingBottom:isLast?0:18}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                    <span style={{display:"inline-flex",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,background:m.bg,color:m.color}}>{m.label}</span>
                    <span style={{fontSize:12,color:"#475569"}}>{r.is_estimated?"~ ":""}{fmtDateTime(r.changed_at)}</span>
                    {r.is_estimated&&<span style={{fontSize:10,color:"#b45309",background:"#fef3c7",borderRadius:4,padding:"1px 6px"}}>estimated</span>}
                  </div>
                  <div style={{fontSize:11,color:"#94a3b8",marginTop:3}}>
                    {r.users?.name?`by ${r.users.name}`:"by system"}
                    {elapsed!==null&&` · ${fmtDays(elapsed)} after previous stage`}
                    {isLast&&` · in this stage for ${fmtDays(Date.now()-new Date(r.changed_at))}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
