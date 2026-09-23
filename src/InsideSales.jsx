import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";
import AddPreLeadModal from "./AddPreLeadModal.jsx";
import { parseCSVFile, downloadCSVTemplate } from "./importUtils.js";

const TEMPLATE_HEADERS = ["Contact Name","Title","Company Name","Email","Phone","Website","City","LinkedIn URL"];

function normalizeKey(h){
  return h.toLowerCase().replace(/[^a-z0-9]/g,"");
}

const FIELD_MAP = {
  contactname:"contact_name",
  name:"contact_name",
  title:"title",
  jobtitle:"title",
  companyname:"company_name",
  company:"company_name",
  institute:"company_name",
  email:"email",
  emailaddress:"email",
  phone:"phone",
  phonenumber:"phone",
  mobile:"phone",
  website:"website",
  companywebsite:"website",
  city:"city",
  location:"city",
  linkedinurl:"linkedin_url",
  linkedin:"linkedin_url",
  linkedinprofile:"linkedin_url",
};

const STATUS_META = {
  SCREENER:   {label:"Screener",         color:"#0891b2", bg:"#ecfeff"},
  REJECTED:   {label:"Rejected",         color:"#b91c1c", bg:"#fee2e2"},
  CLEAN:      {label:"Clean",            color:"#15803d", bg:"#f0fdf4"},
  CONVERTED:  {label:"Converted to Lead",color:"#7c3aed", bg:"#f5f3ff"},
};

function Badge({status}){
  const m=STATUS_META[status]||STATUS_META.SCREENER;
  return <span style={{display:"inline-flex",alignItems:"center",padding:"3px 9px",borderRadius:20,fontSize:11,fontWeight:600,whiteSpace:"nowrap",background:m.bg,color:m.color}}>{m.label}</span>;
}

export default function InsideSales({currentUser,onSelectLead}){
  const [preLeads,setPreLeads]=useState([]);
  const [loading,setLoading]=useState(true);
  const [filterStatus,setFilterStatus]=useState("ALL");
  const [filterFromDate,setFilterFromDate]=useState("");
  const [filterToDate,setFilterToDate]=useState("");
  const [showAddModal,setShowAddModal]=useState(false);
  const [updatingId,setUpdatingId]=useState(null);
  const [error,setError]=useState("");
  const [importing,setImporting]=useState(false);
  const [importResult,setImportResult]=useState(null);
  const fileInputRef=useRef(null);

  useEffect(()=>{
    loadPreLeads();
  },[]);

  const loadPreLeads=async()=>{
    setLoading(true);
    try{
      const {data}=await supabase.from("pre_leads").select("*, users!pre_leads_created_by_fkey(name)").order("created_at",{ascending:false});
      setPreLeads(data||[]);
    }catch(err){
      console.error("Error loading pre-leads:",err);
    }finally{
      setLoading(false);
    }
  };

  const changeStatus=async(preLead,newStatus)=>{
    if(newStatus===preLead.status)return;
    setUpdatingId(preLead.id);
    setError("");
    try{
      if(newStatus==="CONVERTED"){
        const leadName=preLead.company_name||preLead.contact_name;
        const {data:newLead,error:leadErr}=await supabase.from("leads").insert({
          name:leadName,
          contact_name:preLead.contact_name,
          contact_email:preLead.email,
          contact_phone:preLead.phone,
          source:"Inside Sales Team",
          status:"LEAD_CREATED",
          created_by:currentUser.id,
        }).select().single();

        if(leadErr)throw leadErr;

        const {error:updErr}=await supabase.from("pre_leads").update({
          status:"CONVERTED",
          converted_lead_id:newLead.id,
        }).eq("id",preLead.id);

        if(updErr)throw updErr;
      }else{
        const {error:updErr}=await supabase.from("pre_leads").update({status:newStatus}).eq("id",preLead.id);
        if(updErr)throw updErr;
      }

      await loadPreLeads();
    }catch(err){
      console.error("Error changing pre-lead status:",err);
      setError(err.message||"Failed to change status");
    }finally{
      setUpdatingId(null);
    }
  };

  const handleDownloadTemplate=()=>{
    downloadCSVTemplate(TEMPLATE_HEADERS,"PreLeads_Template.csv");
  };

  const handleImportClick=()=>{
    fileInputRef.current?.click();
  };

  const handleFileSelected=async(e)=>{
    const file=e.target.files?.[0];
    e.target.value="";
    if(!file)return;

    setImporting(true);
    setImportResult(null);
    setError("");
    try{
      const rows=await parseCSVFile(file);
      if(rows.length===0){
        setImportResult({imported:0,skipped:[],total:0,message:"No rows found in file."});
        return;
      }

      const toInsert=[];
      const skipped=[];

      rows.forEach((row,idx)=>{
        const mapped={};
        Object.entries(row).forEach(([key,value])=>{
          const field=FIELD_MAP[normalizeKey(key)];
          if(field)mapped[field]=value;
        });

        if(!mapped.contact_name||!mapped.contact_name.trim()){
          skipped.push(`Row ${idx+2}: missing Contact Name`);
          return;
        }

        toInsert.push({
          contact_name:mapped.contact_name.trim(),
          title:mapped.title?.trim()||null,
          company_name:mapped.company_name?.trim()||null,
          email:mapped.email?.trim()||null,
          phone:mapped.phone?.trim()||null,
          website:mapped.website?.trim()||null,
          city:mapped.city?.trim()||null,
          linkedin_url:mapped.linkedin_url?.trim()||null,
          status:"SCREENER",
          created_by:currentUser.id,
        });
      });

      const batchSize=200;
      let insertedCount=0;
      for(let i=0;i<toInsert.length;i+=batchSize){
        const batch=toInsert.slice(i,i+batchSize);
        const {error:err}=await supabase.from("pre_leads").insert(batch);
        if(err){
          skipped.push(`Rows ${i+1}-${i+batch.length}: ${err.message}`);
        }else{
          insertedCount+=batch.length;
        }
      }

      setImportResult({imported:insertedCount,skipped,total:rows.length});
      await loadPreLeads();
    }catch(err){
      console.error("Error importing pre-leads:",err);
      setError(err.message||"Failed to import file");
    }finally{
      setImporting(false);
    }
  };

  const filtered=preLeads.filter(p=>{
    const statusMatch=filterStatus==="ALL"||p.status===filterStatus;

    let dateMatch=true;
    if(filterFromDate||filterToDate){
      const createdDate=new Date(p.created_at);
      if(filterFromDate)dateMatch=dateMatch&&createdDate>=new Date(filterFromDate);
      if(filterToDate){
        const toDate=new Date(filterToDate);
        toDate.setHours(23,59,59,999);
        dateMatch=dateMatch&&createdDate<=toDate;
      }
    }

    return statusMatch&&dateMatch;
  });

  return(
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <div>
          <h1 style={{fontSize:18,fontWeight:700,color:"#1e293b",margin:0}}>Email Marketing</h1>
          <p style={{fontSize:13,color:"#64748b",margin:"4px 0 0"}}>Pre-leads sourced from LinkedIn, Apollo & email nurture sequences.</p>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button
            onClick={handleDownloadTemplate}
            style={{background:"#fff",color:"#475569",border:"1px solid #e2e8f0",borderRadius:6,padding:"10px 16px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}
          >⬇ Download Template</button>
          <button
            onClick={handleImportClick}
            disabled={importing}
            style={{background:"#fff",color:"#475569",border:"1px solid #e2e8f0",borderRadius:6,padding:"10px 16px",fontSize:13,fontWeight:600,cursor:importing?"not-allowed":"pointer",opacity:importing?0.5:1,fontFamily:"inherit"}}
          >{importing?"Importing...":"⬆ Import"}</button>
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileSelected} style={{display:"none"}}/>
          <button
            onClick={()=>setShowAddModal(true)}
            style={{background:"#1e3a8a",color:"#fff",border:"none",borderRadius:6,padding:"10px 20px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}
          >+ Add Pre-Lead</button>
        </div>
      </div>

      {error&&<div style={{background:"#fee2e2",border:"1px solid #fca5a5",borderRadius:8,padding:12,marginBottom:16,color:"#b91c1c",fontSize:12}}>{error}</div>}

      {importResult&&(
        <div style={{background:importResult.skipped.length>0?"#fffbeb":"#f0fdf4",border:`1px solid ${importResult.skipped.length>0?"#fcd34d":"#bbf7d0"}`,borderRadius:8,padding:12,marginBottom:16,fontSize:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <strong>{importResult.message||`Imported ${importResult.imported} of ${importResult.total} row${importResult.total!==1?"s":""}.`}</strong>
              {importResult.skipped.length>0&&(
                <ul style={{margin:"8px 0 0",paddingLeft:18,color:"#92400e"}}>
                  {importResult.skipped.slice(0,8).map((s,i)=><li key={i}>{s}</li>)}
                  {importResult.skipped.length>8&&<li>...and {importResult.skipped.length-8} more</li>}
                </ul>
              )}
            </div>
            <button onClick={()=>setImportResult(null)} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,opacity:.6}}>×</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{display:"flex",gap:16,marginBottom:20,flexWrap:"wrap",alignItems:"flex-end"}}>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {["ALL",...Object.keys(STATUS_META)].map(s=>{
            const m=STATUS_META[s];
            const active=filterStatus===s;
            return <button key={s} onClick={()=>setFilterStatus(s)} style={{padding:"5px 12px",borderRadius:20,border:"1px solid",borderColor:active?"#2563eb":"#e2e8f0",background:active?"#2563eb":"#fff",color:active?"#fff":"#64748b",fontSize:11,fontWeight:600,cursor:"pointer",transition:"all .15s"}}>{s==="ALL"?"All":m.label}</button>;
          })}
        </div>

        <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
          <div>
            <label style={{display:"block",fontSize:10,fontWeight:600,color:"#475569",marginBottom:4}}>From Date</label>
            <input type="date" value={filterFromDate} onChange={e=>setFilterFromDate(e.target.value)} style={{padding:"6px 8px",borderRadius:6,border:"1px solid #e2e8f0",fontSize:12,fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
          <div>
            <label style={{display:"block",fontSize:10,fontWeight:600,color:"#475569",marginBottom:4}}>To Date</label>
            <input type="date" value={filterToDate} onChange={e=>setFilterToDate(e.target.value)} style={{padding:"6px 8px",borderRadius:6,border:"1px solid #e2e8f0",fontSize:12,fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
          {(filterFromDate||filterToDate)&&(
            <button onClick={()=>{setFilterFromDate("");setFilterToDate("");}} style={{padding:"6px 14px",borderRadius:6,border:"1px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Clear</button>
          )}
        </div>

        <div style={{marginLeft:"auto",fontSize:12,color:"#64748b",paddingBottom:6}}>{filtered.length} pre-lead{filtered.length!==1?"s":""}</div>
      </div>

      {/* Table */}
      {loading?
        <div style={{textAlign:"center",padding:40,color:"#94a3b8"}}>Loading...</div>
      :(
        <div style={{background:"#fff",borderRadius:10,border:"1px solid #e2e8f0",overflow:"hidden"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead>
              <tr>
                {["Contact","Title","Company","City","Website","LinkedIn","Added By","Date","Status"].map(h=>
                  <th key={h} style={{textAlign:"left",padding:"9px 12px",fontSize:11,color:"#64748b",fontWeight:600,textTransform:"uppercase",letterSpacing:".4px",borderBottom:"1px solid #f1f5f9",background:"#fafafa",whiteSpace:"nowrap"}}>{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.length===0?
                <tr><td colSpan={9} style={{textAlign:"center",padding:40,color:"#94a3b8",fontSize:13}}>No pre-leads found.</td></tr>
              :
                filtered.map(p=>(
                  <tr key={p.id} style={{borderBottom:"1px solid #f8fafc"}}>
                    <td style={{padding:"9px 12px",verticalAlign:"middle",fontWeight:600,color:"#1e293b"}}>
                      {p.contact_name}
                      {p.email&&<div style={{fontSize:11,color:"#94a3b8",marginTop:1}}>{p.email}</div>}
                      {p.phone&&<div style={{fontSize:11,color:"#94a3b8"}}>{p.phone}</div>}
                    </td>
                    <td style={{padding:"9px 12px",verticalAlign:"middle",color:"#64748b"}}>{p.title||"--"}</td>
                    <td style={{padding:"9px 12px",verticalAlign:"middle",color:"#64748b"}}>{p.company_name||"--"}</td>
                    <td style={{padding:"9px 12px",verticalAlign:"middle",color:"#64748b"}}>{p.city||"--"}</td>
                    <td style={{padding:"9px 12px",verticalAlign:"middle"}}>
                      {p.website?<a href={p.website} target="_blank" rel="noopener noreferrer" style={{color:"#2563eb",fontSize:12,textDecoration:"none"}}>{p.website.replace(/^https?:\/\/(www\.)?/,"").replace(/\/$/,"")}</a>:"--"}
                    </td>
                    <td style={{padding:"9px 12px",verticalAlign:"middle"}}>
                      {p.linkedin_url?<a href={p.linkedin_url} target="_blank" rel="noopener noreferrer" style={{color:"#2563eb",fontSize:12,textDecoration:"none"}}>Profile →</a>:"--"}
                    </td>
                    <td style={{padding:"9px 12px",verticalAlign:"middle",color:"#64748b"}}>{p.users?.name||"Unknown"}</td>
                    <td style={{padding:"9px 12px",verticalAlign:"middle",color:"#94a3b8"}}>{new Date(p.created_at).toLocaleDateString("en-IN")}</td>
                    <td style={{padding:"9px 12px",verticalAlign:"middle"}}>
                      {p.status==="CONVERTED"?(
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <Badge status={p.status}/>
                          {p.converted_lead_id&&onSelectLead&&(
                            <button onClick={()=>onSelectLead(p.converted_lead_id)} style={{background:"none",border:"none",color:"#2563eb",fontSize:11,fontWeight:600,cursor:"pointer",padding:0,fontFamily:"inherit"}}>View Lead →</button>
                          )}
                        </div>
                      ):(
                        <select
                          value={p.status}
                          disabled={updatingId===p.id}
                          onChange={e=>changeStatus(p,e.target.value)}
                          style={{border:"1px solid #e2e8f0",borderRadius:6,padding:"4px 8px",fontSize:11,fontFamily:"inherit",background:"#fff",cursor:updatingId===p.id?"not-allowed":"pointer",opacity:updatingId===p.id?0.5:1}}
                        >
                          {Object.keys(STATUS_META).map(s=><option key={s} value={s}>{STATUS_META[s].label}</option>)}
                        </select>
                      )}
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}

      {showAddModal&&(
        <AddPreLeadModal
          currentUser={currentUser}
          onClose={()=>setShowAddModal(false)}
          onSuccess={loadPreLeads}
        />
      )}
    </div>
  );
}
