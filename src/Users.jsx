import { useState, useEffect } from "react";
import { supabase } from "./supabase";

export default function UserManagement({currentUser}){
  const [users,setUsers]=useState([]);
  const [loading,setLoading]=useState(true);
  const [showNew,setShowNew]=useState(false);
  const [newUser,setNewUser]=useState({name:"",email:"",role:"Sales",active:true});
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState("");

  useEffect(()=>{
    loadUsers();
  },[]);

  const loadUsers=async()=>{
    setLoading(true);
    try{
      const {data,error:err}=await supabase.from("users").select("*").order("name");
      if(err)throw err;
      setUsers(data||[]);
    }catch(err){
      console.error("Error loading users:",err);
      setError("Failed to load users");
    }finally{
      setLoading(false);
    }
  };

  const handleAddUser=async()=>{
    if(!newUser.name.trim()||!newUser.email.trim()){
      setError("Name and email are required");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try{
      const {error:err}=await supabase.from("users").insert({
        name:newUser.name,
        email:newUser.email,
        role:newUser.role,
        active:newUser.active,
      });

      if(err)throw err;

      setSuccess("User added successfully!");
      setNewUser({name:"",email:"",role:"Sales",active:true});
      setShowNew(false);
      await loadUsers();
    }catch(err){
      console.error("Error adding user:",err);
      setError(err.message||"Failed to add user");
    }finally{
      setSaving(false);
    }
  };

  const handleToggleActive=async(userId,currentActive)=>{
    try{
      const {error:err}=await supabase.from("users").update({active:!currentActive}).eq("id",userId);
      if(err)throw err;
      await loadUsers();
    }catch(err){
      console.error("Error updating user:",err);
      setError("Failed to update user");
    }
  };

  const handleDeleteUser=async(userId)=>{
    if(!confirm("Are you sure you want to delete this user?"))return;

    try{
      const {error:err}=await supabase.from("users").delete().eq("id",userId);
      if(err)throw err;
      await loadUsers();
      setSuccess("User deleted");
    }catch(err){
      console.error("Error deleting user:",err);
      setError("Failed to delete user");
    }
  };

  const roleColors={Sales:"#2563eb",["Channel Partner"]:"#d97706",Management:"#6d28d9"};

  return(
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <div>
          <h1 style={{fontSize:20,fontWeight:700,color:"#1e293b",margin:0}}>User Management</h1>
          <p style={{fontSize:13,color:"#64748b",margin:"4px 0 0"}}>Manage your team members and their roles.</p>
        </div>
        <button onClick={()=>setShowNew(!showNew)} style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:6,padding:"8px 16px",fontSize:13,fontWeight:600,cursor:"pointer"}}>+ Add User</button>
      </div>

      {error&&<div style={{background:"#fee2e2",border:"1px solid #fca5a5",borderRadius:8,padding:"12px 16px",color:"#b91c1c",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span>{error}</span><button onClick={()=>setError("")} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,opacity:.6}}>×</button></div>}

      {success&&<div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:8,padding:"12px 16px",color:"#15803d",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span>{success}</span><button onClick={()=>setSuccess("")} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,opacity:.6}}>×</button></div>}

      {showNew&&(
        <div style={{background:"#fff",borderRadius:10,border:"1px solid #e2e8f0",padding:20,marginBottom:20}}>
          <h2 style={{fontSize:16,fontWeight:700,color:"#1e293b",margin:"0 0 16px"}}>Add New User</h2>
          
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
            <div>
              <label style={{display:"block",fontSize:12,fontWeight:600,color:"#475569",marginBottom:6}}>Name *</label>
              <input type="text" value={newUser.name} onChange={e=>setNewUser({...newUser,name:e.target.value})} placeholder="Full name" style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:6,padding:"8px 10px",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
            </div>
            <div>
              <label style={{display:"block",fontSize:12,fontWeight:600,color:"#475569",marginBottom:6}}>Email *</label>
              <input type="email" value={newUser.email} onChange={e=>setNewUser({...newUser,email:e.target.value})} placeholder="user@email.com" style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:6,padding:"8px 10px",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
            <div>
              <label style={{display:"block",fontSize:12,fontWeight:600,color:"#475569",marginBottom:6}}>Role</label>
              <select value={newUser.role} onChange={e=>setNewUser({...newUser,role:e.target.value})} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:6,padding:"8px 10px",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}>
                <option value="Sales">Sales</option>
                <option value="Channel Partner">Channel Partner</option>
                <option value="Management">Management</option>
              </select>
            </div>
            <div>
              <label style={{display:"block",fontSize:12,fontWeight:600,color:"#475569",marginBottom:6}}>Status</label>
              <select value={newUser.active?"Active":"Inactive"} onChange={e=>setNewUser({...newUser,active:e.target.value==="Active"})} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:6,padding:"8px 10px",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div style={{display:"flex",gap:8}}>
            <button onClick={handleAddUser} disabled={saving} style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:6,padding:"8px 16px",fontSize:13,fontWeight:600,cursor:saving?"not-allowed":"pointer",opacity:saving?.5:1}}>{saving?"Adding...":"Add User"}</button>
            <button onClick={()=>setShowNew(false)} style={{background:"#fff",color:"#475569",border:"1px solid #e2e8f0",borderRadius:6,padding:"8px 16px",fontSize:13,fontWeight:600,cursor:"pointer"}}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{background:"#fff",borderRadius:10,border:"1px solid #e2e8f0",overflow:"hidden"}}>
        {loading?(
          <div style={{textAlign:"center",padding:40,color:"#94a3b8"}}>Loading users...</div>
        ):users.length===0?(
          <div style={{textAlign:"center",padding:40,color:"#94a3b8"}}>No users yet. Add one above!</div>
        ):(
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr style={{borderBottom:"1px solid #f1f5f9",background:"#fafafa"}}>
                <th style={{textAlign:"left",padding:"12px 16px",fontSize:11,fontWeight:600,color:"#64748b",textTransform:"uppercase",letterSpacing:".4px"}}>Name</th>
                <th style={{textAlign:"left",padding:"12px 16px",fontSize:11,fontWeight:600,color:"#64748b",textTransform:"uppercase",letterSpacing:".4px"}}>Email</th>
                <th style={{textAlign:"left",padding:"12px 16px",fontSize:11,fontWeight:600,color:"#64748b",textTransform:"uppercase",letterSpacing:".4px"}}>Role</th>
                <th style={{textAlign:"left",padding:"12px 16px",fontSize:11,fontWeight:600,color:"#64748b",textTransform:"uppercase",letterSpacing:".4px"}}>Status</th>
                <th style={{textAlign:"left",padding:"12px 16px",fontSize:11,fontWeight:600,color:"#64748b",textTransform:"uppercase",letterSpacing:".4px"}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user=>(
                <tr key={user.id} style={{borderBottom:"1px solid #f8fafc"}}>
                  <td style={{padding:"12px 16px",fontSize:13,fontWeight:500,color:"#1e293b"}}>{user.name}</td>
                  <td style={{padding:"12px 16px",fontSize:13,color:"#64748b"}}>{user.email}</td>
                  <td style={{padding:"12px 16px",fontSize:13}}>
                    <span style={{display:"inline-flex",alignItems:"center",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,background:roleColors[user.role]+"20",color:roleColors[user.role]}}>{user.role}</span>
                  </td>
                  <td style={{padding:"12px 16px",fontSize:13}}>
                    <span style={{display:"inline-flex",alignItems:"center",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,background:user.active?"#f0fdf4":"#fee2e2",color:user.active?"#15803d":"#b91c1c"}}>{user.active?"Active":"Inactive"}</span>
                  </td>
                  <td style={{padding:"12px 16px",fontSize:13}}>
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={()=>handleToggleActive(user.id,user.active)} style={{background:"none",border:"none",color:"#2563eb",cursor:"pointer",fontSize:12,fontWeight:600,textDecoration:"underline"}}>{user.active?"Deactivate":"Activate"}</button>
                      <button onClick={()=>handleDeleteUser(user.id)} style={{background:"none",border:"none",color:"#ef4444",cursor:"pointer",fontSize:12,fontWeight:600,textDecoration:"underline"}}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}