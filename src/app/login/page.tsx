
"use client";

import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setMessage("Login service is not connected yet.");
  }

  return (
    <main style={{minHeight:"100vh",background:"#f5f4f0",padding:"50px 20px",fontFamily:"Arial"}}>
      <div style={{maxWidth:430,margin:"auto"}}>
        <Link href="/" style={{color:"#111",textDecoration:"none",fontWeight:900,letterSpacing:3}}>YUSEE PLUGS</Link>
        <h1 style={{fontSize:38,marginTop:60}}>WELCOME BACK.</h1>
        <p>Sign in to your Yusee Plugs account.</p>
        <form onSubmit={login} style={{display:"grid",gap:16,marginTop:35}}>
          <input required type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)} style={field}/>
          <input required type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} style={field}/>
          <button style={button}>SIGN IN</button>
        </form>
        {message && <p>{message}</p>}
        <p style={{marginTop:25}}>New to Yusee? <Link href="/register">Create an account</Link></p>
      </div>
    </main>
  );
}

const field = {padding:16,border:"1px solid #ccc",background:"white",fontSize:15};
const button = {padding:17,background:"#111",color:"white",border:0,fontWeight:800,cursor:"pointer"};
