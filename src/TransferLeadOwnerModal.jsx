import { useState, useEffect } from "react";
import { supabase } from "./supabase";

export default function TransferLeadOwnerModal({leadId,currentOwner,onClose,onSuccess}){
  const [users,setUsers]=useState([]);
  const [selectedUserId,setSelectedUserId]=useState(currentOwner);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");

  useEffect(()=>{
    loadUsers();
  },[]);

  const loadUsers=async()=>{
    try{
      const {data}=await supabase.from("users").select("id,name,role").order("name");
      setUsers(data||[]);
    }catch(err){
      console.error("Error loading users:",err);
    }
  };

  const handleTransfer=async()=>{
    if(selectedUserId===currentOwner){
      setError("Please select a different owner");
      return;
    }

    setSaving(true);
    setError("");
    try{
      const {error:err}=await supabase.from("leads").update({
        created_by:selectedUserId,
      }).eq("id",leadId);

      if(err)throw err;

      onSuccess();
      onClose();
    }catch(err){
      console.error("Error transferring lead:",err);
      setError(err.message||"Failed to transfer lead");
    }finally{
      setSaving(false);
    }
  };

  return(
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}}>
      <div style={{background:"#fff",borderRadius:10,padding:24,maxWidth:400,width:"90%",boxShadow:"0 10px 25px rgba(0,0,0,0.2)"}}>
        <h2 style={{fontSize:16,fontWeight:700,color:"#1e293b",margin:"0 0 16px"}}>Transfer Lead Ownership</h2>
        
        {error&&<div style={{background:"#fee2e2",border:"1px solid #fca5a5",borderRadius:6,padding:10,marginBottom:16,color:"#b91c1c",fontSize:12}}>{error}</div>}

        <div style={{marginBottom:20}}>
          <label style={{display:"block",fontSize:12,fontWeight:600,color:"#475569",marginBottom:8}}>Select New Owner</label>
          <select 
            value={selectedUserId}
            onChange={e=>setSelectedUserId(e.target.value)}
            style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:6,padding:"10px",fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none"}}
          >
            <option value="">-- Select Owner --</option>
            {users.map(u=><option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
          </select>
        </div>

        <div style={{display:"flex",gap:12}}>
          <button 
            onClick={handleTransfer}
            disabled={saving||!selectedUserId}
            style={{flex:1,background:"#2563eb",color:"#fff",border:"none",borderRadius:6,padding:"10px",fontSize:13,fontWeight:600,cursor:saving||!selectedUserId?"not-allowed":"pointer",opacity:saving||!selectedUserId?0.5:1,fontFamily:"inherit"}}
          >{saving?"Transferring...":"Transfer"}</button>
          <button 
            onClick={onClose}
            style={{flex:1,background:"#fff",color:"#475569",border:"1px solid #e2e8f0",borderRadius:6,padding:"10px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}
          >Cancel</button>
        </div>
      </div>
    </div>
  );
}
