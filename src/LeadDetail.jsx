import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import ActivityLog from "./ActivityLog.jsx";

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
  return <span style={{display:"inline-flex",alignItems:"center",padding:"4px 10px",borderRadius:20,fontSize:11,fontWeight:600,whiteSpace:"nowrap",background:m.bg,color:m.color}}>{m.label}</span>;
}

function extractDomain(url){
  if(!url)return null;
  try{
    const urlObj=new URL(url);
    return urlObj.hostname.replace(/^www\./,"");
  }catch{
    return url;
  }
}

export default function LeadDetail({leadId,currentUser,onBack,onNavigate,onRefresh}){
  const [lead,setLead]=useState(null);
  const [loading,setLoading]=useState(true);
  const [showRejectModal,setShowRejectModal]=useState(false);
  const [rejectionReason,setRejectionReason]=useState("");
  const [rejecting,setRejecting]=useState(false);

  useEffect(()=>{
    loadLead();
  },[leadId]);

  const loadLead=async()=>{
    setLoading(true);
    try{
      const {data}=await supabase.from("leads").select("*, users!leads_created_by_fkey(name,email,role)").eq("id",leadId).single();
      setLead(data);
    }catch(err){
      console.error("Error loading lead:",err);
    }finally{
      setLoading(false);
    }
  };

  const approveLead=async()=>{
    try{
      const {error}=await supabase.from("leads").update({
        status:"MGMT_VETTED",
      }).eq("id",leadId);

      if(error)throw error;

      setLead({...lead,status:"MGMT_VETTED"});

      if(onRefresh)onRefresh();
    }catch(err){
      console.error("Error approving lead:",err);
      alert("Failed to approve lead");
    }
  };

  const rejectLead=async()=>{
    if(!rejectionReason.trim()){
      alert("Please enter rejection reason");
      return;
    }

    setRejecting(true);
    try{
      const {error}=await supabase.from("leads").update({
        status:"REJECTED",
        rejection_reason:rejectionReason,
        rejected_at:new Date().toISOString(),
        rejected_by:currentUser.id,
      }).eq("id",leadId);

      if(error)throw error;

      if(onRefresh)onRefresh();

      setTimeout(()=>onBack(),500);
    }catch(err){
      console.error("Error rejecting lead:",err);
      alert("Failed to reject lead");
    }finally{
      setRejecting(false);
    }
  };

  if(loading)return <div style={{padding:20,textAlign:"center",color:"#94a3b8"}}>Loading...</div>;
  if(!lead)return <div style={{padding:20,color:"#ef4444"}}>Lead not found</div>;

  const isManagement=currentUser.role==="Management";

  return(
    <div>
      {/* Header */}
      <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",color:"#2563eb",fontSize:13,marginBottom:16,display:"flex",alignItems:"center",gap:4,padding:0,fontFamily:"inherit"}}>← Back to Pipeline</button>

      <div style={{background:"#fff",borderRadius:10,border:"1px solid #e2e8f0",padding:24}}>
        {/* Title and Status */}
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:24}}>
          <div>
            <h1 style={{fontSize:24,fontWeight:700,color:"#1e293b",margin:"0 0 8px"}}>{lead.name}</h1>
            {lead.legal_name&&lead.legal_name!==lead.name&&<p style={{fontSize:13,color:"#64748b",margin:0}}>Legal: {lead.legal_name}</p>}
          </div>
          <Badge status={lead.status}/>
        </div>

        {/* Lead Info Grid */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24,marginBottom:24}}>
          {/* Left Column */}
          <div>
            <div style={{marginBottom:16}}>
              <label style={{fontSize:10,fontWeight:600,color:"#475569",textTransform:"uppercase",letterSpacing:".4px"}}>Organization Type</label>
              <p style={{fontSize:14,fontWeight:600,color:"#1e293b",margin:"4px 0 0"}}>{lead.org_type||"--"}</p>
            </div>

            <div style={{marginBottom:16}}>
              <label style={{fontSize:10,fontWeight:600,color:"#475569",textTransform:"uppercase",letterSpacing:".4px"}}>Industry</label>
              <p style={{fontSize:14,fontWeight:600,color:"#1e293b",margin:"4px 0 0"}}>{lead.industry||"--"}</p>
            </div>

            <div style={{marginBottom:16}}>
              <label style={{fontSize:10,fontWeight:600,color:"#475569",textTransform:"uppercase",letterSpacing:".4px"}}>Website</label>
              {lead.website?<a href={lead.website} target="_blank" rel="noopener noreferrer" style={{fontSize:13,color:"#2563eb",textDecoration:"none",margin:"4px 0 0"}}>{extractDomain(lead.website)} →</a>:<p style={{fontSize:14,color:"#1e293b",margin:"4px 0 0"}}>--</p>}
            </div>

            <div style={{marginBottom:16}}>
              <label style={{fontSize:10,fontWeight:600,color:"#475569",textTransform:"uppercase",letterSpacing:".4px"}}>Source</label>
              <p style={{fontSize:14,fontWeight:600,color:"#1e293b",margin:"4px 0 0"}}>{lead.source||"--"}</p>
            </div>

            <div style={{marginBottom:16}}>
              <label style={{fontSize:10,fontWeight:600,color:"#475569",textTransform:"uppercase",letterSpacing:".4px"}}>Contact Person</label>
              <p style={{fontSize:14,fontWeight:600,color:"#1e293b",margin:"4px 0 0"}}>{lead.contact_name||"--"}</p>
              {lead.contact_email&&<p style={{fontSize:12,color:"#64748b",margin:"2px 0 0"}}>{lead.contact_email}</p>}
              {lead.contact_phone&&<p style={{fontSize:12,color:"#64748b",margin:"2px 0 0"}}>{lead.contact_phone}</p>}
            </div>
          </div>

          {/* Right Column */}
          <div>
            <div style={{marginBottom:16}}>
              <label style={{fontSize:10,fontWeight:600,color:"#475569",textTransform:"uppercase",letterSpacing:".4px"}}>Turnover</label>
              <p style={{fontSize:14,fontWeight:600,color:"#1e293b",margin:"4px 0 0"}}>{lead.turnover||"--"}</p>
            </div>

            <div style={{marginBottom:16}}>
              <label style={{fontSize:10,fontWeight:600,color:"#475569",textTransform:"uppercase",letterSpacing:".4px"}}>Number of Students</label>
              <p style={{fontSize:14,fontWeight:600,color:"#1e293b",margin:"4px 0 0"}}>{lead.num_students||"--"}</p>
            </div>

            <div style={{marginBottom:16}}>
              <label style={{fontSize:10,fontWeight:600,color:"#475569",textTransform:"uppercase",letterSpacing:".4px"}}>State</label>
              <p style={{fontSize:14,fontWeight:600,color:"#1e293b",margin:"4px 0 0"}}>{lead.state||"--"}</p>
            </div>

            <div style={{marginBottom:16}}>
              <label style={{fontSize:10,fontWeight:600,color:"#475569",textTransform:"uppercase",letterSpacing:".4px"}}>Created By</label>
              <p style={{fontSize:14,fontWeight:600,color:"#1e293b",margin:"4px 0 0"}}>{lead.users?.name||"Unknown"}</p>
              {lead.users?.email&&<p style={{fontSize:12,color:"#64748b",margin:"2px 0 0"}}>{lead.users.email}</p>}
            </div>

            <div style={{marginBottom:16}}>
              <label style={{fontSize:10,fontWeight:600,color:"#475569",textTransform:"uppercase",letterSpacing:".4px"}}>Created On</label>
              <p style={{fontSize:14,fontWeight:600,color:"#1e293b",margin:"4px 0 0"}}>{new Date(lead.created_at).toLocaleDateString("en-IN")}</p>
            </div>
          </div>
        </div>

        {/* Notes */}
        {lead.notes&&(
          <div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:8,padding:16,marginBottom:24}}>
            <label style={{fontSize:10,fontWeight:600,color:"#475569",textTransform:"uppercase",letterSpacing:".4px",display:"block",marginBottom:8}}>Notes</label>
            <p style={{fontSize:13,color:"#1e293b",margin:0,whiteSpace:"pre-wrap"}}>{lead.notes}</p>
          </div>
        )}

        {/* Rejection Reason (if rejected) */}
        {lead.status==="REJECTED"&&lead.rejection_reason&&(
          <div style={{background:"#fee2e2",border:"1px solid #fca5a5",borderRadius:8,padding:16,marginBottom:24}}>
            <label style={{fontSize:10,fontWeight:600,color:"#991b1b",textTransform:"uppercase",letterSpacing:".4px",display:"block",marginBottom:8}}>Rejection Reason</label>
            <p style={{fontSize:13,color:"#991b1b",margin:0,whiteSpace:"pre-wrap"}}>{lead.rejection_reason}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{display:"flex",gap:12,paddingTop:20,borderTop:"1px solid #e2e8f0",flexWrap:"wrap"}}>
          {isManagement&&(
            <>
              {/* Show Approve button only if LEAD_CREATED */}
              {lead.status==="LEAD_CREATED"&&(
                <button 
                  onClick={approveLead}
                  style={{background:"#10b981",color:"#fff",border:"none",borderRadius:6,padding:"10px 20px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}
                >✓ Approve Lead</button>
              )}

              {/* Show Create Proposal if not rejected/completed */}
              {lead.status!=="REJECTED"&&lead.status!=="COMPLETED"&&(
                <button 
                  onClick={()=>onNavigate("proposal",{leadId:lead.id})}
                  style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:6,padding:"10px 20px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}
                >+ Create Proposal</button>
              )}

              {/* Show Reject button if not already rejected/completed */}
              {lead.status!=="REJECTED"&&lead.status!=="COMPLETED"&&(
                <button 
                  onClick={()=>setShowRejectModal(true)}
                  style={{background:"#fee2e2",color:"#b91c1c",border:"none",borderRadius:6,padding:"10px 20px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}
                >Reject Lead</button>
              )}
            </>
          )}
          <button 
            onClick={onBack}
            style={{background:"#fff",color:"#475569",border:"1px solid #e2e8f0",borderRadius:6,padding:"10px 20px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",marginLeft:"auto"}}
          >Close</button>
        </div>
      </div>

      {/* Activity Log */}
      <div style={{marginTop:24}}>
        <ActivityLog type="lead" recordId={lead.id} currentUser={currentUser}/>
      </div>

      {/* Rejection Modal */}
      {showRejectModal&&(
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}}>
          <div style={{background:"#fff",borderRadius:10,padding:24,maxWidth:400,width:"90%",boxShadow:"0 10px 25px rgba(0,0,0,0.2)"}}>
            <h2 style={{fontSize:16,fontWeight:700,color:"#1e293b",margin:"0 0 16px"}}>Reject Lead</h2>
            <p style={{fontSize:13,color:"#64748b",margin:"0 0 16px"}}>Are you sure you want to reject this lead? Please provide a reason.</p>
            
            <textarea 
              value={rejectionReason}
              onChange={e=>setRejectionReason(e.target.value)}
              placeholder="Rejection reason..."
              style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:6,padding:"12px",fontSize:13,fontFamily:"inherit",boxSizing:"border-box",minHeight:80,marginBottom:16,outline:"none"}}
            />

            <div style={{display:"flex",gap:12}}>
              <button 
                onClick={rejectLead}
                disabled={rejecting}
                style={{flex:1,background:"#ef4444",color:"#fff",border:"none",borderRadius:6,padding:"10px",fontSize:13,fontWeight:600,cursor:rejecting?"not-allowed":"pointer",opacity:rejecting?0.5:1,fontFamily:"inherit"}}
              >{rejecting?"Rejecting...":"Confirm Rejection"}</button>
              <button 
                onClick={()=>{setShowRejectModal(false);setRejectionReason("");}}
                style={{flex:1,background:"#fff",color:"#475569",border:"1px solid #e2e8f0",borderRadius:6,padding:"10px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}
              >Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
