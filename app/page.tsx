import Explore from './explore-preview/preview';
import {getNews} from '@/lib/news';
import './explore-preview/style.css';
export const dynamic='force-dynamic';
export default async function Home(){return <Explore initial={await getNews()} preview={false}/>;}
