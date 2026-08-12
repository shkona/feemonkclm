import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const PROSPECT_TYPES = ["K-12","Higher Ed","Upskilling","Study Abroad","Channel Partner"];
const VISIT_TYPES = ["New","Follow up"];
const VISIT_MODES = ["Online","Field"];
const VISIT_STATUS = ["To be followed up","Discard"];

export default function VisitLog({currentUser,onSubmit,onCancel}){
  const [form,setForm]=useState({
    prospect_name:"",
    prospect_type:"K-12",
    visit_date:new Date().toISOString().split("T")[0],
    visit_time:new Date().toTimeString().slice(0,5),
    visit_type:"New",
    visit_mode:"Field",
    person_met:"",
    contact_email:"",
    contact_mobile:"",
    monthly_business_volume:"",
    remarks:"",
    status:"To be followed up",
    maps_url:"",
    next_followup_date:"",
  });
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");

  const handleChange=(field,value)=>{
    setForm({...form,[field]:value});
  };

  const handleSubmit=async()=>{
    if(!form.prospect_name.trim()){
      setError("Prospect name is required");
      return;
    }

    setSaving(true);
    setError("");
    try{
      const {error:err}=await supabase.from("visits").insert({
        prospect_name:form.prospect_name,
        prospect_type:form.prospect_type,
        visit_date:form.visit_date,
        visit_time:form.visit_time,
        visit_type:form.visit_type,
        visit_mode:form.visit_mode,
        person_met:form.person_met,
        contact_email:form.contact_email,
        contact_mobile:form.contact_mobile,
        monthly_business_volume:form.monthly_business_volume,
        remarks:form.remarks,
        status:form.status,
        maps_url:form.maps_url,
        next_followup_date:form.next_followup_date,
        created_by:currentUser.id,
      });

      if(err)throw err;
      
      // Reset form
      setForm({
        prospect_name:"",
        prospect_type:"K-12",
        visit_date:new Date().toISOString().split("T")[0],
        visit_time:new Date().toTimeString().slice(0,5),
        visit_type:"New",
        visit_mode:"Field",
        person_met:"",
        contact_email:"",
        contact_mobile:"",
        monthly_business_volume:"",
        remarks:"",
        status:"To be followed up",
        maps_url:"",
        next_followup_date:"",
      });
      
      onSubmit();
    }catch(err){
      console.error("Error logging visit:",err);
      setError(err.message||"Failed to log visit");
    }finally{
      setSaving(false);
    }
  };

  return(
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <div>
          <h1 style={{fontSize:20,fontWeight:700,color:"#1e293b",margin:0}}>Log Visit</h1>
          <p style={{fontSize:13,color:"#64748b",margin:"4px 0 0"}}>Record a prospect visit quickly</p>
        </div>
      </div>

      {error&&<div style={{background:"#fee2e2",border:"1px solid #fca5a5",borderRadius:8,padding:"12px 16px",color:"#b91c1c",marginBottom:16,fontSize:13}}>{error}</div>}

      <div style={{background:"#fff",borderRadius:10,border:"1px solid #e2e8f0",padding:24}}>
        {/* Row 1 */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
          <div>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:"#475569",marginBottom:6}}>Prospect Name *</label>
            <input 
              type="text" 
              value={form.prospect_name}
              onChange={e=>handleChange("prospect_name",e.target.value)}
              placeholder="Company/Institute name"
              style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:6,padding:"8px 10px",fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none"}}
            />
          </div>
          <div>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:"#475569",marginBottom:6}}>Prospect Type</label>
            <select 
              value={form.prospect_type}
              onChange={e=>handleChange("prospect_type",e.target.value)}
              style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:6,padding:"8px 10px",fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none"}}
            >
              {PROSPECT_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Row 2 */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
          <div>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:"#475569",marginBottom:6}}>Date of Visit</label>
            <input 
              type="date" 
              value={form.visit_date}
              onChange={e=>handleChange("visit_date",e.target.value)}
              style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:6,padding:"8px 10px",fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none"}}
            />
          </div>
          <div>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:"#475569",marginBottom:6}}>Time of Visit</label>
            <input 
              type="time" 
              value={form.visit_time}
              onChange={e=>handleChange("visit_time",e.target.value)}
              style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:6,padding:"8px 10px",fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none"}}
            />
          </div>
        </div>

        {/* Row 3 */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
          <div>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:"#475569",marginBottom:6}}>Visit Type</label>
            <select 
              value={form.visit_type}
              onChange={e=>handleChange("visit_type",e.target.value)}
              style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:6,padding:"8px 10px",fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none"}}
            >
              {VISIT_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:"#475569",marginBottom:6}}>Visit Mode</label>
            <select 
              value={form.visit_mode}
              onChange={e=>handleChange("visit_mode",e.target.value)}
              style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:6,padding:"8px 10px",fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none"}}
            >
              {VISIT_MODES.map(m=><option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {/* Row 4 - Contact Info */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
          <div>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:"#475569",marginBottom:6}}>Person Met</label>
            <input 
              type="text" 
              value={form.person_met}
              onChange={e=>handleChange("person_met",e.target.value)}
              placeholder="Name or 'No meeting'"
              style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:6,padding:"8px 10px",fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none"}}
            />
          </div>
          <div>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:"#475569",marginBottom:6}}>Contact Email</label>
            <input 
              type="email" 
              value={form.contact_email}
              onChange={e=>handleChange("contact_email",e.target.value)}
              placeholder="email@example.com"
              style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:6,padding:"8px 10px",fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none"}}
            />
          </div>
        </div>

        {/* Row 5 - Contact Mobile & Business Volume */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
          <div>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:"#475569",marginBottom:6}}>Contact Mobile</label>
            <input 
              type="tel" 
              value={form.contact_mobile}
              onChange={e=>handleChange("contact_mobile",e.target.value)}
              placeholder="+91 98765 43210"
              style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:6,padding:"8px 10px",fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none"}}
            />
          </div>
          <div>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:"#475569",marginBottom:6}}>Monthly Business Volume</label>
            <input 
              type="text" 
              value={form.monthly_business_volume}
              onChange={e=>handleChange("monthly_business_volume",e.target.value)}
              placeholder="e.g., ₹10L, ₹50L"
              style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:6,padding:"8px 10px",fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none"}}
            />
          </div>
        </div>

        {/* Row 6 - Status & Next Followup */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
          <div>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:"#475569",marginBottom:6}}>Status</label>
            <select 
              value={form.status}
              onChange={e=>handleChange("status",e.target.value)}
              style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:6,padding:"8px 10px",fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none"}}
            >
              {VISIT_STATUS.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:"#475569",marginBottom:6}}>Next Follow-up Date</label>
            <input 
              type="date" 
              value={form.next_followup_date}
              onChange={e=>handleChange("next_followup_date",e.target.value)}
              style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:6,padding:"8px 10px",fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none"}}
            />
          </div>
        </div>

        {/* Row 7 - Maps URL */}
        <div style={{marginBottom:20}}>
          <label style={{display:"block",fontSize:12,fontWeight:600,color:"#475569",marginBottom:6}}>Maps URL</label>
          <input 
            type="url" 
            value={form.maps_url}
            onChange={e=>handleChange("maps_url",e.target.value)}
            placeholder="Google Maps link"
            style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:6,padding:"8px 10px",fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none"}}
          />
        </div>

        {/* Remarks */}
        <div style={{marginBottom:20}}>
          <label style={{display:"block",fontSize:12,fontWeight:600,color:"#475569",marginBottom:6}}>Remarks</label>
          <textarea 
            value={form.remarks}
            onChange={e=>handleChange("remarks",e.target.value)}
            placeholder="Visit observations and notes"
            style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:6,padding:"8px 10px",fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none",minHeight:80}}
          />
        </div>

        {/* Buttons */}
        <div style={{display:"flex",gap:12,paddingTop:16,borderTop:"1px solid #e2e8f0"}}>
          <button 
            onClick={handleSubmit}
            disabled={saving}
            style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:6,padding:"10px 20px",fontSize:13,fontWeight:600,cursor:saving?"not-allowed":"pointer",opacity:saving?0.5:1,fontFamily:"inherit"}}
          >{saving?"Logging...":"Log Visit"}</button>
          <button 
            onClick={onCancel}
            style={{background:"#fff",color:"#475569",border:"1px solid #e2e8f0",borderRadius:6,padding:"10px 20px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}
          >Cancel</button>
        </div>
      </div>
    </div>
  );
}
