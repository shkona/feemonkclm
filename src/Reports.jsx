import { useState } from "react";
import LeadsReport from "./LeadsReport.jsx";
import ProspectsReport from "./ProspectsReport.jsx";
import StageMovementReport from "./StageMovementReport.jsx";

export default function Reports({currentUser}){
  const [activeTab,setActiveTab]=useState("leads");

  return(
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <div>
          <h1 style={{fontSize:20,fontWeight:700,color:"#1e293b",margin:0}}>Reports</h1>
          <p style={{fontSize:13,color:"#64748b",margin:"4px 0 0"}}>View and analyze leads and prospects</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{display:"flex",gap:4,marginBottom:20,borderBottom:"1px solid #e2e8f0"}}>
        <button 
          onClick={()=>setActiveTab("leads")}
          style={{padding:"12px 20px",border:"none",background:"none",cursor:"pointer",borderBottom:activeTab==="leads"?"2px solid #2563eb":"none",color:activeTab==="leads"?"#2563eb":"#64748b",fontWeight:600,fontSize:13,fontFamily:"inherit"}}
        >Leads</button>
        <button 
          onClick={()=>setActiveTab("prospects")}
          style={{padding:"12px 20px",border:"none",background:"none",cursor:"pointer",borderBottom:activeTab==="prospects"?"2px solid #2563eb":"none",color:activeTab==="prospects"?"#2563eb":"#64748b",fontWeight:600,fontSize:13,fontFamily:"inherit"}}
        >Prospects</button>
        <button
          onClick={()=>setActiveTab("movement")}
          style={{padding:"12px 20px",border:"none",background:"none",cursor:"pointer",borderBottom:activeTab==="movement"?"2px solid #2563eb":"none",color:activeTab==="movement"?"#2563eb":"#64748b",fontWeight:600,fontSize:13,fontFamily:"inherit"}}
        >Stage Movement</button>
      </div>

      {/* Tab Content */}
      {activeTab==="leads"&&<LeadsReport currentUser={currentUser}/>}
      {activeTab==="prospects"&&<ProspectsReport currentUser={currentUser}/>}
      {activeTab==="movement"&&<StageMovementReport currentUser={currentUser}/>}
    </div>
  );
}
