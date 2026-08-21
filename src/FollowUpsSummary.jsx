import { useState, useEffect } from "react";
import { supabase } from "./supabase";

export default function FollowUpsSummary({currentUser}){
  const [followups,setFollowups]=useState({leads:0,visits:0});
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    loadFollowups();
  },[]);

  const loadFollowups=async()=>{
    try{
      const today=new Date().toISOString().split("T")[0];

      // Get today's lead follow-ups
      const {data:leadFollowups}=await supabase
        .from("lead_followups")
        .select("id")
        .eq("followup_date",today);

      // Get today's visit follow-ups
      const {data:visitFollowups}=await supabase
        .from("visit_followups")
        .select("id")
        .eq("followup_date",today);

      setFollowups({
        leads:leadFollowups?.length||0,
        visits:visitFollowups?.length||0,
      });
    }catch(err){
      console.error("Error loading follow-ups:",err);
    }finally{
      setLoading(false);
    }
  };

  const total=followups.leads+followups.visits;

  if(loading)return null;

  if(total===0)return null;

  return(
    <div style={{background:"linear-gradient(135deg,#fbbf24,#f59e0b)",borderRadius:10,border:"1px solid #f97316",padding:16,marginBottom:20}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:12,fontWeight:600,color:"#92400e",textTransform:"uppercase",marginBottom:4}}>📅 Today's Follow-ups</div>
          <div style={{fontSize:24,fontWeight:700,color:"#b45309",margin:0}}>
            {total} {total===1?"follow-up":"follow-ups"}
          </div>
          <div style={{fontSize:11,color:"#b45309",marginTop:4}}>
            {followups.leads} leads · {followups.visits} prospects
          </div>
        </div>
        <div style={{fontSize:40}}>🎯</div>
      </div>
    </div>
  );
}
