import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { exportToCSV } from "./exportUtils.js";

export default function LeadsReport({currentUser}){
  const [leads,setLeads]=useState([]);
  const [loading,setLoading]=useState(true);
  const [users,setUsers]=useState([]);
  const [filterAssociate,setFilterAssociate]=useState("");
  const [filterFromDate,setFilterFromDate]=useState(getDefaultFromDate());
  const [filterToDate,setFilterToDate]=useState(new Date().toISOString().split("T")[0]);
  const [filterType,setFilterType]=useState("");
  const [leadTypes,setLeadTypes]=useState([]);
  const [error,setError]=useState("");

  function getDefaultFromDate(){
    const date=new Date();
    date.setDate(date.getDate()-30);
    return date.toISOString().split("T")[0];
  }

  useEffect(()=>{
    loadInitialData();
  },[]);

  useEffect(()=>{
    loadLeads();
  },[filterAssociate,filterFromDate,filterToDate,filterType]);

  const loadInitialData=async()=>{
    try{
      // Load users
      const {data:usersData}=await supabase.from("users").select("id,name").order("name");
      if(usersData)setUsers(usersData);

      setLeadTypes(["K-12", "Higher Ed", "Upskilling", "Study Abroad", "Channel Partner"]);
    }catch(err){
      console.error("Error loading initial data:",err);
    }
  };

  const loadLeads=async()=>{
    setLoading(true);
    setError("");
    try{
      let query=supabase.from("leads").select("id,name,created_at,created_by,users!leads_created_by_fkey(name),status").order("created_at",{ascending:false});
      
      if(filterAssociate){
        query=query.eq("created_by",filterAssociate);
      }

      const {data,error:err}=await query;

      if(err){
        console.error("Supabase error:",err);
        setError("Failed to load leads: "+err.message);
        setLeads([]);
        return;
      }

      if(!data){
        setLeads([]);
        return;
      }

      // Filter by type and date in JavaScript
      let filtered=data;
      
      if(filterType){
        // Since org_type doesn't exist, we'll filter by industry or skip this for now
        // filtered=filtered.filter(l=>l.industry===filterType);
      }
      
      if(filterFromDate){
        const fromDate=new Date(filterFromDate);
        filtered=filtered.filter(l=>{
          const leadDate=new Date(l.created_at);
          return leadDate>=fromDate;
        });
      }
      if(filterToDate){
        const toDate=new Date(filterToDate);
        toDate.setHours(23,59,59,999);
        filtered=filtered.filter(l=>{
          const leadDate=new Date(l.created_at);
          return leadDate<=toDate;
        });
      }

      setLeads(filtered);
    }catch(err){
      console.error("Error in loadLeads:",err);
      setError("Error: "+err.message);
      setLeads([]);
    }finally{
      setLoading(false);
    }
  };

  const handleExport=()=>{
    // Format data for export
    const exportData=leads.map(lead=>({
      "Lead Name":lead.name,
      "Associate":lead.users?.name||"--",
      "Created Date":new Date(lead.created_at).toLocaleDateString("en-IN"),
      "Status":lead.status||"UNKNOWN"
    }));
    
    exportToCSV(exportData,"Leads_Report");
  };

  const STATUS_COLORS={
    "LEAD_CREATED":"#64748b",
    "MGMT_VETTED":"#2563eb",
    "PROPOSAL_IN_REVIEW":"#b45309",
    "PROPOSAL_APPROVED":"#15803d",
    "MOU_IN_PROGRESS":"#7c3aed",
    "COMPLETED":"#15803d",
    "REJECTED":"#b91c1c",
  };

  return(
    <div>
      {error&&<div style={{background:"#fee2e2",border:"1px solid #fca5a5",borderRadius:8,padding:12,marginBottom:16,color:"#b91c1c",fontSize:12}}>⚠️ {error}</div>}

      {/* Export Button */}
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
        <button 
          onClick={handleExport}
          disabled={leads.length===0}
          style={{background:"#059669",color:"#fff",border:"none",borderRadius:6,padding:"10px 20px",fontSize:13,fontWeight:600,cursor:leads.length===0?"not-allowed":"pointer",opacity:leads.length===0?0.5:1,fontFamily:"inherit",display:"flex",alignItems:"center",gap:8}}
        >
          📥 Export to CSV
        </button>
      </div>

      {/* Filters */}
      <div style={{background:"#fff",borderRadius:10,border:"1px solid #e2e8f0",padding:16,marginBottom:20}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,alignItems:"flex-end",flexWrap:"wrap"}}>
          <div>
            <label style={{display:"block",fontSize:11,fontWeight:600,color:"#475569",marginBottom:4,textTransform:"uppercase"}}>Associate</label>
            <select 
              value={filterAssociate}
              onChange={e=>setFilterAssociate(e.target.value)}
              style={{width:"100%",padding:"8px 10px",borderRadius:6,border:"1px solid #e2e8f0",fontSize:12,fontFamily:"inherit",boxSizing:"border-box"}}
            >
              <option value="">All Associates</option>
              {users.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>

          <div>
            <label style={{display:"block",fontSize:11,fontWeight:600,color:"#475569",marginBottom:4,textTransform:"uppercase"}}>From Date</label>
            <input 
              type="date" 
              value={filterFromDate}
              onChange={e=>setFilterFromDate(e.target.value)}
              style={{width:"100%",padding:"8px 10px",borderRadius:6,border:"1px solid #e2e8f0",fontSize:12,fontFamily:"inherit",boxSizing:"border-box"}}
            />
          </div>

          <div>
            <label style={{display:"block",fontSize:11,fontWeight:600,color:"#475569",marginBottom:4,textTransform:"uppercase"}}>To Date</label>
            <input 
              type="date" 
              value={filterToDate}
              onChange={e=>setFilterToDate(e.target.value)}
              style={{width:"100%",padding:"8px 10px",borderRadius:6,border:"1px solid #e2e8f0",fontSize:12,fontFamily:"inherit",boxSizing:"border-box"}}
            />
          </div>
        </div>
      </div>

      {/* Leads Table */}
      {loading?
        <div style={{textAlign:"center",padding:40,color:"#94a3b8"}}>📊 Loading leads...</div>
      :(
        <div style={{background:"#fff",borderRadius:10,border:"1px solid #e2e8f0",overflow:"hidden"}}>
          {leads.length===0?
            <div style={{textAlign:"center",padding:40,color:"#94a3b8"}}>No leads found for the selected filters</div>
          :(
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead>
                <tr style={{background:"#f8fafc",borderBottom:"1px solid #e2e8f0"}}>
                  <th style={{padding:"12px 16px",textAlign:"left",fontSize:11,fontWeight:600,color:"#475569",textTransform:"uppercase"}}>Lead Name</th>
                  <th style={{padding:"12px 16px",textAlign:"left",fontSize:11,fontWeight:600,color:"#475569",textTransform:"uppercase"}}>Associate</th>
                  <th style={{padding:"12px 16px",textAlign:"left",fontSize:11,fontWeight:600,color:"#475569",textTransform:"uppercase"}}>Created Date</th>
                  <th style={{padding:"12px 16px",textAlign:"left",fontSize:11,fontWeight:600,color:"#475569",textTransform:"uppercase"}}>Status</th>
                </tr>
              </thead>
              <tbody>
                {leads.map(lead=>(
                  <tr key={lead.id} style={{borderBottom:"1px solid #e2e8f0"}}>
                    <td style={{padding:"12px 16px",fontSize:13,color:"#1e293b",fontWeight:500}}>{lead.name}</td>
                    <td style={{padding:"12px 16px",fontSize:13,color:"#1e293b"}}>{lead.users?.name||"--"}</td>
                    <td style={{padding:"12px 16px",fontSize:13,color:"#1e293b"}}>{new Date(lead.created_at).toLocaleDateString("en-IN")}</td>
                    <td style={{padding:"12px 16px"}}>
                      <span style={{display:"inline-block",padding:"4px 10px",borderRadius:6,fontSize:10,fontWeight:600,color:"#fff",background:STATUS_COLORS[lead.status]||"#64748b"}}>
                        {lead.status||"UNKNOWN"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <div style={{marginTop:16,fontSize:12,color:"#64748b"}}>
        📈 Total: {leads.length} leads
      </div>
    </div>
  );
}
