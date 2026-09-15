import BrandMark from '@/app/brand-mark';
import PrimaryNav from '@/app/primary-nav';
import {LocalToday} from '@/app/device-time';
import Community from './community';
import './communities.css';
export const metadata={title:'Communities & Startup Resources — My Day Harbor',description:'Find established founder communities and practical resources to take an idea from discovery to launch.'};
export default function CommunitiesPage(){return <div className="community-page"><div className="site-shell"><header className="masthead"><a className="wordmark site-brand" href="/"><BrandMark/><span>My Day Harbor</span></a><PrimaryNav active="communities"/><span className="hub-date"><LocalToday/></span></header><Community/></div></div>;}
