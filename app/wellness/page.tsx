import './welcome.css';
import BrandMark from '@/app/brand-mark';
import {chatGPTSignOutPath} from '@/app/chatgpt-auth';
import {getSiteUser} from '@/lib/accounts';
import PrimaryNav from '@/app/primary-nav';
import FitnessDashboard from './fitness-dashboard';
export const dynamic='force-dynamic';
export const metadata={title:'Fitness & Nutrition — My Day Harbor',description:'Private meal and activity logs, nutrient estimates, and ideas for your next meal.'};
export default async function WellnessPage(){const user=await getSiteUser();return <div className="site-shell wellness-shell"><header className="masthead"><a href="/" className="wordmark site-brand"><BrandMark/><span>My Day Harbor</span></a><PrimaryNav active="wellness"/>{user&&<a className="account-link" href={user.kind==='personal'?'/account/signout':chatGPTSignOutPath('/wellness')} target="_top">Sign out</a>}</header><FitnessDashboard signedIn={!!user}/></div>;}
