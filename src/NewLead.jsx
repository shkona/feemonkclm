import { useState } from "react";
import { supabase } from "./supabase";
import { Btn, Alert } from "./App";

const INST_TYPES = ["Engineering College","Medical College","K-12 School","Skill Dev Institute","University","Management Institute","Polytechnic","Other"];
const BIZ_TYPES = ["Private Limited","Limited Liability","Partnership Firm","Proprietorship","Trust/Society","Other"];
const BUSINESS_CATEGORIES = ["K-12","Higher Education","Upskilling","Executive Education"];
const VINTAGE_OPTIONS = ["0-1 Year","1-3 Years",">3 years"];
const TURNOVER_OPTIONS = ["0-50L","51L-1Cr","1Cr-2Cr","2-3Cr","3-4Cr","4-5Cr",">5Cr"];
const LEAD_SOURCES = ["Direct Sales","Client Website","Inbound Website","Inbound Email","Channel Partner","Inside Sales Team","North Sales Team","South Sales Team","East Sales Team","West Sales Team","Referral","Employee Referral","Other"];

export default function NewLead({currentUser,onSubmit,onCancel}){
  const [formData,setFormData]=useState({name:"",legal_name:"",institute_type:"",business_type:"",org_type:"",vintage:"",turnover:"",website:"",source:"",contact_phone:"",contact_email:""});
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState(false);

  const handleChange=(e)=>{
    const {name,value}=e.target;
    setFormData(prev=>({...prev,[name]:value}));
  };

  const handleSubmit=async()=>{
    const errors=[];
    if(!formData.name.trim())errors.push("Institute name is required");
    if(!formData.institute_type)errors.push("Institute type is required");
    if(!formData.turnover)errors.push("Turnover is required");

    if(errors.length>0){
      setError(errors.join(", "));
      return;
    }

    setLoading(true);
    setError("");

    try{
      const {data,error:err}=await supabase.from("leads").insert({
        name:formData.name,
        legal_name:formData.legal_name,
        institute_type:formData.institute_type,
        business_type:formData.business_type,
        org_type:formData.org_type,
        vintage:formData.vintage,
        turnover:formData.turnover,
        website:formData.website,
        source:formData.source,
        contact_phone:formData.contact_phone,
        contact_email:formData.contact_email,
        status:"LEAD_CREATED",
        created_by:currentUser.id,
      }).select();

      if(err){
        setError(err.message||"Failed to create lead");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(()=>{
        onSubmit();
      },1500);
    }catch(err){
      setError(err.message||"An error occurred");
      setLoading(false);
    }
  };

  if(success){
    return(
      <div style={{maxWidth:600,margin:"0 auto",padding:20}}>
        <Alert type="success" message="✅ Lead created successfully! Redirecting..."/>
      </div>
    );
  }

  const ic={width:"100%",border:"1px solid #e2e8f0",borderRadius:6,padding:"8px 10px",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"};
  const labelStyle={display:"block",fontSize:12,fontWeight:600,color:"#475569",marginBottom:4};

  return(
    <div style={{maxWidth:900,margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h1 style={{fontSize:20,fontWeight:700,color:"#1e293b",margin:0}}>Create New Lead</h1>
        <Btn variant="secondary" onClick={onCancel}>Cancel</Btn>
      </div>

      {error&&<Alert type="error" message={error} onClose={()=>setError("")}/>}

      <div style={{background:"#fff",borderRadius:10,border:"1px solid #e2e8f0",padding:24}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
          <div>
            <label style={labelStyle}>Institute Name *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g., St. Xavier's College" style={ic}/>
          </div>
          <div>
            <label style={labelStyle}>Legal Name</label>
            <input type="text" name="legal_name" value={formData.legal_name} onChange={handleChange} placeholder="Official registered name" style={ic}/>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
          <div>
            <label style={labelStyle}>Institute Type *</label>
            <select name="institute_type" value={formData.institute_type} onChange={handleChange} style={ic}>
              <option value="">Select type...</option>
              {INST_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Institute Website</label>
            <input type="text" name="website" value={formData.website} onChange={handleChange} placeholder="https://..." style={ic}/>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
          <div>
            <label style={labelStyle}>Business Type</label>
            <select name="business_type" value={formData.business_type} onChange={handleChange} style={ic}>
              <option value="">Select type...</option>
              {BIZ_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Business Category</label>
            <select name="org_type" value={formData.org_type} onChange={handleChange} style={ic}>
              <option value="">Select category...</option>
              {BUSINESS_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
          <div>
            <label style={labelStyle}>Vintage</label>
            <select name="vintage" value={formData.vintage} onChange={handleChange} style={ic}>
              <option value="">Select vintage...</option>
              {VINTAGE_OPTIONS.map(v=><option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Annual Turnover *</label>
            <select name="turnover" value={formData.turnover} onChange={handleChange} style={ic}>
              <option value="">Select turnover...</option>
              {TURNOVER_OPTIONS.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
          <div>
            <label style={labelStyle}>Mobile Number</label>
            <input type="text" name="contact_phone" value={formData.contact_phone} onChange={handleChange} placeholder="+91 ..." style={ic}/>
          </div>
          <div>
            <label style={labelStyle}>Email ID</label>
            <input type="email" name="contact_email" value={formData.contact_email} onChange={handleChange} placeholder="name@institute.com" style={ic}/>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
          <div>
            <label style={labelStyle}>Lead Source</label>
            <select name="source" value={formData.source} onChange={handleChange} style={ic}>
              <option value="">Select source...</option>
              {LEAD_SOURCES.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div style={{display:"flex",gap:12,paddingTop:12,borderTop:"1px solid #e2e8f0"}}>
          <Btn variant="primary" onClick={handleSubmit} disabled={loading}>{loading?"Creating...":"Create Lead"}</Btn>
          <Btn variant="secondary" onClick={onCancel}>Cancel</Btn>
        </div>
      </div>
    </div>
  );
}
