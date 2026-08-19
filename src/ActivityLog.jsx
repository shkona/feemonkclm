import { useState, useEffect } from "react";
import { supabase } from "./supabase";

export default function ActivityLog({type,recordId,currentUser}){
  const [activities,setActivities]=useState([]);
  const [loading,setLoading]=useState(true);
  const [newComment,setNewComment]=useState("");
  const [submitting,setSubmitting]=useState(false);
  const [users,setUsers]=useState({});

  const tableName=type==="lead"?"lead_activities":"visit_activities";
  const fieldName=type==="lead"?"lead_id":"visit_id";

  useEffect(()=>{
    loadActivities();
    loadUsers();
  },[recordId]);

  const loadUsers=async()=>{
    try{
      const {data}=await supabase.from("users").select("id,name");
      const userMap={};
      data?.forEach(u=>{userMap[u.id]=u.name;});
      setUsers(userMap);
    }catch(err){
      console.error("Error loading users:",err);
    }
  };

  const loadActivities=async()=>{
    setLoading(true);
    try{
      const {data}=await supabase
        .from(tableName)
        .select("*")
        .eq(fieldName,recordId)
        .order("created_at",{ascending:false});
      setActivities(data||[]);
    }catch(err){
      console.error("Error loading activities:",err);
    }finally{
      setLoading(false);
    }
  };

  const addComment=async()=>{
    if(!newComment.trim()){
      alert("Please enter a comment");
      return;
    }

    setSubmitting(true);
    try{
      const {error}=await supabase.from(tableName).insert({
        [fieldName]:recordId,
        user_id:currentUser.id,
        comment:newComment,
      });

      if(error)throw error;

      setNewComment("");
      loadActivities();
    }catch(err){
      console.error("Error adding comment:",err);
      alert("Failed to add comment");
    }finally{
      setSubmitting(false);
    }
  };

  return(
    <div style={{marginTop:24}}>
      <h3 style={{fontSize:14,fontWeight:700,color:"#1e293b",margin:"0 0 16px"}}>Activity & Comments</h3>

      {/* Add Comment */}
      <div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:8,padding:16,marginBottom:16}}>
        <textarea 
          value={newComment}
          onChange={e=>setNewComment(e.target.value)}
          placeholder="Add a comment..."
          style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:6,padding:"10px",fontSize:13,fontFamily:"inherit",boxSizing:"border-box",minHeight:60,marginBottom:10,outline:"none"}}
        />
        <button 
          onClick={addComment}
          disabled={submitting}
          style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:6,padding:"8px 16px",fontSize:12,fontWeight:600,cursor:submitting?"not-allowed":"pointer",opacity:submitting?0.5:1,fontFamily:"inherit"}}
        >{submitting?"Adding...":"Add Comment"}</button>
      </div>

      {/* Comments List */}
      {loading?
        <div style={{textAlign:"center",padding:20,color:"#94a3b8",fontSize:13}}>Loading comments...</div>
      :(
        <div style={{display:"grid",gap:12}}>
          {activities.length===0?
            <div style={{textAlign:"center",padding:20,color:"#94a3b8",fontSize:13}}>No comments yet</div>
          :(
            activities.map(activity=>(
              <div key={activity.id} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,padding:12}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <div>
                    <span style={{fontSize:12,fontWeight:600,color:"#1e293b"}}>{users[activity.user_id]||"Unknown"}</span>
                    <span style={{fontSize:11,color:"#64748b",marginLeft:8}}>
                      {new Date(activity.created_at).toLocaleDateString("en-IN")} {new Date(activity.created_at).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}
                    </span>
                  </div>
                </div>
                <p style={{fontSize:13,color:"#1e293b",margin:0,whiteSpace:"pre-wrap"}}>{activity.comment}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
