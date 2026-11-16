import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import FollowUpsSummary from "./FollowUpsSummary.jsx";


const STATUS_META = {
  LEAD_CREATED:     {label:"Lead Created",    color:"#64748b", bg:"#f1f5f9"},
  DOCS_REQUESTED:   {label:"Docs Requested",  color:"#0891b2", bg:"#ecfeff"},
  MGMT_VETTED:      {label:"Demo Booked",     color:"#2563eb", bg:"#eff6ff"},
  PROPOSAL_SHARED:  {label:"Proposal Shared", color:"#b45309", bg:"#fef3c7"},
  MOU_IN_PROGRESS:  {label:"MOU In Progress", color:"#7c3aed", bg:"#f5f3ff"},
  COMPLETED:        {label:"Onboarded",       color:"#15803d", bg:"#f0fdf4"},
  REJECTED:         {label:"Rejected",        color:"#b91c1c", bg:"#fee2e2"},
  COLD:             {label:"Cold",            color:"#334155", bg:"#e2e8f0"},
};

function Badge({status}){
  const m=STATUS_META[status]||STATUS_META.LEAD_CREATED;
  return <span style={{display:"inline-flex",alignItems:"center",padding:"3px 9px",borderRadius:20,fontSize:11,fontWeight:600,whiteSpace:"nowrap",background:m.bg,color:m.color}}>{m.label}</span>;
}

const PAGE_SIZE = 20;

const PERIODS = [
  {id:"ytd",       label:"Current YTD"},
  {id:"mtd",       label:"Current MTD"},
  {id:"lastMonth", label:"Last Month"},
  {id:"lastWeek",  label:"Last Week"},
];

// Returns {start, end}; end is exclusive and null for periods that run up to now. Weeks run Monday-Sunday.
function getPeriodRange(period){
  const now=new Date();
  if(period==="ytd")return {start:new Date(now.getFullYear(),0,1),end:null};
  if(period==="mtd")return {start:new Date(now.getFullYear(),now.getMonth(),1),end:null};
  if(period==="lastMonth")return {start:new Date(now.getFullYear(),now.getMonth()-1,1),end:new Date(now.getFullYear(),now.getMonth(),1)};
  const daysSinceMonday=(now.getDay()+6)%7;
  const thisMonday=new Date(now.getFullYear(),now.getMonth(),now.getDate()-daysSinceMonday);
  const lastMonday=new Date(thisMonday.getFullYear(),thisMonday.getMonth(),thisMonday.getDate()-7);
  return {start:lastMonday,end:thisMonday};
}

function formatRange({start,end}){
  const fmt=d=>d.toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});
  const last=end?new Date(end.getFullYear(),end.getMonth(),end.getDate()-1):new Date();
  return `${fmt(start)} – ${fmt(last)}`;
}

export default function Dashboard({currentUser,onNavigate}){
  const [stats,setStats]=useState({total:0,approved:0,rejected:0,completed:0});
  const [recent,setRecent]=useState([]);
  const [loading,setLoading]=useState(true);
  const [period,setPeriod]=useState("ytd");
  const [filterUser,setFilterUser]=useState("");
  const isMgmt=currentUser.role==="Management";
  const activeUser=isMgmt?filterUser:currentUser.id;
  const [users,setUsers]=useState([]);
  const [page,setPage]=useState(1);
  const [totalCount,setTotalCount]=useState(0);

  useEffect(()=>{
    supabase.from("users").select("id,name").order("name").then(({data})=>setUsers(data||[]));
  },[]);

  const applyFilters=q=>{
    const {start,end}=getPeriodRange(period);
    q=q.gte("created_at",start.toISOString());
    if(end)q=q.lt("created_at",end.toISOString());
    if(activeUser)q=q.eq("created_by",activeUser);
    return q;
  };

  const changePeriod=id=>{setPeriod(id);setPage(1);};
  const changeUser=id=>{setFilterUser(id);setPage(1);};

  useEffect(()=>{
    let cancelled=false;
    (async()=>{
      try{
        const {data:allLeads}=await applyFilters(supabase.from("leads").select("status"));
        if(cancelled)return;
        const total=allLeads?.length||0;
        const approved=allLeads?.filter(l=>l.status==="PROPOSAL_SHARED"||l.status==="MOU_IN_PROGRESS"||l.status==="COMPLETED").length||0;
        const rejected=allLeads?.filter(l=>l.status==="REJECTED").length||0;
        const completed=allLeads?.filter(l=>l.status==="COMPLETED").length||0;
        setStats({total,approved,rejected,completed});
      }catch(err){
        console.error("Error loading stats:",err);
      }
    })();
    return()=>{cancelled=true;};
  },[period,activeUser]);

  useEffect(()=>{
    let cancelled=false;
    (async()=>{
      setLoading(true);
      try{
        const from=(page-1)*PAGE_SIZE;
        const {data,count}=await applyFilters(
          supabase.from("leads").select("id,name,status,created_at,users!leads_created_by_fkey(name)",{count:"exact"})
        ).order("created_at",{ascending:false}).range(from,from+PAGE_SIZE-1);
        if(cancelled)return;
        setRecent(data||[]);
        setTotalCount(count||0);
      }catch(err){
        console.error("Error loading leads:",err);
      }finally{
        if(!cancelled)setLoading(false);
      }
    })();
    return()=>{cancelled=true;};
  },[period,activeUser,page]);

  const totalPages=Math.max(1,Math.ceil(totalCount/PAGE_SIZE));

  const StatCard=({label,value,color})=>(
    <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,padding:20,minWidth:180}}>
      <div style={{fontSize:12,color:"#64748b",fontWeight:600,marginBottom:8}}>{label}</div>
      <div style={{fontSize:28,fontWeight:700,color:color}}>{value}</div>
    </div>
  );

  return(
    <div>
      
      {/* Header */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:16,flexWrap:"wrap",marginBottom:20}}>
        <div>
          <h1 style={{fontSize:24,fontWeight:700,color:"#1e293b",margin:0}}>Welcome back, {currentUser.name}!</h1>
          <p style={{fontSize:13,color:"#64748b",margin:"4px 0 0"}}>Here's what's happening with {!isMgmt?"your":filterUser?`${users.find(u=>u.id===filterUser)?.name||"this user"}'s`:"your team's"} leads.</p>
        </div>
        {isMgmt&&<div>
          <label style={{display:"block",fontSize:10,fontWeight:600,color:"#475569",marginBottom:4}}>Filter by User</label>
          <select value={filterUser} onChange={e=>changeUser(e.target.value)} style={{padding:"6px 12px",borderRadius:6,border:"1px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",minWidth:160}}>
            <option value="">All Users</option>
            {users.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>}
      </div>

      {/* Period Tabs */}
      <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap",marginBottom:20}}>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {PERIODS.map(p=>{
            const active=period===p.id;
            return <button key={p.id} onClick={()=>changePeriod(p.id)} style={{padding:"6px 16px",borderRadius:20,border:"1px solid",borderColor:active?"#2563eb":"#e2e8f0",background:active?"#2563eb":"#fff",color:active?"#fff":"#64748b",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>{p.label}</button>;
          })}
        </div>
        <span style={{fontSize:12,color:"#94a3b8"}}>{formatRange(getPeriodRange(period))}</span>
      </div>

      {/* KPI Cards */}
      <div style={{display:"flex",gap:16,marginBottom:24,flexWrap:"wrap"}}>
        <FollowUpsSummary currentUser={currentUser} userId={activeUser}/>
        <StatCard label="Total Leads" value={stats.total} color="#2563eb"/>
        <StatCard label="Approved" value={stats.approved} color="#10b981"/>
        <StatCard label="Rejected" value={stats.rejected} color="#ef4444"/>
        <StatCard label="Onboarded" value={stats.completed} color="#8b5cf6"/>
      </div>

      {/* Recent Activity */}
      <div style={{background:"#fff",borderRadius:10,border:"1px solid #e2e8f0",padding:20}}>
        <h2 style={{fontSize:16,fontWeight:700,color:"#1e293b",margin:"0 0 16px"}}>All Leads <span style={{fontSize:12,fontWeight:500,color:"#94a3b8"}}>({totalCount})</span></h2>
        
        {loading?(
          <div style={{textAlign:"center",padding:40,color:"#94a3b8"}}>Loading...</div>
        ):recent.length===0?(
          <div style={{textAlign:"center",padding:40,color:"#94a3b8"}}>No leads in this period</div>
        ):(
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr style={{borderBottom:"1px solid #f1f5f9"}}>
                <th style={{textAlign:"left",padding:"8px 0",fontSize:11,fontWeight:600,color:"#64748b",textTransform:"uppercase",letterSpacing:".4px"}}>Lead</th>
                <th style={{textAlign:"left",padding:"8px 0",fontSize:11,fontWeight:600,color:"#64748b",textTransform:"uppercase",letterSpacing:".4px"}}>Status</th>
                <th style={{textAlign:"left",padding:"8px 0",fontSize:11,fontWeight:600,color:"#64748b",textTransform:"uppercase",letterSpacing:".4px"}}>Created By</th>
                <th style={{textAlign:"left",padding:"8px 0",fontSize:11,fontWeight:600,color:"#64748b",textTransform:"uppercase",letterSpacing:".4px"}}>Date</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(lead=>(
                <tr key={lead.id} style={{borderBottom:"1px solid #f9fafb",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background=""}>
                  <td style={{padding:"12px 0",fontSize:13,fontWeight:500,color:"#1e293b"}}>{lead.name}</td>
                  <td style={{padding:"12px 0",fontSize:13}}><Badge status={lead.status}/></td>
                  <td style={{padding:"12px 0",fontSize:13,color:"#64748b"}}>{lead.users?.name||"Unknown"}</td>
                  <td style={{padding:"12px 0",fontSize:12,color:"#94a3b8"}}>{new Date(lead.created_at).toLocaleDateString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {totalCount>0&&(
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:16,paddingTop:16,borderTop:"1px solid #f1f5f9",fontSize:12,color:"#64748b"}}>
            <span>Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE,totalCount)} of {totalCount}</span>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <button onClick={()=>setPage(p=>p-1)} disabled={page<=1} style={{padding:"5px 12px",borderRadius:6,border:"1px solid #e2e8f0",background:"#fff",color:"#475569",fontSize:12,fontWeight:600,cursor:page<=1?"not-allowed":"pointer",opacity:page<=1?0.5:1,fontFamily:"inherit"}}>← Prev</button>
              <span>Page {page} of {totalPages}</span>
              <button onClick={()=>setPage(p=>p+1)} disabled={page>=totalPages} style={{padding:"5px 12px",borderRadius:6,border:"1px solid #e2e8f0",background:"#fff",color:"#475569",fontSize:12,fontWeight:600,cursor:page>=totalPages?"not-allowed":"pointer",opacity:page>=totalPages?0.5:1,fontFamily:"inherit"}}>Next →</button>
            </div>
          </div>
        )}

        <div style={{marginTop:16,paddingTop:16,borderTop:"1px solid #f1f5f9"}}>
          <button onClick={()=>onNavigate("pipeline")} style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:6,padding:"8px 16px",fontSize:13,fontWeight:600,cursor:"pointer"}}>View All Leads →</button>
        </div>
      </div>
    </div>
  );
}
