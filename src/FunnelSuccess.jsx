import { useState, useEffect } from "react";
import { supabase } from "./supabase";

export default function FunnelSuccess({currentUser}){
  const [loading,setLoading]=useState(true);
  const [filterFromDate,setFilterFromDate]=useState(getDefaultFromDate());
  const [filterToDate,setFilterToDate]=useState(new Date().toISOString().split("T")[0]);
  const [filterUser,setFilterUser]=useState("");
  const [users,setUsers]=useState([]);
  const [stats,setStats]=useState({
    visits:0,
    visitsToLeads:0,
    leads:0,
    leadsToProposals:0,
    proposals:0,
    proposalsToWins:0,
    wins:0,
  });

  function getDefaultFromDate(){
    const date=new Date();
    date.setDate(date.getDate()-30);
    return date.toISOString().split("T")[0];
  }

  useEffect(()=>{
    loadUsers();
  },[]);

  useEffect(()=>{
    loadStats();
  },[filterFromDate,filterToDate,filterUser]);

  const loadUsers=async()=>{
    try{
      const {data}=await supabase.from("users").select("*").order("name");
      setUsers(data||[]);
    }catch(err){
      console.error("Error loading users:",err);
    }
  };

  const loadStats=async()=>{
    setLoading(true);
    try{
      // Load visits
      let visitsQ=supabase.from("visits").select("id,created_by").gte("visit_date",filterFromDate).lte("visit_date",filterToDate);
      if(filterUser)visitsQ=visitsQ.eq("created_by",filterUser);
      const {data:visitsData}=await visitsQ;
      const totalVisits=visitsData?.length||0;

      // Load leads
      let leadsQ=supabase.from("leads").select("id,created_by,status").gte("created_at",filterFromDate+"T00:00:00").lte("created_at",filterToDate+"T23:59:59");
      if(filterUser)leadsQ=leadsQ.eq("created_by",filterUser);
      const {data:leadsData}=await leadsQ;
      const totalLeads=leadsData?.length||0;

      // Count leads with proposals
      const leadsWithProposals=leadsData?.filter(l=>l.status==="PROPOSAL_IN_REVIEW"||l.status==="PROPOSAL_APPROVED"||l.status==="MOU_IN_PROGRESS"||l.status==="COMPLETED").length||0;

      // Count proposals (for now, assume proposals exist if lead status indicates it)
      const totalProposals=leadsWithProposals;

      // Count completed (wins)
      const wins=leadsData?.filter(l=>l.status==="COMPLETED").length||0;

      setStats({
        visits:totalVisits,
        visitsToLeads:totalLeads,
        leads:totalLeads,
        leadsToProposals:leadsWithProposals,
        proposals:totalProposals,
        proposalsToWins:wins,
        wins:wins,
      });
    }catch(err){
      console.error("Error loading stats:",err);
    }finally{
      setLoading(false);
    }
  };

  const getPercentage=(current,total)=>{
    if(total===0)return "0%";
    return Math.round((current/total)*100)+"%";
  };

  const StatBox=({label,value,previous,percentage,color})=>(
    <div style={{background:"#fff",borderRadius:10,border:"1px solid #e2e8f0",padding:16}}>
      <div style={{fontSize:11,fontWeight:600,color:"#475569",textTransform:"uppercase",marginBottom:8,letterSpacing:".4px"}}>{label}</div>
      <div style={{display:"flex",alignItems:"flex-end",gap:8,marginBottom:8}}>
        <div style={{fontSize:28,fontWeight:700,color}}>{value}</div>
        {percentage&&<div style={{fontSize:13,fontWeight:600,color:"#64748b",marginBottom:2}}>{percentage}</div>}
      </div>
      {previous!==undefined&&<div style={{fontSize:11,color:"#94a3b8"}}>From {previous}</div>}
    </div>
  );

  return(
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <div>
          <h1 style={{fontSize:20,fontWeight:700,color:"#1e293b",margin:0}}>Funnel Success</h1>
          <p style={{fontSize:13,color:"#64748b",margin:"4px 0 0"}}>Track conversion from visits to closed wins</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{background:"#fff",borderRadius:10,border:"1px solid #e2e8f0",padding:16,marginBottom:20}}>
        <div style={{display:"flex",gap:16,flexWrap:"wrap",alignItems:"flex-end"}}>
          <div>
            <label style={{display:"block",fontSize:11,fontWeight:600,color:"#475569",marginBottom:4,textTransform:"uppercase"}}>From Date</label>
            <input 
              type="date" 
              value={filterFromDate}
              onChange={e=>setFilterFromDate(e.target.value)}
              style={{padding:"6px 8px",borderRadius:6,border:"1px solid #e2e8f0",fontSize:12,fontFamily:"inherit",boxSizing:"border-box"}}
            />
          </div>
          <div>
            <label style={{display:"block",fontSize:11,fontWeight:600,color:"#475569",marginBottom:4,textTransform:"uppercase"}}>To Date</label>
            <input 
              type="date" 
              value={filterToDate}
              onChange={e=>setFilterToDate(e.target.value)}
              style={{padding:"6px 8px",borderRadius:6,border:"1px solid #e2e8f0",fontSize:12,fontFamily:"inherit",boxSizing:"border-box"}}
            />
          </div>
          <div>
            <label style={{display:"block",fontSize:11,fontWeight:600,color:"#475569",marginBottom:4,textTransform:"uppercase"}}>Sales Associate</label>
            <select 
              value={filterUser}
              onChange={e=>setFilterUser(e.target.value)}
              style={{padding:"6px 12px",borderRadius:6,border:"1px solid #e2e8f0",background:"#fff",fontSize:12,fontFamily:"inherit",cursor:"pointer",minWidth:150}}
            >
              <option value="">All Associates</option>
              {users.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Funnel Stats */}
      {loading?
        <div style={{textAlign:"center",padding:40,color:"#94a3b8"}}>Loading analytics...</div>
      :(
        <div>
          {/* Stage 1: Visits */}
          <div style={{marginBottom:24}}>
            <h2 style={{fontSize:14,fontWeight:700,color:"#1e293b",margin:"0 0 12px"}}>Stage 1: Prospect Visits</h2>
            <StatBox label="Total Visits" value={stats.visits} color="#2563eb"/>
          </div>

          {/* Funnel Arrow */}
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{fontSize:24,color:"#cbd5e1"}}>↓</div>
            <div style={{fontSize:11,fontWeight:600,color:"#64748b"}}>Convert to Leads</div>
          </div>

          {/* Stage 2: Visits to Leads Conversion */}
          <div style={{marginBottom:24}}>
            <h2 style={{fontSize:14,fontWeight:700,color:"#1e293b",margin:"0 0 12px"}}>Stage 2: Visits → Leads Conversion</h2>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              <StatBox label="Visits → Leads" value={stats.visitsToLeads} percentage={getPercentage(stats.visitsToLeads,stats.visits)} previous={`${stats.visits} visits`} color="#10b981"/>
              <StatBox label="Conversion Rate" value={getPercentage(stats.visitsToLeads,stats.visits)} color="#10b981"/>
            </div>
          </div>

          {/* Funnel Arrow */}
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{fontSize:24,color:"#cbd5e1"}}>↓</div>
            <div style={{fontSize:11,fontWeight:600,color:"#64748b"}}>Share Proposals</div>
          </div>

          {/* Stage 3: Leads to Proposals */}
          <div style={{marginBottom:24}}>
            <h2 style={{fontSize:14,fontWeight:700,color:"#1e293b",margin:"0 0 12px"}}>Stage 3: Leads → Proposals</h2>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              <StatBox label="Leads w/ Proposals" value={stats.leadsToProposals} percentage={getPercentage(stats.leadsToProposals,stats.leads)} previous={`${stats.leads} leads`} color="#f59e0b"/>
              <StatBox label="Conversion Rate" value={getPercentage(stats.leadsToProposals,stats.leads)} color="#f59e0b"/>
            </div>
          </div>

          {/* Funnel Arrow */}
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{fontSize:24,color:"#cbd5e1"}}>↓</div>
            <div style={{fontSize:11,fontWeight:600,color:"#64748b"}}>Close Deals</div>
          </div>

          {/* Stage 4: Proposals to Wins */}
          <div style={{marginBottom:24}}>
            <h2 style={{fontSize:14,fontWeight:700,color:"#1e293b",margin:"0 0 12px"}}>Stage 4: Proposals → Closed Wins</h2>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              <StatBox label="Closed Wins" value={stats.wins} percentage={getPercentage(stats.wins,stats.leadsToProposals)} previous={`${stats.leadsToProposals} proposals`} color="#8b5cf6"/>
              <StatBox label="Win Rate" value={getPercentage(stats.wins,stats.leadsToProposals)} color="#8b5cf6"/>
            </div>
          </div>

          {/* Overall Funnel */}
          <div style={{background:"#f8fafc",borderRadius:10,border:"1px solid #e2e8f0",padding:20}}>
            <h2 style={{fontSize:14,fontWeight:700,color:"#1e293b",margin:"0 0 16px"}}>Overall Funnel</h2>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:13,fontWeight:600,color:"#2563eb"}}>{stats.visits}</div>
                <div style={{fontSize:10,color:"#64748b",marginTop:4}}>Visits</div>
              </div>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:13,fontWeight:600,color:"#10b981"}}>{stats.leads}</div>
                <div style={{fontSize:10,color:"#64748b",marginTop:4}}>Leads ({getPercentage(stats.leads,stats.visits)})</div>
              </div>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:13,fontWeight:600,color:"#f59e0b"}}>{stats.leadsToProposals}</div>
                <div style={{fontSize:10,color:"#64748b",marginTop:4}}>Proposals ({getPercentage(stats.leadsToProposals,stats.leads)})</div>
              </div>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:13,fontWeight:600,color:"#8b5cf6"}}>{stats.wins}</div>
                <div style={{fontSize:10,color:"#64748b",marginTop:4}}>Wins ({getPercentage(stats.wins,stats.leadsToProposals)})</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
