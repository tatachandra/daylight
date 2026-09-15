import {getNews} from '@/lib/news';
import OriginalPreview from './preview';
import './preview.css';
import './palettes.css';
export const dynamic='force-dynamic';
export const metadata={title:'Daylight — Original layout preview'};
export default async function DesignPreview(){return <OriginalPreview initial={await getNews()}/>;}
