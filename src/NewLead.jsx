import { useState } from "react";
import { supabase } from "./supabase";

const LEAD_SOURCES  = ["Direct Sales","Client Website","Channel Partner","Inside Sales Team","North Sales Team","South Sales Team","East Sales Team","West Sales Team","Referral","Other"];
const BIZ_TYPES     = ["Trust/Society","Private Limited","Partnership Firm","LLP","Proprietorship","Other"];
const INST_TYPES    = ["K-12", "Higher Education", "Upskilling"];
const INST_DOMAINS  = {
  "K-12":             ["CBSE", "STATE BOARD", "ICSE", "INTERNATIONAL"],
  "Higher Education": ["Engineering College", "Medical College", "Physiotherapy", "Business", "Design", "Gaming", "Hotel Management", "Others"],
  "Upskilling":       ["Healthcare", "Technology", "Executive Education", "Other Upskilling"],
};
const INDIA_STATES  = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan",
  "Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman & Nicobar Islands","Chandigarh","Dadra & Nagar Haveli and Daman & Diu",
  "Delhi","Jammu & Kashmir","Ladakh","Lakshadweep","Puducherry",
];

export default function NewLead({ currentUser, onSubmit, onCancel }) {
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");
  const [errors, setErrors]           = useState({});
  const [instType, setInstType]       = useState("");
  const [domain, setDomain]           = useState("");
  const [instState, setInstState]     = useState("");
  const [source, setSource]           = useState("");
  const [businessType, setBizType]    = useState("");
  const [gst, setGst]                 = useState(false);

  // text / number field refs via a simple object approach
  const [fields, setFields] = useState({
    name: "", legalName: "", website: "", estd: "",
    turnover: "", monthlyVol: "", avgTicket: "",
    contactName: "", contactEmail: "", contactPhone: "", notes: "",
  });
  const set = (k) => (e) => setFields(f => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!fields.name.trim())                                   e.name         = "Required";
    if (!instType)                                             e.instType     = "Required";
    if (!domain)                                               e.domain       = "Required";
    if (!businessType)                                         e.businessType = "Required";
    if (!source)                                               e.source       = "Required";
    const yr = Number(fields.estd);
    if (!fields.estd || isNaN(yr) || yr < 1800 || yr > 2030)  e.estd         = "Enter a valid year";
    if (!fields.turnover.trim())                               e.turnover     = "Required";
    if (!fields.monthlyVol || isNaN(fields.monthlyVol))        e.monthlyVol   = "Enter a number";
    if (!fields.avgTicket  || isNaN(fields.avgTicket))         e.avgTicket    = "Enter a number";
    if (!fields.contactEmail.includes("@"))                    e.contactEmail = "Enter a valid email";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    setError("");

    const payload = {
      name:           fields.name.trim(),
      legal_name:     fields.legalName.trim(),
      website:        fields.website.trim(),
      source,
      business_type:  businessType,
      institute_type: instType,
      domain,
      inst_state:     instState,
      estd_year:      fields.estd,
      gst_registered: gst,
      turnover:       fields.turnover.trim(),
      monthly_volume: fields.monthlyVol,
      avg_ticket:     fields.avgTicket,
      contact_name:   fields.contactName.trim(),
      contact_email:  fields.contactEmail.trim(),
      contact_phone:  fields.contactPhone.trim(),
      notes:          fields.notes,
      status:         "LEAD_CREATED",
      created_by:     currentUser.id,
    };

    const { data, error: err } = await supabase
      .from("leads")
      .insert(payload)
      .select()
      .single();

    if (err) {
      setError(err.message);
      setSaving(false);
      return;
    }

    if (payload.notes && data) {
      await supabase.from("comments").insert({
        lead_id:    data.id,
        text:       payload.notes,
        created_by: currentUser.id,
        role:       currentUser.role,
      });
    }

    setSaving(false);
    onSubmit();
  };

  // ── style helpers (matches App.jsx fm-* design system) ──────────────────────
  const ic  = (err) => `fm-input${err ? " error" : ""}`;
  const sc  = (err) => `fm-select${err ? " error" : ""}`;
  const Lbl = ({ t, req }) => (
    <label className="fm-label">{t}{req ? " *" : ""}</label>
  );
  const Err = ({ k }) => errors[k]
    ? <div className="fm-err">{errors[k]}</div>
    : null;

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto" }}>
      <div style={{ marginBottom: "20px" }}>
        <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)" }}>New Lead Intake</div>
        <div style={{ fontSize: "13px", color: "var(--muted)", marginTop: "2px" }}>Fill in the institute details.</div>
      </div>

      {error && (
        <div className="fm-alert error" style={{ marginBottom: "16px" }}>
          <span>{error}</span>
          <button className="fm-alert-close" onClick={() => setError("")}>×</button>
        </div>
      )}

      <form onSubmit={handleSubmit}>

        {/* ── Institute Details ── */}
        <div className="fm-card" style={{ marginBottom: "16px" }}>
          <div className="fm-card-header"><span className="fm-card-title">Institute Details</span></div>
          <div className="fm-card-body">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>

              <div style={{ gridColumn: "1 / -1" }}>
                <Lbl t="Institute Name" req />
                <input value={fields.name} onChange={set("name")} placeholder="e.g. Monk Academy" className={ic(errors.name)} />
                <Err k="name" />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <Lbl t="Legal Entity Name" />
                <input value={fields.legalName} onChange={set("legalName")} placeholder="e.g. Monk Education Trust" className="fm-input" />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <Lbl t="Website" />
                <input value={fields.website} onChange={set("website")} placeholder="https://example.edu.in" className="fm-input" />
              </div>

              {/* Lead Source */}
              <div>
                <Lbl t="Lead Source" req />
                <select value={source} onChange={e => setSource(e.target.value)} className={sc(errors.source)}>
                  <option value="">Select…</option>
                  {LEAD_SOURCES.map(o => <option key={o}>{o}</option>)}
                </select>
                <Err k="source" />
              </div>

              {/* Business Type */}
              <div>
                <Lbl t="Business Type" req />
                <select value={businessType} onChange={e => setBizType(e.target.value)} className={sc(errors.businessType)}>
                  <option value="">Select…</option>
                  {BIZ_TYPES.map(o => <option key={o}>{o}</option>)}
                </select>
                <Err k="businessType" />
              </div>

              {/* Institute Type → clears Domain on change */}
              <div>
                <Lbl t="Institute Type" req />
                <select
                  value={instType}
                  onChange={e => { setInstType(e.target.value); setDomain(""); }}
                  className={sc(errors.instType)}>
                  <option value="">Select…</option>
                  {INST_TYPES.map(o => <option key={o}>{o}</option>)}
                </select>
                <Err k="instType" />
              </div>

              {/* Domain — cascades from Institute Type */}
              <div>
                <Lbl t="Domain" req />
                <select
                  value={domain}
                  onChange={e => setDomain(e.target.value)}
                  disabled={!instType}
                  className={sc(errors.domain)}
                  style={!instType ? { opacity: 0.6, cursor: "not-allowed" } : {}}>
                  <option value="">{instType ? "Select domain…" : "Select Institute Type first"}</option>
                  {(INST_DOMAINS[instType] || []).map(o => <option key={o}>{o}</option>)}
                </select>
                <Err k="domain" />
              </div>

              {/* Institute State */}
              <div>
                <Lbl t="Institute State" />
                <select value={instState} onChange={e => setInstState(e.target.value)} className="fm-select">
                  <option value="">Select state…</option>
                  {INDIA_STATES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              {/* Established Year */}
              <div>
                <Lbl t="Established Year" req />
                <input value={fields.estd} onChange={set("estd")} placeholder="e.g. 2005" className={ic(errors.estd)} />
                <Err k="estd" />
              </div>

              {/* GST toggle */}
              <div style={{ gridColumn: "1 / -1" }}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: "var(--grey-bg)", border: "1px solid var(--border)",
                  borderRadius: "8px", padding: "12px 16px"
                }}>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 600 }}>GST Registered?</div>
                    <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>
                      Toggle on if the institute has an active GST registration
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGst(p => !p)}
                    className={"fm-toggle " + (gst ? "on" : "off")}>
                    <span className="fm-toggle-knob" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ── Financial Profile ── */}
        <div className="fm-card" style={{ marginBottom: "16px" }}>
          <div className="fm-card-header"><span className="fm-card-title">Financial Profile</span></div>
          <div className="fm-card-body">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
              <div>
                <Lbl t="Annual Turnover" req />
                <input value={fields.turnover} onChange={set("turnover")} placeholder="e.g. 12 Cr" className={ic(errors.turnover)} />
                <Err k="turnover" />
              </div>
              <div>
                <Lbl t="Monthly Volume (Sales)" req />
                <input value={fields.monthlyVol} onChange={set("monthlyVol")} placeholder="e.g. 450" className={ic(errors.monthlyVol)} />
                <Err k="monthlyVol" />
              </div>
              <div>
                <Lbl t="Avg Course Ticket (₹)" req />
                <input value={fields.avgTicket} onChange={set("avgTicket")} placeholder="e.g. 85000" className={ic(errors.avgTicket)} />
                <Err k="avgTicket" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Primary Contact ── */}
        <div className="fm-card" style={{ marginBottom: "20px" }}>
          <div className="fm-card-header"><span className="fm-card-title">Primary Contact</span></div>
          <div className="fm-card-body">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              <div>
                <Lbl t="Contact Name" />
                <input value={fields.contactName} onChange={set("contactName")} placeholder="Full name" className="fm-input" />
              </div>
              <div>
                <Lbl t="Email" req />
                <input value={fields.contactEmail} onChange={set("contactEmail")} type="email" placeholder="email@institute.com" className={ic(errors.contactEmail)} />
                <Err k="contactEmail" />
              </div>
              <div>
                <Lbl t="Phone" />
                <input value={fields.contactPhone} onChange={set("contactPhone")} placeholder="+91 98XXX XXXXX" className="fm-input" />
              </div>
            </div>
            <div>
              <Lbl t="Internal Notes" />
              <textarea
                value={fields.notes}
                onChange={set("notes")}
                rows={2}
                placeholder="Any context for Management…"
                className="fm-textarea"
                style={{ resize: "none" }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button type="submit" disabled={saving} className="fm-btn fm-btn-primary">
            {saving ? "Submitting…" : "Submit Lead"}
          </button>
          <button type="button" onClick={onCancel} className="fm-btn fm-btn-ghost">
            Cancel
          </button>
        </div>

      </form>
    </div>
  );
}
