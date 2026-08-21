import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import FollowUpsSummary from "./FollowUpsSummary.jsx";


const STATUS_META = {
  LEAD_CREATED:       {label:"Lead Created",       color:"#64748b", bg:"#f1f5f9"},
  MGMT_VETTED:        {label:"Mgmt Vetted",        color:"#2563eb", bg:"#eff6ff"},
  PROPOSAL_IN_REVIEW: {label:"Proposal In Review", color:"#b45309", bg:"#fef3c7"},
  PROPOSAL_APPROVED:  {label:"Proposal Approved",  color:"#15803d", bg:"#f0fdf4"},
  MOU_IN_PROGRESS:    {label:"MOU In Progress",    color:"#7c3aed", bg:"#f5f3ff"},
  COMPLETED:          {label:"Completed",          color:"#15803d", bg:"#f0fdf4"},
  REJECTED:           {label:"Rejected",           color:"#b91c1c", bg:"#fee2e2"},
};

function Badge({status}){
  const m=STATUS_META[status]||STATUS_META.LEAD_CREATED;
  return <span style={{display:"inline-flex",alignItems:"center",padding:"3px 9px",borderRadius:20,fontSize:11,fontWeight:600,whiteSpace:"nowrap",background:m.bg,color:m.color}}>{m.label}</span>;
}

export default function Dashboard({currentUser,onNavigate}){
  const [stats,setStats]=useState({total:0,approved:0,rejected:0,completed:0});
  const [recent,setRecent]=useState([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    loadStats();
  },[]);

  const loadStats=async()=>{
    setLoading(true);
    try{
      // Get all leads
      const {data:allLeads}=await supabase.from("leads").select("status");
      
      // Count by status
      const total=allLeads?.length||0;
      const approved=allLeads?.filter(l=>l.status==="PROPOSAL_APPROVED"||l.status==="MOU_IN_PROGRESS"||l.status==="COMPLETED").length||0;
      const rejected=allLeads?.filter(l=>l.status==="REJECTED").length||0;
      const completed=allLeads?.filter(l=>l.status==="COMPLETED").length||0;

      setStats({total,approved,rejected,completed});

      // Get recent leads
      const {data:recentLeads}=await supabase
        .from("leads")
        .select("id,name,status,created_at,users!leads_created_by_fkey(name)")
        .order("created_at",{ascending:false})
        .limit(5);

      setRecent(recentLeads||[]);
    }catch(err){
      console.error("Error loading stats:",err);
    }finally{
      setLoading(false);
    }
  };

  const StatCard=({label,value,color})=>(
    <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,padding:20,minWidth:180}}>
      <div style={{fontSize:12,color:"#64748b",fontWeight:600,marginBottom:8}}>{label}</div>
      <div style={{fontSize:28,fontWeight:700,color:color}}>{value}</div>
    </div>
  );

  return(
    <div>
      
      {/* Header */}
      <div style={{marginBottom:24}}>
        <h1 style={{fontSize:24,fontWeight:700,color:"#1e293b",margin:0}}>Welcome back, {currentUser.name}!</h1>
        <p style={{fontSize:13,color:"#64748b",margin:"4px 0 0"}}>Here's what's happening with your leads today.</p>
      </div>

      {/* KPI Cards */}
      <div style={{display:"flex",gap:16,marginBottom:24,flexWrap:"wrap"}}>
        <FollowUpsSummary currentUser={currentUser}/>
        <StatCard label="Total Leads" value={stats.total} color="#2563eb"/>
        <StatCard label="Approved" value={stats.approved} color="#10b981"/>
        <StatCard label="Rejected" value={stats.rejected} color="#ef4444"/>
        <StatCard label="Completed" value={stats.completed} color="#8b5cf6"/>
      </div>

      {/* Recent Activity */}
      <div style={{background:"#fff",borderRadius:10,border:"1px solid #e2e8f0",padding:20}}>
        <h2 style={{fontSize:16,fontWeight:700,color:"#1e293b",margin:"0 0 16px"}}>Recent Leads</h2>
        
        {loading?(
          <div style={{textAlign:"center",padding:40,color:"#94a3b8"}}>Loading...</div>
        ):recent.length===0?(
          <div style={{textAlign:"center",padding:40,color:"#94a3b8"}}>No leads yet</div>
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

        <div style={{marginTop:16,paddingTop:16,borderTop:"1px solid #f1f5f9"}}>
          <button onClick={()=>onNavigate("pipeline")} style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:6,padding:"8px 16px",fontSize:13,fontWeight:600,cursor:"pointer"}}>View All Leads →</button>
        </div>
      </div>
    </div>
  );
}
