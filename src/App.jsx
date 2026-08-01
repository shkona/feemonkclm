
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";
import NewLead from "./NewLead.jsx";

const TENURE_OPTIONS = [3,6,9,10,12,15,18,21,24,27,30,33,36];
const PRODUCTS = ["SV GST","SV Non GST","STD ROI","HYBRID"];
const ADVANCE_EMI_OPTIONS = [0,1,2,3];
const INST_TYPES = ["Engineering College","Medical College","K-12 School","Skill Dev Institute","University","Management Institute","Polytechnic","Other"];
const BIZ_TYPES = ["Trust/Society","Private Limited","Partnership Firm","LLP","Proprietorship","Other"];
const LEAD_SOURCES = ["Direct Sales","Client Website","Channel Partner","Inside Sales Team","North Sales Team","South Sales Team","East Sales Team","West Sales Team","Referral","Other"];
const SOURCE_COLORS = {"Direct Sales":"#2563eb","Client Website":"#0d9488","Channel Partner":"#d97706","Inside Sales Team":"#2563eb","Referral":"#db2777"};
const STATUS_META = {
  LEAD_CREATED:       {label:"Lead Created",       color:"#64748b", bg:"#f1f5f9", step:1},
  MGMT_VETTED:        {label:"Mgmt Vetted",        color:"#2563eb", bg:"#eff6ff", step:2},
  PROPOSAL_IN_REVIEW: {label:"Proposal In Review", color:"#b45309", bg:"#fef3c7", step:3},
  PROPOSAL_APPROVED:  {label:"Proposal Approved",  color:"#15803d", bg:"#f0fdf4", step:4},
  MOU_IN_PROGRESS:    {label:"MOU In Progress",    color:"#7c3aed", bg:"#f5f3ff", step:5},
  COMPLETED:          {label:"Completed",          color:"#15803d", bg:"#f0fdf4", step:6},
  REJECTED:           {label:"Rejected",           color:"#b91c1c", bg:"#fee2e2", step:0},
};
const STEPS = ["Lead Created","Mgmt Vetted","Proposal Review","Proposal Approved","MOU","Completed"];

// ── Calculations ──────────────────────────────────────────────────────────────
function calcIRR(cfs) {
  const guesses = [0.005,0.01,0.02,0.05,0.1,0.15,0.2,0.3];
  for (let g=0;g<guesses.length;g++) {
    let rate=guesses[g], ok=false;
    for (let i=0;i<2000;i++) {
      let npv=0,dn=0;
      for (let t=0;t<cfs.length;t++){const d=Math.pow(1+rate,t);npv+=cfs[t]/d;dn-=t*cfs[t]/(d*(1+rate));}
      if(Math.abs(dn)<1e-14)break;
      const nr=rate-npv/dn;
      if(Math.abs(nr-rate)<1e-10){rate=nr;ok=true;break;}
      rate=nr; if(rate<=-1||!isFinite(rate))break;
    }
    if(ok&&rate>0.0001&&isFinite(rate)){const a=rate*12*100;if(a>0&&isFinite(a))return a;}
  }
  return null;
}
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
  const advAmt=emi*advEmi, rem=tenure-advEmi;
  const m0w=-fees+advAmt+pfRupee+subvAmt;
  const m0wo=-fees+advAmt+subvAmt;
  const irrW=rem>0?calcIRR([m0w,...Array(Math.max(0,rem)).fill(emi)]):null;
  const irrWo=rem>0?calcIRR([m0wo,...Array(Math.max(0,rem)).fill(emi)]):null;
  return {subvAmt,subvGST,disbursement,costToInstitute:cti,emi,roiCharge:totalInt,costToStudent:cts,pfRupee,pfGST,irrWithPF:irrW,irrWithoutPF:irrWo};
}
function fmt(n){return "\u20B9"+Math.round(n).toLocaleString("en-IN");}
function roiOff(p){return p==="SV GST"||p==="SV Non GST";}
function subvOff(p){return p==="STD ROI";}

// ── Shared UI ─────────────────────────────────────────────────────────────────
const S = {
  sidebar:{width:220,background:"#1e3a8a",color:"#fff",display:"flex",flexDirection:"column",flexShrink:0,position:"fixed",top:0,left:0,height:"100vh",overflowY:"auto",zIndex:100,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"},
  main:{flex:1,marginLeft:220,display:"flex",flexDirection:"column",minHeight:"100vh",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",background:"#f1f5f9"},
  topbar:{background:"#fff",borderBottom:"1px solid #e2e8f0",padding:"0 24px",height:56,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50},
  content:{padding:24,flex:1},
  card:{background:"#fff",borderRadius:10,border:"1px solid #e2e8f0",marginBottom:20},
  th:{textAlign:"left",padding:"9px 12px",fontSize:11,color:"#64748b",fontWeight:600,textTransform:"uppercase",letterSpacing:".4px",borderBottom:"1px solid #f1f5f9",background:"#fafafa",whiteSpace:"nowrap"},
  td:{padding:"9px 12px",borderBottom:"1px solid #f9fafb",verticalAlign:"middle",fontSize:13},
};

function Badge({status}){
  const m=STATUS_META[status]||STATUS_META.LEAD_CREATED;
  return <span style={{display:"inline-flex",alignItems:"center",padding:"3px 9px",borderRadius:20,fontSize:11,fontWeight:600,whiteSpace:"nowrap",background:m.bg,color:m.color}}>{m.label}</span>;
}
function StepBar({status}){
  if(status==="REJECTED")return <span style={{fontSize:11,color:"#b91c1c",fontWeight:600}}>Rejected</span>;
  const cur=(STATUS_META[status]?.step||1)-1;
  return(
    <div style={{display:"flex",alignItems:"center"}}>
      {STEPS.map((s,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center"}}>
          <div style={{width:18,height:18,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,border:"2px solid",borderColor:i<=cur?"#2563eb":"#cbd5e1",background:i<=cur?"#2563eb":"#fff",color:i<=cur?"#fff":"#94a3b8"}}>{i+1}</div>
          {i<STEPS.length-1&&<div style={{height:2,width:16,background:i<cur?"#2563eb":"#e2e8f0"}}/>}
        </div>
      ))}
    </div>
  );
}
function Spinner(){return <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:48}}><div style={{width:32,height:32,border:"4px solid #e2e8f0",borderTop:"4px solid #2563eb",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;}
function Alert({type,message,onClose}){
  const s=type==="error"?{background:"#fee2e2",border:"1px solid #fca5a5",color:"#b91c1c"}:{background:"#f0fdf4",border:"1px solid #bbf7d0",color:"#15803d"};
  return <div style={{...s,borderRadius:8,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,fontSize:13}}><span>{message}</span>{onClose&&<button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,opacity:.6,marginLeft:12}}>×</button>}</div>;
}
function Btn({children,onClick,variant="primary",disabled,style={}}){
  const base={padding:"7px 16px",borderRadius:6,fontSize:13,cursor:disabled?"not-allowed":"pointer",border:"1px solid",fontWeight:500,transition:"background .15s",opacity:disabled?.5:1,...style};
  const v={primary:{background:"#2563eb",color:"#fff",borderColor:"#2563eb"},secondary:{background:"#fff",color:"#1e293b",borderColor:"#e2e8f0"},danger:{background:"#ef4444",color:"#fff",borderColor:"#ef4444"},success:{background:"#10b981",color:"#fff",borderColor:"#10b981"}};
  return <button onClick={disabled?undefined:onClick} style={{...base,...v[variant]}}>{children}</button>;
}

// ── Login ─────────────────────────────────────────────────────────────────────
function LoginScreen({onLogin}){
  const emailRef=useRef(),passRef=useRef();
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const handleLogin=async()=>{
    const email=emailRef.current.value, password=passRef.current.value;
    if(!email||!password){setError("Please enter email and password");return;}
    setLoading(true);setError("");
    const {data,error:err}=await supabase.auth.signInWithPassword({email,password});
    if(err){setError(err.message);setLoading(false);return;}
    const {data:u}=await supabase.from("users").select("*").eq("id",data.user.id).single();
    if(!u){setError("User profile not found.");setLoading(false);return;}
    if(!u.active){setError("Account deactivated. Contact admin.");setLoading(false);return;}
    onLogin(u);setLoading(false);
  };
  const ic={width:"100%",border:"1px solid #e2e8f0",borderRadius:6,padding:"10px 12px",fontSize:14,outline:"none",fontFamily:"inherit"};
  return(
    <div style={{minHeight:"100vh",background:"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      <div style={{background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",padding:40,width:"100%",maxWidth:400,boxShadow:"0 4px 24px rgba(0,0,0,.07)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:32}}>
          <div style={{width:42,height:42,background:"#1e3a8a",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:18}}>F</div>
          <div><div style={{fontWeight:700,color:"#1e293b",fontSize:18}}>Feemonk CLM</div><div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>Sales & Contract Management</div></div>
        </div>
        {error&&<Alert type="error" message={error} onClose={()=>setError("")}/>}
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div><label style={{display:"block",fontSize:12,fontWeight:600,color:"#475569",marginBottom:6}}>Email</label><input ref={emailRef} type="email" placeholder="you@feemonk.com" style={ic} onKeyDown={e=>e.key==="Enter"&&handleLogin()}/></div>
          <div><label style={{display:"block",fontSize:12,fontWeight:600,color:"#475569",marginBottom:6}}>Password</label><input ref={passRef} type="password" placeholder="••••••••" style={ic} onKeyDown={e=>e.key==="Enter"&&handleLogin()}/></div>
          <Btn onClick={handleLogin} disabled={loading} style={{marginTop:8,padding:"10px 16px",fontSize:14}}>{loading?"Signing in...":"Sign In"}</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Lead Detail ───────────────────────────────────────────────────────────────
function LeadDetail({leadId,currentUser,onBack,onRefresh}){
  const [lead,setLead]=useState(null);
  const [loading,setLoading]=useState(true);
  const [subView,setSubView]=useState("detail");
  const [rejectReason,setRejectReason]=useState("");
  const [showReject,setShowReject]=useState(false);
  const [saving,setSaving]=useState(false);

  useEffect(()=>{loadData();},[leadId]);
  const loadData=async()=>{
    setLoading(true);
    const {data:l}=await supabase.from("leads").select("*, users!leads_created_by_fkey(name,role)").eq("id",leadId).single();
    setLead(l);setLoading(false);
  };
  
  const approveLead=async()=>{
    setSaving(true);
    await supabase.from("leads").update({status:"MGMT_VETTED"}).eq("id",leadId);
    await supabase.from("comments").insert({lead_id:leadId,text:"Lead approved. Sales can now build a proposal.",created_by:currentUser.id,role:currentUser.role});
    setSaving(false);
    loadData();
    onRefresh();
  };

  // ✅ FIXED: Added onBack() to navigate back to pipeline after rejection
  const rejectLead=async()=>{
    if(!rejectReason.trim())return;
    setSaving(true);
    await supabase.from("leads").update({status:"REJECTED",rejection_reason:rejectReason}).eq("id",leadId);
    await supabase.from("comments").insert({lead_id:leadId,text:"Lead rejected: "+rejectReason,created_by:currentUser.id,role:currentUser.role});
    setShowReject(false);
    setSaving(false);
    onRefresh(); // Refresh parent pipeline
    setTimeout(()=>onBack(), 500); // Navigate back after brief delay
  };

  if(loading)return <Spinner/>;
  if(!lead)return <div style={{color:"#94a3b8"}}>Lead not found.</div>;

  const isMgmt=currentUser.role==="Management";

  return(
    <div style={{maxWidth:900}}>
      <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",color:"#2563eb",fontSize:13,marginBottom:16,display:"flex",alignItems:"center",gap:4,padding:0,fontFamily:"inherit"}}>← Back to Pipeline</button>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:20}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:700,color:"#1e293b",margin:0}}>{lead.name}</h2>
          {lead.legal_name&&lead.legal_name!==lead.name&&<p style={{fontSize:12,color:"#94a3b8",margin:"3px 0 0"}}>Legal: {lead.legal_name}</p>}
          <p style={{fontSize:13,color:"#64748b",margin:"4px 0 0"}}>{lead.institute_type} · Est. {lead.estd_year} · {lead.business_type}{lead.source?" · "+lead.source:""}</p>
          <p style={{fontSize:12,color:"#94a3b8",margin:"2px 0 0"}}>Created by: {lead.users?.name} ({lead.users?.role})</p>
        </div>
        <Badge status={lead.status}/>
      </div>

      {lead.status!=="REJECTED"&&<div style={{marginBottom:20}}><StepBar status={lead.status}/></div>}

      {isMgmt&&lead.status==="LEAD_CREATED"&&(
        <div style={{background:lead.created_by===currentUser.id?"#eff6ff":"#fef3c7",border:"1px solid",borderColor:lead.created_by===currentUser.id?"#bfdbfe":"#fde68a",borderRadius:8,padding:16,marginBottom:20}}>
          {showReject?(
            <div>
              <div style={{fontSize:13,fontWeight:600,color:"#1e293b",marginBottom:8}}>Reason for rejection</div>
              <textarea value={rejectReason} onChange={e=>setRejectReason(e.target.value)} rows={2} placeholder="e.g. Turnover too low..." style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:6,padding:"8px 10px",fontSize:13,outline:"none",resize:"none",marginBottom:8,boxSizing:"border-box",fontFamily:"inherit"}}/>
              <div style={{display:"flex",gap:8}}>
                <Btn variant="danger" onClick={rejectLead} disabled={!rejectReason.trim()||saving}>Confirm Rejection</Btn>
                <Btn variant="secondary" onClick={()=>setShowReject(false)}>Cancel</Btn>
              </div>
            </div>
          ):(
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:lead.created_by===currentUser.id?"#1d4ed8":"#b45309"}}>{lead.created_by===currentUser.id?"You created this lead":"Pending Your Vetting"}</div>
                <div style={{fontSize:12,color:"#64748b",marginTop:2}}>Approve to move to the proposal stage.</div>
              </div>
              <div style={{display:"flex",gap:8}}>
                {/* ✅ FIXED: Changed condition to allow all management users to reject */}
                <Btn variant="danger" onClick={()=>setShowReject(true)}>Reject</Btn>
                <Btn variant="success" onClick={approveLead} disabled={saving}>Approve ✓</Btn>
              </div>
            </div>
          )}
        </div>
      )}

      {lead.status==="REJECTED"&&<div style={{background:"#fee2e2",border:"1px solid #fca5a5",borderRadius:8,padding:14,fontSize:13,color:"#b91c1c",marginBottom:16}}><strong>Rejected:</strong> {lead.rejection_reason}</div>}
    </div>
  );
}

// ── Pipeline ──────────────────────────────────────────────────────────────────
function Pipeline({currentUser,onSelectLead,refreshKey}){
  const [leads,setLeads]=useState([]);
  const [loading,setLoading]=useState(true);
  const [filterStatus,setFilterStatus]=useState("ALL");

  // ✅ FIXED: Added refreshKey to dependency array to reload when parent refreshes
  useEffect(()=>{loadLeads();},[refreshKey]);
  
  const loadLeads=async()=>{
    setLoading(true);
    let q=supabase.from("leads").select("*, users!leads_created_by_fkey(name,role)").order("created_at",{ascending:false});
    if(currentUser.role!=="Management")q=q.eq("created_by",currentUser.id);
    const {data}=await q;
    setLeads(data||[]);setLoading(false);
  };
  const filtered=filterStatus==="ALL"?leads:leads.filter(l=>l.status===filterStatus);

  return(
    <div>
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        {["ALL",...Object.keys(STATUS_META)].map(s=>{
          const m=STATUS_META[s];
          const active=filterStatus===s;
          return <button key={s} onClick={()=>setFilterStatus(s)} style={{padding:"5px 12px",borderRadius:20,border:"1px solid",borderColor:active?"#2563eb":"#e2e8f0",background:active?"#2563eb":"#fff",color:active?"#fff":"#64748b",fontSize:11,fontWeight:600,cursor:"pointer",transition:"all .15s"}}>{s==="ALL"?"All":m.label}</button>;
        })}
      </div>
      {loading?<Spinner/>:(
        <div style={S.card}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead><tr>{["Institute","Created By","Source","Turnover","Status","Progress","Date"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.length===0&&<tr><td colSpan={7} style={{textAlign:"center",padding:40,color:"#94a3b8",fontSize:13}}>No leads found.</td></tr>}
              {filtered.map(l=>(
                <tr key={l.id} onClick={()=>onSelectLead(l.id)} style={{borderBottom:"1px solid #f8fafc",cursor:"pointer",transition:"background .1s"}} onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background=""}>
                  <td style={S.td}><div style={{fontWeight:600,color:"#1e293b"}}>{l.name}</div>{l.legal_name&&l.legal_name!==l.name&&<div style={{fontSize:11,color:"#94a3b8",marginTop:1}}>{l.legal_name}</div>}</td>
                  <td style={{...S.td,color:"#64748b",fontSize:12}}>{l.users?.name}</td>
                  <td style={S.td}>{l.source?<span style={{fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:12,background:"#eff6ff",color:"#2563eb"}}>{l.source}</span>:"--"}</td>
                  <td style={{...S.td,color:"#64748b"}}>{l.turnover}</td>
                  <td style={S.td}><Badge status={l.status}/></td>
                  <td style={S.td}><StepBar status={l.status}/></td>
                  <td style={{...S.td,color:"#94a3b8",fontSize:12}}>{new Date(l.created_at).toLocaleDateString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export { Btn, Alert };
export default function App(){
  const [currentUser,setCurrentUser]=useState(null);
  const [authLoading,setAuthLoading]=useState(true);
  const [view,setView]=useState("dashboard");
  const [selectedLeadId,setSelectedLeadId]=useState(null);
  const [refreshTrigger,setRefreshTrigger]=useState(0); // ✅ FIXED: Added refresh trigger

  useEffect(()=>{
    supabase.auth.getSession().then(async({data:{session}})=>{
      if(session){const {data}=await supabase.from("users").select("*").eq("id",session.user.id).single();if(data&&data.active)setCurrentUser(data);}
      setAuthLoading(false);
    });
    const {data:{subscription}}=supabase.auth.onAuthStateChange(async(event,session)=>{if(event==="SIGNED_OUT")setCurrentUser(null);});
    return()=>subscription.unsubscribe();
  },[]);

  const handleLogout=async()=>{await supabase.auth.signOut();setCurrentUser(null);setView("dashboard");};

  if(authLoading)return <div style={{minHeight:"100vh",background:"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center"}}><Spinner/></div>;
  if(!currentUser)return <LoginScreen onLogin={setCurrentUser}/>;

  const isMgmt=currentUser.role==="Management";
  const navItems=[
    {id:"dashboard",icon:"📊",label:"Dashboard"},
    {id:"pipeline",icon:"📋",label:"Pipeline"},
    ...(isMgmt?[{id:"approvals",icon:"✅",label:"Approvals"},{id:"users",icon:"👥",label:"Users"}]:[]),
  ];
  const pageTitle={dashboard:"Dashboard",pipeline:"Pipeline",approvals:"Pending Approvals",users:"User Management",new:"New Lead"};
  const roleColors={Sales:{background:"#2563eb"},["Channel Partner"]:{background:"#d97706"},Management:{background:"#6d28d9"}};

  return(
    <div style={{display:"flex",minHeight:"100vh"}}>
      {/* Sidebar */}
      <div style={S.sidebar}>
        <div style={{padding:"20px 16px 16px",borderBottom:"1px solid rgba(255,255,255,.1)"}}>
          <div style={{fontSize:18,fontWeight:700,letterSpacing:"-.3px"}}>FeeMonk</div>
          <div style={{fontSize:11,opacity:.5,marginTop:2}}>Sales & Contract Management</div>
        </div>
        <div style={{padding:"16px 14px 5px",fontSize:10,textTransform:"uppercase",letterSpacing:1,opacity:.4,fontWeight:600}}>Navigation</div>
        {navItems.map(item=>(
          <div key={item.id} onClick={()=>{setView(item.id);setSelectedLeadId(null);}} style={{display:"flex",alignItems:"center",gap:9,padding:"10px 16px",cursor:"pointer",fontSize:13,transition:"background .15s",borderLeft:"3px solid",borderLeftColor:view===item.id?"rgba(255,255,255,.4)":"transparent",background:view===item.id?"#2563eb":"transparent",color:"#fff"}}>
            <span style={{fontSize:15,width:18,textAlign:"center"}}>{item.icon}</span>{item.label}
          </div>
        ))}
        <div style={{marginTop:"auto",padding:"14px 16px",borderTop:"1px solid rgba(255,255,255,.1)",fontSize:11,opacity:.4}}>FeeMonk · {new Date().getFullYear()}</div>
      </div>

      {/* Main */}
      <div style={S.main}>
        {/* Topbar */}
        <div style={S.topbar}>
          <span style={{fontSize:16,fontWeight:600,color:"#1e293b"}}>{pageTitle[view]||"FeeMonk CLM"}</span>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <Btn onClick={()=>{setView("new");setSelectedLeadId(null);}} style={{background:"#1e3a8a",borderColor:"#1e3a8a",color:"#fff",fontWeight:600}}>+ New Lead</Btn>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:30,height:30,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12,fontWeight:700,...(roleColors[currentUser.role]||{background:"#64748b"})}}>{currentUser.name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}</div>
              <div style={{lineHeight:1.3}}>
                <div style={{fontSize:13,fontWeight:600,color:"#1e293b"}}>{currentUser.name}</div>
                <div style={{fontSize:11,color:"#94a3b8"}}>{currentUser.role}</div>
              </div>
            </div>
            <button onClick={handleLogout} style={{padding:"6px 12px",borderRadius:6,border:"1px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Sign out</button>
          </div>
        </div>

        {/* Content */}
        <div style={S.content}>
          {view==="dashboard"&&<Dashboard currentUser={currentUser} onNavigate={v=>{setView(v);setSelectedLeadId(null);}}/>}
          {view==="pipeline"&&!selectedLeadId&&(
            <div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
                <div><h1 style={{fontSize:18,fontWeight:700,color:"#1e293b",margin:0}}>Pipeline</h1><p style={{fontSize:13,color:"#64748b",margin:"4px 0 0"}}>{isMgmt?"All leads across the team.":"Your submitted leads."}</p></div>
              </div>
              {/* ✅ FIXED: Pass refreshKey and updated onRefresh callback */}
              <Pipeline currentUser={currentUser} onSelectLead={id=>setSelectedLeadId(id)} refreshKey={refreshTrigger}/>
            </div>
          )}
          {view==="pipeline"&&selectedLeadId&&<LeadDetail leadId={selectedLeadId} currentUser={currentUser} onBack={()=>setSelectedLeadId(null)} onRefresh={()=>setRefreshTrigger(t=>t+1)}/>}
          {view==="new"&&<NewLead currentUser={currentUser} onSubmit={()=>setView("pipeline")} onCancel={()=>setView("dashboard")}/>}
          {view==="approvals"&&isMgmt&&(
            <div>
              <div style={{marginBottom:20}}><h1 style={{fontSize:18,fontWeight:700,color:"#1e293b",margin:0}}>Pending Approvals</h1><p style={{fontSize:13,color:"#64748b",margin:"4px 0 0"}}>Leads and proposals awaiting your review.</p></div>
              <Pipeline currentUser={currentUser} onSelectLead={id=>{setSelectedLeadId(id);setView("pipeline");}} refreshKey={refreshTrigger}/>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
