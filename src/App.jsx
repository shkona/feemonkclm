import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";
import NewLead from "./NewLead.jsx";
import Dashboard from "./Dashboard.jsx";
import UserManagement from "./Users.jsx"; 
import ProposalBuilder from "./ProposalBuilder.jsx"; 
import Pipeline from "./Pipeline.jsx";
import LeadDetail from "./LeadDetail.jsx"; 
import VisitLog from "./VisitLog.jsx";
import VisitsCalendar from "./VisitsCalendar.jsx";
import FunnelSuccess from "./FunnelSuccess.jsx"; 
import Reports from "./Reports.jsx";

const INST_TYPES = ["Engineering College","Medical College","K-12 School","Skill Dev Institute","University","Management Institute","Polytechnic","Other"];
const BIZ_TYPES = ["Trust/Society","Private Limited","Partnership Firm","LLP","Proprietorship","Other"];
const LEAD_SOURCES = ["Direct Sales","Client Website","Channel Partner","Inside Sales Team","North Sales Team","South Sales Team","East Sales Team","West Sales Team","Referral","Other"];
const STATUS_META = {
  LEAD_CREATED:       {label:"Lead Created",       color:"#64748b", bg:"#f1f5f9", step:1},
  MGMT_VETTED:        {label:"Mgmt Vetted",        color:"#2563eb", bg:"#eff6ff", step:2},
  PROPOSAL_IN_REVIEW: {label:"Proposal In Review", color:"#b45309", bg:"#fef3c7", step:3},
  PROPOSAL_APPROVED:  {label:"Proposal Approved",  color:"#15803d", bg:"#f0fdf4", step:4},
  MOU_IN_PROGRESS:    {label:"MOU In Progress",    color:"#7c3aed", bg:"#f5f3ff", step:5},
  COMPLETED:          {label:"Completed",          color:"#15803d", bg:"#f0fdf4", step:6},
  REJECTED:           {label:"Rejected",           color:"#b91c1c", bg:"#fee2e2", step:0},
};

// ── Shared Styles ─────────────────────────────────────────────────────────────
const S = {
  sidebar:{width:220,background:"#1e3a8a",color:"#fff",display:"flex",flexDirection:"column",flexShrink:0,position:"fixed",top:0,left:0,height:"100vh",overflowY:"auto",zIndex:100,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"},
  main:{flex:1,marginLeft:220,display:"flex",flexDirection:"column",minHeight:"100vh",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",background:"#f1f5f9"},
  topbar:{background:"#fff",borderBottom:"1px solid #e2e8f0",padding:"0 24px",height:56,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50},
  content:{padding:24,flex:1},
};

// ── Shared UI Components ───────────────────────────────────────────────────────
function Spinner(){
  return <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:48}}><div style={{width:32,height:32,border:"4px solid #e2e8f0",borderTop:"4px solid #2563eb",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;
}

function Alert({type,message,onClose}){
  const s=type==="error"?{background:"#fee2e2",border:"1px solid #fca5a5",color:"#b91c1c"}:{background:"#f0fdf4",border:"1px solid #bbf7d0",color:"#15803d"};
  return <div style={{...s,borderRadius:8,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,fontSize:13}}><span>{message}</span>{onClose&&<button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,opacity:.6,marginLeft:12}}>×</button>}</div>;
}

function Btn({children,onClick,variant="primary",disabled,style={}}){
  const base={padding:"7px 16px",borderRadius:6,fontSize:13,cursor:disabled?"not-allowed":"pointer",border:"1px solid",fontWeight:500,transition:"background .15s",opacity:disabled?.5:1,...style};
  const v={primary:{background:"#2563eb",color:"#fff",borderColor:"#2563eb"},secondary:{background:"#fff",color:"#1e293b",borderColor:"#e2e8f0"},danger:{background:"#ef4444",color:"#fff",borderColor:"#ef4444"},success:{background:"#10b981",color:"#fff",borderColor:"#10b981"}};
  return <button onClick={disabled?undefined:onClick} style={{...base,...v[variant]}}>{children}</button>;
}

// ── Login Screen ───────────────────────────────────────────────────────────────
function LoginScreen({onLogin}){
  const emailRef=useRef(),passRef=useRef();
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  
  const handleLogin=async()=>{
    const email=emailRef.current.value, password=passRef.current.value;
    if(!email||!password){setError("Please enter email and password");return;}
    setLoading(true);
    setError("");
    try{
      const {data,error:err}=await supabase.auth.signInWithPassword({email,password});
      if(err)throw err;
      const {data:user}=await supabase.from("users").select("*").eq("id",data.user.id).single();
      if(user&&user.active)onLogin(user);
      else{setError("User account is inactive");await supabase.auth.signOut();}
    }catch(err){
      setError(err.message||"Login failed");
    }finally{
      setLoading(false);
    }
  };

  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#667eea 0%,#764ba2 100%)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      <div style={{background:"#fff",borderRadius:12,padding:40,width:"100%",maxWidth:380,boxShadow:"0 20px 25px -5px rgba(0,0,0,0.1)"}}>
        <h1 style={{fontSize:24,fontWeight:700,color:"#1e293b",margin:"0 0 8px",textAlign:"center"}}>FeeMonk CLM</h1>
        <p style={{fontSize:13,color:"#64748b",textAlign:"center",margin:"0 0 32px"}}>Sales & Contract Management</p>
        {error&&<Alert type="error" message={error} onClose={()=>setError("")}/>}
        <input ref={emailRef} type="email" placeholder="Email" style={{width:"100%",padding:"10px 12px",borderRadius:6,border:"1px solid #e2e8f0",marginBottom:12,fontSize:13,fontFamily:"inherit",boxSizing:"border-box"}}/>
        <input ref={passRef} type="password" placeholder="Password" onKeyPress={e=>e.key==="Enter"&&handleLogin()} style={{width:"100%",padding:"10px 12px",borderRadius:6,border:"1px solid #e2e8f0",marginBottom:20,fontSize:13,fontFamily:"inherit",boxSizing:"border-box"}}/>
        <Btn onClick={handleLogin} disabled={loading} style={{width:"100%"}}>{loading?"Signing in...":"Sign In"}</Btn>
      </div>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────────
export { Btn, Alert };

export default function App(){
  const [currentUser,setCurrentUser]=useState(null);
  const [authLoading,setAuthLoading]=useState(true);
  const [view,setView]=useState("dashboard");
  const [selectedLeadId,setSelectedLeadId]=useState(null);
  const [refreshTrigger,setRefreshTrigger]=useState(0);

  useEffect(()=>{
    supabase.auth.getSession().then(async({data:{session}})=>{
      if(session){
        const {data}=await supabase.from("users").select("*").eq("id",session.user.id).single();
        if(data&&data.active)setCurrentUser(data);
      }
      setAuthLoading(false);
    });
    const {data:{subscription}}=supabase.auth.onAuthStateChange(async(event,session)=>{
      if(event==="SIGNED_OUT")setCurrentUser(null);
    });
    return()=>subscription.unsubscribe();
  },[]);

  const handleLogout=async()=>{
    await supabase.auth.signOut();
    setCurrentUser(null);
    setView("dashboard");
  };

  if(authLoading)return <div style={{minHeight:"100vh",background:"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center"}}><Spinner/></div>;
  if(!currentUser)return <LoginScreen onLogin={setCurrentUser}/>;

  const isMgmt=currentUser.role==="Management";
  const navItems=[
  {id:"dashboard",icon:"📊",label:"Dashboard"},
  {id:"pipeline",icon:"📋",label:"Pipeline"},
  {id:"visits",icon:"📍",label:"Visits"},
  {id:"funnel",icon:"📈",label:"Funnel Success"},
  {id:"reports",icon:"📊",label:"Reports"},
  ...(isMgmt?[{id:"approvals",icon:"✅",label:"Approvals"},{id:"users",icon:"👥",label:"Users"}]:[]),
];
const pageTitle={dashboard:"Dashboard",pipeline:"Pipeline",approvals:"Pending Approvals",users:"User Management",visits:"Visits",funnel:"Funnel Success",reports:"Reports",new:"New Lead"};
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
              <Pipeline currentUser={currentUser} onSelectLead={id=>setSelectedLeadId(id)} refreshKey={refreshTrigger}/>
            </div>
          )}
          {view==="pipeline"&&selectedLeadId&&<LeadDetail leadId={selectedLeadId} currentUser={currentUser} onBack={()=>setSelectedLeadId(null)} onNavigate={(v,params)=>{if(v==="proposal"){setView("proposal");} else {setView(v);}}} onRefresh={()=>setRefreshTrigger(t=>t+1)}/>}
          {view==="new"&&<NewLead currentUser={currentUser} onSubmit={()=>setView("pipeline")} onCancel={()=>setView("dashboard")}/>}
          {view==="approvals"&&isMgmt&&(
            <div>
              <div style={{marginBottom:20}}><h1 style={{fontSize:18,fontWeight:700,color:"#1e293b",margin:0}}>Pending Approvals</h1><p style={{fontSize:13,color:"#64748b",margin:"4px 0 0"}}>Leads and proposals awaiting your review.</p></div>
              <Pipeline currentUser={currentUser} onSelectLead={id=>{setSelectedLeadId(id);setView("pipeline");}} refreshKey={refreshTrigger}/>
            </div>
          )}
          {view==="users"&&isMgmt&&<UserManagement currentUser={currentUser}/>}
          {view==="visits"&&<VisitsCalendar currentUser={currentUser}/>}
{view==="funnel"&&<FunnelSuccess currentUser={currentUser}/>}
{view==="new"&&<NewLead currentUser={currentUser} onSubmit={()=>setView("pipeline")} onCancel={()=>setView("dashboard")}/>}
  {view==="reports"&&<Reports currentUser={currentUser}/>}
        </div>
      </div>
    </div>
  );
}
