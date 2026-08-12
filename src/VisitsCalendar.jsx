import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import VisitLog from "./VisitLog.jsx";

export default function VisitsCalendar({currentUser}){
  const [visits,setVisits]=useState([]);
  const [loading,setLoading]=useState(true);
  const [selectedDate,setSelectedDate]=useState(null);
  const [filterUser,setFilterUser]=useState("");
  const [users,setUsers]=useState([]);
  const [currentWeekStart,setCurrentWeekStart]=useState(getMonday(new Date()));
  const [showLogForm,setShowLogForm]=useState(false);

  function getMonday(date){
    const d=new Date(date);
    const day=d.getDay();
    const diff=d.getDate()-(day===0?6:day-1);
    return new Date(d.setDate(diff));
  }

  function formatDate(date){
    return date.toISOString().split("T")[0];
  }

  useEffect(()=>{
    loadUsers();
    loadVisits();
  },[currentWeekStart,filterUser]);

  const loadUsers=async()=>{
    try{
      const {data}=await supabase.from("users").select("*").order("name");
      setUsers(data||[]);
    }catch(err){
      console.error("Error loading users:",err);
    }
  };

  const loadVisits=async()=>{
    setLoading(true);
    try{
      const weekEnd=new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate()+5); // Mon to Sat = 6 days

      let q=supabase.from("visits").select("*").gte("visit_date",formatDate(currentWeekStart)).lte("visit_date",formatDate(weekEnd)).order("visit_date",{ascending:false});
      
      if(filterUser)q=q.eq("created_by",filterUser);
      
      const {data}=await q;
      setVisits(data||[]);
    }catch(err){
      console.error("Error loading visits:",err);
    }finally{
      setLoading(false);
    }
  };

  const getDaysArray=()=>{
    const days=[];
    for(let i=0;i<6;i++){
      const date=new Date(currentWeekStart);
      date.setDate(date.getDate()+i);
      days.push(date);
    }
    return days;
  };

  const getVisitsForDate=(date)=>{
    const dateStr=formatDate(date);
    return visits.filter(v=>v.visit_date===dateStr);
  };

  const getConversionCount=(dateStr)=>{
    return visits.filter(v=>v.visit_date===dateStr&&v.status==="To be followed up").length;
  };

  const days=getDaysArray();
  const dayNames=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

  const getVisitModeColor=(mode)=>{
    return mode==="Online"?"#0d9488":"#2563eb";
  };

  const getVisitModeLabel=(mode)=>{
    return mode==="Online"?"💻 Online":"📍 Field";
  };

  if(showLogForm){
  return <VisitLog currentUser={currentUser} onSubmit={()=>{setShowLogForm(false);loadVisits();}} onCancel={()=>setShowLogForm(false)}/>;
}

return(
  <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
  <div>
    <h1 style={{fontSize:20,fontWeight:700,color:"#1e293b",margin:0}}>Visits</h1>
    <p style={{fontSize:13,color:"#64748b",margin:"4px 0 0"}}>Track and monitor prospect visits</p>
  </div>
  <button 
    onClick={()=>setShowLogForm(!showLogForm)}
    style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:6,padding:"10px 20px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}
  >+ Log Visit</button>
</div>

      {/* Filters */}
      <div style={{display:"flex",gap:16,marginBottom:20,alignItems:"flex-end",flexWrap:"wrap"}}>
        {/* Week Navigation */}
        <div>
          <label style={{display:"block",fontSize:11,fontWeight:600,color:"#475569",marginBottom:4,textTransform:"uppercase"}}>Week</label>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <button 
              onClick={()=>setCurrentWeekStart(new Date(currentWeekStart.getTime()-7*24*60*60*1000))}
              style={{padding:"6px 12px",borderRadius:6,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",fontSize:12,fontFamily:"inherit"}}
            >← Prev</button>
            <span style={{fontSize:12,fontWeight:600,color:"#1e293b",minWidth:120,textAlign:"center"}}>
              {currentWeekStart.toLocaleDateString("en-IN",{month:"short",day:"numeric"})} - {new Date(currentWeekStart.getTime()+5*24*60*60*1000).toLocaleDateString("en-IN",{month:"short",day:"numeric"})}
            </span>
            <button 
              onClick={()=>setCurrentWeekStart(new Date(currentWeekStart.getTime()+7*24*60*60*1000))}
              style={{padding:"6px 12px",borderRadius:6,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",fontSize:12,fontFamily:"inherit"}}
            >Next →</button>
          </div>
        </div>

        {/* User Filter */}
        <div style={{marginLeft:"auto"}}>
          <label style={{display:"block",fontSize:11,fontWeight:600,color:"#475569",marginBottom:4,textTransform:"uppercase"}}>Filter by Sales Associate</label>
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

      {/* Calendar Grid */}
      {loading?
        <div style={{textAlign:"center",padding:40,color:"#94a3b8"}}>Loading visits...</div>
      :(
        <div style={{background:"#fff",borderRadius:10,border:"1px solid #e2e8f0",overflow:"hidden"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:"1px",background:"#e2e8f0",padding:"1px"}}>
            {days.map((date,idx)=>{
              const dateStr=formatDate(date);
              const dayVisits=getVisitsForDate(date);
              const converted=getConversionCount(dateStr);
              
              return(
                <div key={idx} onClick={()=>setSelectedDate(selectedDate===dateStr?null:dateStr)} style={{background:"#fff",padding:16,minHeight:140,cursor:"pointer",transition:"background .15s"}} onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                  <div style={{fontSize:12,fontWeight:600,color:"#1e293b",marginBottom:8}}>{dayNames[idx]}</div>
                  <div style={{fontSize:11,color:"#64748b",marginBottom:12}}>{date.toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</div>
                  <div style={{background:"#eff6ff",borderRadius:6,padding:8,marginBottom:8}}>
                    <div style={{fontSize:10,color:"#475569",textTransform:"uppercase",fontWeight:600,marginBottom:2}}>Visits</div>
                    <div style={{fontSize:18,fontWeight:700,color:"#2563eb"}}>{dayVisits.length}</div>
                  </div>
                  <div style={{background:"#f0fdf4",borderRadius:6,padding:8}}>
                    <div style={{fontSize:10,color:"#475569",textTransform:"uppercase",fontWeight:600,marginBottom:2}}>Converted</div>
                    <div style={{fontSize:18,fontWeight:700,color:"#15803d"}}>{converted}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day Details */}
      {selectedDate&&(
        <div style={{marginTop:24,background:"#fff",borderRadius:10,border:"1px solid #e2e8f0",padding:20}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <h2 style={{fontSize:16,fontWeight:700,color:"#1e293b",margin:0}}>Visits on {new Date(selectedDate).toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</h2>
            <button 
              onClick={()=>setSelectedDate(null)}
              style={{background:"none",border:"none",cursor:"pointer",fontSize:16,color:"#94a3b8"}}
            >×</button>
          </div>

          {getVisitsForDate(new Date(selectedDate)).length===0?
            <div style={{textAlign:"center",padding:40,color:"#94a3b8",fontSize:13}}>No visits logged for this day</div>
          :(
            <div style={{display:"grid",gap:12}}>
              {getVisitsForDate(new Date(selectedDate)).map(visit=>(
                <div key={visit.id} style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:8,padding:16}}>
                  {/* Row 1: Prospect Info */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginBottom:16}}>
                    <div>
                      <div style={{fontSize:10,fontWeight:600,color:"#475569",textTransform:"uppercase",marginBottom:4}}>Prospect</div>
                      <div style={{fontSize:13,fontWeight:600,color:"#1e293b"}}>{visit.prospect_name}</div>
                      <div style={{fontSize:11,color:"#64748b",marginTop:2}}>{visit.prospect_type}</div>
                    </div>
                    <div>
                      <div style={{fontSize:10,fontWeight:600,color:"#475569",textTransform:"uppercase",marginBottom:4}}>Visit Details</div>
                      <div style={{fontSize:12,fontWeight:600,color:"#1e293b"}}>{visit.visit_time}</div>
                      <span style={{display:"inline-block",fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:6,background:"#f1f5f9",color:"#1e293b",marginTop:4}}>{visit.visit_type}</span>
                    </div>
                    <div>
                      <div style={{fontSize:10,fontWeight:600,color:"#475569",textTransform:"uppercase",marginBottom:4}}>Mode</div>
                      <span style={{display:"inline-block",fontSize:11,fontWeight:600,padding:"4px 10px",borderRadius:6,background:getVisitModeColor(visit.visit_mode)+"20",color:getVisitModeColor(visit.visit_mode)}}>
                        {getVisitModeLabel(visit.visit_mode)}
                      </span>
                    </div>
                  </div>

                  {/* Row 2: Contact Information */}
                  <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:6,padding:12,marginBottom:16}}>
                    <div style={{fontSize:10,fontWeight:600,color:"#475569",textTransform:"uppercase",marginBottom:8,letterSpacing:".4px"}}>Contact Information</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                      <div>
                        {visit.person_met&&<div style={{fontSize:11,color:"#1e293b",marginBottom:6}}><strong>Person Met:</strong> {visit.person_met}</div>}
                        {visit.contact_email&&<div style={{fontSize:11,color:"#1e293b",marginBottom:6}}><strong>Email:</strong> <a href={`mailto:${visit.contact_email}`} style={{color:"#2563eb",textDecoration:"none"}}>{visit.contact_email}</a></div>}
                      </div>
                      <div>
                        {visit.contact_mobile&&<div style={{fontSize:11,color:"#1e293b",marginBottom:6}}><strong>Mobile:</strong> <a href={`tel:${visit.contact_mobile}`} style={{color:"#2563eb",textDecoration:"none"}}>{visit.contact_mobile}</a></div>}
                        {visit.monthly_business_volume&&<div style={{fontSize:11,color:"#1e293b"}}><strong>Monthly Volume:</strong> {visit.monthly_business_volume}</div>}
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Status & Next Followup */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
                    <div>
                      <div style={{fontSize:10,fontWeight:600,color:"#475569",textTransform:"uppercase",marginBottom:6}}>Status</div>
                      <span style={{display:"inline-block",fontSize:10,fontWeight:600,padding:"3px 9px",borderRadius:12,background:visit.status==="Discard"?"#fee2e2":"#f0fdf4",color:visit.status==="Discard"?"#b91c1c":"#15803d"}}>{visit.status}</span>
                    </div>
                    <div>
                      {visit.next_followup_date&&(
                        <div>
                          <div style={{fontSize:10,fontWeight:600,color:"#475569",textTransform:"uppercase",marginBottom:6}}>Next Follow-up</div>
                          <div style={{fontSize:12,color:"#1e293b",fontWeight:600}}>
                            {new Date(visit.next_followup_date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 4: Remarks & Location */}
                  <div>
                    {visit.remarks&&(
                      <div style={{background:"#f1f5f9",borderRadius:6,padding:10,marginBottom:10}}>
                        <div style={{fontSize:10,fontWeight:600,color:"#475569",textTransform:"uppercase",marginBottom:6}}>Remarks</div>
                        <div style={{fontSize:12,color:"#1e293b",whiteSpace:"pre-wrap"}}>{visit.remarks}</div>
                      </div>
                    )}
                    {visit.maps_url&&(
                      <div style={{fontSize:11}}>
                        <a href={visit.maps_url} target="_blank" rel="noopener noreferrer" style={{color:"#2563eb",textDecoration:"none"}}>
                          📍 View Location →
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
