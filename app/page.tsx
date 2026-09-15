import DaylightNews from './design-preview/preview';
import { getNews } from '@/lib/news';
import './design-preview/preview.css';
import './design-preview/palettes.css';
export const dynamic = 'force-dynamic';
export default async function Home() { return <DaylightNews initial={await getNews()} preview={false} />; }
