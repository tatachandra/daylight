import {env} from 'cloudflare:workers';
import {headers} from 'next/headers';
import {drizzleAdapter} from '@better-auth/drizzle-adapter';
import {getDb} from '@/db';
import * as schema from '@/db/schema';
import {createAccountAuth} from './account-config';
import {getChatGPTUser} from '@/app/chatgpt-auth';

export function accountsEnabled(){return env.PERSONAL_ACCOUNTS_ENABLED==='true'&&!!env.BETTER_AUTH_SECRET&&!!env.RESEND_API_KEY;}
export function googleSignInEnabled(){return accountsEnabled()&&!!env.GOOGLE_CLIENT_ID&&!!env.GOOGLE_CLIENT_SECRET;}
export function accountBaseURL(){return env.ACCOUNT_BASE_URL||'https://mydayharbor.com';}
export function accountAuth(){
 if(!accountsEnabled())throw Error('Personal accounts are not available yet.');
 return createAccountAuth({database:drizzleAdapter(getDb(),{provider:'sqlite',schema,transaction:false}),secret:env.BETTER_AUTH_SECRET!,baseURL:accountBaseURL(),
  google:googleSignInEnabled()?{clientId:env.GOOGLE_CLIENT_ID!,clientSecret:env.GOOGLE_CLIENT_SECRET!}:undefined,
  sendMail:async(to,subject,text)=>{
   const result=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:'My Day Harbor <accounts@mydayharbor.com>',to:[to],subject,text}),signal:AbortSignal.timeout(12000)});
   if(!result.ok)throw Error('Account email could not be delivered.');
  }});
}
export async function getSiteUser(){
 if(accountsEnabled()){
  const session=await accountAuth().api.getSession({headers:await headers()});
  if(session?.user.emailVerified)return {userId:`local:${session.user.id}`,email:session.user.email,displayName:session.user.name,kind:'personal' as const};
 }
 const legacy=await getChatGPTUser();
 return legacy?{...legacy,kind:'chatgpt' as const}:null;
}
