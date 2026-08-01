import { useState, useRef } from "react";
import { supabase } from "./supabase";
import { Btn, Alert } from "./App";

const TENURE_OPTIONS = [3,6,9,10,12,15,18,21,24,27,30,33,36];
const PRODUCTS = ["SV GST","SV Non GST","STD ROI","HYBRID"];
const ADVANCE_EMI_OPTIONS = [0,1,2,3];
const INST_TYPES = ["Engineering College","Medical College","K-12 School","Skill Dev Institute","University","Management Institute","Polytechnic","Other"];
const BIZ_TYPES = ["Trust/Society","Private Limited","Partnership Firm","LLP","Proprietorship","Other"];
const LEAD_SOURCES = ["Direct Sales","Client Website","Channel Partner","Inside Sales Team","North Sales Team","South Sales Team","East Sales Team","West Sales Team","Referral","Other"];

export default function NewLead({currentUser,onSubmit,onCancel}){
  const [formData,setFormData]=useState({name:"",legal_name:"",institute_type:"",business_type:"",estd_year:new Date().getFullYear(),turnover:"",source:"",sampleFees:"",roi:"",subvention:"",tenure:12,advanceEmi:0,product:"",processingFee:"",processingFeeType:"%"});
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
        estd_year:parseInt(formData.estd_year),
        turnover:formData.turnover,
        source:formData.source,
        sample_fees:parseFloat(formData.sampleFees)||null,
        roi:parseFloat(formData.roi)||null,
        subvention:parseFloat(formData.subvention)||null,
        tenure:parseInt(formData.tenure),
        advance_emi:parseInt(formData.advanceEmi),
        product:formData.product,
        processing_fee:parseFloat(formData.processingFee)||null,
        processing_fee_type:formData.processingFeeType,
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
            <label style={labelStyle}>Business Type</label>
            <select name="business_type" value={formData.business_type} onChange={handleChange} style={ic}>
              <option value="">Select type...</option>
              {BIZ_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
          <div>
            <label style={labelStyle}>Established Year</label>
            <input type="number" name="estd_year" value={formData.estd_year} onChange={handleChange} style={ic}/>
          </div>
          <div>
            <label style={labelStyle}>Annual Turnover *</label>
            <input type="text" name="turnover" value={formData.turnover} onChange={handleChange} placeholder="e.g., ₹5 Cr" style={ic}/>
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
          <div>
            <label style={labelStyle}>Product</label>
            <select name="product" value={formData.product} onChange={handleChange} style={ic}>
              <option value="">Select product...</option>
              {PRODUCTS.map(p=><option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:20,marginBottom:20}}>
          <div>
            <label style={labelStyle}>Sample Fees</label>
            <input type="number" name="sampleFees" value={formData.sampleFees} onChange={handleChange} placeholder="Amount in ₹" style={ic}/>
          </div>
          <div>
            <label style={labelStyle}>ROI %</label>
            <input type="number" name="roi" value={formData.roi} onChange={handleChange} placeholder="%" style={ic}/>
          </div>
          <div>
            <label style={labelStyle}>Subvention %</label>
            <input type="number" name="subvention" value={formData.subvention} onChange={handleChange} placeholder="%" style={ic}/>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:20,marginBottom:20}}>
          <div>
            <label style={labelStyle}>Tenure (Months)</label>
            <select name="tenure" value={formData.tenure} onChange={handleChange} style={ic}>
              {TENURE_OPTIONS.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Advance EMI</label>
            <select name="advanceEmi" value={formData.advanceEmi} onChange={handleChange} style={ic}>
              {ADVANCE_EMI_OPTIONS.map(a=><option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Processing Fee</label>
            <div style={{display:"flex",gap:8}}>
              <input type="number" name="processingFee" value={formData.processingFee} onChange={handleChange} placeholder="Amount" style={{...ic,flex:1}}/>
              <select name="processingFeeType" value={formData.processingFeeType} onChange={handleChange} style={{...ic,flex:0.3}}>
                <option value="%">%</option>
                <option value="₹">₹</option>
              </select>
            </div>
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
