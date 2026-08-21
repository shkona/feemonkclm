import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { exportToCSV } from "./exportUtils.js";

export default function ProspectsReport({currentUser}){
  const [visits,setVisits]=useState([]);
  const [loading,setLoading]=useState(true);
  const [filterFromDate,setFilterFromDate]=useState(getDefaultFromDate());
  const [filterToDate,setFilterToDate]=useState(new Date().toISOString().split("T")[0]);
  const [filterType,setFilterType]=useState("");
  const [prospectTypes,setProspectTypes]=useState([]);

  function getDefaultFromDate(){
    const date=new Date();
    date.setDate(date.getDate()-30);
    return date.toISOString().split("T")[0];
  }

  useEffect(()=>{
    loadProspectTypes();
  },[]);

  useEffect(()=>{
    loadVisits();
  },[filterFromDate,filterToDate,filterType]);

  const loadProspectTypes=async()=>{
    try{
      const {data}=await supabase.from("visits").select("prospect_type").order("prospect_type");
      const types=Array.from(new Set(data?.map(d=>d.prospect_type).filter(Boolean)||[]));
      setProspectTypes(types);
    }catch(err){
      console.error("Error loading prospect types:",err);
    }
  };

  const loadVisits=async()=>{
    setLoading(true);
    try{
      let q=supabase.from("visits").select("id,prospect_name,prospect_type,visit_date,remarks,next_followup_date,next_followup_time").gte("visit_date",filterFromDate).lte("visit_date",filterToDate).order("visit_date",{ascending:false});
      
      if(filterType)q=q.eq("prospect_type",filterType);
      
      const {data}=await q;
      setVisits(data||[]);
    }catch(err){
      console.error("Error loading visits:",err);
    }finally{
      setLoading(false);
    }
  };

  const handleExport=()=>{
    // Format data for export
    const exportData=visits.map(visit=>({
      "Prospect Name":visit.prospect_name,
      "Type":visit.prospect_type,
      "Visit Date":new Date(visit.visit_date).toLocaleDateString("en-IN"),
      "Remarks":visit.remarks||"--"
    }));
    
    exportToCSV(exportData,"Prospects_Report");
  };

  return(
    <div>
      {/* Export Button */}
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
        <button 
          onClick={handleExport}
          disabled={visits.length===0}
          style={{background:"#059669",color:"#fff",border:"none",borderRadius:6,padding:"10px 20px",fontSize:13,fontWeight:600,cursor:visits.length===0?"not-allowed":"pointer",opacity:visits.length===0?0.5:1,fontFamily:"inherit",display:"flex",alignItems:"center",gap:8}}
        >
          📥 Export to CSV
        </button>
      </div>
      {/* Filters */}
      <div style={{background:"#fff",borderRadius:10,border:"1px solid #e2e8f0",padding:16,marginBottom:20}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,alignItems:"flex-end",flexWrap:"wrap"}}>
          <div>
            <label style={{display:"block",fontSize:11,fontWeight:600,color:"#475569",marginBottom:4,textTransform:"uppercase"}}>Visit From Date</label>
            <input 
              type="date" 
              value={filterFromDate}
              onChange={e=>setFilterFromDate(e.target.value)}
              style={{width:"100%",padding:"8px 10px",borderRadius:6,border:"1px solid #e2e8f0",fontSize:12,fontFamily:"inherit",boxSizing:"border-box"}}
            />
          </div>

          <div>
            <label style={{display:"block",fontSize:11,fontWeight:600,color:"#475569",marginBottom:4,textTransform:"uppercase"}}>Visit To Date</label>
            <input 
              type="date" 
              value={filterToDate}
              onChange={e=>setFilterToDate(e.target.value)}
              style={{width:"100%",padding:"8px 10px",borderRadius:6,border:"1px solid #e2e8f0",fontSize:12,fontFamily:"inherit",boxSizing:"border-box"}}
            />
          </div>

          <div>
            <label style={{display:"block",fontSize:11,fontWeight:600,color:"#475569",marginBottom:4,textTransform:"uppercase"}}>Type of Institute</label>
            <select 
              value={filterType}
              onChange={e=>setFilterType(e.target.value)}
              style={{width:"100%",padding:"8px 10px",borderRadius:6,border:"1px solid #e2e8f0",fontSize:12,fontFamily:"inherit",boxSizing:"border-box"}}
            >
              <option value="">All Types</option>
              {prospectTypes.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Prospects Table */}
      {loading?
        <div style={{textAlign:"center",padding:40,color:"#94a3b8"}}>Loading prospects...</div>
      :(
        <div style={{background:"#fff",borderRadius:10,border:"1px solid #e2e8f0",overflow:"hidden"}}>
          {visits.length===0?
            <div style={{textAlign:"center",padding:40,color:"#94a3b8"}}>No visits found</div>
          :(
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead>
                <tr style={{background:"#f8fafc",borderBottom:"1px solid #e2e8f0"}}>
                  <th style={{padding:"12px 16px",textAlign:"left",fontSize:11,fontWeight:600,color:"#475569",textTransform:"uppercase"}}>Prospect Name</th>
                  <th style={{padding:"12px 16px",textAlign:"left",fontSize:11,fontWeight:600,color:"#475569",textTransform:"uppercase"}}>Type</th>
                  <th style={{padding:"12px 16px",textAlign:"left",fontSize:11,fontWeight:600,color:"#475569",textTransform:"uppercase"}}>Visit Date</th>
                  <th style={{padding:"12px 16px",textAlign:"left",fontSize:11,fontWeight:600,color:"#475569",textTransform:"uppercase"}}>Next Follow-up</th>
                  <th style={{padding:"12px 16px",textAlign:"left",fontSize:11,fontWeight:600,color:"#475569",textTransform:"uppercase"}}>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {visits.map(visit=>(
                  <tr key={visit.id} style={{borderBottom:"1px solid #e2e8f0"}}>
                    <td style={{padding:"12px 16px",fontSize:13,color:"#1e293b",fontWeight:500}}>{visit.prospect_name}</td>
                    <td style={{padding:"12px 16px",fontSize:13,color:"#1e293b"}}>{visit.prospect_type}</td>
                    <td style={{padding:"12px 16px",fontSize:13,color:"#1e293b"}}>{new Date(visit.visit_date).toLocaleDateString("en-IN")}</td>
                    <td style={{padding:"12px 16px",fontSize:13,color:visit.next_followup_date?"#b45309":"#94a3b8"}}>
                      {visit.next_followup_date?
                        <>
                          {new Date(visit.next_followup_date).toLocaleDateString("en-IN")}<br/>
                          <span style={{fontSize:11,color:"#64748b"}}>{visit.next_followup_time}</span>
                        </>
                      :"--"}
                    </td>
                    <td style={{padding:"12px 16px",fontSize:13,color:"#64748b",maxWidth:300,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {visit.remarks||"--"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <div style={{marginTop:16,fontSize:12,color:"#64748b"}}>
        Total: {visits.length} visits
      </div>
    </div>
  );
}
