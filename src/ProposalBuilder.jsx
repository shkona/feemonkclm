import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const PRODUCTS = ["SV GST","SV Non GST","STD ROI","HYBRID"];

function computeV(v) {
  const fees=parseFloat(v.sampleFees)||0, subvPct=parseFloat(v.subvention)||0;
  const roiPct=parseFloat(v.roi)||0, tenure=parseInt(v.tenure)||0;
  const advEmi=parseInt(v.advanceEmi)||0, pfVal=parseFloat(v.processingFee)||0;
  const subvAmt=fees*subvPct/100;
  const subvGST=(v.product==="SV GST"||v.product==="HYBRID")?subvAmt*0.18:0;
  const disbursement=fees-(subvAmt+subvGST);
  let cti=0;
  if(v.product==="SV GST")cti=subvAmt+subvGST;
  if(v.product==="SV Non GST")cti=subvAmt;
  if(v.product==="HYBRID")cti=subvAmt+subvGST;
  const totalInt=fees*roiPct/100;
  const emi=tenure>0?(fees+totalInt)/tenure:0;
  const pfRupee=v.processingFeeType==="%"?fees*pfVal/100:pfVal;
  const pfGST=pfRupee*0.18;
  const cts=fees+totalInt+pfRupee+pfGST;
  return {subvAmt,subvGST,disbursement,costToInstitute:cti,emi,roiCharge:totalInt,costToStudent:cts,pfRupee,pfGST};
}
function fmt(n){return "₹"+Math.round(n).toLocaleString("en-IN");}

export default function ProposalBuilder({leadId,currentUser,onBack}){
  const [lead,setLead]=useState(null);
  const [variants,setVariants]=useState([{product:"SV GST",sampleFees:100000,roi:10,subvention:20,tenure:12,advanceEmi:0,processingFee:2,processingFeeType:"%"}]);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);

  useEffect(()=>{loadLead();},[leadId]);

  const loadLead=async()=>{
    setLoading(true);
    const {data}=await supabase.from("leads").select("*").eq("id",leadId).single();
    setLead(data);
    setLoading(false);
  };

  const updateVariant=(idx,field,val)=>{
    const v=[...variants];
    v[idx]={...v[idx],[field]:val};
    setVariants(v);
  };

  const addVariant=()=>{
    setVariants([...variants,{product:"SV GST",sampleFees:100000,roi:10,subvention:20,tenure:12,advanceEmi:0,processingFee:2,processingFeeType:"%"}]);
  };

  const removeVariant=(idx)=>{
    if(variants.length>1)setVariants(variants.filter((_,i)=>i!==idx));
  };

  const saveProposal=async()=>{
    setSaving(true);
    try{
      const {error}=await supabase.from("proposals").insert({
        lead_id:leadId,
        variants:variants,
        created_by:currentUser.id,
      });
      if(error)throw error;
      onBack();
    }catch(err){
      console.error("Error saving proposal:",err);
      alert("Failed to save proposal");
    }finally{
      setSaving(false);
    }
  };

  if(loading)return <div style={{padding:20,textAlign:"center",color:"#94a3b8"}}>Loading...</div>;
  if(!lead)return <div style={{padding:20,color:"#ef4444"}}>Lead not found</div>;

  return(
    <div style={{maxWidth:1000}}>
      <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",color:"#2563eb",fontSize:13,marginBottom:16,display:"flex",alignItems:"center",gap:4,padding:0,fontFamily:"inherit"}}>← Back</button>
      
      <h1 style={{fontSize:20,fontWeight:700,color:"#1e293b",margin:"0 0 8px"}}>{lead.name}</h1>
      <p style={{fontSize:13,color:"#64748b",margin:0}}>Build proposal variants</p>

      <div style={{marginTop:20}}>
        {variants.map((v,idx)=>{
          const calc=computeV(v);
          return(
            <div key={idx} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,padding:20,marginBottom:20}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                <h2 style={{fontSize:14,fontWeight:700,color:"#1e293b",margin:0}}>Variant {idx+1}</h2>
                {variants.length>1&&<button onClick={()=>removeVariant(idx)} style={{background:"#fee2e2",color:"#b91c1c",border:"none",borderRadius:6,padding:"4px 12px",fontSize:12,fontWeight:600,cursor:"pointer"}}>Remove</button>}
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginBottom:16}}>
                <div>
                  <label style={{display:"block",fontSize:11,fontWeight:600,color:"#475569",marginBottom:6,textTransform:"uppercase"}}>Product</label>
                  <select value={v.product} onChange={e=>updateVariant(idx,"product",e.target.value)} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:6,padding:"8px 10px",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}>
                    {PRODUCTS.map(p=><option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{display:"block",fontSize:11,fontWeight:600,color:"#475569",marginBottom:6,textTransform:"uppercase"}}>Sample Fees</label>
                  <input type="number" value={v.sampleFees} onChange={e=>updateVariant(idx,"sampleFees",e.target.value)} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:6,padding:"8px 10px",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
                </div>
                <div>
                  <label style={{display:"block",fontSize:11,fontWeight:600,color:"#475569",marginBottom:6,textTransform:"uppercase"}}>ROI %</label>
                  <input type="number" value={v.roi} onChange={e=>updateVariant(idx,"roi",e.target.value)} step="0.1" style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:6,padding:"8px 10px",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
                </div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginBottom:16}}>
                <div>
                  <label style={{display:"block",fontSize:11,fontWeight:600,color:"#475569",marginBottom:6,textTransform:"uppercase"}}>Subvention %</label>
                  <input type="number" value={v.subvention} onChange={e=>updateVariant(idx,"subvention",e.target.value)} step="0.1" style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:6,padding:"8px 10px",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
                </div>
                <div>
                  <label style={{display:"block",fontSize:11,fontWeight:600,color:"#475569",marginBottom:6,textTransform:"uppercase"}}>Tenure (Months)</label>
                  <input type="number" value={v.tenure} onChange={e=>updateVariant(idx,"tenure",e.target.value)} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:6,padding:"8px 10px",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
                </div>
                <div>
                  <label style={{display:"block",fontSize:11,fontWeight:600,color:"#475569",marginBottom:6,textTransform:"uppercase"}}>Advance EMI</label>
                  <input type="number" value={v.advanceEmi} onChange={e=>updateVariant(idx,"advanceEmi",e.target.value)} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:6,padding:"8px 10px",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
                </div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:16,marginBottom:20}}>
                <div>
                  <label style={{display:"block",fontSize:11,fontWeight:600,color:"#475569",marginBottom:6,textTransform:"uppercase"}}>Processing Fee</label>
                  <div style={{display:"flex",gap:8}}>
                    <input type="number" value={v.processingFee} onChange={e=>updateVariant(idx,"processingFee",e.target.value)} step="0.1" style={{flex:1,border:"1px solid #e2e8f0",borderRadius:6,padding:"8px 10px",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
                    <select value={v.processingFeeType} onChange={e=>updateVariant(idx,"processingFeeType",e.target.value)} style={{flex:0.3,border:"1px solid #e2e8f0",borderRadius:6,padding:"8px 10px",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}>
                      <option value="%">%</option>
                      <option value="₹">₹</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div style={{background:"#f1f5f9",borderRadius:8,padding:16,marginBottom:16}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,fontSize:13}}>
                  <div><span style={{color:"#64748b"}}>Subvention Amount:</span> <strong style={{color:"#1e293b"}}>{fmt(calc.subvAmt)}</strong></div>
                  <div><span style={{color:"#64748b"}}>Subvention GST:</span> <strong style={{color:"#1e293b"}}>{fmt(calc.subvGST)}</strong></div>
                  <div><span style={{color:"#64748b"}}>Cost to Institute:</span> <strong style={{color:"#1e293b"}}>{fmt(calc.costToInstitute)}</strong></div>
                  <div><span style={{color:"#64748b"}}>Disbursement:</span> <strong style={{color:"#1e293b"}}>{fmt(calc.disbursement)}</strong></div>
                  <div><span style={{color:"#64748b"}}>Monthly EMI:</span> <strong style={{color:"#1e293b"}}>{fmt(calc.emi)}</strong></div>
                  <div><span style={{color:"#64748b"}}>ROI Charge:</span> <strong style={{color:"#1e293b"}}>{fmt(calc.roiCharge)}</strong></div>
                  <div><span style={{color:"#64748b"}}>Processing Fee (₹):</span> <strong style={{color:"#1e293b"}}>{fmt(calc.pfRupee)}</strong></div>
                  <div><span style={{color:"#64748b"}}>Processing Fee GST:</span> <strong style={{color:"#1e293b"}}>{fmt(calc.pfGST)}</strong></div>
                  <div><span style={{color:"#64748b"}}>Cost to Student:</span> <strong style={{color:"#1e293b"}}>{fmt(calc.cts)}</strong></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{display:"flex",gap:12,paddingTop:20,borderTop:"1px solid #e2e8f0"}}>
        <button onClick={addVariant} style={{background:"#fff",color:"#2563eb",border:"2px solid #2563eb",borderRadius:6,padding:"8px 16px",fontSize:13,fontWeight:600,cursor:"pointer"}}>+ Add Variant</button>
        <button onClick={saveProposal} disabled={saving} style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:6,padding:"8px 16px",fontSize:13,fontWeight:600,cursor:saving?"not-allowed":"pointer",opacity:saving?.5:1}}>{saving?"Saving...":"Save Proposal"}</button>
        <button onClick={onBack} style={{background:"#fff",color:"#475569",border:"1px solid #e2e8f0",borderRadius:6,padding:"8px 16px",fontSize:13,fontWeight:600,cursor:"pointer"}}>Cancel</button>
      </div>
    </div>
  );
}