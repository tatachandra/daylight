import {Newspaper,Utensils} from 'lucide-react';
export default function PrimaryNav({active}:{active:'news'|'wellness'}){return <nav className="primary-nav" aria-label="Main navigation"><a href="/" aria-current={active==='news'?'page':undefined}><Newspaper size={17}/>News</a><a href="/wellness" aria-current={active==='wellness'?'page':undefined}><Utensils size={17}/>Meals & Fitness</a></nav>;}
