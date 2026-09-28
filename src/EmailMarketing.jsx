import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const SETUP_SQL = `-- Email Marketing dashboard support --

-- 1) Track when a lead's status last changed (for weekly "Demo Booked" / "Onboarded" counts)
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

-- 2) Cache table for Apollo email-marketing stats (kept in sync automatically)
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

function getWeekStartISO(){
  const now=new Date();
  const day=now.getDay();
  const diff=(day===0?-6:1-day);
  const monday=new Date(now.getFullYear(),now.getMonth(),now.getDate()+diff);
  monday.setHours(0,0,0,0);
  return monday.toISOString();
}

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

function StatCard({label,value,sub,color}){
  return(
    <div style={{background:"#fff",borderRadius:10,border:"1px solid #e2e8f0",padding:16,flex:"1 1 160px",minWidth:150}}>
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
  const [loading,setLoading]=useState(true);
  const [refreshing,setRefreshing]=useState(false);
  const [apolloStats,setApolloStats]=useState(null);
  const [apolloMissing,setApolloMissing]=useState(false);
  const [leadCounts,setLeadCounts]=useState({convertedToLead:null,demoBooked:null,onboarded:null});
  const [statusColumnMissing,setStatusColumnMissing]=useState(false);
  const [error,setError]=useState("");

  useEffect(()=>{
    loadAll();
  },[]);

  const loadAll=async()=>{
    setLoading(true);
    setError("");
    await Promise.all([loadApolloStats(),loadLeadCounts()]);
    setLoading(false);
  };

  const handleRefresh=async()=>{
    setRefreshing(true);
    setError("");
    await Promise.all([loadApolloStats(),loadLeadCounts()]);
    setRefreshing(false);
  };

  const loadApolloStats=async()=>{
    try{
      const {data,error:err}=await supabase
        .from("email_marketing_stats")
        .select("*")
        .order("synced_at",{ascending:false})
        .limit(1)
        .maybeSingle();
      if(err){
        if(err.code==="42P01"){setApolloMissing(true);return;}
        throw err;
      }
      setApolloStats(data);
    }catch(err){
      console.error("Error loading email marketing stats:",err);
      setError("Failed to load Apollo email stats");
    }
  };

  const loadLeadCounts=async()=>{
    const weekStart=getWeekStartISO();
    try{
      const {count:convertedToLead,error:err1}=await supabase
        .from("leads").select("id",{count:"exact",head:true})
        .gte("created_at",weekStart);
      if(err1)throw err1;

      let demoBooked=null,onboarded=null;
      try{
        const {count:c1,error:err2}=await supabase
          .from("leads").select("id",{count:"exact",head:true})
          .eq("status","MGMT_VETTED").gte("status_updated_at",weekStart);
        if(err2)throw err2;
        demoBooked=c1;

        const {count:c2,error:err3}=await supabase
          .from("leads").select("id",{count:"exact",head:true})
          .eq("status","COMPLETED").gte("status_updated_at",weekStart);
        if(err3)throw err3;
        onboarded=c2;
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

  if(loading){
    return <div style={{textAlign:"center",padding:60,color:"#94a3b8"}}>Loading...</div>;
  }

  const steps=apolloStats?.steps||[];
  const totalSent=apolloStats?.total_sent||0;
  const totalDelivered=apolloStats?.total_delivered||0;
  const totalOpened=apolloStats?.total_opened||0;
  const totalReplied=apolloStats?.total_replied||0;
  const totalBounced=apolloStats?.total_bounced||0;

  return(
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
        <div>
          <h1 style={{fontSize:20,fontWeight:700,color:"#1e293b",margin:0}}>Email Marketing</h1>
          <p style={{fontSize:13,color:"#64748b",margin:"4px 0 0"}}>Outbound sequence performance, synced from Apollo.</p>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {apolloStats&&<div style={{fontSize:11,color:"#94a3b8"}}>Synced {timeAgo(apolloStats.synced_at)}</div>}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{background:"#fff",color:"#2563eb",border:"1px solid #e2e8f0",borderRadius:6,padding:"8px 14px",fontSize:12,fontWeight:600,cursor:refreshing?"not-allowed":"pointer",opacity:refreshing?0.6:1,fontFamily:"inherit"}}
          >{refreshing?"Refreshing...":"↻ Refresh"}</button>
        </div>
      </div>

      {error&&<div style={{background:"#fee2e2",border:"1px solid #fca5a5",borderRadius:8,padding:"12px 16px",color:"#b91c1c",marginTop:16,fontSize:12}}>{error}</div>}

      {apolloMissing&&(
        <div style={{background:"#fffbeb",border:"1px solid #fcd34d",borderRadius:10,padding:20,marginTop:20}}>
          <div style={{fontWeight:700,color:"#92400e",marginBottom:8}}>One-time setup needed</div>
          <p style={{fontSize:13,color:"#78350f",margin:"0 0 12px"}}>
            The Apollo sync table doesn't exist yet. Open your Supabase project → SQL Editor → New query, paste the SQL below, and click Run. Once it's created, the dashboard will populate automatically.
          </p>
          <pre style={{background:"#1e293b",color:"#e2e8f0",padding:14,borderRadius:8,fontSize:11,overflowX:"auto",whiteSpace:"pre"}}>{SETUP_SQL}</pre>
        </div>
      )}

      {!apolloMissing&&!apolloStats&&(
        <div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:10,padding:20,marginTop:20,color:"#64748b",fontSize:13}}>
          No Apollo data synced yet. The first sync will populate this dashboard shortly.
        </div>
      )}

      {apolloStats&&(
        <>
          <SectionTitle caption={`Sequence: ${apolloStats.sequence_name} · this week`}>Email Outreach (Apollo)</SectionTitle>
          <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
            <StatCard label="New Leads Added" value={apolloStats.contacts_added_this_week} color="#2563eb"/>
            <StatCard label="Emails Sent" value={totalSent} color="#334155"/>
            <StatCard label="Delivered" value={totalDelivered} sub={pct(totalDelivered,totalSent)+" of sent"} color="#0891b2"/>
            <StatCard label="Opened" value={totalOpened} sub={pct(totalOpened,totalDelivered)+" of delivered"} color="#7c3aed"/>
            <StatCard label="Replied" value={totalReplied} sub={pct(totalReplied,totalDelivered)+" of delivered"} color="#15803d"/>
            <StatCard label="Bounced" value={totalBounced} sub={pct(totalBounced,totalSent)+" of sent"} color="#b91c1c"/>
          </div>

          <SectionTitle>Emails Sent by Sequence Stage</SectionTitle>
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
                  <tr><td colSpan={6} style={{textAlign:"center",padding:30,color:"#94a3b8"}}>No stage activity this week.</td></tr>
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

      <SectionTitle caption="From your pipeline · this week">Pipeline Conversion</SectionTitle>
      <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
        <StatCard label="Converted to Lead" value={leadCounts.convertedToLead??"--"} color="#2563eb"/>
        <StatCard label="Demo Booked" value={statusColumnMissing?"--":(leadCounts.demoBooked??"--")} color="#2563eb" sub={statusColumnMissing?"Run setup SQL above":null}/>
        <StatCard label="Onboarded" value={statusColumnMissing?"--":(leadCounts.onboarded??"--")} color="#15803d" sub={statusColumnMissing?"Run setup SQL above":null}/>
      </div>
    </div>
  );
}
