export const STATUS_META = {
  LEAD_CREATED:     {label:"Lead Created",    color:"#64748b", bg:"#f1f5f9"},
  DOCS_REQUESTED:   {label:"Docs Requested",  color:"#0891b2", bg:"#ecfeff"},
  MGMT_VETTED:      {label:"Demo Booked",     color:"#2563eb", bg:"#eff6ff"},
  PROPOSAL_SHARED:  {label:"Proposal Shared", color:"#b45309", bg:"#fef3c7"},
  MOU_IN_PROGRESS:  {label:"MOU In Progress", color:"#7c3aed", bg:"#f5f3ff"},
  COMPLETED:        {label:"Onboarded",       color:"#15803d", bg:"#f0fdf4"},
  REJECTED:         {label:"Rejected",        color:"#b91c1c", bg:"#fee2e2"},
  COLD:             {label:"Cold",            color:"#334155", bg:"#e2e8f0"},
};

export const STAGE_ORDER = ["LEAD_CREATED","DOCS_REQUESTED","MGMT_VETTED","PROPOSAL_SHARED","MOU_IN_PROGRESS","COMPLETED","REJECTED","COLD"];
