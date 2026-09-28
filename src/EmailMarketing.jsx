import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const SEQUENCE_ID="6aab8853292aab00189d502b";
const LEAD_SOURCE_FILTER="Inside Sales Team";

const SETUP_SQL_1=`-- Part 1 (already run)
alter table leads add column if not exists status_updated_at timestamptz not null default now();

create or replace function set_leads_status_updated_at()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status then
    new.status_updated_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_leads_status_updated_at on leads;
create trigger trg_leads_status_updated_at
before update on leads
for each row
execute function set_leads_status_updated_at();

create table if not exists email_marketing_stats (
  id bigint generated always as identity primary key,
  synced_at timestamptz not null default now(),
  sequence_id text not null,
  sequence_name text not null,
  week_start date not null,
  contacts_added_this_week integer not null default 0,
  total_sent integer not null default 0,
  total_delivered integer not null default 0,
  total_opened integer not null default 0,
  total_replied integer not null default 0,
  total_bounced integer not null default 0,
  steps jsonb not null default '[]'::jsonb,
  unique (sequence_id, week_start)
);`;

const SETUP_SQL_2=`-- Part 2 (date-range support + drill-down tables)
alter table email_marketing_stats rename column week_start to range_start;
alter table email_marketing_stats add column if not exists range_end date;
update email_marketing_stats set range_end = range_start where range_end is null;
alter table email_marketing_stats alter column range_end set not null;
alter table email_marketing_stats drop constraint if exists email_marketing_stats_sequence_id_week_start_key;
alter table email_marketing_stats add constraint email_marketing_stats_sequence_range_key unique (sequence_id, range_start, range_end);

create table if not exists email_marketing_contact_stats (
  id bigint generated always as identity primary key,
  synced_at timestamptz not null default now(),
  sequence_id text not null,
  range_start date not null,
  range_end date not null,
  contact_name text not null,
  sent integer not null default 0,
  delivered integer not null default 0,
  opened integer not null default 0,
  replied integer not null default 0,
  bounced integer not null default 0
);
create index if not exists idx_emc_stats_range on email_marketing_contact_stats(sequence_id, range_start, range_end);

create table if not exists email_marketing_new_contacts (
  id bigint generated always as identity primary key,
  synced_at timestamptz not null default now(),
  sequence_id text not null,
  range_start date not null,
  range_end date not null,
  contact_name text not null
);
create index if not exists idx_emc_new_range on email_marketing_new_contacts(sequence_id, range_start, range_end);`;

function toISODate(d){ return d.toISOString().slice(0,10); }

function startOfWeek(d){
  const day=d.getDay();
  const diff=(day===0?-6:1-day);
  return new Date(d.getFullYear(),d.getMonth(),d.getDate()+diff);
}

const PRESETS={
  this_week:{label:"This Week",compute:()=>{const now=new Date();return {start:toISODate(startOfWeek(now)),end:toISODate(now)};}},
  last_7_days:{label:"Last 7 Days",compute:()=>{const now=new Date();const s=new Date(now);s.setDate(s.getDate()-6);return {start:toISODate(s),end:toISODate(now)};}},
  last_30_days:{label:"Last 30 Days",compute:()=>{const now=new Date();const s=new Date(now);s.setDate(s.getDate()-29);return {start:toISODate(s),end:toISODate(now)};}},
  this_month:{label:"This Month",compute:()=>{const now=new Date();return {start:toISODate(new Date(now.getFullYear(),now.getMonth(),1)),end:toISODate(now)};}},
  custom:{label:"Custom",compute:null},
};

function pct(n,d){
  if(!d)return "0%";
  return `${Math.round((n/d)*100)}%`;
}

function timeAgo(iso){
  if(!iso)return "";
  const diffMs=Date.now()-new Date(iso).getTime();
  const mins=Math.floor(diffMs/60000);
  if(mins<1)return "just now";
  if(mins<60)return `${mins}m ago`;
  const hrs=Math.floor(mins/60);
  if(hrs<24)return `${hrs}h ago`;
  const days=Math.floor(hrs/24);
  return `${days}d ago`;
}

function StatCard({label,value,sub,color,onClick,active}){
  return(
    <div
      onClick={onClick}
      style={{background:"#fff",borderRadius:10,border:active?"1px solid #2563eb":"1px solid #e2e8f0",boxShadow:active?"0 0 0 2px #dbeafe":"none",padding:16,flex:"1 1 160px",minWidth:150,cursor:onClick?"pointer":"default"}}
    >
      <div style={{fontSize:11,fontWeight:600,color:"#64748b",textTransform:"uppercase",letterSpacing:".4px",marginBottom:8}}>{label}</div>
      <div style={{fontSize:26,fontWeight:700,color:color||"#1e293b"}}>{value}</div>
      {sub&&<div style={{fontSize:11,color:"#94a3b8",marginTop:4}}>{sub}</div>}
    </div>
  );
}

function SectionTitle({children,caption}){
  return(
    <div style={{margin:"28px 0 12px"}}>
      <h2 style={{fontSize:14,fontWeight:700,color:"#1e293b",margin:0,textTransform:"uppercase",letterSpacing:".4px"}}>{children}</h2>
      {caption&&<p style={{fontSize:12,color:"#94a3b8",margin:"2px 0 0"}}>{caption}</p>}
    </div>
  );
}

export default function EmailMarketing(){
  const [preset,setPreset]=useState("this_week");
  const [customStart,setCustomStart]=useState("");
  const [customEnd,setCustomEnd]=useState("");

  const [loading,setLoading]=useState(true);
  const [refreshing,setRefreshing]=useState(false);
  const [apolloStats,setApolloStats]=useState(null);
  const [apolloMissing,setApolloMissing]=useState(false);
  const [apolloNotSynced,setApolloNotSynced]=useState(false);
  const [leadCounts,setLeadCounts]=useState({convertedToLead:null,demoBooked:null,onboarded:null});
  const [statusColumnMissing,setStatusColumnMissing]=useState(false);
  const [error,setError]=useState("");

  const [activeMetric,setActiveMetric]=useState(null);
  const [drilldownRows,setDrilldownRows]=useState([]);
  const [drilldownLoading,setDrilldownLoading]=useState(false);

  const range=preset==="custom"
    ?{start:customStart,end:customEnd}
    :PRESETS[preset].compute();
  const rangeValid=!!(range.start&&range.end&&range.start<=range.end);

  useEffect(()=>{
    setActiveMetric(null);
    setDrilldownRows([]);
    if(rangeValid)loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[preset,customStart,customEnd]);

  const loadAll=async()=>{
    setLoading(true);
    setError("");
    await Promise.all([loadApolloStats(),loadLeadCounts()]);
    setLoading(false);
  };

  const handleRefresh=async()=>{
    setRefreshing(true);
    setError("");
    setActiveMetric(null);
    setDrilldownRows([]);
    await Promise.all([loadApolloStats(),loadLeadCounts()]);
    setRefreshing(false);
  };

  const loadApolloStats=async()=>{
    setApolloMissing(false);
    setApolloNotSynced(false);
    try{
      const {data,error:err}=await supabase
        .from("email_marketing_stats")
        .select("*")
        .eq("sequence_id",SEQUENCE_ID)
        .eq("range_start",range.start)
        .eq("range_end",range.end)
        .order("synced_at",{ascending:false})
        .limit(1)
        .maybeSingle();
      if(err){
        if(err.code==="42P01"){setApolloMissing(true);return;}
        if(err.code==="42703"){setApolloMissing(true);return;}
        throw err;
      }
      if(!data){setApolloNotSynced(true);setApolloStats(null);return;}
      setApolloStats(data);
    }catch(err){
      console.error("Error loading email marketing stats:",err);
      setError("Failed to load Apollo email stats");
    }
  };

  const loadLeadCounts=async()=>{
    const startTs=`${range.start}T00:00:00`;
    const endTs=`${range.end}T23:59:59`;
    try{
      const {count:convertedToLead,error:err1}=await supabase
        .from("leads").select("id",{count:"exact",head:true})
        .eq("source",LEAD_SOURCE_FILTER)
        .gte("created_at",startTs).lte("created_at",endTs);
      if(err1)throw err1;

      let demoBooked=null,onboarded=null;
      try{
        const {count:c1,error:err2}=await supabase
          .from("leads").select("id",{count:"exact",head:true})
          .eq("source",LEAD_SOURCE_FILTER).eq("status","MGMT_VETTED")
          .gte("status_updated_at",startTs).lte("status_updated_at",endTs);
        if(err2)throw err2;
        demoBooked=c1;

        const {count:c2,error:err3}=await supabase
          .from("leads").select("id",{count:"exact",head:true})
          .eq("source",LEAD_SOURCE_FILTER).eq("status","COMPLETED")
          .gte("status_updated_at",startTs).lte("status_updated_at",endTs);
        if(err3)throw err3;
        onboarded=c2;
        setStatusColumnMissing(false);
      }catch(colErr){
        if(colErr.code==="42703"){setStatusColumnMissing(true);}
        else throw colErr;
      }

      setLeadCounts({convertedToLead,demoBooked,onboarded});
    }catch(err){
      console.error("Error loading lead counts:",err);
      setError(prev=>prev||"Failed to load pipeline counts");
    }
  };

  const loadDrilldown=async(metric)=>{
    setActiveMetric(metric);
    setDrilldownLoading(true);
    setDrilldownRows([]);
    try{
      if(metric.type==="apollo_new"){
        const {data,error:err}=await supabase
          .from("email_marketing_new_contacts")
          .select("contact_name")
          .eq("sequence_id",SEQUENCE_ID).eq("range_start",range.start).eq("range_end",range.end)
          .order("contact_name");
        if(err)throw err;
        setDrilldownRows(data||[]);
      }else if(metric.type==="apollo_metric"){
        const {data,error:err}=await supabase
          .from("email_marketing_contact_stats")
          .select("contact_name,sent,delivered,opened,replied,bounced")
          .eq("sequence_id",SEQUENCE_ID).eq("range_start",range.start).eq("range_end",range.end)
          .gt(metric.column,0)
          .order(metric.column,{ascending:false})
          .limit(50);
        if(err)throw err;
        setDrilldownRows(data||[]);
      }else if(metric.type==="lead"){
        const startTs=`${range.start}T00:00:00`;
        const endTs=`${range.end}T23:59:59`;
        let q=supabase.from("leads")
          .select("id,name,contact_name,status,created_at,status_updated_at")
          .eq("source",LEAD_SOURCE_FILTER);
        if(metric.key==="converted"){
          q=q.gte("created_at",startTs).lte("created_at",endTs).order("created_at",{ascending:false});
        }else{
          const status=metric.key==="demo"?"MGMT_VETTED":"COMPLETED";
          q=q.eq("status",status).gte("status_updated_at",startTs).lte("status_updated_at",endTs).order("status_updated_at",{ascending:false});
        }
        const {data,error:err}=await q;
        if(err)throw err;
        setDrilldownRows(data||[]);
      }
    }catch(err){
      console.error("Error loading drilldown:",err);
      setError("Failed to load details for that number");
    }finally{
      setDrilldownLoading(false);
    }
  };

  const steps=apolloStats?.steps||[];
  const totalSent=apolloStats?.total_sent||0;
  const totalDelivered=apolloStats?.total_delivered||0;
  const totalOpened=apolloStats?.total_opened||0;
  const totalReplied=apolloStats?.total_replied||0;
  const totalBounced=apolloStats?.total_bounced||0;

  const rangeLabel=rangeValid?`${range.start} to ${range.end}`:"Pick a valid date range";

  return(
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:12}}>
        <div>
          <h1 style={{fontSize:20,fontWeight:700,color:"#1e293b",margin:0}}>Email Marketing</h1>
          <p style={{fontSize:13,color:"#64748b",margin:"4px 0 0"}}>Outbound sequence performance, synced from Apollo. Click any number below for details.</p>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {apolloStats&&<div style={{fontSize:11,color:"#94a3b8"}}>Synced {timeAgo(apolloStats.synced_at)}</div>}
          <button
            onClick={handleRefresh}
            disabled={refreshing||!rangeValid}
            style={{background:"#fff",color:"#2563eb",border:"1px solid #e2e8f0",borderRadius:6,padding:"8px 14px",fontSize:12,fontWeight:600,cursor:refreshing?"not-allowed":"pointer",opacity:refreshing?0.6:1,fontFamily:"inherit"}}
          >{refreshing?"Refreshing...":"↻ Refresh"}</button>
        </div>
      </div>

      {/* Date range picker */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"flex-end",marginBottom:8}}>
        {Object.entries(PRESETS).map(([key,p])=>(
          <button key={key} onClick={()=>setPreset(key)} style={{padding:"6px 14px",borderRadius:20,border:"1px solid",borderColor:preset===key?"#2563eb":"#e2e8f0",background:preset===key?"#2563eb":"#fff",color:preset===key?"#fff":"#64748b",fontSize:12,fontWeight:600,cursor:"pointer"}}>{p.label}</button>
        ))}
        {preset==="custom"&&(
          <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
            <div>
              <label style={{display:"block",fontSize:10,fontWeight:600,color:"#475569",marginBottom:4}}>From</label>
              <input type="date" value={customStart} onChange={e=>setCustomStart(e.target.value)} style={{padding:"6px 8px",borderRadius:6,border:"1px solid #e2e8f0",fontSize:12,fontFamily:"inherit"}}/>
            </div>
            <div>
              <label style={{display:"block",fontSize:10,fontWeight:600,color:"#475569",marginBottom:4}}>To</label>
              <input type="date" value={customEnd} onChange={e=>setCustomEnd(e.target.value)} style={{padding:"6px 8px",borderRadius:6,border:"1px solid #e2e8f0",fontSize:12,fontFamily:"inherit"}}/>
            </div>
          </div>
        )}
      </div>
      <div style={{fontSize:12,color:"#94a3b8",marginBottom:16}}>Showing: {rangeLabel}</div>

      {error&&<div style={{background:"#fee2e2",border:"1px solid #fca5a5",borderRadius:8,padding:"12px 16px",color:"#b91c1c",marginBottom:16,fontSize:12}}>{error}</div>}

      {loading?(
        <div style={{textAlign:"center",padding:60,color:"#94a3b8"}}>Loading...</div>
      ):(
        <>
          {apolloMissing&&(
            <div style={{background:"#fffbeb",border:"1px solid #fcd34d",borderRadius:10,padding:20,marginBottom:20}}>
              <div style={{fontWeight:700,color:"#92400e",marginBottom:8}}>Setup needed</div>
              <p style={{fontSize:13,color:"#78350f",margin:"0 0 12px"}}>
                Run both SQL blocks below in Supabase → SQL Editor (part 1 if you haven't already, part 2 for date-range + drill-down support), then hit Refresh.
              </p>
              <pre style={{background:"#1e293b",color:"#e2e8f0",padding:14,borderRadius:8,fontSize:11,overflowX:"auto",whiteSpace:"pre",marginBottom:10}}>{SETUP_SQL_1}</pre>
              <pre style={{background:"#1e293b",color:"#e2e8f0",padding:14,borderRadius:8,fontSize:11,overflowX:"auto",whiteSpace:"pre"}}>{SETUP_SQL_2}</pre>
            </div>
          )}

          {!apolloMissing&&apolloNotSynced&&(
            <div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:10,padding:20,marginBottom:20,color:"#64748b",fontSize:13}}>
              No Apollo data synced yet for <strong>{rangeLabel}</strong>. Ask Claude to sync this exact date range, then hit Refresh.
            </div>
          )}

          {apolloStats&&(
            <>
              <SectionTitle caption={`Sequence: ${apolloStats.sequence_name} · Apollo contacts, not CRM leads`}>Email Outreach (Apollo)</SectionTitle>
              <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                <StatCard label="New Contacts Added" value={apolloStats.contacts_added_this_week} color="#2563eb" onClick={()=>loadDrilldown({type:"apollo_new",key:"new",label:"New Contacts Added"})} active={activeMetric?.key==="new"}/>
                <StatCard label="Emails Sent" value={totalSent} color="#334155" onClick={()=>loadDrilldown({type:"apollo_metric",key:"sent",column:"sent",label:"Emails Sent"})} active={activeMetric?.key==="sent"}/>
                <StatCard label="Delivered" value={totalDelivered} sub={pct(totalDelivered,totalSent)+" of sent"} color="#0891b2" onClick={()=>loadDrilldown({type:"apollo_metric",key:"delivered",column:"delivered",label:"Delivered"})} active={activeMetric?.key==="delivered"}/>
                <StatCard label="Opened" value={totalOpened} sub={pct(totalOpened,totalDelivered)+" of delivered"} color="#7c3aed" onClick={()=>loadDrilldown({type:"apollo_metric",key:"opened",column:"opened",label:"Opened"})} active={activeMetric?.key==="opened"}/>
                <StatCard label="Replied" value={totalReplied} sub={pct(totalReplied,totalDelivered)+" of delivered"} color="#15803d" onClick={()=>loadDrilldown({type:"apollo_metric",key:"replied",column:"replied",label:"Replied"})} active={activeMetric?.key==="replied"}/>
                <StatCard label="Bounced" value={totalBounced} sub={pct(totalBounced,totalSent)+" of sent"} color="#b91c1c" onClick={()=>loadDrilldown({type:"apollo_metric",key:"bounced",column:"bounced",label:"Bounced"})} active={activeMetric?.key==="bounced"}/>
              </div>

              <SectionTitle caption="Summary only — not clickable (Apollo can't reliably break this down per contact per stage)">Emails Sent by Sequence Stage</SectionTitle>
              <div style={{background:"#fff",borderRadius:10,border:"1px solid #e2e8f0",overflow:"hidden"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                  <thead>
                    <tr>
                      {["Stage","Sent","Delivered","Opened","Replied","Bounced"].map(h=>
                        <th key={h} style={{textAlign:"left",padding:"9px 12px",fontSize:11,color:"#64748b",fontWeight:600,textTransform:"uppercase",letterSpacing:".4px",borderBottom:"1px solid #f1f5f9",background:"#fafafa"}}>{h}</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {steps.length===0?
                      <tr><td colSpan={6} style={{textAlign:"center",padding:30,color:"#94a3b8"}}>No stage activity in this range.</td></tr>
                    :steps.map(s=>(
                      <tr key={s.position} style={{borderBottom:"1px solid #f8fafc"}}>
                        <td style={{padding:"9px 12px",fontWeight:600,color:"#1e293b"}}>Step {s.position}</td>
                        <td style={{padding:"9px 12px",color:"#64748b"}}>{s.sent}</td>
                        <td style={{padding:"9px 12px",color:"#64748b"}}>{s.delivered}</td>
                        <td style={{padding:"9px 12px",color:"#64748b"}}>{s.opened}</td>
                        <td style={{padding:"9px 12px",color:"#64748b"}}>{s.replied}</td>
                        <td style={{padding:"9px 12px",color:"#64748b"}}>{s.bounced}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <SectionTitle caption={`From your pipeline · source = "${LEAD_SOURCE_FILTER}"`}>Pipeline Conversion</SectionTitle>
          <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
            <StatCard label="Converted to Lead" value={leadCounts.convertedToLead??"--"} color="#2563eb" onClick={()=>loadDrilldown({type:"lead",key:"converted",label:"Converted to Lead"})} active={activeMetric?.key==="converted"}/>
            <StatCard label="Demo Booked" value={statusColumnMissing?"--":(leadCounts.demoBooked??"--")} color="#2563eb" sub={statusColumnMissing?"Run setup SQL above":null} onClick={statusColumnMissing?undefined:()=>loadDrilldown({type:"lead",key:"demo",label:"Demo Booked"})} active={activeMetric?.key==="demo"}/>
            <StatCard label="Onboarded" value={statusColumnMissing?"--":(leadCounts.onboarded??"--")} color="#15803d" sub={statusColumnMissing?"Run setup SQL above":null} onClick={statusColumnMissing?undefined:()=>loadDrilldown({type:"lead",key:"onboarded",label:"Onboarded"})} active={activeMetric?.key==="onboarded"}/>
          </div>

          {activeMetric&&(
            <>
              <SectionTitle>{activeMetric.label} — Details</SectionTitle>
              <div style={{background:"#fff",borderRadius:10,border:"1px solid #e2e8f0",overflow:"hidden"}}>
                {drilldownLoading?(
                  <div style={{textAlign:"center",padding:30,color:"#94a3b8"}}>Loading...</div>
                ):drilldownRows.length===0?(
                  <div style={{textAlign:"center",padding:30,color:"#94a3b8"}}>No records for this range.</div>
                ):activeMetric.type==="apollo_new"?(
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                    <thead><tr><th style={{textAlign:"left",padding:"9px 12px",fontSize:11,color:"#64748b",fontWeight:600,textTransform:"uppercase",background:"#fafafa",borderBottom:"1px solid #f1f5f9"}}>Contact Name</th></tr></thead>
                    <tbody>{drilldownRows.map((r,i)=><tr key={i} style={{borderBottom:"1px solid #f8fafc"}}><td style={{padding:"9px 12px",color:"#1e293b"}}>{r.contact_name}</td></tr>)}</tbody>
                  </table>
                ):activeMetric.type==="apollo_metric"?(
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                    <thead>
                      <tr>
                        {["Contact Name","Sent","Delivered","Opened","Replied","Bounced"].map(h=>
                          <th key={h} style={{textAlign:"left",padding:"9px 12px",fontSize:11,color:"#64748b",fontWeight:600,textTransform:"uppercase",background:"#fafafa",borderBottom:"1px solid #f1f5f9"}}>{h}</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {drilldownRows.map((r,i)=>(
                        <tr key={i} style={{borderBottom:"1px solid #f8fafc"}}>
                          <td style={{padding:"9px 12px",fontWeight:600,color:"#1e293b"}}>{r.contact_name}</td>
                          <td style={{padding:"9px 12px",color:"#64748b"}}>{r.sent}</td>
                          <td style={{padding:"9px 12px",color:"#64748b"}}>{r.delivered}</td>
                          <td style={{padding:"9px 12px",color:"#64748b"}}>{r.opened}</td>
                          <td style={{padding:"9px 12px",color:"#64748b"}}>{r.replied}</td>
                          <td style={{padding:"9px 12px",color:"#64748b"}}>{r.bounced}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ):(
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                    <thead>
                      <tr>
                        {["Institute / Business","Contact Name","Status","Created","Status Changed"].map(h=>
                          <th key={h} style={{textAlign:"left",padding:"9px 12px",fontSize:11,color:"#64748b",fontWeight:600,textTransform:"uppercase",background:"#fafafa",borderBottom:"1px solid #f1f5f9"}}>{h}</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {drilldownRows.map(r=>(
                        <tr key={r.id} style={{borderBottom:"1px solid #f8fafc"}}>
                          <td style={{padding:"9px 12px",fontWeight:600,color:"#1e293b"}}>{r.name||"--"}</td>
                          <td style={{padding:"9px 12px",color:"#64748b"}}>{r.contact_name||"--"}</td>
                          <td style={{padding:"9px 12px",color:"#64748b"}}>{r.status}</td>
                          <td style={{padding:"9px 12px",color:"#94a3b8"}}>{r.created_at?new Date(r.created_at).toLocaleDateString("en-IN"):"--"}</td>
                          <td style={{padding:"9px 12px",color:"#94a3b8"}}>{r.status_updated_at?new Date(r.status_updated_at).toLocaleDateString("en-IN"):"--"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
