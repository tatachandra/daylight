'use client';
import BrandMark from '@/app/brand-mark';
import { useEffect, useMemo, useState, useRef } from 'react';
import { flushSync } from 'react-dom';
import {LocalTimestamp,LocalToday} from './device-time';
import { ArrowUpRight, SlidersHorizontal, RotateCw, Globe2, Sparkles, Cpu, TrendingUp, Check, ChevronRight } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { TOPICS, type Topic, type Story, type NewsData } from '@/lib/news';
import PrimaryNav from './primary-nav';
const defaults:Topic[]=['World','Technology','AI','U.S. markets','India markets'];
const topicIcons={World:Globe2,Technology:Cpu,AI:Sparkles,'U.S. markets':TrendingUp,'India markets':TrendingUp};
export function ArticleImage({story,lead}:{story:Story;lead:boolean}){
  const [fallback,setFallback]=useState(false),[failed,setFailed]=useState(false);
  useEffect(()=>{setFallback(false);setFailed(false);},[story.image?.url]);
  if(!story.image||failed)return null;
  return <figure className={lead?'article-image article-image-lead':'article-image article-image-small'}>
    <a href={story.url} target="_blank" rel="noopener noreferrer" aria-label={`Open publisher image and story: ${story.title}`}>
      {/* Publisher-provided media stays attached to its original article. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={fallback?story.image.originalUrl:story.image.url} alt="" loading={lead?'eager':'lazy'} decoding="async" referrerPolicy="no-referrer" onError={()=>{if(!fallback&&story.image?.url!==story.image?.originalUrl)setFallback(true);else setFailed(true);}}/>
    </a>
    {lead&&<figcaption>Image supplied with this story by {story.source}</figcaption>}
  </figure>;
}
function Article({story,lead=false,index=0}:{story:Story;lead?:boolean;index?:number}){return <article className={lead?'lead-story':'story-row'}>
  {!lead&&<span className="story-number">{String(index+1).padStart(2,'0')}</span>}
  <div className="story-body"><div className="story-meta"><span className="topic-label">{story.topics[0]}</span><a href={story.sourceUrl} target="_blank" rel="noopener noreferrer">{story.source}</a></div>
  <a className="story-link" href={story.url} target="_blank" rel="noopener noreferrer"><h2>{story.title}</h2><ArrowUpRight aria-hidden="true"/></a>
  {lead&&<ArticleImage story={story} lead/>}
  <div className="story-bottom"><LocalTimestamp value={story.published}/><a href={story.url} target="_blank" rel="noopener noreferrer" aria-label={`Read on ${story.source}: ${story.title}`}>Read full story <ArrowUpRight size={14}/></a></div></div>{!lead&&<ArticleImage story={story} lead={false}/>}</article>;}
export default function Newsroom({initial}:{initial:NewsData}){
  const [data,setData]=useState(initial),[topics,setTopics]=useState<Topic[]>(defaults),[active,setActive]=useState('For you'),[refreshing,setRefreshing]=useState(false),[notice,setNotice]=useState(''),[limit,setLimit]=useState(12),[preferencesReady,setPreferencesReady]=useState(false);
  useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem('daylight-topics')||'null');if(Array.isArray(saved)&&saved.some(x=>TOPICS.includes(x)))setTopics(saved.filter(x=>TOPICS.includes(x)));}catch{}setPreferencesReady(true);},[]);
  useEffect(()=>{if(preferencesReady)try{localStorage.setItem('daylight-topics',JSON.stringify(topics));}catch{}},[topics,preferencesReady]);
  function toggleTopic(topic:Topic){setTopics(current=>current.includes(topic)?current.length>1?current.filter(t=>t!==topic):current:[...current,topic]);}
  async function refresh(){setRefreshing(true);setNotice('');try{const response=await fetch('/api/news');if(!response.ok)throw Error();const next:NewsData=await response.json();setData(next);setNotice(next.stale?'Showing your last available headlines while the publisher feeds recover.':next.unavailable.length?'Available feeds refreshed. Some publishers are temporarily unavailable.':'Your feed is up to date.');}catch{setNotice('News could not be refreshed. Your last loaded headlines are still here.');}finally{setRefreshing(false);}}
  useEffect(()=>{const id=window.setInterval(()=>{if(document.visibilityState==='visible')void refresh();},300000);return()=>window.clearInterval(id);},[]);
  const matching=useMemo(()=>data.stories.filter(s=>s.topics.some(t=>active==='For you'?topics.includes(t):t===active)),[data,topics,active]);
  const current=useRef({matching,topics,active});current.current={matching,topics,active};
  useEffect(()=>{
    type Tool={name:string;title:string;description:string;inputSchema:object;annotations:object;execute:(input:unknown)=>unknown};
    const context=(document as Document&{modelContext?:{registerTool:(tool:Tool,options:{signal:AbortSignal})=>void|Promise<void>}}).modelContext;
    if(!context?.registerTool)return;
    const lifecycle=new AbortController();
    const definitions:Tool[]=[{name:'read_current_news',title:'Read current headlines',description:'Read headlines in the selected news tab with their original publisher links and publication times.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute(){return{tab:current.current.active,stories:current.current.matching.slice(0,12)};}},{name:'set_news_interests',title:'Set news interests',description:'Replace the selected topic preferences and show the personalized For you feed. Preferences are saved in this browser.',inputSchema:{type:'object',properties:{topics:{type:'array',items:{type:'string',enum:[...TOPICS]},minItems:1,uniqueItems:true}},required:['topics'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!input||typeof input!=='object'||!('topics' in input)||!Array.isArray(input.topics)||input.topics.length===0||input.topics.some(t=>!TOPICS.includes(t))||Object.keys(input).some(k=>k!=='topics'))throw Error('Select at least one valid news topic.');const selected=[...new Set(input.topics)] as Topic[];flushSync(()=>{setTopics(selected);setActive('For you');setLimit(12);});return{topics:selected,tab:'For you'};}}];
    for(const tool of definitions)try{Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}
    return()=>lifecycle.abort();
  },[]);
  const preferences=<Dialog><DialogTrigger asChild><Button variant="outline" className="customize"><SlidersHorizontal size={16}/> Your interests</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Make it your daily read.</DialogTitle><DialogDescription>Choose at least one topic. These preferences stay in this browser.</DialogDescription></DialogHeader><div className="topic-options">{TOPICS.map(topic=><label key={topic}><Checkbox checked={topics.includes(topic)} disabled={topics.length===1&&topics.includes(topic)} onCheckedChange={()=>toggleTopic(topic)}/><span>{topic}</span></label>)}</div><p className="small-copy">Your “For you” feed shows stories matching these topics, newest first. No account needed.</p></DialogContent></Dialog>;
  return <div className="site-shell"><header className="masthead"><a href="/" className="wordmark site-brand"><BrandMark/><span>My Day Harbor</span></a><PrimaryNav active="news"/>{preferences}</header>
  <main><div className="page-heading"><div><p className="eyebrow"><LocalToday/></p><h1>Your daily perspective<span>.</span></h1><p>The world, your interests, and what’s happening next.</p></div><Button variant="ghost" onClick={refresh} disabled={refreshing} className="refresh-button"><RotateCw className={refreshing?'spinning':''} size={16}/>{refreshing?'Refreshing':'Refresh feed'}</Button></div>
  <Tabs value={active} onValueChange={value=>{setActive(value);setLimit(12);}} className="news-tabs"><TabsList variant="line" className="topic-tabs">{['For you',...TOPICS].map(topic=><TabsTrigger key={topic} value={topic}>{topic==='For you'&&<Sparkles size={15}/>} {topic}</TabsTrigger>)}</TabsList>
  <div className="feed-status"><span>PAST 7 DAYS · REFRESHES EVERY 5 MINUTES</span><span>{data.stale?'Last successful update':'Checked'} <LocalTimestamp value={data.checkedAt}/></span></div>
  {notice&&<p className="notice" role="status">{notice}</p>}{data.unavailable.length>0&&<p className="notice" role="status">Some feeds are temporarily unavailable: {data.unavailable.join(', ')}. Available stories are shown below.</p>}
  <div className="content-grid"><section className="feed-column" aria-label="News stories">{['For you',...TOPICS].map(tab=><TabsContent value={tab} key={tab}>
  {matching.length?<><div className="lead-label"><span>THE LATEST</span><span>{active==='For you'?'Selected by your interests':active}</span></div><Article story={matching[0]} lead/><div className="section-heading"><h2>More to know</h2><span>{matching.length-1} stories</span></div>{matching.slice(1,limit).map((story,index)=><Article key={story.id} story={story} index={index}/>)}{matching.length>limit?<Button variant="outline" className="load-more" onClick={()=>setLimit(limit+12)}>Show more headlines <ChevronRight size={16}/></Button>:<p className="feed-end"><Check size={16}/> You’re caught up with this feed.</p>}</>:<div className="empty-feed"><Globe2 size={36}/><h2>{data.stories.length?'No matching headlines right now.':'The news is taking a moment.'}</h2><p>{data.stories.length?'Try another topic, or check back as new stories arrive.':'The publisher feeds could not be reached. Please try refreshing.'}</p><Button variant="outline" onClick={refresh}>Try again</Button></div>}
  </TabsContent>)}</section>
  <aside className="right-rail"><section className="interests-card"><p className="eyebrow">YOUR DAILY MIX</p><h2>A feed that follows<br/>your curiosity.</h2><div className="interest-list">{topics.map(topic=>{const Icon=topicIcons[topic];return <button key={topic} onClick={()=>{setActive(topic);setLimit(12);}}><Icon size={18}/><span>{topic}</span><ChevronRight size={15}/></button>;})}</div><p className="small-copy">Picked by you. Ordered by recency.</p></section>
  <section className="market-card"><div className="rail-section-title"><TrendingUp size={19}/><h2>Market lens</h2></div><p>Follow the stories behind the markets.</p><button onClick={()=>setActive('U.S. markets')}><span>United States<small>Business & company headlines</small></span><ArrowUpRight size={18}/></button><button onClick={()=>setActive('India markets')}><span>India<small>The Economic Times · markets</small></span><ArrowUpRight size={18}/></button><p className="small-copy market-note">News coverage, not live stock prices or a top-gainers ranking.</p></section>
  <section className="reading-note"><span className="mini-sun"><BrandMark small/></span><h3>Stay curious.<br/>Keep your day.</h3><p>A useful daily read, with room for everything else.</p></section></aside></div></Tabs>
  </main><footer><a className="footer-brand" href="/">My Day Harbor</a><p>Headlines from <a href="https://www.bbc.com/news" target="_blank" rel="noopener noreferrer">BBC News</a> and <a href="https://economictimes.indiatimes.com/markets" target="_blank" rel="noopener noreferrer">The Economic Times</a>. Full stories open at the publisher.</p><span>For curious minds.</span></footer></div>;
}
