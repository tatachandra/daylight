'use client';
import {useEffect,useState,type FormEvent} from 'react';
type Mode='signin'|'signup'|'forgot'|'reset'|'verify';
export default function AccountForm({googleEnabled=false,signedInEmail,googleLinked=false}:{googleEnabled?:boolean;signedInEmail?:string;googleLinked?:boolean}){
 const [mode,setMode]=useState<Mode>('signin'),[token,setToken]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{const q=new URLSearchParams(location.search);if(q.get('token')){setToken(q.get('token')!);setMode('reset');history.replaceState(null,'','/account');}if(q.get('error')){setMessage(q.get('error')==='account_not_linked'?'This email already has an account. Sign in with your existing password, then connect Google to keep your saved data.':q.get('error')==='email_not_verified'?'Use a Google account with a verified email address.':'Sign-in was not completed, or the link has expired. Please try again.');}},[]);
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setMessage('');const f=new FormData(e.currentTarget);const email=String(f.get('email')||'').trim();const password=String(f.get('password')||'');const login=String(f.get('login')||'').trim();let endpoint='',body:Record<string,unknown>={};
  if(mode==='signup'){endpoint='sign-up/email';body={email,password,username:String(f.get('username')||'').trim(),name:String(f.get('username')||'').trim(),callbackURL:'/account'};}
  if(mode==='signin'){endpoint=login.includes('@')?'sign-in/email':'sign-in/username';body={password,...(login.includes('@')?{email:login}:{username:login})};}
  if(mode==='forgot'){endpoint='request-password-reset';body={email,redirectTo:location.origin+'/account'};}
  if(mode==='verify'){endpoint='send-verification-email';body={email,callbackURL:'/account'};}
  if(mode==='reset'){endpoint='reset-password';body={newPassword:password,token};}
  try{const r=await fetch('/api/account/'+endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const result=await r.json() as {message?:string};if(!r.ok)throw Error(result.message||'Please try again.');
   if(mode==='signin'){location.assign(googleEnabled?'/account':'/wellness');return;}
   setMessage(mode==='reset'?'Your password was changed. Sign in with your new password.':'If your details are eligible, an email will arrive shortly. Check your inbox and spam folder.');if(mode==='reset'){setToken('');setMode('signin');}
  }catch(error){setMessage(error instanceof Error?error.message:'Unable to connect. Please try again.');}finally{setBusy(false);}
 }
 async function signInWithGoogle(link=false){
  setBusy(true);setMessage('');
  try{
   const r=await fetch('/api/account/'+(link?'link-social':'sign-in/social'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({provider:'google',callbackURL:link?'/account':'/wellness',errorCallbackURL:'/account',disableRedirect:true})});
   const result=await r.json() as {url?:string;message?:string};
   if(!r.ok||!result.url)throw Error(result.message||'Google sign-in could not start. Please try again.');
   const destination=new URL(result.url);
   if(destination.origin!=='https://accounts.google.com')throw Error('Google sign-in could not start. Please try again.');
   location.assign(destination.href);
  }catch(error){setMessage(error instanceof Error?error.message:'Unable to connect. Please try again.');setBusy(false);}
 }
 const switchMode=(next:Mode)=>{setMode(next);setMessage('');};
 if(signedInEmail&&mode==='signin')return <><h1>Your account</h1><p>Signed in as {signedInEmail}</p><a className="signin-button" href="/wellness">Open Fitness &amp; Nutrition</a>{googleEnabled&&<section style={{marginTop:24}}><h2>Google sign-in</h2>{googleLinked?<p>Google is connected. Next time, use Continue with Google.</p>:<><p>Connect the Google account with this same email address to keep your saved profile and logs.</p><button type="button" style={googleButton} disabled={busy} onClick={()=>void signInWithGoogle(true)}>{busy?'Connecting…':'Connect Google'}</button></>}</section>}{message&&<p role="status">{message}</p>}<p><a href="/account/signout">Sign out</a></p></>;
 const emailForm=<form onSubmit={submit} style={{display:'grid',gap:16}}>
 {mode==='signin'&&<label>Email or username<input name="login" required autoComplete="username" style={field}/></label>}
 {mode==='signup'&&<label>Username<input name="username" required minLength={3} maxLength={30} pattern="[A-Za-z0-9_.]+" autoComplete="username" style={field}/><small>3–30 letters, numbers, underscores or periods.</small></label>}
 {['signup','forgot','verify'].includes(mode)&&<label>Email<input name="email" type="email" required autoComplete="email" style={field}/></label>}
 {['signin','signup','reset'].includes(mode)&&<label>Password<input name="password" type="password" required minLength={mode==='signin'?1:15} maxLength={128} autoComplete={mode==='signin'?'current-password':'new-password'} style={field}/>{mode!=='signin'&&<small>Use at least 15 characters. A unique passphrase works well.</small>}</label>}
 <button className="signin-button" disabled={busy} type="submit">{busy?'Please wait…':({signin:'Sign in',signup:'Create account',forgot:'Send reset link',reset:'Save new password',verify:'Send verification link'})[mode]}</button></form>;
 return <><h1>{({signin:'Welcome back',signup:'Create your account',forgot:'Reset your password',reset:'Choose a new password',verify:'Verify your email'})[mode]}</h1><p>Your meal and workout logs stay private to your account.</p>{googleEnabled&&(mode==='signin'||mode==='signup')?<><button type="button" style={googleButton} disabled={busy} onClick={()=>void signInWithGoogle()}>{busy?'Opening Google…':'Continue with Google'}</button><p style={{fontSize:14}}>Use your Google account. No separate username or password needed.</p><details key={mode} style={{marginTop:24}}><summary style={{cursor:'pointer',marginBottom:16}}>Use email instead</summary>{emailForm}</details></>:emailForm}
 {message&&<p role="status" style={{padding:'12px 0'}}>{message}</p>}
 <nav aria-label="Account options" style={{display:'flex',gap:12,flexWrap:'wrap',marginTop:24}}>{mode!=='signin'&&<button onClick={()=>switchMode('signin')}>Sign in</button>}{mode!=='signup'&&<button onClick={()=>switchMode('signup')}>Create account</button>}{mode==='signin'&&<><button onClick={()=>switchMode('forgot')}>Forgot password?</button><button onClick={()=>switchMode('verify')}>Resend verification</button></>}</nav></>;
}
const field={display:'block',width:'100%',padding:'12px',border:'1px solid #b7b3aa',borderRadius:8,font:'inherit',marginTop:6};

const googleButton={display:'block',width:'100%',padding:'12px 20px',background:'#fff',color:'#1f1f1f',border:'1px solid #747775',borderRadius:24,fontSize:16,fontWeight:500,cursor:'pointer'};
