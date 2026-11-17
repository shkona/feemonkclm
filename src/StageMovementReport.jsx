import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { exportToCSV } from "./exportUtils.js";
import { STATUS_META, STAGE_ORDER } from "./leadStatus.js";

const fmtDate=d=>new Date(d).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"2-digit"});

// Supabase caps a single response at 1000 rows, so page through until exhausted
async function fetchAll(buildQuery){
  const size=1000;
  const rows=[];
  for(let from=0;;from+=size){
    const {data,error}=await buildQuery().range(from,from+size-1);
    if(error)throw error;
    rows.push(...data);
    if(data.length<size)break;
  }
  return rows;
}

function getDefaultFromDate(){
  const date=new Date();
  date.setDate(date.getDate()-30);
  return date.toISOString().split("T")[0];
}

export default function StageMovementReport({currentUser}){
  const isMgmt=currentUser.role==="Management";
  const [leads,setLeads]=useState([]);
  const [history,setHistory]=useState([]);
  const [users,setUsers]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [filterUser,setFilterUser]=useState("");
  const [fromDate,setFromDate]=useState(getDefaultFromDate());
  const [toDate,setToDate]=useState(new Date().toISOString().split("T")[0]);

  useEffect(()=>{
    let cancelled=false;
    (async()=>{
      try{
        const leadRows=await fetchAll(()=>{
          let q=supabase.from("leads").select("id,name,status,created_by,users!leads_created_by_fkey(name)").order("created_at").order("id");
          if(!isMgmt)q=q.eq("created_by",currentUser.id);
          return q;
        });
        const historyRows=await fetchAll(()=>supabase.from("lead_status_history").select("lead_id,to_status,changed_at,is_estimated").order("changed_at").order("id"));
        if(isMgmt){
          const {data}=await supabase.from("users").select("id,name").order("name");
          if(!cancelled)setUsers(data||[]);
        }
        if(cancelled)return;
        setLeads(leadRows);
        setHistory(historyRows);
      }catch(err){
        console.error("Error loading stage movement:",err);
        if(!cancelled)setError(err.message||"Failed to load stage movement");
      }finally{
        if(!cancelled)setLoading(false);
      }
    })();
    return()=>{cancelled=true;};
  },[]);

  const from=fromDate?new Date(fromDate+"T00:00:00"):null;
  const to=toDate?new Date(toDate+"T23:59:59.999"):null;
  const inRange=iso=>{
    const t=new Date(iso);
    return (!from||t>=from)&&(!to||t<=to);
  };

  const visibleLeads=leads.filter(l=>!filterUser||l.created_by===filterUser);
  const leadIds=new Set(visibleLeads.map(l=>l.id));

  // first time each lead entered each stage
  const entries={};
  history.forEach(h=>{
    if(!leadIds.has(h.lead_id))return;
    const byStage=entries[h.lead_id]||(entries[h.lead_id]={});
    const cur=byStage[h.to_status];
    if(!cur||new Date(h.changed_at)<new Date(cur.at))byStage[h.to_status]={at:h.changed_at,est:h.is_estimated};
  });

  const enteredInPeriod={};
  const lastMove={};
  Object.entries(entries).forEach(([leadId,byStage])=>{
    Object.entries(byStage).forEach(([stage,e])=>{
      if(!inRange(e.at))return;
      enteredInPeriod[stage]=(enteredInPeriod[stage]||0)+1;
      if(!lastMove[leadId]||new Date(e.at)>new Date(lastMove[leadId]))lastMove[leadId]=e.at;
    });
  });

  const rows=visibleLeads
    .filter(l=>lastMove[l.id])
    .sort((a,b)=>new Date(lastMove[b.id])-new Date(lastMove[a.id]));

  const cellText=e=>e?`${e.est?"~":""}${fmtDate(e.at)}`:"";

  const handleExport=()=>{
    exportToCSV(rows.map(l=>{
      const row={"Lead":l.name,"Owner":l.users?.name||"--","Current Stage":STATUS_META[l.status]?.label||l.status};
      STAGE_ORDER.forEach(s=>{row[STATUS_META[s].label]=cellText(entries[l.id]?.[s]);});
      return row;
    }),"Stage_Movement");
  };

  const labelStyle={display:"block",fontSize:11,fontWeight:600,color:"#475569",marginBottom:4,textTransform:"uppercase"};
  const inputStyle={width:"100%",padding:"8px 10px",borderRadius:6,border:"1px solid #e2e8f0",fontSize:12,fontFamily:"inherit",boxSizing:"border-box"};

  return(
    <div>
      {error&&<div style={{background:"#fee2e2",border:"1px solid #fca5a5",borderRadius:8,padding:12,marginBottom:16,color:"#b91c1c",fontSize:12}}>⚠️ {error}</div>}

      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
        <button
          onClick={handleExport}
          disabled={rows.length===0}
          style={{background:"#059669",color:"#fff",border:"none",borderRadius:6,padding:"10px 20px",fontSize:13,fontWeight:600,cursor:rows.length===0?"not-allowed":"pointer",opacity:rows.length===0?0.5:1,fontFamily:"inherit"}}
        >📥 Export to CSV</button>
      </div>

      {/* Filters */}
      <div style={{background:"#fff",borderRadius:10,border:"1px solid #e2e8f0",padding:16,marginBottom:20}}>
        <div style={{display:"grid",gridTemplateColumns:isMgmt?"1fr 1fr 1fr":"1fr 1fr",gap:16,alignItems:"flex-end"}}>
          {isMgmt&&(
            <div>
              <label style={labelStyle}>Associate</label>
              <select value={filterUser} onChange={e=>setFilterUser(e.target.value)} style={inputStyle}>
                <option value="">All Associates</option>
                {users.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label style={labelStyle}>From Date</label>
            <input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)} style={inputStyle}/>
          </div>
          <div>
            <label style={labelStyle}>To Date</label>
            <input type="date" value={toDate} onChange={e=>setToDate(e.target.value)} style={inputStyle}/>
          </div>
        </div>
      </div>

      {loading?(
        <div style={{textAlign:"center",padding:40,color:"#94a3b8"}}>Loading...</div>
      ):(
        <>
          {/* Per-stage counts for the period */}
          <h2 style={{fontSize:14,fontWeight:700,color:"#1e293b",margin:"0 0 10px"}}>Leads entering each stage in this period</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:12,marginBottom:24}}>
            {STAGE_ORDER.map(s=>{
              const m=STATUS_META[s];
              return(
                <div key={s} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,padding:14,borderTop:`3px solid ${m.color}`}}>
                  <div style={{fontSize:11,fontWeight:600,color:"#64748b",marginBottom:6}}>{m.label}</div>
                  <div style={{fontSize:24,fontWeight:700,color:m.color}}>{enteredInPeriod[s]||0}</div>
                </div>
              );
            })}
          </div>

          {/* Lead-by-lead dates */}
          <h2 style={{fontSize:14,fontWeight:700,color:"#1e293b",margin:"0 0 4px"}}>Stage dates by lead</h2>
          <p style={{fontSize:12,color:"#64748b",margin:"0 0 10px"}}>
            Each date is when the lead first entered that stage. Highlighted dates fall inside the selected range. A "~" marks a date estimated for leads that existed before stage tracking began.
          </p>
          <div style={{background:"#fff",borderRadius:10,border:"1px solid #e2e8f0",overflowX:"auto"}}>
            {rows.length===0?(
              <div style={{textAlign:"center",padding:40,color:"#94a3b8"}}>No stage movement in the selected range</div>
            ):(
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead>
                  <tr style={{background:"#f8fafc",borderBottom:"1px solid #e2e8f0"}}>
                    {["Lead","Owner","Current Stage",...STAGE_ORDER.map(s=>STATUS_META[s].label)].map(h=>
                      <th key={h} style={{padding:"10px 12px",textAlign:"left",fontSize:11,fontWeight:600,color:"#475569",textTransform:"uppercase",whiteSpace:"nowrap"}}>{h}</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(l=>{
                    const cur=STATUS_META[l.status];
                    return(
                      <tr key={l.id} style={{borderBottom:"1px solid #f1f5f9"}}>
                        <td style={{padding:"10px 12px",fontWeight:600,color:"#1e293b",whiteSpace:"nowrap"}}>{l.name}</td>
                        <td style={{padding:"10px 12px",color:"#64748b",whiteSpace:"nowrap"}}>{l.users?.name||"--"}</td>
                        <td style={{padding:"10px 12px"}}>
                          <span style={{display:"inline-block",padding:"3px 9px",borderRadius:20,fontSize:10,fontWeight:600,whiteSpace:"nowrap",background:cur?.bg,color:cur?.color}}>{cur?.label||l.status}</span>
                        </td>
                        {STAGE_ORDER.map(s=>{
                          const e=entries[l.id]?.[s];
                          const hit=e&&inRange(e.at);
                          return <td key={s} style={{padding:"10px 12px",whiteSpace:"nowrap",color:hit?"#1d4ed8":"#64748b",background:hit?"#eff6ff":"transparent",fontWeight:hit?600:400}}>{e?cellText(e):"—"}</td>;
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          <div style={{marginTop:12,fontSize:12,color:"#64748b"}}>📈 {rows.length} lead{rows.length!==1?"s":""} moved in this period</div>
        </>
      )}
    </div>
  );
}
