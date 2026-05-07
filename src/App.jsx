import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";
import NewLead from "./NewLead.jsx";

const TENURE_OPTIONS = [3,6,9,10,12,15,18,21,24,27,30,33,36];
const PRODUCTS = ["SV GST","SV Non GST","STD ROI","HYBRID"];
const ADVANCE_EMI_OPTIONS = [0,1,2,3];
const INST_TYPES = ["K-12", "Higher Education", "Upskilling"];
const INST_DOMAINS = {
  "K-12":             ["CBSE", "STATE BOARD", "ICSE", "INTERNATIONAL"],
  "Higher Education": ["Engineering College", "Medical College", "Physiotherapy", "Business", "Design", "Gaming", "Hotel Management", "Others"],
  "Upskilling":       ["Healthcare", "Technology", "Executive Education", "Other Upskilling"],
};
const INDIA_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan",
  "Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman & Nicobar Islands","Chandigarh","Dadra & Nagar Haveli and Daman & Diu",
  "Delhi","Jammu & Kashmir","Ladakh","Lakshadweep","Puducherry",
];
const BIZ_TYPES = ["Trust/Society","Private Limited","Partnership Firm","LLP","Proprietorship","Other"];
const LEAD_SOURCES = ["Direct Sales","Client Website","Channel Partner","Inside Sales Team","North Sales Team","South Sales Team","East Sales Team","West Sales Team","Referral","Other"];

// Color system matching the HTML reference
const SOURCE_COLORS = {
  "Direct Sales":      "source-direct",
  "Client Website":    "source-web",
  "Channel Partner":   "source-partner",
  "Inside Sales Team": "source-inside",
  "Referral":          "source-referral",
};
const ROLE_COLORS = {
  Sales:             "role-sales",
  "Channel Partner": "role-partner",
  Management:        "role-mgmt",
};
const STATUS_META = {
  LEAD_CREATED:       {label:"Lead Created",       cls:"badge-grey",   step:1},
  MGMT_VETTED:        {label:"Mgmt Vetted",        cls:"badge-blue",   step:2},
  PROPOSAL_IN_REVIEW: {label:"Proposal In Review", cls:"badge-yellow", step:3},
  PROPOSAL_APPROVED:  {label:"Proposal Approved",  cls:"badge-green",  step:4},
  MOU_IN_PROGRESS:    {label:"MOU In Progress",    cls:"badge-purple", step:5},
  COMPLETED:          {label:"Onboarded",          cls:"badge-green",  step:6},
  LEAD_REJECTED:      {label:"Lead Rejected",       cls:"badge-red",    step:0},
  REJECTED:           {label:"Rejected",           cls:"badge-red",    step:0},
  WENT_COLD:          {label:"Went Cold",          cls:"badge-grey",   step:0},
};
const STEPS = ["Lead Created","Mgmt Vetted","Proposal Review","Proposal Approved","MOU","Onboarded"];

// ── CSS — AdminPro design system ───────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap');

  :root {
    /* ── AdminPro brand palette ── */
    --ap-primary:       #745af2;
    --ap-primary-light: #ede8fd;
    --ap-primary-mid:   #c4b8f9;
    --ap-info:          #398bf7;
    --ap-info-light:    #cfecfe;
    --ap-success:       #06d79c;
    --ap-success-light: #e8fdeb;
    --ap-warning:       #ffb22b;
    --ap-warning-light: #fff8ec;
    --ap-danger:        #ef5350;
    --ap-danger-light:  #f9e7eb;
    --ap-dark:          #242a33;
    --ap-dark2:         #1e2a35;

    /* ── Semantic aliases (used throughout components) ── */
    --blue-dark:  #242a33;
    --blue:       #745af2;
    --blue-light: #ede8fd;
    --blue-mid:   #c4b8f9;
    --green:      #05a97a;
    --green-bg:   #e8fdeb;
    --green-bd:   #a3f0d0;
    --yellow:     #c48a00;
    --yellow-bg:  #fff8ec;
    --yellow-bd:  #fde68a;
    --orange:     #e07b25;
    --orange-bg:  #fff3e0;
    --orange-bd:  #ffcc80;
    --red:        #e53935;
    --red-bg:     #f9e7eb;
    --red-bd:     #f5b8bb;
    --purple:     #745af2;
    --purple-bg:  #ede8fd;
    --purple-bd:  #c4b8f9;
    --grey:       #67757c;
    --grey-bg:    #f2f7f8;
    --grey-bd:    #dee2e6;
    --body:       #f4f6f9;
    --card:       #ffffff;
    --border:     #dee2e6;
    --text:       #455a64;
    --text-dark:  #1e2a35;
    --muted:      #67757c;
    --subtle:     #99abb4;
    --shadow:     0 0.5rem 1rem rgba(0,0,0,0.05);
  }

  * { box-sizing: border-box; }

  body {
    font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif;
    background: var(--body);
    color: var(--text);
    font-size: 0.875rem;
    font-weight: 400;
    margin: 0;
    -webkit-font-smoothing: antialiased;
  }

  /* ══════════════════════════════════════════
     SIDEBAR  — AdminPro dark sidebar style
  ══════════════════════════════════════════ */
  .fm-sidebar {
    width: 260px;
    background: var(--ap-dark);
    color: #fff;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    position: fixed;
    top: 0; left: 0;
    height: 100vh;
    overflow-y: auto;
    z-index: 100;
    transition: width 0.1s ease-in;
  }

  /* Logo area */
  .fm-sb-logo {
    padding: 18px 20px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 60px;
  }
  .fm-sb-logo-icon {
    width: 34px; height: 34px;
    background: var(--ap-primary);
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-weight: 800; font-size: 16px; color: #fff;
    flex-shrink: 0;
  }
  .fm-sb-brand {
    font-size: 15px;
    font-weight: 700;
    letter-spacing: -0.3px;
    color: #fff;
    line-height: 1.2;
  }
  .fm-sb-sub {
    font-size: 10px;
    color: rgba(255,255,255,0.45);
    margin-top: 1px;
    font-weight: 400;
  }

  /* Section caption — matches AdminPro .navCaption */
  .fm-sb-section {
    padding: 20px 20px 6px;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: rgba(255,255,255,0.35);
    font-weight: 600;
  }

  /* Nav item — matches AdminPro .nav-link style */
  .fm-sb-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 20px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 400;
    border: none;
    background: transparent;
    color: rgba(255,255,255,0.6);
    width: 100%;
    text-align: left;
    transition: color 0.15s, background 0.15s, border-left-color 0.15s;
    border-left: 3px solid transparent;
    white-space: nowrap;
    overflow: hidden;
    letter-spacing: 0.1px;
  }
  .fm-sb-item:hover {
    color: #fff;
    background: rgba(255,255,255,0.05);
  }
  .fm-sb-item.active {
    color: #fff;
    font-weight: 500;
    border-left-color: var(--ap-primary);
    background: rgba(116,90,242,0.15);
  }
  .fm-sb-icon {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    opacity: 0.7;
  }
  .fm-sb-item:hover .fm-sb-icon,
  .fm-sb-item.active .fm-sb-icon {
    opacity: 1;
  }

  /* User profile footer in sidebar */
  .fm-sb-footer {
    margin-top: auto;
    padding: 12px 20px;
    border-top: 1px solid rgba(255,255,255,0.1);
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .fm-sb-avatar {
    width: 32px; height: 32px;
    background: var(--ap-primary);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700; color: #fff; flex-shrink: 0;
  }
  .fm-sb-footer-name  { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.85); }
  .fm-sb-footer-role  { font-size: 10px; color: rgba(255,255,255,0.4); margin-top: 1px; }

  /* ══════════════════════════════════════════
     LAYOUT
  ══════════════════════════════════════════ */
  .fm-layout { display: flex; min-height: 100vh; }
  .fm-main   { flex: 1; margin-left: 260px; display: flex; flex-direction: column; min-height: 100vh; }

  /* Topbar — AdminPro white topbar, 60px height */
  .fm-topbar {
    background: #fff;
    border-bottom: 1px solid var(--border);
    padding: 0 24px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 50;
    box-shadow: var(--shadow);
  }
  .fm-topbar-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-dark);
  }
  .fm-content { padding: 24px; flex: 1; }

  /* ══════════════════════════════════════════
     CARDS — rounded corners like screenshot
  ══════════════════════════════════════════ */
  .fm-card {
    background: var(--card);
    border-radius: 16px;
    border: 0;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    margin-bottom: 24px;
    overflow: hidden;
  }
  .fm-card-header {
    padding: 18px 22px;
    border-bottom: 1px solid #f2f4f7;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .fm-card-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-dark);
  }
  .fm-card-sub { font-size: 12px; color: var(--muted); }
  .fm-card-body { padding: 22px; }

  /* ══════════════════════════════════════════
     KPI CARDS — icon badge style (screenshot)
  ══════════════════════════════════════════ */
  .fm-kpi-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 20px; margin-bottom: 28px; }
  .fm-kc {
    background: var(--card);
    border-radius: 16px;
    padding: 22px 22px 20px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }
  /* Remove the old lstick ::before — replaced by icon badge */
  .fm-kc::before { display: none; }

  .fm-kc-body { flex: 1; min-width: 0; }

  /* Icon badge — rounded square, light tint, colored icon (matches screenshot) */
  .fm-kc-badge {
    width: 48px; height: 48px;
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .fm-kc.info  .fm-kc-badge { background: #e8f0fe; color: var(--ap-info); }
  .fm-kc.warn  .fm-kc-badge { background: #fff3e0; color: var(--ap-warning); }
  .fm-kc.alert .fm-kc-badge { background: #fde8e8; color: var(--ap-danger); }
  .fm-kc.good  .fm-kc-badge { background: #e6faf4; color: var(--ap-success); }

  .fm-kl {
    font-size: 11px;
    color: var(--muted);
    font-weight: 600;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.7px;
  }
  .fm-kv { font-size: 28px; font-weight: 700; line-height: 1.1; color: var(--text-dark); }
  .fm-ks { font-size: 12px; color: var(--subtle); margin-top: 6px; }

  .kv-slate  { color: var(--text-dark); }
  .kv-orange { color: var(--ap-warning); }
  .kv-yellow { color: var(--ap-warning); }
  .kv-purple { color: var(--ap-primary); }

  /* ══════════════════════════════════════════
     TABLES — rounded container
  ══════════════════════════════════════════ */
  .fm-table-wrap { overflow-x: auto; border-radius: 16px; }
  .fm-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .fm-table th {
    text-align: left;
    padding: 12px 16px;
    font-size: 11px;
    color: var(--muted);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 2px solid #f2f4f7;
    background: #fff;
    white-space: nowrap;
  }
  .fm-table th:first-child { border-radius: 16px 0 0 0; }
  .fm-table th:last-child  { border-radius: 0 16px 0 0; }
  .fm-table td {
    padding: 12px 16px;
    border-bottom: 1px solid #f2f4f7;
    vertical-align: middle;
    color: var(--text);
  }
  .fm-table tr:last-child td { border-bottom: none; }
  .fm-table tr:last-child td:first-child { border-radius: 0 0 0 16px; }
  .fm-table tr:last-child td:last-child  { border-radius: 0 0 16px 0; }
  .fm-table tbody tr:hover td { background: #f8f9fc; }

  /* ══════════════════════════════════════════
     BADGES — rounded pills
  ══════════════════════════════════════════ */
  .fm-badge {
    display: inline-flex;
    align-items: center;
    padding: 4px 11px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
    letter-spacing: 0.3px;
  }
  .badge-grey   { background: var(--grey-bg);         color: var(--muted); }
  .badge-blue   { background: var(--ap-primary-light); color: var(--ap-primary); }
  .badge-yellow { background: var(--ap-warning-light); color: #b07a00; }
  .badge-green  { background: var(--ap-success-light); color: #04a87b; }
  .badge-red    { background: var(--ap-danger-light);  color: var(--ap-danger); }
  .badge-purple { background: var(--ap-primary-light); color: var(--ap-primary); }

  .role-sales   { background: var(--ap-info-light);    color: var(--ap-info); }
  .role-partner { background: var(--ap-warning-light); color: #b07a00; }
  .role-mgmt    { background: var(--ap-primary-light); color: var(--ap-primary); }

  .source-direct   { background: var(--ap-info-light);    color: var(--ap-info); }
  .source-web      { background: var(--ap-success-light); color: #04a87b; }
  .source-partner  { background: var(--ap-warning-light); color: #b07a00; }
  .source-inside   { background: var(--ap-primary-light); color: var(--ap-primary); }
  .source-referral { background: #fde8f3;                  color: #c0256f; }

  /* ══════════════════════════════════════════
     BUTTONS — rounded
  ══════════════════════════════════════════ */
  .fm-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 18px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    font-family: 'Montserrat', sans-serif;
    cursor: pointer;
    transition: all 0.15s;
    border: none;
    letter-spacing: 0.2px;
  }
  .fm-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .fm-btn-primary  { background: var(--ap-primary); color: #fff; }
  .fm-btn-primary:hover:not(:disabled)  { background: #5e47d6; }
  .fm-btn-outline  { background: #fff; color: var(--ap-primary); border: 1px solid var(--ap-primary-mid); }
  .fm-btn-outline:hover:not(:disabled)  { background: var(--ap-primary-light); }
  .fm-btn-ghost    { background: transparent; color: var(--muted); border: 1px solid var(--border); }
  .fm-btn-ghost:hover:not(:disabled)    { background: var(--grey-bg); }
  .fm-btn-danger   { background: var(--ap-danger); color: #fff; }
  .fm-btn-danger:hover:not(:disabled)   { background: #c62828; }
  .fm-btn-success  { background: var(--ap-success); color: #fff; }
  .fm-btn-success:hover:not(:disabled)  { background: #05b07f; }
  .fm-btn-info     { background: var(--ap-info); color: #fff; }
  .fm-btn-info:hover:not(:disabled)     { background: #1a6ed8; }
  .fm-btn-sm { padding: 5px 14px; font-size: 12px; border-radius: 7px; }
  .fm-btn-xs { padding: 3px 10px; font-size: 11px; border-radius: 6px; }

  /* ══════════════════════════════════════════
     FORM INPUTS — rounded
  ══════════════════════════════════════════ */
  .fm-input, .fm-select, .fm-textarea {
    width: 100%;
    border: 1px solid #e0e4ea;
    border-radius: 8px;
    padding: 9px 13px;
    font-size: 13px;
    font-family: 'Montserrat', sans-serif;
    outline: none;
    background: #fff;
    color: var(--text-dark);
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .fm-input:focus, .fm-select:focus, .fm-textarea:focus {
    border-color: var(--ap-primary);
    box-shadow: 0 0 0 3px rgba(116,90,242,0.10);
  }
  .fm-input.error, .fm-select.error { border-color: var(--ap-danger); }
  .fm-label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 5px;
  }
  .fm-field { margin-bottom: 0; }
  .fm-err   { font-size: 11px; color: var(--ap-danger); margin-top: 3px; }

  /* ══════════════════════════════════════════
     ALERTS — rounded
  ══════════════════════════════════════════ */
  .fm-alert {
    border-radius: 10px;
    padding: 12px 16px;
    margin-bottom: 16px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
    font-size: 13px;
    font-weight: 500;
  }
  .fm-alert.error   { background: var(--ap-danger-light);  border-left: 3px solid var(--ap-danger);  color: #c0392b; }
  .fm-alert.success { background: var(--ap-success-light); border-left: 3px solid var(--ap-success); color: #04a87b; }
  .fm-alert-close   { background: none; border: none; cursor: pointer; opacity: 0.5; font-size: 16px; line-height: 1; padding: 0; color: inherit; }
  .fm-alert-close:hover { opacity: 1; }

  /* ══════════════════════════════════════════
     STEP BAR
  ══════════════════════════════════════════ */
  .fm-stepbar { display: flex; align-items: center; }
  .fm-step-dot {
    width: 24px; height: 24px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700;
    border: 2px solid #dee2e6;
    background: #fff;
    color: var(--subtle);
    flex-shrink: 0;
  }
  .fm-step-dot.done  { background: var(--ap-primary); border-color: var(--ap-primary); color: #fff; }
  .fm-step-line      { height: 2px; width: 20px; background: #dee2e6; flex-shrink: 0; }
  .fm-step-line.done { background: var(--ap-primary); }

  /* ══════════════════════════════════════════
     MISC COMPONENTS — rounded
  ══════════════════════════════════════════ */
  .fm-section-label {
    font-size: 10px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 1.2px;
    color: var(--subtle); margin-bottom: 12px;
  }

  .fm-info-tile { background: #f8f9fc; border-radius: 10px; padding: 12px 16px; }
  .fm-info-tile-label { font-size: 11px; color: var(--muted); margin-bottom: 3px; font-weight: 500; }
  .fm-info-tile-value { font-size: 14px; font-weight: 700; color: var(--text-dark); }

  .fm-approval-banner {
    border-radius: 12px; padding: 14px 18px; margin-top: 16px;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
  }
  .fm-approval-banner.pending  { background: var(--ap-warning-light); border-left: 3px solid var(--ap-warning); }
  .fm-approval-banner.own-lead { background: var(--ap-primary-light); border-left: 3px solid var(--ap-primary); }

  /* Spinner */
  .fm-spinner-wrap { display: flex; align-items: center; justify-content: center; padding: 48px; }
  .fm-spinner {
    width: 32px; height: 32px;
    border: 3px solid var(--ap-primary-light);
    border-top-color: var(--ap-primary);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ══════════════════════════════════════════
     LOGIN PAGE — rounded card
  ══════════════════════════════════════════ */
  .fm-login-wrap {
    min-height: 100vh;
    background: linear-gradient(135deg, #1e2a35 0%, #2d3748 100%);
    display: flex; align-items: center; justify-content: center;
    position: relative; overflow: hidden;
  }
  .fm-login-wrap::before {
    content: '';
    position: absolute;
    width: 500px; height: 500px;
    background: radial-gradient(circle, rgba(116,90,242,0.15) 0%, transparent 70%);
    top: -100px; left: -100px;
    pointer-events: none;
  }
  .fm-login-wrap::after {
    content: '';
    position: absolute;
    width: 400px; height: 400px;
    background: radial-gradient(circle, rgba(57,139,247,0.12) 0%, transparent 70%);
    bottom: -80px; right: -80px;
    pointer-events: none;
  }
  .fm-login-card {
    background: #fff;
    border-radius: 20px;
    padding: 36px 40px;
    width: 100%; max-width: 420px;
    box-shadow: 0 1rem 3rem rgba(0,0,0,0.25);
    position: relative; z-index: 1;
  }
  .fm-login-logo {
    width: 44px; height: 44px;
    background: var(--ap-primary);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-weight: 800; font-size: 20px;
  }

  /* ══════════════════════════════════════════
     SIDEBAR SUBMENU
  ══════════════════════════════════════════ */
  .fm-sb-submenu {
    overflow: hidden;
    transition: max-height 0.2s ease-in-out;
  }
  .fm-sb-subitem {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 20px 9px 48px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 400;
    border: none;
    background: transparent;
    color: rgba(255,255,255,0.5);
    width: 100%;
    text-align: left;
    transition: color 0.15s, background 0.15s;
    white-space: nowrap;
    border-left: 3px solid transparent;
    letter-spacing: 0.1px;
  }
  .fm-sb-subitem:hover {
    color: rgba(255,255,255,0.9);
    background: rgba(255,255,255,0.04);
  }
  .fm-sb-subitem.active {
    color: #fff;
    font-weight: 500;
    border-left-color: var(--ap-primary);
    background: rgba(116,90,242,0.12);
  }
  .fm-sb-subitem::before {
    content: '';
    width: 5px; height: 5px;
    border-radius: 50%;
    background: currentColor;
    flex-shrink: 0;
    opacity: 0.6;
  }
  .fm-sb-subitem.active::before { opacity: 1; background: var(--ap-primary); }
  .fm-sb-chevron {
    margin-left: auto;
    transition: transform 0.2s;
    opacity: 0.5;
    flex-shrink: 0;
  }
  .fm-sb-chevron.open { transform: rotate(90deg); }
  .fm-pill-wrap { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
  .fm-pill {
    padding: 5px 16px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    border: 1px solid #dee2e6;
    background: #fff;
    color: var(--muted);
    cursor: pointer;
    transition: all 0.15s;
    font-family: 'Montserrat', sans-serif;
  }
  .fm-pill:hover { border-color: var(--ap-primary); color: var(--ap-primary); }
  .fm-pill.active { background: var(--ap-primary); color: #fff; border-color: var(--ap-primary); }

  /* ══════════════════════════════════════════
     PROPOSAL CARDS
  ══════════════════════════════════════════ */
  .fm-proposal-card {
    background: var(--card);
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    border: 0;
    border-left: 3px solid #dee2e6;
    padding: 18px 20px;
    margin-bottom: 14px;
  }
  .fm-proposal-card.approved { border-left-color: var(--ap-success); }
  .fm-proposal-card.rejected { border-left-color: var(--ap-danger); }
  .fm-proposal-card.submitted { border-left-color: var(--ap-warning); }

  /* ══════════════════════════════════════════
     COMMENTS
  ══════════════════════════════════════════ */
  .fm-comment { background: #f8f9fc; border-radius: 10px; padding: 10px 14px; margin-bottom: 8px; }
  .fm-comment-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }

  /* ══════════════════════════════════════════
     TOGGLE SWITCH
  ══════════════════════════════════════════ */
  .fm-toggle {
    position: relative; display: inline-flex; align-items: center;
    height: 24px; width: 46px; border-radius: 12px;
    cursor: pointer; transition: background 0.2s; border: none;
  }
  .fm-toggle.on  { background: var(--ap-primary); }
  .fm-toggle.off { background: #ced4da; }
  .fm-toggle-knob {
    position: absolute; top: 3px;
    width: 18px; height: 18px;
    background: #fff; border-radius: 50%;
    box-shadow: 0 1px 4px rgba(0,0,0,0.25);
    transition: left 0.2s;
  }
  .fm-toggle.on  .fm-toggle-knob { left: 24px; }
  .fm-toggle.off .fm-toggle-knob { left: 4px; }

  /* ══════════════════════════════════════════
     MISC
  ══════════════════════════════════════════ */
  .fm-empty { text-align: center; padding: 48px; color: var(--subtle); font-size: 13px; }

  .fm-back {
    background: none; border: none;
    color: var(--ap-primary); font-size: 13px; font-weight: 600;
    cursor: pointer; padding: 0; margin-bottom: 16px;
    display: inline-flex; align-items: center; gap: 4px;
    font-family: 'Montserrat', sans-serif;
  }
  .fm-back:hover { text-decoration: underline; }

  /* ══════════════════════════════════════════
     PROPOSAL BUILDER TABLE INPUTS
  ══════════════════════════════════════════ */
  .pb-input {
    border: 1px solid #e0e4ea; border-radius: 7px;
    padding: 5px 8px; font-size: 13px; outline: none;
    width: 80px; text-align: right;
    font-family: 'Montserrat', sans-serif;
    transition: border-color 0.15s;
  }
  .pb-input:focus { border-color: var(--ap-primary); box-shadow: 0 0 0 2px rgba(116,90,242,0.10); }
  .pb-input:disabled { background: #f2f7f8; border-color: #f2f7f8; color: var(--subtle); cursor: not-allowed; }
  .pb-select {
    border: 1px solid #e0e4ea; border-radius: 7px;
    padding: 5px 8px; font-size: 13px; outline: none;
    background: #fff; font-family: 'Montserrat', sans-serif;
  }
  .pb-select:focus { border-color: var(--ap-primary); }

  /* ══════════════════════════════════════════
     PROPOSAL TABLE TINTED COLUMN HEADERS
  ══════════════════════════════════════════ */
  .col-blue   { background: var(--ap-info-light);    color: var(--ap-info); }
  .col-orange { background: var(--ap-warning-light); color: #b07a00; }
  .col-green  { background: var(--ap-success-light); color: #04a87b; }
  .col-violet { background: var(--ap-primary-light); color: var(--ap-primary); }
  .val-blue   { color: var(--ap-info);    font-weight: 700; }
  .val-orange { color: #c48a00;           font-weight: 700; }
  .val-green  { color: #04a87b;           font-weight: 700; }
  .val-violet { color: var(--ap-primary); font-weight: 700; }
  .val-muted  { color: var(--subtle); }

  /* ══════════════════════════════════════════
     ACTION MENU DROPDOWN
  ══════════════════════════════════════════ */
  .fm-action-wrap { position: relative; display: inline-block; }
  .fm-action-btn {
    display: flex; align-items: center; justify-content: center;
    width: 30px; height: 30px;
    border-radius: 8px;
    border: 1px solid transparent;
    background: transparent;
    cursor: pointer;
    color: var(--subtle);
    transition: all 0.15s;
  }
  .fm-action-btn:hover, .fm-action-btn.open {
    background: var(--grey-bg);
    border-color: var(--border);
    color: var(--text-dark);
  }
  .fm-action-menu {
    position: absolute; right: 0; top: calc(100% + 4px);
    background: #fff;
    border: 0;
    border-radius: 14px;
    box-shadow: 0 8px 28px rgba(0,0,0,0.12);
    min-width: 185px;
    z-index: 200;
    overflow: hidden;
    padding: 6px;
  }
  .fm-action-menu-label {
    font-size: 10px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.7px;
    color: var(--subtle); padding: 6px 10px 4px;
  }
  .fm-action-item {
    display: flex; align-items: center; gap: 9px;
    width: 100%; padding: 8px 12px;
    border: none; background: transparent; border-radius: 8px;
    cursor: pointer; font-size: 13px; font-weight: 500;
    font-family: 'Montserrat', sans-serif;
    color: var(--text); text-align: left; transition: background 0.1s;
  }
  .fm-action-item:hover         { background: var(--grey-bg); }
  .fm-action-item.danger:hover  { background: var(--ap-danger-light);  color: var(--ap-danger); }
  .fm-action-item.warn:hover    { background: var(--ap-warning-light); color: #b07a00; }
  .fm-action-item.success:hover { background: var(--ap-success-light); color: #04a87b; }
  .fm-action-divider { height: 1px; background: #f2f4f7; margin: 4px 0; }
`;

function InjectCSS() {
  useEffect(() => {
    const id = "feemonk-css";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.textContent = GLOBAL_CSS;
      document.head.appendChild(style);
    }
  }, []);
  return null;
}

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

function fmt(n){return "₹"+Math.round(n).toLocaleString("en-IN");}
function roiOff(p){return p==="SV GST"||p==="SV Non GST";}
function subvOff(p){return p==="STD ROI";}

// ── Shared UI ─────────────────────────────────────────────────────────────────
function Badge({status}) {
  const m = STATUS_META[status] || STATUS_META.LEAD_CREATED;
  return <span className={"fm-badge " + m.cls}>{m.label}</span>;
}

function RoleBadge({role}) {
  return <span className={"fm-badge " + (ROLE_COLORS[role] || "badge-grey")}>{role}</span>;
}

function SourceBadge({source}) {
  return <span className={"fm-badge " + (SOURCE_COLORS[source] || "badge-grey")}>{source || "--"}</span>;
}

function StepBar({status}) {
  if (status === "REJECTED") return <span className="fm-badge badge-red">Rejected</span>;
  const cur = (STATUS_META[status]?.step || 1) - 1;
  return (
    <div className="fm-stepbar">
      {STEPS.map((s, i) => (
        <div key={i} style={{display:"flex",alignItems:"center"}}>
          <div className={"fm-step-dot" + (i <= cur ? " done" : "")}>{i+1}</div>
          {i < STEPS.length-1 && <div className={"fm-step-line" + (i < cur ? " done" : "")} />}
        </div>
      ))}
    </div>
  );
}

function Spinner() {
  return <div className="fm-spinner-wrap"><div className="fm-spinner" /></div>;
}

function Alert({type, message, onClose}) {
  return (
    <div className={"fm-alert " + type}>
      <span>{message}</span>
      {onClose && <button className="fm-alert-close" onClick={onClose}>×</button>}
    </div>
  );
}

// ── Login ─────────────────────────────────────────────────────────────────────
function LoginScreen({onLogin}) {
  const emailRef = useRef(), passRef = useRef();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // "login" | "forgot" | "forgot-sent"
  const [screen, setScreen] = useState("login");
  const forgotEmailRef = useRef();
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");

  const handleLogin = async () => {
    const email = emailRef.current.value, password = passRef.current.value;
    if (!email || !password) { setError("Please enter email and password"); return; }
    setLoading(true); setError("");
    const {data, error: err} = await supabase.auth.signInWithPassword({email, password});
    if (err) { setError(err.message); setLoading(false); return; }
    const {data: u} = await supabase.from("users").select("*").eq("id", data.user.id).single();
    if (!u) { setError("User profile not found."); setLoading(false); return; }
    if (!u.active) { setError("Account deactivated. Contact admin."); setLoading(false); return; }
    onLogin(u); setLoading(false);
  };

  const handleForgot = async () => {
    const email = forgotEmailRef.current.value.trim();
    if (!email || !email.includes("@")) { setForgotError("Please enter a valid email address."); return; }
    setForgotLoading(true); setForgotError("");
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname,
    });
    setForgotLoading(false);
    if (err) { setForgotError(err.message); return; }
    setScreen("forgot-sent");
  };

  const LogoHeader = () => (
    <div style={{display:"flex", alignItems:"center", gap:"12px", marginBottom:"28px"}}>
      <div className="fm-login-logo">F</div>
      <div>
        <div style={{fontWeight:700, fontSize:"16px", color:"var(--text)"}}>Feemonk CLM</div>
        <div style={{fontSize:"12px", color:"var(--muted)"}}>Sales &amp; Contract Management</div>
      </div>
    </div>
  );

  if (screen === "forgot") return (
    <div className="fm-login-wrap">
      <div className="fm-login-card">
        <LogoHeader />
        <div style={{marginBottom:"20px"}}>
          <div style={{fontSize:"15px", fontWeight:700, color:"var(--text)"}}>Reset your password</div>
          <div style={{fontSize:"13px", color:"var(--muted)", marginTop:"4px"}}>Enter your email and we'll send you a reset link.</div>
        </div>
        {forgotError && <Alert type="error" message={forgotError} onClose={() => setForgotError("")} />}
        <div style={{display:"flex", flexDirection:"column", gap:"14px"}}>
          <div>
            <label className="fm-label">Email</label>
            <input ref={forgotEmailRef} type="email" placeholder="you@feemonk.com" className="fm-input"
              onKeyDown={e => e.key === "Enter" && handleForgot()} />
          </div>
          <button onClick={handleForgot} disabled={forgotLoading} className="fm-btn fm-btn-primary" style={{justifyContent:"center"}}>
            {forgotLoading ? "Sending…" : "Send Reset Link"}
          </button>
          <button onClick={() => { setScreen("login"); setForgotError(""); }} className="fm-btn fm-btn-ghost" style={{justifyContent:"center"}}>
            ← Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );

  if (screen === "forgot-sent") return (
    <div className="fm-login-wrap">
      <div className="fm-login-card">
        <LogoHeader />
        <div style={{textAlign:"center", padding:"8px 0 20px"}}>
          <div style={{fontSize:"36px", marginBottom:"12px"}}>📬</div>
          <div style={{fontSize:"15px", fontWeight:700, color:"var(--text)", marginBottom:"8px"}}>Check your inbox</div>
          <div style={{fontSize:"13px", color:"var(--muted)", lineHeight:"1.6"}}>
            We've sent a password reset link to your email.<br />
            Click the link in the email to set a new password.
          </div>
        </div>
        <button onClick={() => setScreen("login")} className="fm-btn fm-btn-outline" style={{justifyContent:"center", width:"100%"}}>
          ← Back to Sign In
        </button>
      </div>
    </div>
  );

  return (
    <div className="fm-login-wrap">
      <div className="fm-login-card">
        <LogoHeader />
        {error && <Alert type="error" message={error} onClose={() => setError("")} />}
        <div style={{display:"flex", flexDirection:"column", gap:"14px"}}>
          <div>
            <label className="fm-label">Email</label>
            <input ref={emailRef} type="email" placeholder="you@feemonk.com" className="fm-input"
              onKeyDown={e => e.key === "Enter" && handleLogin()} />
          </div>
          <div>
            <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"5px"}}>
              <label className="fm-label" style={{margin:0}}>Password</label>
              <button
                onClick={() => { setScreen("forgot"); setError(""); }}
                style={{background:"none", border:"none", fontSize:"12px", color:"var(--blue)", cursor:"pointer", padding:0, fontWeight:600}}>
                Forgot password?
              </button>
            </div>
            <input ref={passRef} type="password" placeholder="••••••••" className="fm-input"
              onKeyDown={e => e.key === "Enter" && handleLogin()} />
          </div>
          <button onClick={handleLogin} disabled={loading} className="fm-btn fm-btn-primary" style={{marginTop:"4px", justifyContent:"center"}}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Reset Password Screen (shown after user clicks email link) ────────────────
function ResetPasswordScreen({onDone}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleReset = async () => {
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true); setError("");
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSuccess(true);
    setTimeout(() => { supabase.auth.signOut().then(onDone); }, 2500);
  };

  return (
    <div className="fm-login-wrap">
      <div className="fm-login-card">
        <div style={{display:"flex", alignItems:"center", gap:"12px", marginBottom:"28px"}}>
          <div className="fm-login-logo">F</div>
          <div>
            <div style={{fontWeight:700, fontSize:"18px", color:"var(--text-dark)"}}>Feemonk CLM</div>
            <div style={{fontSize:"12px", color:"var(--muted)"}}>Sales &amp; Contract Management</div>
          </div>
        </div>
        {success ? (
          <div style={{textAlign:"center", padding:"8px 0"}}>
            <div style={{fontSize:"36px", marginBottom:"12px"}}>✅</div>
            <div style={{fontSize:"15px", fontWeight:700, color:"var(--green)", marginBottom:"8px"}}>Password updated!</div>
            <div style={{fontSize:"13px", color:"var(--muted)"}}>Redirecting you to sign in…</div>
          </div>
        ) : (
          <>
            <div style={{marginBottom:"20px"}}>
              <div style={{fontSize:"15px", fontWeight:700, color:"var(--text)"}}>Set a new password</div>
              <div style={{fontSize:"13px", color:"var(--muted)", marginTop:"4px"}}>Choose a strong password for your account.</div>
            </div>
            {error && <Alert type="error" message={error} onClose={() => setError("")} />}
            <div style={{display:"flex", flexDirection:"column", gap:"14px"}}>
              <div>
                <label className="fm-label">New Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" className="fm-input" />
              </div>
              <div>
                <label className="fm-label">Confirm Password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Re-enter password" className="fm-input"
                  onKeyDown={e => e.key === "Enter" && handleReset()} />
              </div>
              <button onClick={handleReset} disabled={loading} className="fm-btn fm-btn-primary" style={{justifyContent:"center"}}>
                {loading ? "Updating…" : "Update Password"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── User Management ───────────────────────────────────────────────────────────
function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [role, setRole] = useState("Sales");
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);
  const nameRef = useRef(), emailRef = useRef(), passRef = useRef();

  useEffect(() => { loadUsers(); }, []);
  const loadUsers = async () => {
    setLoading(true);
    const {data} = await supabase.from("users").select("*").order("created_at", {ascending: false});
    setUsers(data || []); setLoading(false);
  };

  const handleAdd = async () => {
    const name = nameRef.current.value.trim();
    const email = emailRef.current.value.trim();
    const password = passRef.current.value;
    if (!name || !email || !password) { setAlert({type:"error", message:"All fields are required."}); return; }
    if (password.length < 6) { setAlert({type:"error", message:"Password must be at least 6 characters."}); return; }
    setSaving(true);
    const {data: authData, error: authErr} = await supabase.auth.signUp({email, password});
    if (authErr) { setAlert({type:"error", message: authErr.message}); setSaving(false); return; }
    const uid = authData?.user?.id;
    if (!uid) { setAlert({type:"error", message:"Failed to create user."}); setSaving(false); return; }
    const {error: dbErr} = await supabase.from("users").insert({id:uid, name, email, role});
    if (dbErr) { setAlert({type:"error", message: dbErr.message}); setSaving(false); return; }
    setAlert({type:"success", message: name + " added successfully."});
    nameRef.current.value = ""; emailRef.current.value = ""; passRef.current.value = "";
    setShowForm(false); setSaving(false); loadUsers();
  };

  const toggleActive = async (u) => {
    await supabase.from("users").update({active: !u.active}).eq("id", u.id);
    loadUsers();
  };

  return (
    <div>
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"20px"}}>
        <div>
          <div style={{fontSize:"18px", fontWeight:700, color:"var(--text)"}}>User Management</div>
          <div style={{fontSize:"13px", color:"var(--muted)", marginTop:"2px"}}>Add and manage team members.</div>
        </div>
        <button onClick={() => setShowForm(p => !p)} className="fm-btn fm-btn-primary fm-btn-sm">+ Add User</button>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {showForm && (
        <div className="fm-card" style={{marginBottom:"20px"}}>
          <div className="fm-card-header">
            <span className="fm-card-title">New User</span>
          </div>
          <div className="fm-card-body">
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"12px"}}>
              <div><label className="fm-label">Full Name *</label><input ref={nameRef} placeholder="e.g. Ravi Kumar" className="fm-input" /></div>
              <div><label className="fm-label">Email *</label><input ref={emailRef} type="email" placeholder="ravi@feemonk.com" className="fm-input" /></div>
              <div><label className="fm-label">Password *</label><input ref={passRef} type="password" placeholder="Min 6 characters" className="fm-input" /></div>
              <div>
                <label className="fm-label">Role *</label>
                <select value={role} onChange={e => setRole(e.target.value)} className="fm-select">
                  <option>Sales</option><option>Channel Partner</option><option>Management</option>
                </select>
              </div>
            </div>
            <div style={{display:"flex", gap:"8px"}}>
              <button onClick={handleAdd} disabled={saving} className="fm-btn fm-btn-primary fm-btn-sm">{saving ? "Saving…" : "Add User"}</button>
              <button onClick={() => setShowForm(false)} className="fm-btn fm-btn-ghost fm-btn-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {loading ? <Spinner /> : (
        <div className="fm-card">
          <div className="fm-table-wrap">
            <table className="fm-table">
              <thead>
                <tr>{["Name","Email","Role","Status","Joined","Action"].map(h => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={{fontWeight:600}}>{u.name}</td>
                    <td style={{color:"var(--muted)"}}>{u.email}</td>
                    <td><RoleBadge role={u.role} /></td>
                    <td><span className={"fm-badge " + (u.active ? "badge-green" : "badge-red")}>{u.active ? "Active" : "Inactive"}</span></td>
                    <td style={{color:"var(--subtle)", fontSize:"12px"}}>{new Date(u.created_at).toLocaleDateString("en-IN")}</td>
                    <td>
                      <button
                        onClick={() => toggleActive(u)}
                        className={"fm-btn fm-btn-xs " + (u.active ? "fm-btn-danger" : "fm-btn-success")}
                        style={{background:"transparent", border: u.active ? "1px solid var(--red-bd)" : "1px solid var(--green-bd)", color: u.active ? "var(--red)" : "var(--green)"}}>
                        {u.active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Comments ──────────────────────────────────────────────────────────────────
function Comments({leadId, currentUser}) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const textRef = useRef();

  useEffect(() => { loadComments(); }, [leadId]);
  const loadComments = async () => {
    setLoading(true);
    const {data} = await supabase.from("comments").select("*, users(name,role)").eq("lead_id", leadId).order("created_at", {ascending: true});
    setComments(data || []); setLoading(false);
  };
  const submit = async () => {
    const text = textRef.current.value.trim();
    if (!text) return;
    setSaving(true);
    await supabase.from("comments").insert({lead_id: leadId, text, created_by: currentUser.id, role: currentUser.role});
    textRef.current.value = ""; setSaving(false); loadComments();
  };

  return (
    <div style={{marginTop:"24px"}}>
      <div className="fm-section-label">Remarks &amp; Comments ({comments.length})</div>
      {loading ? <Spinner /> : (
        <div style={{marginBottom:"12px"}}>
          {comments.length === 0 && <div style={{fontSize:"13px", color:"var(--subtle)", fontStyle:"italic", padding:"8px 0"}}>No remarks yet.</div>}
          {comments.map(c => (
            <div key={c.id} className="fm-comment">
              <div className="fm-comment-meta">
                <RoleBadge role={c.users?.role} />
                <span style={{fontSize:"13px", fontWeight:600}}>{c.users?.name}</span>
                <span style={{fontSize:"11px", color:"var(--subtle)", marginLeft:"auto"}}>
                  {new Date(c.created_at).toLocaleString("en-IN", {month:"short", day:"numeric", hour:"2-digit", minute:"2-digit"})}
                </span>
              </div>
              <p style={{fontSize:"13px", color:"var(--text)", margin:0}}>{c.text}</p>
            </div>
          ))}
        </div>
      )}
      <div style={{display:"flex", gap:"8px", alignItems:"flex-start"}}>
        <textarea ref={textRef} rows={2} placeholder="Add a remark…" className="fm-textarea" style={{resize:"none", flex:1}} />
        <button onClick={submit} disabled={saving} className="fm-btn fm-btn-primary fm-btn-sm" style={{marginTop:"1px"}}>
          {saving ? "…" : "Post"}
        </button>
      </div>
    </div>
  );
}

// ── New Lead Form ─────────────────────────────────────────────────────────────
function NewLeadForm({currentUser, onSubmit, onCancel}) {
  const refs = {
    name: useRef(), legalName: useRef(), website: useRef(), estd: useRef(),
    turnover: useRef(), monthlyVol: useRef(), avgTicket: useRef(),
    contactName: useRef(), contactEmail: useRef(), contactPhone: useRef(), notes: useRef()
  };
  const [source, setSource] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [instType, setInstType] = useState("");
  const [domain, setDomain] = useState("");
  const [instState, setInstState] = useState("");
  const [gstRegistered, setGstRegistered] = useState(false);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  const validate = () => {
    const e = {};
    if (!refs.name.current.value.trim()) e.name = "Required";
    if (!instType) e.type = "Required";
    if (!domain) e.domain = "Required";
    if (!businessType) e.businessType = "Required";
    if (!source) e.source = "Required";
    const yr = refs.estd.current.value;
    if (!yr || isNaN(yr) || yr < 1800 || yr > 2030) e.estd = "Enter a valid year";
    if (!refs.turnover.current.value.trim()) e.turnover = "Required";
    if (!refs.monthlyVol.current.value || isNaN(refs.monthlyVol.current.value)) e.monthlyVol = "Enter a number";
    if (!refs.avgTicket.current.value || isNaN(refs.avgTicket.current.value)) e.avgTicket = "Enter a number";
    if (!refs.contactEmail.current.value.includes("@")) e.contactEmail = "Enter a valid email";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    const notes = refs.notes.current.value;
    const payload = {
      name: refs.name.current.value.trim(),
      legal_name: refs.legalName.current.value.trim(),
      business_type: businessType, source, institute_type: instType,
      domain, inst_state: instState,
      estd_year: refs.estd.current.value, website: refs.website.current.value.trim(),
      gst_registered: gstRegistered, turnover: refs.turnover.current.value.trim(),
      monthly_volume: refs.monthlyVol.current.value, avg_ticket: refs.avgTicket.current.value,
      contact_name: refs.contactName.current.value.trim(),
      contact_email: refs.contactEmail.current.value.trim(),
      contact_phone: refs.contactPhone.current.value.trim(),
      notes, status: "LEAD_CREATED", created_by: currentUser.id
    };
    const {data, error} = await supabase.from("leads").insert(payload).select().single();
    if (error) { setAlert({type:"error", message:"Error: " + error.message}); setSaving(false); return; }
    if (notes) { await supabase.from("comments").insert({lead_id: data.id, text: notes, created_by: currentUser.id, role: currentUser.role}); }
    setSaving(false); onSubmit();
  };

  const Field = ({label, required, children, error}) => (
    <div>
      <label className="fm-label">{label}{required ? " *" : ""}</label>
      {children}
      {error && <div className="fm-err">{error}</div>}
    </div>
  );

  return (
    <div style={{maxWidth:"680px", margin:"0 auto"}}>
      <div style={{marginBottom:"20px"}}>
        <div style={{fontSize:"18px", fontWeight:700, color:"var(--text)"}}>New Lead Intake</div>
        <div style={{fontSize:"13px", color:"var(--muted)", marginTop:"2px"}}>Fill in the institute details.</div>
      </div>
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="fm-card" style={{marginBottom:"16px"}}>
        <div className="fm-card-header"><span className="fm-card-title">Institute Details</span></div>
        <div className="fm-card-body">
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px"}}>
            <div style={{gridColumn:"1 / -1"}}>
              <Field label="Institute Name" required error={errors.name}>
                <input ref={refs.name} placeholder="e.g. Monk Academy" className={"fm-input" + (errors.name ? " error" : "")} />
              </Field>
            </div>
            <div style={{gridColumn:"1 / -1"}}>
              <Field label="Legal Entity Name">
                <input ref={refs.legalName} placeholder="e.g. Monk Education Trust" className="fm-input" />
              </Field>
            </div>
            <div style={{gridColumn:"1 / -1"}}>
              <Field label="Website">
                <input ref={refs.website} placeholder="https://example.edu.in" className="fm-input" />
              </Field>
            </div>
            <Field label="Lead Source" required error={errors.source}>
              <select value={source} onChange={e => setSource(e.target.value)} className={"fm-select" + (errors.source ? " error" : "")}>
                <option value="">Select…</option>{LEAD_SOURCES.map(o => <option key={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Business Type" required error={errors.businessType}>
              <select value={businessType} onChange={e => setBusinessType(e.target.value)} className={"fm-select" + (errors.businessType ? " error" : "")}>
                <option value="">Select…</option>{BIZ_TYPES.map(o => <option key={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Institute Type" required error={errors.type}>
              <select value={instType} onChange={e => { setInstType(e.target.value); setDomain(""); }} className={"fm-select" + (errors.type ? " error" : "")}>
                <option value="">Select…</option>{INST_TYPES.map(o => <option key={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Domain" required error={errors.domain}>
              <select value={domain} onChange={e => setDomain(e.target.value)}
                disabled={!instType}
                className={"fm-select" + (errors.domain ? " error" : "") + (!instType ? " disabled" : "")}>
                <option value="">{instType ? "Select domain…" : "Select Institute Type first"}</option>
                {(INST_DOMAINS[instType] || []).map(o => <option key={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Institute State">
              <select value={instState} onChange={e => setInstState(e.target.value)} className="fm-select">
                <option value="">Select state…</option>
                {INDIA_STATES.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Established Year" required error={errors.estd}>
              <input ref={refs.estd} placeholder="e.g. 2005" className={"fm-input" + (errors.estd ? " error" : "")} />
            </Field>
            <div style={{gridColumn:"1 / -1"}}>
              <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", background:"var(--grey-bg)", border:"1px solid var(--border)", borderRadius:"8px", padding:"12px 16px"}}>
                <div>
                  <div style={{fontSize:"13px", fontWeight:600}}>GST Registered?</div>
                  <div style={{fontSize:"12px", color:"var(--muted)", marginTop:"2px"}}>Toggle on if the institute has an active GST registration</div>
                </div>
                <button type="button" onClick={() => setGstRegistered(p => !p)} className={"fm-toggle " + (gstRegistered ? "on" : "off")}>
                  <span className="fm-toggle-knob" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fm-card" style={{marginBottom:"16px"}}>
        <div className="fm-card-header"><span className="fm-card-title">Financial Profile</span></div>
        <div className="fm-card-body">
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"12px"}}>
            <Field label="Annual Turnover" required error={errors.turnover}>
              <input ref={refs.turnover} placeholder="e.g. 12 Cr" className={"fm-input" + (errors.turnover ? " error" : "")} />
            </Field>
            <Field label="Monthly Volume (Sales)" required error={errors.monthlyVol}>
              <input ref={refs.monthlyVol} placeholder="e.g. 450" className={"fm-input" + (errors.monthlyVol ? " error" : "")} />
            </Field>
            <Field label="Avg Course Ticket (₹)" required error={errors.avgTicket}>
              <input ref={refs.avgTicket} placeholder="e.g. 85000" className={"fm-input" + (errors.avgTicket ? " error" : "")} />
            </Field>
          </div>
        </div>
      </div>

      <div className="fm-card" style={{marginBottom:"20px"}}>
        <div className="fm-card-header"><span className="fm-card-title">Primary Contact</span></div>
        <div className="fm-card-body">
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"12px", marginBottom:"12px"}}>
            <Field label="Contact Name"><input ref={refs.contactName} placeholder="Full name" className="fm-input" /></Field>
            <Field label="Email" required error={errors.contactEmail}>
              <input ref={refs.contactEmail} placeholder="email@institute.com" type="email" className={"fm-input" + (errors.contactEmail ? " error" : "")} />
            </Field>
            <Field label="Phone"><input ref={refs.contactPhone} placeholder="+91 98XXX XXXXX" className="fm-input" /></Field>
          </div>
          <Field label="Internal Notes">
            <textarea ref={refs.notes} rows={2} placeholder="Any context for Management…" className="fm-textarea" style={{resize:"none"}} />
          </Field>
        </div>
      </div>

      <div style={{display:"flex", gap:"8px"}}>
        <button onClick={handleSubmit} disabled={saving} className="fm-btn fm-btn-primary">{saving ? "Submitting…" : "Submit Lead"}</button>
        <button onClick={onCancel} className="fm-btn fm-btn-ghost">Cancel</button>
      </div>
    </div>
  );
}

// ── Proposal Builder ──────────────────────────────────────────────────────────
function newVariant(id){return{id,product:"",sampleFees:"",tenure:"",advanceEmi:"0",subvention:"",roi:"",processingFee:"",processingFeeType:"%"};}

function ProposalBuilder({lead, currentUser, existingProposal, onSave, onCancel}) {
  const isEdit = !!existingProposal;
  const [variants, setVariants] = useState(isEdit ? existingProposal.variants.map(v=>({...v,id:v.id||Date.now()+Math.random()})) : [newVariant(1)]);
  const [proposalName, setProposalName] = useState(isEdit ? existingProposal.name : "Proposal for " + lead.name);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  const upd = (id,f,val) => setVariants(vs => vs.map(v => v.id===id ? {...v,[f]:val} : v));
  const addRow = () => setVariants(vs => [...vs, newVariant(Date.now())]);
  const removeRow = id => setVariants(vs => vs.filter(v => v.id!==id));

  const handleSave = async (submit=false) => {
    const filled = variants.filter(v => v.product && v.tenure);
    if (!filled.length) { setAlert({type:"error", message:"Add at least one complete product variant."}); return; }
    setSaving(true);
    const ver = isEdit ? existingProposal.version+1 : 1;
    const status = submit ? "SUBMITTED" : "DRAFT";
    const {error} = await supabase.from("proposals").insert({lead_id:lead.id, name:proposalName, variants:filled, version:ver, status, created_by:currentUser.id, updated_by:currentUser.id});
    if (error) { setAlert({type:"error", message:error.message}); setSaving(false); return; }
    if (submit) {
      await supabase.from("leads").update({status:"PROPOSAL_IN_REVIEW"}).eq("id",lead.id);
      await supabase.from("comments").insert({lead_id:lead.id, text:'Proposal "'+proposalName+'" (v'+ver+') submitted for Management review.', created_by:currentUser.id, role:currentUser.role});
    }
    setSaving(false); onSave();
  };

  const COLS = ["Product","Sample Fees","Tenure","Adv EMI","Subvention %","ROI % (Flat)","Processing Fee","Disbursement","Cost to Institute","Cost to Student","IRR (with PF)","IRR (w/o PF)",""];
  const colCls = h => h==="Disbursement"?"col-blue":h==="Cost to Institute"?"col-orange":h==="Cost to Student"?"col-green":(h==="IRR (with PF)"||h==="IRR (w/o PF)")?"col-violet":"";

  return (
    <div style={{maxWidth:"1300px"}}>
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px"}}>
        <div>
          <div style={{fontSize:"18px", fontWeight:700, color:"var(--text)"}}>{isEdit ? "Edit Proposal" : "Proposal Builder"}</div>
          <div style={{fontSize:"13px", color:"var(--muted)", marginTop:"2px"}}>
            For: <strong>{lead.name}</strong>
            {isEdit && <span style={{marginLeft:"8px", background:"var(--yellow-bg)", color:"var(--yellow)", fontSize:"11px", padding:"2px 8px", borderRadius:"20px", fontWeight:600}}>Editing v{existingProposal.version} → saves as v{existingProposal.version+1}</span>}
          </div>
        </div>
        <Badge status={lead.status} />
      </div>
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div style={{marginBottom:"16px"}}>
        <label className="fm-label">Proposal Name</label>
        <input value={proposalName} onChange={e => setProposalName(e.target.value)} className="fm-input" style={{maxWidth:"460px"}} />
      </div>

      <div className="fm-card" style={{marginBottom:"16px"}}>
        <div style={{overflowX:"auto"}}>
          <table className="fm-table" style={{minWidth:"1250px", width:"100%"}}>
            <thead>
              <tr>
                {COLS.map((h,i) => <th key={i} className={colCls(h)} style={{padding:"10px 12px"}}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {variants.map((v, idx) => {
                const c = computeV(v); const rOff = roiOff(v.product); const sOff = subvOff(v.product);
                return (
                  <tr key={v.id} style={{background: idx%2===0 ? "#fff" : "#fafafa"}}>
                    <td style={{padding:"10px 12px"}}>
                      <select value={v.product} onChange={e => { const p=e.target.value; setVariants(vs=>vs.map(x=>x.id===v.id?{...x,product:p,roi:roiOff(p)?"":x.roi,subvention:subvOff(p)?"":x.subvention}:x)); }} className="pb-select" style={{width:"120px"}}>
                        <option value="">Select…</option>{PRODUCTS.map(p => <option key={p}>{p}</option>)}
                      </select>
                    </td>
                    <td style={{padding:"10px 12px"}}><input value={v.sampleFees} onChange={e=>upd(v.id,"sampleFees",e.target.value)} placeholder="0" className="pb-input" style={{width:"90px"}} /></td>
                    <td style={{padding:"10px 12px"}}>
                      <select value={v.tenure} onChange={e=>upd(v.id,"tenure",e.target.value)} className="pb-select" style={{width:"110px"}}>
                        <option value="">Select…</option>{TENURE_OPTIONS.map(t=><option key={t} value={String(t)}>{t} months</option>)}
                      </select>
                    </td>
                    <td style={{padding:"10px 12px"}}>
                      <select value={v.advanceEmi} onChange={e=>upd(v.id,"advanceEmi",e.target.value)} className="pb-select" style={{width:"60px"}}>
                        {ADVANCE_EMI_OPTIONS.map(o=><option key={o} value={o}>{o}</option>)}
                      </select>
                    </td>
                    <td style={{padding:"10px 12px"}}><div style={{display:"flex",alignItems:"center",gap:"4px"}}><input value={v.subvention} onChange={e=>upd(v.id,"subvention",e.target.value)} disabled={sOff||!v.product} placeholder="0" className="pb-input" /><span style={{fontSize:"11px",color:"var(--muted)"}}>%</span></div></td>
                    <td style={{padding:"10px 12px"}}><div style={{display:"flex",alignItems:"center",gap:"4px"}}><input value={v.roi} onChange={e=>upd(v.id,"roi",e.target.value)} disabled={rOff||!v.product} placeholder="0" className="pb-input" /><span style={{fontSize:"11px",color:"var(--muted)"}}>%</span></div></td>
                    <td style={{padding:"10px 12px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:"4px"}}>
                        <input value={v.processingFee} onChange={e=>upd(v.id,"processingFee",e.target.value)} placeholder="0" className="pb-input" style={{width:"56px"}} />
                        <select value={v.processingFeeType} onChange={e=>upd(v.id,"processingFeeType",e.target.value)} className="pb-select" style={{width:"46px",padding:"6px 4px"}}>
                          <option>%</option><option>₹</option>
                        </select>
                      </div>
                      {c.pfRupee > 0 && <div style={{fontSize:"11px",color:"var(--muted)",marginTop:"2px"}}>{fmt(c.pfRupee)}</div>}
                    </td>
                    <td style={{padding:"10px 12px", background:"rgba(239,246,255,.5)"}}>
                      <span className={v.sampleFees?"val-blue":"val-muted"}>{v.sampleFees?fmt(c.disbursement):"--"}</span>
                      {c.subvAmt>0&&<div style={{fontSize:"11px",color:"#93c5fd",marginTop:"2px"}}>Subv: {fmt(c.subvAmt)}{c.subvGST>0?" + GST: "+fmt(c.subvGST):""}</div>}
                    </td>
                    <td style={{padding:"10px 12px", background:"rgba(255,247,237,.5)"}}>
                      <span className={v.product&&v.sampleFees&&c.costToInstitute>0?"val-orange":"val-muted"}>{v.product&&v.sampleFees?fmt(c.costToInstitute):"--"}</span>
                      {(v.product==="SV GST"||v.product==="HYBRID")&&c.subvGST>0&&<div style={{fontSize:"11px",color:"#fdba74",marginTop:"2px"}}>incl. GST {fmt(c.subvGST)}</div>}
                    </td>
                    <td style={{padding:"10px 12px", background:"rgba(240,253,244,.5)"}}>
                      <span className={v.sampleFees?"val-green":"val-muted"}>{v.sampleFees?fmt(c.costToStudent):"--"}</span>
                      {(c.roiCharge>0||c.pfRupee>0)&&<div style={{fontSize:"11px",color:"#86efac",marginTop:"2px"}}>{c.roiCharge>0&&<span>ROI: {fmt(c.roiCharge)} </span>}{c.pfRupee>0&&<span>PF+GST: {fmt(c.pfRupee+c.pfGST)}</span>}</div>}
                    </td>
                    <td style={{padding:"10px 12px", background:"rgba(245,243,255,.5)"}}>
                      <span className={c.irrWithPF!=null&&v.sampleFees?"val-violet":"val-muted"}>{c.irrWithPF!=null&&v.sampleFees?c.irrWithPF.toFixed(2)+"%":"--"}</span>
                    </td>
                    <td style={{padding:"10px 12px", background:"rgba(245,243,255,.5)"}}>
                      <span className={c.irrWithoutPF!=null&&v.sampleFees?"val-violet":"val-muted"}>{c.irrWithoutPF!=null&&v.sampleFees?c.irrWithoutPF.toFixed(2)+"%":"--"}</span>
                    </td>
                    <td style={{padding:"10px 12px"}}>
                      {variants.length > 1 && <button onClick={() => removeRow(v.id)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--subtle)",fontSize:"18px",lineHeight:1,padding:0}} onMouseOver={e=>e.currentTarget.style.color="var(--red)"} onMouseOut={e=>e.currentTarget.style.color="var(--subtle)"}>×</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{display:"flex", alignItems:"center", gap:"12px", marginBottom:"16px"}}>
        <button onClick={addRow} className="fm-btn fm-btn-outline fm-btn-sm">+ Add Row</button>
        <span style={{fontSize:"12px", color:"var(--muted)"}}>{variants.length} row{variants.length>1?"s":""}</span>
      </div>

      <div style={{display:"flex", gap:"8px"}}>
        <button onClick={() => handleSave(true)} disabled={saving} className="fm-btn fm-btn-primary">{saving ? "Saving…" : "Submit for Review"}</button>
        <button onClick={() => handleSave(false)} disabled={saving} className="fm-btn fm-btn-outline">Save as Draft</button>
        <button onClick={onCancel} className="fm-btn fm-btn-ghost">Cancel</button>
      </div>
    </div>
  );
}

// ── Lead Detail ───────────────────────────────────────────────────────────────
function LeadDetail({leadId, currentUser, onBack, onRefresh}) {
  const [lead, setLead] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subView, setSubView] = useState("detail");
  const [editProposal, setEditProposal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, [leadId]);
  const loadData = async () => {
    setLoading(true);
    const {data: l} = await supabase.from("leads").select("*, users!leads_created_by_fkey(name,role)").eq("id",leadId).single();
    const {data: p} = await supabase.from("proposals").select("*, users!proposals_created_by_fkey(name)").eq("lead_id",leadId).order("created_at",{ascending:false});
    setLead(l); setProposals(p||[]); setLoading(false);
  };

  const approveLead = async () => {
    setSaving(true);
    await supabase.from("leads").update({status:"MGMT_VETTED"}).eq("id",leadId);
    await supabase.from("comments").insert({lead_id:leadId, text:"Lead approved. Sales can now build a proposal.", created_by:currentUser.id, role:currentUser.role});
    setSaving(false); loadData(); onRefresh();
  };
  const rejectLead = async () => {
    if (!rejectReason.trim()) return;
    setSaving(true);
    await supabase.from("leads").update({status:"LEAD_REJECTED", rejection_reason:rejectReason}).eq("id",leadId);
    await supabase.from("comments").insert({lead_id:leadId, text:"Lead rejected: "+rejectReason, created_by:currentUser.id, role:currentUser.role});
    setShowReject(false); setSaving(false); loadData(); onRefresh();
  };
  const approveProposal = async (pid) => {
    setSaving(true);
    await supabase.from("proposals").update({status:"APPROVED", updated_by:currentUser.id}).eq("id",pid);
    await supabase.from("leads").update({status:"MOU_IN_PROGRESS"}).eq("id",leadId);
    await supabase.from("comments").insert({lead_id:leadId, text:"Proposal approved. Lead moved to MOU stage.", created_by:currentUser.id, role:currentUser.role});
    setSaving(false); loadData(); onRefresh();
  };
  const rejectProposal = async (pid) => {
    setSaving(true);
    await supabase.from("proposals").update({status:"REJECTED", updated_by:currentUser.id}).eq("id",pid);
    await supabase.from("leads").update({status:"MGMT_VETTED"}).eq("id",leadId);
    await supabase.from("comments").insert({lead_id:leadId, text:"Proposal rejected. Sales to revise.", created_by:currentUser.id, role:currentUser.role});
    setSaving(false); loadData(); onRefresh();
  };

  if (loading) return <Spinner />;
  if (!lead) return <div style={{color:"var(--muted)"}}>Lead not found.</div>;

  const isMgmt = currentUser.role === "Management";
  const mouLocked = lead.status === "MOU_IN_PROGRESS" || lead.status === "COMPLETED";
  const canBuildProposal = (currentUser.role==="Sales"||currentUser.role==="Channel Partner"||(isMgmt&&lead.created_by===currentUser.id)) && lead.status==="MGMT_VETTED";

  if (subView === "proposal") {
    return <ProposalBuilder lead={lead} currentUser={currentUser} existingProposal={editProposal}
      onSave={() => { setSubView("detail"); setEditProposal(null); loadData(); onRefresh(); }}
      onCancel={() => { setSubView("detail"); setEditProposal(null); }} />;
  }

  // Helper: render a labelled field
  const Field = ({label, value, link, color}) => (
    <div>
      <div style={{fontSize:"11px", fontWeight:600, color:"var(--subtle)", textTransform:"uppercase", letterSpacing:".4px", marginBottom:"3px"}}>{label}</div>
      {link && value
        ? <a href={value.startsWith("http") ? value : "https://"+value} target="_blank" rel="noopener noreferrer"
            style={{fontSize:"13px", color:"var(--blue)", textDecoration:"none", wordBreak:"break-all"}}>{value}</a>
        : <div style={{fontSize:"13px", fontWeight:500, color: color || "var(--text)", wordBreak:"break-all"}}>{value || <span style={{color:"var(--subtle)"}}>—</span>}</div>
      }
    </div>
  );

  return (
    <div style={{maxWidth:"900px", margin:"0 auto"}}>
      <button onClick={onBack} className="fm-back">← Back to Pipeline</button>

      {/* Header bar */}
      <div style={{display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"16px"}}>
        <div>
          <div style={{fontSize:"20px", fontWeight:700, color:"var(--text)"}}>{lead.name}</div>
          {lead.legal_name && lead.legal_name !== lead.name &&
            <div style={{fontSize:"12px", color:"var(--muted)", marginTop:"2px"}}>Legal name: <strong>{lead.legal_name}</strong></div>}
          <div style={{fontSize:"12px", color:"var(--subtle)", marginTop:"3px"}}>
            Created by {lead.users?.name} ({lead.users?.role}) · {new Date(lead.created_at).toLocaleDateString("en-IN", {day:"numeric", month:"short", year:"numeric"})}
          </div>
        </div>
        <Badge status={lead.status} />
      </div>

      {/* Progress bar */}
      {!["REJECTED","WENT_COLD","LEAD_REJECTED"].includes(lead.status) && (
        <div style={{marginBottom:"20px"}}><StepBar status={lead.status} /></div>
      )}

      {/* ── Institute Details ── */}
      <div className="fm-card" style={{marginBottom:"14px"}}>
        <div className="fm-card-header">
          <span className="fm-card-title">🏫 Institute Details</span>
        </div>
        <div className="fm-card-body">
          <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"16px"}}>
            <Field label="Institute Type"   value={lead.institute_type} />
            <Field label="Domain"           value={lead.domain} />
            <Field label="Business Type"    value={lead.business_type} />
            <Field label="Established Year" value={lead.estd_year} />
            <Field label="Lead Source"      value={lead.source} />
            <Field label="State"            value={lead.inst_state} />
            <Field label="Website"          value={lead.website} link />
            <Field label="GST Registered"   value={lead.gst_registered ? "Yes" : "No"}
              color={lead.gst_registered ? "var(--green)" : "var(--muted)"} />
          </div>
        </div>
      </div>

      {/* ── Financial Profile ── */}
      <div className="fm-card" style={{marginBottom:"14px"}}>
        <div className="fm-card-header">
          <span className="fm-card-title">💰 Financial Profile</span>
        </div>
        <div className="fm-card-body">
          <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"16px"}}>
            <Field label="Annual Turnover"      value={lead.turnover} />
            <Field label="Monthly Volume"       value={lead.monthly_volume ? lead.monthly_volume + " sales" : null} />
            <Field label="Avg Course Ticket"    value={lead.avg_ticket ? "₹" + Number(lead.avg_ticket).toLocaleString("en-IN") : null} />
          </div>
        </div>
      </div>

      {/* ── Primary Contact ── */}
      <div className="fm-card" style={{marginBottom:"14px"}}>
        <div className="fm-card-header">
          <span className="fm-card-title">👤 Primary Contact</span>
        </div>
        <div className="fm-card-body">
          <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"16px"}}>
            <Field label="Contact Name"  value={lead.contact_name} />
            <Field label="Email"         value={lead.contact_email} link />
            <Field label="Phone"         value={lead.contact_phone} />
          </div>
        </div>
      </div>

      {isMgmt && lead.status === "LEAD_CREATED" && (
        <div className={"fm-approval-banner " + (lead.created_by===currentUser.id ? "own-lead" : "pending")}>
          {showReject ? (
            <div style={{width:"100%"}}>
              <div style={{fontSize:"13px", fontWeight:700, color:"var(--text-dark)", marginBottom:"8px"}}>Reason for rejection</div>
              <textarea value={rejectReason} onChange={e=>setRejectReason(e.target.value)} rows={2} placeholder="e.g. Turnover too low…" className="fm-textarea" style={{resize:"none", marginBottom:"8px"}} />
              <div style={{display:"flex", gap:"8px"}}>
                <button onClick={rejectLead} disabled={!rejectReason.trim()||saving} className="fm-btn fm-btn-danger fm-btn-sm">Confirm Rejection</button>
                <button onClick={() => setShowReject(false)} className="fm-btn fm-btn-ghost fm-btn-sm">Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <div style={{fontSize:"13px", fontWeight:700, color: lead.created_by===currentUser.id ? "var(--ap-primary)" : "var(--yellow)"}}>
                  {lead.created_by===currentUser.id ? "You created this lead" : "Pending Your Vetting"}
                </div>
                <div style={{fontSize:"12px", color: lead.created_by===currentUser.id ? "var(--ap-primary)" : "#d97706", marginTop:"2px"}}>
                  Approve to move to proposal stage, or reject if not suitable.
                </div>
              </div>
              <div style={{display:"flex", gap:"8px"}}>
                <button onClick={() => setShowReject(true)} className="fm-btn fm-btn-danger fm-btn-sm">Reject</button>
                <button onClick={approveLead} disabled={saving} className="fm-btn fm-btn-success fm-btn-sm">Approve</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Proposals */}
      <div style={{marginTop:"24px"}}>
        <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"12px"}}>
          <div className="fm-section-label">Proposals ({proposals.length})</div>
          {canBuildProposal && (
            <button onClick={() => { setEditProposal(null); setSubView("proposal"); }} className="fm-btn fm-btn-primary fm-btn-sm">+ Build Proposal</button>
          )}
        </div>

        {proposals.length === 0 ? (
          <div style={{background:"var(--grey-bg)", border:"1px dashed var(--border)", borderRadius:"8px", padding:"28px", textAlign:"center", fontSize:"13px", color:"var(--subtle)"}}>
            {canBuildProposal ? "No proposals yet. Click Build Proposal to get started." : "No proposals created yet."}
          </div>
        ) : (
          proposals.map(p => {
            const cardCls = p.status==="APPROVED" ? "approved" : p.status==="REJECTED" ? "rejected" : p.status==="SUBMITTED" ? "submitted" : "";
            return (
              <div key={p.id} className={"fm-proposal-card " + cardCls}>
                <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"12px"}}>
                  <div style={{display:"flex", alignItems:"center", gap:"8px"}}>
                    <span style={{fontSize:"14px", fontWeight:600}}>{p.name}</span>
                    <span style={{background:"var(--grey-bg)", color:"var(--muted)", fontSize:"11px", padding:"2px 8px", borderRadius:"20px", fontWeight:600}}>v{p.version}</span>
                    <span className={"fm-badge " + (p.status==="APPROVED"?"badge-green":p.status==="REJECTED"?"badge-red":p.status==="SUBMITTED"?"badge-yellow":"badge-grey")}>{p.status}</span>
                  </div>
                  <div style={{display:"flex", alignItems:"center", gap:"8px"}}>
                    <span style={{fontSize:"12px", color:"var(--subtle)"}}>{new Date(p.created_at).toLocaleDateString("en-IN")}</span>
                    {!mouLocked
                      ? <button onClick={() => { setEditProposal(p); setSubView("proposal"); }} className="fm-btn fm-btn-outline fm-btn-xs">✏️ Edit</button>
                      : <span style={{fontSize:"12px", background:"var(--grey-bg)", color:"var(--muted)", padding:"4px 10px", borderRadius:"6px"}}>🔒 Locked</span>
                    }
                  </div>
                </div>

                <div style={{overflowX:"auto", marginBottom:"12px"}}>
                  <table className="fm-table" style={{fontSize:"12px"}}>
                    <thead>
                      <tr>{["Product","Tenure","Adv EMI","Subv%","ROI%","Disbursement","Cost/Inst","Cost/Student","IRR w/PF","IRR w/o PF"].map(h=><th key={h}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {p.variants.map((v,j) => {
                        const c = computeV(v);
                        return (
                          <tr key={j}>
                            <td style={{fontWeight:700, color:"var(--blue)"}}>{v.product}</td>
                            <td>{v.tenure}m</td>
                            <td>{v.advanceEmi}</td>
                            <td>{v.subvention||0}%</td>
                            <td>{v.roi||0}%</td>
                            <td className="val-blue">{v.sampleFees?fmt(c.disbursement):"--"}</td>
                            <td className="val-orange">{v.sampleFees?fmt(c.costToInstitute):"--"}</td>
                            <td className="val-green">{v.sampleFees?fmt(c.costToStudent):"--"}</td>
                            <td className="val-violet">{c.irrWithPF!=null&&v.sampleFees?c.irrWithPF.toFixed(2)+"%":"--"}</td>
                            <td style={{color:"#a78bfa"}}>{c.irrWithoutPF!=null&&v.sampleFees?c.irrWithoutPF.toFixed(2)+"%":"--"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {isMgmt && p.status === "SUBMITTED" && (
                  <div style={{display:"flex", gap:"8px", paddingTop:"12px", borderTop:"1px solid var(--border)"}}>
                    <button onClick={() => rejectProposal(p.id)} disabled={saving} className="fm-btn fm-btn-danger fm-btn-sm">Reject Proposal</button>
                    <button onClick={() => approveProposal(p.id)} disabled={saving} className="fm-btn fm-btn-success fm-btn-sm">Approve → Move to MOU</button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {(lead.status === "REJECTED" || lead.status === "LEAD_REJECTED") && (
        <div style={{marginTop:"16px", background:"var(--ap-danger-light)", border:"1px solid var(--red-bd)", borderRadius:"10px", padding:"14px 16px", fontSize:"13px", color:"var(--ap-danger)"}}>
          <strong>{lead.status === "LEAD_REJECTED" ? "Lead Rejected" : "Rejected"}:</strong> {lead.rejection_reason || "No reason provided."}
        </div>
      )}
      {lead.status === "MOU_IN_PROGRESS" && (
        <div style={{marginTop:"16px", background:"var(--purple-bg)", border:"1px solid var(--purple-bd)", borderRadius:"8px", padding:"14px 16px", fontSize:"13px", color:"var(--purple)"}}>
          <strong>🎉 MOU Stage:</strong> Proposal approved. Use comments below to coordinate next steps.
        </div>
      )}

      <Comments leadId={leadId} currentUser={currentUser} />
    </div>
  );
}

// ── Pipeline ──────────────────────────────────────────────────────────────────
// Statuses that are considered "terminal" — no further action available
const TERMINAL_STATUSES = new Set(["COMPLETED", "REJECTED", "WENT_COLD", "LEAD_REJECTED"]);

function ActionMenu({lead, currentUser, onStatusChange}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const menuRef = useRef();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (TERMINAL_STATUSES.has(lead.status)) {
    return (
      <div style={{display:"flex", alignItems:"center", justifyContent:"center", width:"30px", height:"30px"}}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--subtle)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{opacity:.35}}>
          <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
        </svg>
      </div>
    );
  }

  const changeStatus = async (newStatus) => {
    setSaving(true);
    setOpen(false);
    const { error } = await supabase.from("leads").update({ status: newStatus }).eq("id", lead.id);
    if (error) {
      console.error("Status update failed:", error);
      alert("Failed to update status: " + error.message);
      setSaving(false);
      return;
    }
    const labelMap = {COMPLETED:"Onboarded", REJECTED:"Rejected", WENT_COLD:"Went Cold"};
    await supabase.from("comments").insert({
      lead_id: lead.id,
      text: `Status changed to "${labelMap[newStatus] || newStatus}" by ${currentUser.name}.`,
      created_by: currentUser.id,
      role: currentUser.role,
    });
    setSaving(false);
    onStatusChange(lead.id, newStatus);
  };

  return (
    <div className="fm-action-wrap" ref={menuRef}>
      <button
        className={"fm-action-btn" + (open ? " open" : "")}
        disabled={saving}
        onClick={e => { e.stopPropagation(); setOpen(p => !p); }}
        title="Actions">
        {saving
          ? <div style={{width:"14px",height:"14px",border:"2px solid var(--blue-mid)",borderTopColor:"var(--blue)",borderRadius:"50%",animation:"spin .7s linear infinite"}}/>
          : <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5"  r="1.5"/>
              <circle cx="12" cy="12" r="1.5"/>
              <circle cx="12" cy="19" r="1.5"/>
            </svg>
        }
      </button>

      {open && (
        <div className="fm-action-menu" onClick={e => e.stopPropagation()}>
          <div className="fm-action-menu-label">Move lead to</div>
          <button className="fm-action-item success" onClick={() => changeStatus("COMPLETED")}>
            <span style={{fontSize:"15px"}}>🎉</span> Onboarded
          </button>
          <div className="fm-action-divider"/>
          <button className="fm-action-item warn" onClick={() => changeStatus("WENT_COLD")}>
            <span style={{fontSize:"15px"}}>🧊</span> Went Cold
          </button>
          <button className="fm-action-item danger" onClick={() => changeStatus("REJECTED")}>
            <span style={{fontSize:"15px"}}>❌</span> Rejected
          </button>
        </div>
      )}
    </div>
  );
}

function Pipeline({currentUser, onSelectLead, lockedStatus = null, onStatusChanged = null}) {
  const [leads, setLeads] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterUser, setFilterUser] = useState("ALL");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const isMgmt = currentUser.role === "Management";

  useEffect(() => {
    setFilterStatus("ALL");
    setFilterUser("ALL");
    setFilterFrom("");
    setFilterTo("");
    loadData();
  }, [lockedStatus]);

  const loadData = async () => {
    setLoading(true);
    let q = supabase.from("leads").select("*, users!leads_created_by_fkey(name,role)").order("created_at", {ascending: false});
    if (!isMgmt) q = q.eq("created_by", currentUser.id);
    const {data: leadsData} = await q;
    setLeads(leadsData || []);

    if (isMgmt) {
      const {data: usersData} = await supabase.from("users").select("id,name,role").eq("active", true).order("name");
      setAllUsers(usersData || []);
    }
    setLoading(false);
  };

  const resetFilters = () => {
    setFilterStatus("ALL");
    setFilterUser("ALL");
    setFilterFrom("");
    setFilterTo("");
  };

  const hasActiveFilter = filterStatus !== "ALL" || filterUser !== "ALL" || filterFrom !== "" || filterTo !== "";

  const filtered = leads.filter(l => {
    // If coming from a sub-menu, always lock to that status regardless of pill selection
    const statusFilter = lockedStatus || (filterStatus !== "ALL" ? filterStatus : null);
    if (statusFilter && l.status !== statusFilter) return false;
    if (filterUser !== "ALL" && l.created_by !== filterUser) return false;
    if (filterFrom) {
      const from = new Date(filterFrom); from.setHours(0,0,0,0);
      if (new Date(l.created_at) < from) return false;
    }
    if (filterTo) {
      const to = new Date(filterTo); to.setHours(23,59,59,999);
      if (new Date(l.created_at) > to) return false;
    }
    return true;
  });

  return (
    <div>
      {/* Status pills — hidden when a sub-view locks the status */}
      {!lockedStatus && (
        <div className="fm-pill-wrap">
          {["ALL", ...Object.keys(STATUS_META)].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} className={"fm-pill" + (filterStatus===s?" active":"")}>
              {s === "ALL" ? "All Statuses" : STATUS_META[s].label}
            </button>
          ))}
        </div>
      )}

      {/* User + Date filters */}
      <div style={{display:"flex", alignItems:"center", gap:"10px", marginBottom:"16px", flexWrap:"wrap"}}>
        {isMgmt && (
          <div style={{display:"flex", alignItems:"center", gap:"6px"}}>
            <label style={{fontSize:"12px", fontWeight:600, color:"var(--muted)", whiteSpace:"nowrap"}}>Sales Rep</label>
            <select value={filterUser} onChange={e => setFilterUser(e.target.value)} className="fm-select"
              style={{width:"180px", padding:"6px 10px", fontSize:"13px"}}>
              <option value="ALL">All Users</option>
              {allUsers.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
            </select>
          </div>
        )}
        <div style={{display:"flex", alignItems:"center", gap:"6px"}}>
          <label style={{fontSize:"12px", fontWeight:600, color:"var(--muted)", whiteSpace:"nowrap"}}>From</label>
          <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} className="fm-input"
            style={{width:"150px", padding:"6px 10px", fontSize:"13px"}} />
        </div>
        <div style={{display:"flex", alignItems:"center", gap:"6px"}}>
          <label style={{fontSize:"12px", fontWeight:600, color:"var(--muted)", whiteSpace:"nowrap"}}>To</label>
          <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} className="fm-input"
            style={{width:"150px", padding:"6px 10px", fontSize:"13px"}} />
        </div>
        {hasActiveFilter && (
          <button onClick={resetFilters} title="Reset all filters"
            style={{display:"flex",alignItems:"center",justifyContent:"center",width:"32px",height:"32px",borderRadius:"7px",border:"1px solid var(--border)",background:"#fff",cursor:"pointer",color:"var(--muted)",flexShrink:0,transition:"all .15s"}}
            onMouseOver={e=>{e.currentTarget.style.background="var(--red-bg)";e.currentTarget.style.borderColor="var(--red-bd)";e.currentTarget.style.color="var(--red)";}}
            onMouseOut={e=>{e.currentTarget.style.background="#fff";e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--muted)";}}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
            </svg>
          </button>
        )}
        {hasActiveFilter && (
          <span style={{fontSize:"12px", color:"var(--muted)", marginLeft:"2px"}}>
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {loading ? <Spinner /> : (
        <div className="fm-card">
          <div className="fm-table-wrap">
            <table className="fm-table">
              <thead>
                <tr>
                  {["Institute","Created By","Source","Turnover","Status","Progress","Date",""].map((h,i) => (
                    <th key={i} style={i===7 ? {width:"44px"} : {}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && <tr><td colSpan={8} className="fm-empty">No leads found.</td></tr>}
                {filtered.map(l => (
                  <tr key={l.id}>
                    <td onClick={() => onSelectLead(l.id)} style={{cursor:"pointer"}}>
                      <div style={{fontWeight:600, color:"var(--text)"}}>{l.name}</div>
                      {l.legal_name && l.legal_name !== l.name && <div style={{fontSize:"11px", color:"var(--subtle)"}}>{l.legal_name}</div>}
                    </td>
                    <td onClick={() => onSelectLead(l.id)} style={{cursor:"pointer",color:"var(--muted)",fontSize:"12px"}}>{l.users?.name}</td>
                    <td onClick={() => onSelectLead(l.id)} style={{cursor:"pointer"}}><SourceBadge source={l.source} /></td>
                    <td onClick={() => onSelectLead(l.id)} style={{cursor:"pointer",color:"var(--muted)"}}>{l.turnover}</td>
                    <td onClick={() => onSelectLead(l.id)} style={{cursor:"pointer"}}><Badge status={l.status} /></td>
                    <td onClick={() => onSelectLead(l.id)} style={{cursor:"pointer"}}><StepBar status={l.status} /></td>
                    <td onClick={() => onSelectLead(l.id)} style={{cursor:"pointer",color:"var(--subtle)",fontSize:"12px"}}>{new Date(l.created_at).toLocaleDateString("en-IN")}</td>
                    <td style={{textAlign:"center"}}>
                      <ActionMenu
                        lead={l}
                        currentUser={currentUser}
                        onStatusChange={(id, newStatus) => {
                          setLeads(prev => prev.map(x => x.id === id ? {...x, status: newStatus} : x));
                          loadData();
                          if (onStatusChanged) onStatusChanged();
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({currentUser, onNavigate, onNewLead}) {
  const [metrics, setMetrics] = useState({total:0, pending:0, proposals:0, mou:0});
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);
  const loadData = async () => {
    setLoading(true);
    let q = supabase.from("leads").select("*");
    if (currentUser.role !== "Management") q = q.eq("created_by", currentUser.id);
    const {data} = await q;
    const leads = data || [];
    setMetrics({
      total: leads.length,
      pending: leads.filter(l => l.status==="LEAD_CREATED").length,
      proposals: leads.filter(l => l.status==="PROPOSAL_IN_REVIEW").length,
      mou: leads.filter(l => l.status==="MOU_IN_PROGRESS").length,
    });
    setRecent(leads.slice(0, 5)); setLoading(false);
  };

  const kpis = [
    {
      label:"Total Leads", value:metrics.total, sub:"All time", mod:"info", valCls:"kv-slate",
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    },
    {
      label:"Pending Approval", value:metrics.pending, sub:"Awaiting vetting", mod:"warn", valCls:"kv-orange",
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    },
    {
      label:"Proposals In Review", value:metrics.proposals, sub:"Awaiting review", mod:"alert", valCls:"kv-yellow",
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
    },
    {
      label:"MOU In Progress", value:metrics.mou, sub:"Active MOU stage", mod:"good", valCls:"kv-purple",
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
    },
  ];

  return (
    <div>
      <div style={{display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"24px"}}>
        <div>
          <div style={{fontSize:"22px", fontWeight:700, color:"var(--text-dark)"}}>Good morning, {currentUser.name.split(" ")[0]} 👋</div>
          <div style={{fontSize:"13px", color:"var(--muted)", marginTop:"4px"}}>
            {currentUser.role === "Management" ? "Team pipeline overview." : "Your lead pipeline."}
          </div>
        </div>
        <button onClick={onNewLead} className="fm-btn fm-btn-primary" style={{gap:"6px", flexShrink:0}}>
          <span style={{fontSize:"16px", lineHeight:1, marginTop:"-1px"}}>+</span> New Lead
        </button>
      </div>

      <div className="fm-kpi-grid">
        {kpis.map(k => (
          <div key={k.label} className={"fm-kc " + k.mod}>
            <div className="fm-kc-body">
              <div className="fm-kl">{k.label}</div>
              <div className={"fm-kv " + k.valCls}>{k.value}</div>
              <div className="fm-ks">{k.sub}</div>
            </div>
            <div className="fm-kc-badge">{k.icon}</div>
          </div>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <div className="fm-card">
          <div className="fm-card-header">
            <div>
              <div className="fm-card-title">Recent Activity</div>
              <div className="fm-card-sub">Latest leads in your pipeline</div>
            </div>
            <button onClick={() => onNavigate("pipeline")} className="fm-btn fm-btn-outline fm-btn-sm">View all →</button>
          </div>
          <div className="fm-table-wrap">
            <table className="fm-table">
              <thead>
                <tr>{["Institute","Status","Progress","Date"].map(h=><th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {recent.length === 0 && <tr><td colSpan={4} className="fm-empty">No leads yet.</td></tr>}
                {recent.map(l => (
                  <tr key={l.id}>
                    <td style={{fontWeight:600}}>{l.name}</td>
                    <td><Badge status={l.status} /></td>
                    <td><StepBar status={l.status} /></td>
                    <td style={{color:"var(--subtle)", fontSize:"12px"}}>{new Date(l.created_at).toLocaleDateString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState("dashboard");
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [resetMode, setResetMode] = useState(false);
  const [pipelineOpen, setPipelineOpen] = useState(false);
  const [pipelineSubView, setPipelineSubView] = useState(null); // null = all, or a status key
  const [navCounts, setNavCounts] = useState({LEAD_CREATED:0, PROPOSAL_IN_REVIEW:0, WENT_COLD:0, LEAD_REJECTED:0});

  const loadNavCounts = async (user) => {
    let q = supabase.from("leads").select("status");
    if (user.role !== "Management") q = q.eq("created_by", user.id);
    const {data} = await q;
    if (!data) return;
    setNavCounts({
      LEAD_CREATED:       data.filter(l => l.status === "LEAD_CREATED").length,
      PROPOSAL_IN_REVIEW: data.filter(l => l.status === "PROPOSAL_IN_REVIEW").length,
      WENT_COLD:          data.filter(l => l.status === "WENT_COLD").length,
      LEAD_REJECTED:      data.filter(l => l.status === "LEAD_REJECTED").length,
    });
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({data: {session}}) => {
      if (session) {
        const {data} = await supabase.from("users").select("*").eq("id", session.user.id).single();
        if (data && data.active) { setCurrentUser(data); loadNavCounts(data); }
      }
      setAuthLoading(false);
    });
    const {data: {subscription}} = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setResetMode(true);
        setCurrentUser(null);
      }
      if (event === "SIGNED_OUT") {
        setCurrentUser(null);
        setResetMode(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => { await supabase.auth.signOut(); setCurrentUser(null); setView("dashboard"); };

  const PAGE_TITLES = {
    dashboard: "Dashboard",
    pipeline:  "Pipeline",
    new:       "New Lead",
    approvals: "Pending Approvals",
    users:     "User Management",
  };
  const PIPELINE_SUB_TITLES = {
    LEAD_CREATED:       "Lead Approval",
    PROPOSAL_IN_REVIEW: "Proposal Approval",
    WENT_COLD:          "Went Cold",
    LEAD_REJECTED:      "Rejected Leads",
  };
  const topbarTitle = view === "pipeline" && selectedLeadId
    ? "Lead Detail"
    : view === "pipeline" && pipelineSubView
    ? PIPELINE_SUB_TITLES[pipelineSubView]
    : PAGE_TITLES[view] || "";

  if (authLoading) return (
    <>
      <InjectCSS />
      <div style={{minHeight:"100vh", background:"var(--body)", display:"flex", alignItems:"center", justifyContent:"center"}}>
        <div className="fm-spinner" />
      </div>
    </>
  );

  if (resetMode) return (
    <>
      <InjectCSS />
      <ResetPasswordScreen onDone={() => { setResetMode(false); setCurrentUser(null); }} />
    </>
  );

  if (!currentUser) return (<><InjectCSS /><LoginScreen onLogin={(u) => { setCurrentUser(u); loadNavCounts(u); }} /></>);

  const isMgmt = currentUser.role === "Management";

  // SVG outline icons — transparent bg, stroke-based, matches AdminPro style
  const NavIcon = ({name}) => {
    const icons = {
      dashboard: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
      ),
      pipeline: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
      ),
      approvals: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
      users: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
    };
    return icons[name] || null;
  };

  const navItems = [
    {v:"dashboard", label:"Dashboard"},
    {v:"pipeline",  label:"Pipeline"},
    ...(isMgmt ? [
      {v:"approvals", label:"Approvals"},
      {v:"users",     label:"Users"},
    ] : []),
  ];

  return (
    <>
      <InjectCSS />
      <div className="fm-layout">
        {/* Sidebar */}
        <nav className="fm-sidebar">
          <div className="fm-sb-logo">
            <div className="fm-sb-logo-icon">F</div>
            <div>
              <div className="fm-sb-brand">Feemonk</div>
              <div className="fm-sb-sub">CLM Platform</div>
            </div>
          </div>
          <div className="fm-sb-section">Menu</div>

          {/* Dashboard */}
          <button
            onClick={() => { setView("dashboard"); setSelectedLeadId(null); setPipelineSubView(null); }}
            className={"fm-sb-item" + (view==="dashboard" ? " active" : "")}>
            <span className="fm-sb-icon"><NavIcon name="dashboard" /></span>
            Dashboard
          </button>

          {/* Pipeline — parent always goes to full list; chevron toggles submenu */}
          <button
            onClick={() => {
              setView("pipeline");
              setSelectedLeadId(null);
              setPipelineSubView(null);
              setPipelineOpen(true);
            }}
            className={"fm-sb-item" + (view==="pipeline" && !pipelineSubView ? " active" : "")}>
            <span className="fm-sb-icon"><NavIcon name="pipeline" /></span>
            Pipeline
            <span
              onClick={e => { e.stopPropagation(); setPipelineOpen(p => !p); }}
              style={{marginLeft:"auto", padding:"2px", display:"flex", alignItems:"center"}}>
              <svg className={"fm-sb-chevron" + (pipelineOpen ? " open" : "")}
                style={{margin:0}}
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </span>
          </button>

          {/* Pipeline sub-items */}
          <div className="fm-sb-submenu" style={{maxHeight: pipelineOpen ? "260px" : "0"}}>
            {[
              {status:"LEAD_CREATED",       label:"Lead Approval"},
              {status:"PROPOSAL_IN_REVIEW", label:"Proposal Approval"},
              {status:"WENT_COLD",          label:"Went Cold"},
              {status:"LEAD_REJECTED",      label:"Rejected Leads"},
            ].map(({status, label}) => (
              <button
                key={status}
                onClick={() => { setView("pipeline"); setSelectedLeadId(null); setPipelineSubView(status); setPipelineOpen(true); }}
                className={"fm-sb-subitem" + (view==="pipeline" && pipelineSubView===status ? " active" : "")}>
                {label}
                {navCounts[status] > 0 && (
                  <span style={{
                    marginLeft:"auto", background:"rgba(116,90,242,0.25)",
                    color:"rgba(255,255,255,0.9)", fontSize:"10px", fontWeight:700,
                    padding:"1px 7px", borderRadius:"10px", flexShrink:0,
                  }}>
                    {navCounts[status]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Management-only items */}
          {isMgmt && (
            <button
              onClick={() => { setView("approvals"); setSelectedLeadId(null); setPipelineSubView(null); }}
              className={"fm-sb-item" + (view==="approvals" ? " active" : "")}>
              <span className="fm-sb-icon"><NavIcon name="approvals" /></span>
              Approvals
            </button>
          )}
          {isMgmt && (
            <button
              onClick={() => { setView("users"); setSelectedLeadId(null); setPipelineSubView(null); }}
              className={"fm-sb-item" + (view==="users" ? " active" : "")}>
              <span className="fm-sb-icon"><NavIcon name="users" /></span>
              Users
            </button>
          )}
          <div className="fm-sb-section" style={{marginTop:"8px"}}>Account</div>
          <button onClick={handleLogout} className="fm-sb-item" style={{marginBottom:"8px"}}>
            <span className="fm-sb-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </span>
            Logout
          </button>
          <div className="fm-sb-footer">
            <div className="fm-sb-avatar">{currentUser.name.charAt(0).toUpperCase()}</div>
            <div>
              <div className="fm-sb-footer-name">{currentUser.name}</div>
              <div className="fm-sb-footer-role">{currentUser.role}</div>
            </div>
          </div>
        </nav>

        {/* Main */}
        <div className="fm-main">
          <header className="fm-topbar">
            <div className="fm-topbar-title">{topbarTitle}</div>
            <div style={{display:"flex", alignItems:"center", gap:"10px"}}>
              <RoleBadge role={currentUser.role} />
              <span style={{fontSize:"13px", color:"var(--muted)", fontWeight:500}}>{currentUser.name}</span>
            </div>
          </header>

          <main className="fm-content">
            {view === "dashboard" && (
              <Dashboard currentUser={currentUser} onNavigate={v => { setView(v); setSelectedLeadId(null); }} onNewLead={() => setView("new")} />
            )}
            {view === "pipeline" && !selectedLeadId && (
              <div>
                <div style={{marginBottom:"20px"}}>
                  <div style={{fontSize:"18px", fontWeight:700, color:"var(--text-dark)"}}>
                    {pipelineSubView ? PIPELINE_SUB_TITLES[pipelineSubView] : "Pipeline"}
                  </div>
                  <div style={{fontSize:"13px", color:"var(--muted)", marginTop:"2px"}}>
                    {pipelineSubView
                      ? `Showing leads with status: ${PIPELINE_SUB_TITLES[pipelineSubView]}`
                      : isMgmt ? "All leads across the team." : "Your submitted leads."}
                  </div>
                </div>
                <Pipeline
                  currentUser={currentUser}
                  onSelectLead={id => setSelectedLeadId(id)}
                  lockedStatus={pipelineSubView}
                  onStatusChanged={() => loadNavCounts(currentUser)}
                />
              </div>
            )}
            {view === "pipeline" && selectedLeadId && (
              <LeadDetail leadId={selectedLeadId} currentUser={currentUser} onBack={() => setSelectedLeadId(null)} onRefresh={() => {}} />
            )}
            {view === "new" && (
              <NewLead currentUser={currentUser} onSubmit={() => setView("pipeline")} onCancel={() => setView("dashboard")} />
            )}
            {view === "approvals" && isMgmt && (
              <div>
                <div style={{marginBottom:"20px"}}>
                  <div style={{fontSize:"18px", fontWeight:700, color:"var(--text)"}}>Pending Approvals</div>
                  <div style={{fontSize:"13px", color:"var(--muted)", marginTop:"2px"}}>Leads and proposals awaiting your review.</div>
                </div>
                <Pipeline currentUser={currentUser} onSelectLead={id => { setSelectedLeadId(id); setView("pipeline"); }} />
              </div>
            )}
            {view === "users" && isMgmt && <UserManagement />}
          </main>
        </div>
      </div>
    </>
  );
}
