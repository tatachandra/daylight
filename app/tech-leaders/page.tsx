import {getTechFeed} from '@/lib/tech-leaders';
import TechLeaders from './feed';
import '../design-preview/preview.css';
import '../design-preview/palettes.css';
import './tech-leaders.css';
export const dynamic = 'force-dynamic';
export const metadata = {title:'Tech Leaders — My Day Harbor',description:'Find posts and reporting about individual technology leaders, with original sources and local publication times.'};
export default async function TechLeadersPage(){return <TechLeaders initial={await getTechFeed()}/>;}
