import {getNews} from '@/lib/news';
import Explore from './preview';
import './style.css';
export const dynamic='force-dynamic';
export default async function Page(){return <Explore initial={await getNews()}/>;}
