import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
import BrandMark from '@/app/brand-mark';
import {accountsEnabled,accountAuth,accountBaseURL,googleSignInEnabled} from '@/lib/accounts';
import AccountForm from './form';
export const dynamic='force-dynamic';
export const metadata={title:'Your account — My Day Harbor',robots:{index:false,follow:false},referrer:'no-referrer' as const};
export default async function AccountPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const enabled=accountsEnabled(),googleEnabled=googleSignInEnabled();
 const requestHeaders=await headers();
 // OAuth state and the callback must use the same host and cookie jar.
 if(googleEnabled&&requestHeaders.get('host')&&requestHeaders.get('host')!==new URL(accountBaseURL()).host){
  const destination=new URL('/account',accountBaseURL());
  const query=await searchParams;
  for(const key of ['token','error'])if(typeof query[key]==='string')destination.searchParams.set(key,query[key]);
  redirect(destination.toString());
 }
 const session=enabled?await accountAuth().api.getSession({headers:requestHeaders}):null;
 const personalUser=session?.user.emailVerified?session.user:null;
 const linked=personalUser&&googleEnabled?await accountAuth().api.listUserAccounts({headers:requestHeaders}):[];
 return <div className="site-shell account-shell"><header className="masthead"><a href="/" className="wordmark site-brand"><BrandMark/><span>My Day Harbor</span></a></header><main className="account-layout"><section className="account-intro"><p>YOUR EVERYDAY, CONNECTED</p><h1>Make room for<br/><em>your wellbeing.</em></h1><p>One place for your meals, movement and the progress that matters to you.</p><img src="https://images.pexels.com/photos/25004923/pexels-photo-25004923/free-photo-of-salad-in-bowl.jpeg?auto=compress&cs=tinysrgb&w=700" alt="Fresh vegetables and greens in a colorful meal bowl"/><a href="/wellness">Explore Fitness &amp; Nutrition ↗</a></section><section className="account-card">{enabled?<AccountForm googleEnabled={googleEnabled} signedInEmail={personalUser?.email} googleLinked={linked.some(a=>a.providerId==='google')}/>:<><h1>Personal accounts are being prepared</h1><p>Registration will open after verification and security checks are complete.</p><a href="/wellness">Return to Fitness &amp; Nutrition</a></>}</section></main></div>;
}
