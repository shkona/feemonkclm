import { useState } from "react";
import { supabase } from "./supabase";

export default function AddPreLeadModal({currentUser,onClose,onSuccess}){
  const [contactName,setContactName]=useState("");
  const [title,setTitle]=useState("");
  const [companyName,setCompanyName]=useState("");
  const [email,setEmail]=useState("");
  const [phone,setPhone]=useState("");
  const [website,setWebsite]=useState("");
  const [city,setCity]=useState("");
  const [linkedinUrl,setLinkedinUrl]=useState("");
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");

  const handleSubmit=async()=>{
    if(!contactName.trim()){
      setError("Please enter a contact name");
      return;
    }

    setSaving(true);
    setError("");
    try{
      const {error:err}=await supabase.from("pre_leads").insert({
        contact_name:contactName,
        title:title||null,
        company_name:companyName||null,
        email:email||null,
        phone:phone||null,
        website:website||null,
        city:city||null,
        linkedin_url:linkedinUrl||null,
        status:"SCREENER",
        created_by:currentUser.id,
      });

      if(err)throw err;

      onSuccess();
      onClose();
    }catch(err){
      console.error("Error adding pre-lead:",err);
      setError(err.message||"Failed to add pre-lead");
    }finally{
      setSaving(false);
    }
  };

  const ic={width:"100%",border:"1px solid #e2e8f0",borderRadius:6,padding:"8px 10px",fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none"};
  const labelStyle={display:"block",fontSize:12,fontWeight:600,color:"#475569",marginBottom:6};

  return(
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}}>
      <div style={{background:"#fff",borderRadius:10,padding:24,maxWidth:450,width:"90%",boxShadow:"0 10px 25px rgba(0,0,0,0.2)"}}>
        <h2 style={{fontSize:16,fontWeight:700,color:"#1e293b",margin:"0 0 16px"}}>Add Pre-Lead</h2>

        {error&&<div style={{background:"#fee2e2",border:"1px solid #fca5a5",borderRadius:6,padding:10,marginBottom:16,color:"#b91c1c",fontSize:12}}>{error}</div>}

        <div style={{marginBottom:14}}>
          <label style={labelStyle}>Contact Name *</label>
          <input type="text" value={contactName} onChange={e=>setContactName(e.target.value)} placeholder="e.g., Priya Sharma" style={ic}/>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          <div>
            <label style={labelStyle}>Title</label>
            <input type="text" value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g., Director" style={ic}/>
          </div>
          <div>
            <label style={labelStyle}>Company / Institute</label>
            <input type="text" value={companyName} onChange={e=>setCompanyName(e.target.value)} placeholder="e.g., ABC Institute" style={ic}/>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          <div>
            <label style={labelStyle}>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@company.com" style={ic}/>
          </div>
          <div>
            <label style={labelStyle}>Phone</label>
            <input type="text" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+91 ..." style={ic}/>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          <div>
            <label style={labelStyle}>Website</label>
            <input type="text" value={website} onChange={e=>setWebsite(e.target.value)} placeholder="https://company.com" style={ic}/>
          </div>
          <div>
            <label style={labelStyle}>City</label>
            <input type="text" value={city} onChange={e=>setCity(e.target.value)} placeholder="e.g., Mumbai" style={ic}/>
          </div>
        </div>

        <div style={{marginBottom:20}}>
          <label style={labelStyle}>LinkedIn Profile URL</label>
          <input type="text" value={linkedinUrl} onChange={e=>setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/..." style={ic}/>
        </div>

        <div style={{display:"flex",gap:12}}>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{flex:1,background:"#2563eb",color:"#fff",border:"none",borderRadius:6,padding:"10px",fontSize:13,fontWeight:600,cursor:saving?"not-allowed":"pointer",opacity:saving?0.5:1,fontFamily:"inherit"}}
          >{saving?"Adding...":"Add Pre-Lead"}</button>
          <button
            onClick={onClose}
            style={{flex:1,background:"#fff",color:"#475569",border:"1px solid #e2e8f0",borderRadius:6,padding:"10px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}
          >Cancel</button>
        </div>
      </div>
    </div>
  );
}
