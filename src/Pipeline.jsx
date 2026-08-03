import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const STATUS_META = {
  LEAD_CREATED:       {label:"Lead Created",       color:"#64748b", bg:"#f1f5f9", step:1},
  MGMT_VETTED:        {label:"Mgmt Vetted",        color:"#2563eb", bg:"#eff6ff", step:2},
  PROPOSAL_IN_REVIEW: {label:"Proposal In Review", color:"#b45309", bg:"#fef3c7", step:3},
  PROPOSAL_APPROVED:  {label:"Proposal Approved",  color:"#15803d", bg:"#f0fdf4", step:4},
  MOU_IN_PROGRESS:    {label:"MOU In Progress",    color:"#7c3aed", bg:"#f5f3ff", step:5},
  COMPLETED:          {label:"Completed",          color:"#15803d", bg:"#f0fdf4", step:6},
  REJECTED:           {label:"Rejected",           color:"#b91c1c", bg:"#fee2e2", step:0},
};

function Badge({status}){
  const m=STATUS_META[status]||STATUS_META.LEAD_CREATED;
  return <span style={{display:"inline-flex",alignItems:"center",padding:"3px 9px",borderRadius:20,fontSize:11,fontWeight:600,whiteSpace:"nowrap",background:m.bg,color:m.color}}>{m.label}</span>;
}

export default function Pipeline({currentUser,onSelectLead,refreshKey}){
  const [leads,setLeads]=useState([]);
  const [loading,setLoading]=useState(true);
  const [filterStatus,setFilterStatus]=useState("ALL");
  const [filterUser,setFilterUser]=useState("");
  const [filterFromDate,setFilterFromDate]=useState("");
  const [filterToDate,setFilterToDate]=useState("");
  const [users,setUsers]=useState([]);

  useEffect(()=>{
    loadLeads();
  },[refreshKey]);

  useEffect(()=>{
    loadUsers();
  },[]);

  const loadLeads=async()=>{
    setLoading(true);
    try{
      let q=supabase.from("leads").select("*, users!leads_created_by_fkey(name,role)").order("created_at",{ascending:false});
      if(currentUser.role!=="Management")q=q.eq("created_by",currentUser.id);
      const {data}=await q;
      setLeads(data||[]);
    }catch(err){
      console.error("Error loading leads:",err);
    }finally{
      setLoading(false);
    }
  };

  const loadUsers=async()=>{
    try{
      const {data}=await supabase.from("users").select("*").order("name");
      setUsers(data||[]);
    }catch(err){
      console.error("Error loading users:",err);
    }
  };

  const filtered=leads.filter(l=>{
    const statusMatch=filterStatus==="ALL"||l.status===filterStatus;
    const userMatch=filterUser===""||l.created_by===filterUser;
    
    let dateMatch=true;
    if(filterFromDate||filterToDate){
      const leadDate=new Date(l.created_at);
      if(filterFromDate){
        const fromDate=new Date(filterFromDate);
        dateMatch=dateMatch&&leadDate>=fromDate;
      }
      if(filterToDate){
        const toDate=new Date(filterToDate);
        toDate.setHours(23,59,59,999);
        dateMatch=dateMatch&&leadDate<=toDate;
      }
    }
    
    return statusMatch&&userMatch&&dateMatch;
  });

  return(
    <div>
      {/* Filters */}
      <div style={{display:"flex",gap:16,marginBottom:20,flexWrap:"wrap",alignItems:"flex-end"}}>
        {/* Status Filters */}
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {["ALL",...Object.keys(STATUS_META)].map(s=>{
            const m=STATUS_META[s];
            const active=filterStatus===s;
            return <button key={s} onClick={()=>setFilterStatus(s)} style={{padding:"5px 12px",borderRadius:20,border:"1px solid",borderColor:active?"#2563eb":"#e2e8f0",background:active?"#2563eb":"#fff",color:active?"#fff":"#64748b",fontSize:11,fontWeight:600,cursor:"pointer",transition:"all .15s"}}>{s==="ALL"?"All":m.label}</button>;
          })}
        </div>

        {/* Date Range Filter */}
        <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
          <div>
            <label style={{display:"block",fontSize:10,fontWeight:600,color:"#475569",marginBottom:4}}>From Date</label>
            <input 
              type="date" 
              value={filterFromDate} 
              onChange={e=>setFilterFromDate(e.target.value)}
              style={{padding:"6px 8px",borderRadius:6,border:"1px solid #e2e8f0",fontSize:12,fontFamily:"inherit",boxSizing:"border-box"}}
            />
          </div>
          <div>
            <label style={{display:"block",fontSize:10,fontWeight:600,color:"#475569",marginBottom:4}}>To Date</label>
            <input 
              type="date" 
              value={filterToDate} 
              onChange={e=>setFilterToDate(e.target.value)}
              style={{padding:"6px 8px",borderRadius:6,border:"1px solid #e2e8f0",fontSize:12,fontFamily:"inherit",boxSizing:"border-box"}}
            />
          </div>
          <button 
            onClick={()=>{}}
            style={{padding:"6px 14px",borderRadius:6,border:"none",background:"#2563eb",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}
          >Go</button>
          {(filterFromDate||filterToDate)&&(
            <button 
              onClick={()=>{setFilterFromDate("");setFilterToDate("");}}
              style={{padding:"6px 14px",borderRadius:6,border:"1px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}
            >Clear</button>
          )}
        </div>

        {/* User Dropdown */}
        <div style={{marginLeft:"auto"}}>
          <label style={{display:"block",fontSize:10,fontWeight:600,color:"#475569",marginBottom:4}}>Filter by User</label>
          <select value={filterUser} onChange={e=>setFilterUser(e.target.value)} style={{padding:"6px 12px",borderRadius:6,border:"1px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",minWidth:150}}>
            <option value="">All Users</option>
            {users.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
      </div>

      {/* Leads Table */}
      {loading?
        <div style={{textAlign:"center",padding:40,color:"#94a3b8"}}>Loading...</div>
      :(
        <div style={{background:"#fff",borderRadius:10,border:"1px solid #e2e8f0"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead>
              <tr>
                {["Institute","Created By","Source","Turnover","Status","Progress","Date"].map(h=>
                  <th key={h} style={{textAlign:"left",padding:"9px 12px",fontSize:11,color:"#64748b",fontWeight:600,textTransform:"uppercase",letterSpacing:".4px",borderBottom:"1px solid #f1f5f9",background:"#fafafa",whiteSpace:"nowrap"}}>{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.length===0?
                <tr><td colSpan={7} style={{textAlign:"center",padding:40,color:"#94a3b8",fontSize:13}}>No leads found.</td></tr>
              :
                filtered.map(l=>(
                  <tr key={l.id} onClick={()=>onSelectLead(l.id)} style={{borderBottom:"1px solid #f8fafc",cursor:"pointer",transition:"background .1s"}} onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background=""}>
                    <td style={{padding:"9px 12px",borderBottom:"1px solid #f9fafb",verticalAlign:"middle",fontSize:13,fontWeight:600,color:"#1e293b"}}>
                      {l.name}
                      {l.legal_name&&l.legal_name!==l.name&&<div style={{fontSize:11,color:"#94a3b8",marginTop:1}}>{l.legal_name}</div>}
                    </td>
                    <td style={{padding:"9px 12px",borderBottom:"1px solid #f9fafb",verticalAlign:"middle",fontSize:13,color:"#64748b"}}>{l.users?.name||"Unknown"}</td>
                    <td style={{padding:"9px 12px",borderBottom:"1px solid #f9fafb",verticalAlign:"middle",fontSize:13}}>
                      {l.source?<span style={{fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:12,background:"#eff6ff",color:"#2563eb"}}>{l.source}</span>:"--"}
                    </td>
                    <td style={{padding:"9px 12px",borderBottom:"1px solid #f9fafb",verticalAlign:"middle",fontSize:13,color:"#64748b"}}>{l.turnover||"--"}</td>
                    <td style={{padding:"9px 12px",borderBottom:"1px solid #f9fafb",verticalAlign:"middle",fontSize:13}}><Badge status={l.status}/></td>
                    <td style={{padding:"9px 12px",borderBottom:"1px solid #f9fafb",verticalAlign:"middle",fontSize:13}}>
                      <div style={{fontSize:10,color:"#64748b"}}>{l.status}</div>
                    </td>
                    <td style={{padding:"9px 12px",borderBottom:"1px solid #f9fafb",verticalAlign:"middle",fontSize:13,color:"#94a3b8"}}>{new Date(l.created_at).toLocaleDateString("en-IN")}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}