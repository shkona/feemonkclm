export const LENDERS = [
  {key:"fibe",   label:"Fibe",   column:"fibe_status"},
  {key:"avanse", label:"Avanse", column:"avanse_status"},
];

export const LENDER_STATUS = {
  NOT_APPLICABLE: {label:"Not Applicable", icon:"🚫", color:"#64748b", bg:"#f1f5f9"},
  NOT_SUBMITTED:  {label:"Not Submitted",  icon:"📝", color:"#b45309", bg:"#fef3c7"},
  IN_PROGRESS:    {label:"In Progress",    icon:"⏳", color:"#2563eb", bg:"#eff6ff"},
  APPROVED:       {label:"Approved",       icon:"✅", color:"#15803d", bg:"#f0fdf4"},
  REJECTED:       {label:"Rejected",       icon:"❌", color:"#b91c1c", bg:"#fee2e2"},
};

// Statuses offered in the Pipeline "Filter by Lender" dropdown (Not Applicable excluded)
export const LENDER_FILTER_STATUSES = ["NOT_SUBMITTED","IN_PROGRESS","APPROVED","REJECTED"];

// A lead with no value yet counts as Not Submitted
export const getLenderStatus = (lead, lender) => lead?.[lender.column] || "NOT_SUBMITTED";

export function LenderIcon({status}){
  const m = LENDER_STATUS[status] || LENDER_STATUS.NOT_SUBMITTED;
  return <span title={m.label} style={{fontSize:16,cursor:"default"}}>{m.icon}</span>;
}

export function LenderStatusModal({lender, current, onSelect, onClose}){
  return(
    <div onClick={onClose} style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:10,padding:24,maxWidth:460,width:"90%",boxShadow:"0 10px 25px rgba(0,0,0,0.2)"}}>
        <h2 style={{fontSize:16,fontWeight:700,color:"#1e293b",margin:"0 0 16px"}}>{lender.label} Status</h2>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>
          {Object.entries(LENDER_STATUS).map(([k,m])=>{
            const active=current===k;
            return(
              <button key={k} onClick={()=>onSelect(k)} style={{flex:"1 1 80px",display:"flex",flexDirection:"column",alignItems:"center",gap:6,padding:"12px 6px",borderRadius:8,border:"2px solid",borderColor:active?m.color:"#e2e8f0",background:active?m.bg:"#fff",cursor:"pointer",fontFamily:"inherit"}}>
                <span style={{fontSize:26}}>{m.icon}</span>
                <span style={{fontSize:11,fontWeight:600,color:m.color,textAlign:"center"}}>{m.label}</span>
              </button>
            );
          })}
        </div>
        <button onClick={onClose} style={{width:"100%",background:"#fff",color:"#475569",border:"1px solid #e2e8f0",borderRadius:6,padding:"10px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
      </div>
    </div>
  );
}
