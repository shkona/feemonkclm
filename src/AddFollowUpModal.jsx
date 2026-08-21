import { useState } from "react";
import { supabase } from "./supabase";

export default function AddFollowUpModal({type,recordId,currentUser,onClose,onSuccess}){
  const [followupDate,setFollowupDate]=useState(new Date().toISOString().split("T")[0]);
  const [followupTime,setFollowupTime]=useState("10:00");
  const [comment,setComment]=useState("");
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");

  const tableName=type==="lead"?"lead_followups":"visit_followups";
  const fieldName=type==="lead"?"lead_id":"visit_id";
  const activityTableName=type==="lead"?"lead_activities":"visit_activities";

  const handleSubmit=async()=>{
    if(!followupDate){
      setError("Please select a date");
      return;
    }
    if(!followupTime){
      setError("Please select a time");
      return;
    }
    if(!comment.trim()){
      setError("Please enter a comment");
      return;
    }

    setSaving(true);
    setError("");
    try{
      // Add follow-up record
      const {error:err}=await supabase.from(tableName).insert({
        [fieldName]:recordId,
        user_id:currentUser.id,
        followup_date:followupDate,
        followup_time:followupTime,
        comment:comment,
      });

      if(err)throw err;

      // Add system remark in activities
      const systemComment=`[FOLLOW-UP SCHEDULED]\nDate: ${new Date(followupDate).toLocaleDateString("en-IN")} at ${followupTime}\nNote: ${comment}`;
      
      await supabase.from(activityTableName).insert({
        [fieldName]:recordId,
        user_id:currentUser.id,
        comment:systemComment,
      });

      // Update next_followup fields in main table if it's a lead
      if(type==="lead"){
        await supabase.from("leads").update({
          next_followup_date:followupDate,
          next_followup_time:followupTime,
        }).eq("id",recordId);
      }

      onSuccess();
      onClose();
    }catch(err){
      console.error("Error adding follow-up:",err);
      setError(err.message||"Failed to add follow-up");
    }finally{
      setSaving(false);
    }
  };

  return(
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}}>
      <div style={{background:"#fff",borderRadius:10,padding:24,maxWidth:450,width:"90%",boxShadow:"0 10px 25px rgba(0,0,0,0.2)"}}>
        <h2 style={{fontSize:16,fontWeight:700,color:"#1e293b",margin:"0 0 16px"}}>Add Follow-up</h2>
        
        {error&&<div style={{background:"#fee2e2",border:"1px solid #fca5a5",borderRadius:6,padding:10,marginBottom:16,color:"#b91c1c",fontSize:12}}>{error}</div>}

        <div style={{marginBottom:16}}>
          <label style={{display:"block",fontSize:12,fontWeight:600,color:"#475569",marginBottom:6}}>Follow-up Date</label>
          <input 
            type="date" 
            value={followupDate}
            onChange={e=>setFollowupDate(e.target.value)}
            style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:6,padding:"8px 10px",fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none"}}
          />
        </div>

        <div style={{marginBottom:16}}>
          <label style={{display:"block",fontSize:12,fontWeight:600,color:"#475569",marginBottom:6}}>Follow-up Time</label>
          <input 
            type="time" 
            value={followupTime}
            onChange={e=>setFollowupTime(e.target.value)}
            style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:6,padding:"8px 10px",fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none"}}
          />
        </div>

        <div style={{marginBottom:20}}>
          <label style={{display:"block",fontSize:12,fontWeight:600,color:"#475569",marginBottom:6}}>Comment</label>
          <textarea 
            value={comment}
            onChange={e=>setComment(e.target.value)}
            placeholder="What to follow up on..."
            style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:6,padding:"10px",fontSize:13,fontFamily:"inherit",boxSizing:"border-box",minHeight:80,outline:"none"}}
          />
        </div>

        <div style={{display:"flex",gap:12}}>
          <button 
            onClick={handleSubmit}
            disabled={saving}
            style={{flex:1,background:"#2563eb",color:"#fff",border:"none",borderRadius:6,padding:"10px",fontSize:13,fontWeight:600,cursor:saving?"not-allowed":"pointer",opacity:saving?0.5:1,fontFamily:"inherit"}}
          >{saving?"Adding...":"Add Follow-up"}</button>
          <button 
            onClick={onClose}
            style={{flex:1,background:"#fff",color:"#475569",border:"1px solid #e2e8f0",borderRadius:6,padding:"10px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}
          >Cancel</button>
        </div>
      </div>
    </div>
  );
}
