'use client';
import {useState} from 'react';
export default function SignOut(){const [message,setMessage]=useState('');return <main className="site-shell"><h1>Sign out</h1><button className="signin-button" onClick={async()=>{const r=await fetch('/api/account/sign-out',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});if(r.ok)location.assign('/wellness');else setMessage('Could not sign out. Please try again.');}}>Sign out of your account</button><p role="status">{message}</p></main>}
