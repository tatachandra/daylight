'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {ArrowUpRight,RotateCw,Newspaper,Utensils,Users,Radio,ExternalLink} from 'lucide-react';
import BrandMark from '@/app/brand-mark';
import NewsViews from '@/app/news-views';
import {LocalTimestamp,LocalToday} from '@/app/device-time';
import {Button} from '@/components/ui/button';
import {Tabs,TabsList,TabsTrigger,TabsContent} from '@/components/ui/tabs';
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from '@/components/ui/select';
import {TECH_CATEGORIES,TECH_LEADERS,type TechCategory,type TechFeed,type TechPost} from '@/lib/tech-leaders-types';
import {LEADER_PORTRAITS} from '@/lib/tech-leader-portraits';

function PostCard({post,selectedLeaderId}:{post:TechPost;selectedLeaderId:string}) {
  const portraitId=post.leaderIds.includes(selectedLeaderId)?selectedLeaderId:post.leaderIds.find(id=>LEADER_PORTRAITS.some(photo=>photo.leaderId===id));
  const portrait=LEADER_PORTRAITS.find(photo=>photo.leaderId===portraitId);
  const portraitName=TECH_LEADERS.find(person=>person.id===portraitId)?.name;
  const [articleFailed,setArticleFailed]=useState(false),[portraitFailed,setPortraitFailed]=useState(false);
  useEffect(()=>{setArticleFailed(false);setPortraitFailed(false);},[post.image,portrait?.imageUrl]);
  const articleImage=post.image&&!articleFailed;
  const portraitImage=!articleImage&&portrait&&!portraitFailed;
  return <article className="op-news-card tl-post">
    {articleImage&&<figure className="tl-image"><a href={post.url} target="_blank" rel="noopener noreferrer" aria-label={`Read ${post.title}`}><img src={post.image} alt="" loading="lazy" referrerPolicy="no-referrer" onError={()=>setArticleFailed(true)}/></a><figcaption>Image from {post.publisher} · supplied with this post</figcaption></figure>}
    {portraitImage&&<figure className="tl-image tl-image-portrait"><a href={post.url} target="_blank" rel="noopener noreferrer" aria-label={`Read ${post.title}`}><img src={portrait.imageUrl} alt={`Portrait of ${portraitName}`} loading="lazy" referrerPolicy="no-referrer" onError={()=>setPortraitFailed(true)}/></a><figcaption>Portrait of {portraitName} · <a href={portrait.sourceUrl} target="_blank" rel="noopener noreferrer">{portrait.credit}</a> · <a href={portrait.licenseUrl||portrait.sourceUrl} target="_blank" rel="noopener noreferrer">{portrait.license}</a></figcaption></figure>}
    <div className="op-card-copy"><div className="tl-post-meta"><a href={post.url} target="_blank" rel="noopener noreferrer">{post.publisher}</a><span>{post.kind==='official'?'Company post':'News coverage'}</span></div>
      <p className="tl-about">About {post.leaderIds.map(id=>TECH_LEADERS.find(person=>person.id===id)?.name).join(' · ')}</p>
      <a className="op-headline" href={post.url} target="_blank" rel="noopener noreferrer"><h2>{post.title}</h2></a>
      {post.excerpt&&<p className="tl-excerpt">{post.excerpt}</p>}
      <p className="tl-attribution">{post.author?`By ${post.author} · `:''}{post.viaGoogle?'Found through Google News':post.excerpt?'Excerpt from the source':'Original source'} · {post.categories.join(' / ')}</p>
      <div className="op-card-bottom"><LocalTimestamp value={post.published}/><a href={post.url} target="_blank" rel="noopener noreferrer">{post.viaGoogle?'Read report':'Read original'} <ArrowUpRight size={16}/></a></div>
    </div>
  </article>;
}
export default function TechLeaders({initial}:{initial:TechFeed}) {
  const [data,setData]=useState(initial),[active,setActive]=useState<TechCategory>('All updates'),[leaderId,setLeaderId]=useState('all'),[limit,setLimit]=useState(10),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
  const requestNumber=useRef(0),requestController=useRef<AbortController|null>(null);
  const refresh=useCallback(async()=>{
    requestController.current?.abort();const controller=new AbortController();requestController.current=controller;const number=++requestNumber.current;setBusy(true);setNotice('');
    try{const response=await fetch('/api/tech-leaders?leader='+encodeURIComponent(leaderId),{signal:controller.signal});const next:TechFeed=await response.json();if(!response.ok)throw Error();if(number===requestNumber.current){setData(next);setNotice('');}}
    catch{if(!controller.signal.aborted&&number===requestNumber.current)setNotice('Could not refresh this view. Try again in a moment.');}
    finally{if(!controller.signal.aborted&&number===requestNumber.current)setBusy(false);}
  },[leaderId]);
  useEffect(()=>{void refresh();const timer=window.setInterval(()=>{if(document.visibilityState==='visible')void refresh();},300000);return()=>{requestController.current?.abort();window.clearInterval(timer);};},[refresh]);
  const showingSelection=data.leaderId===leaderId;
  const matching=showingSelection?data.posts.filter(post=>active==='All updates'||post.categories.includes(active)):[];
  const problem=showingSelection?data.sources.filter(source=>source.status!=='available'):[];
  const person=TECH_LEADERS.find(person=>person.id===leaderId);
  return <div className="original-daylight op-palette-scope tech-leaders" data-palette="cream"><div className="op-shell">
    <header className="op-header"><a className="op-logo site-brand" href="/"><BrandMark/><span>My Day Harbor</span></a><nav aria-label="Main navigation" className="op-app-nav"><a href="/" aria-current="page"><Newspaper size={17}/>News</a><a href="/wellness"><Utensils size={17}/>Fitness &amp; Nutrition</a><a href="/communities"><Users size={17}/>Communities</a></nav></header>
    <main><NewsViews active="leaders"/><div className="op-intro tl-intro"><div><p className="op-eyebrow"><LocalToday/></p><h1>Tech Leaders<span>.</span></h1><p className="tl-intro-copy">Posts about the people shaping technology.</p></div><Button variant="outline" className="tl-refresh" onClick={()=>void refresh()} disabled={busy}><RotateCw size={16} className={busy?'spinning':''}/>{busy?'Checking':'Refresh'}</Button></div>
      <p className="tl-scope">From company blogs and news publishers. Choose a leader below.</p>
      <Tabs value={active} onValueChange={value=>{setActive(value as TechCategory);setLimit(10);}} className="tl-layout"><aside className="tl-sidebar"><span className="op-eyebrow">Explore technology</span><TabsList className="tl-categories" aria-label="Technology categories">{TECH_CATEGORIES.map(category=><TabsTrigger key={category} value={category}>{category}</TabsTrigger>)}</TabsList>
      </aside><section className="tl-feed" aria-label="Posts about tech leaders" aria-busy={busy}><div className="tl-tools"><div><h2>{person?.name??'All leaders'}</h2><span>{person?.company??'33 people'} · {matching.length} {matching.length===1?'post':'posts'}</span></div><div className="tl-person-select"><label id="leader-choice-label">Choose a tech leader</label><Select value={leaderId} onValueChange={value=>{setLeaderId(value);setLimit(10);setActive('All updates');}}><SelectTrigger className="tl-source-select" aria-labelledby="leader-choice-label"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">All leaders</SelectItem>{TECH_LEADERS.map(leader=><SelectItem value={leader.id} key={leader.id}>{leader.name}</SelectItem>)}</SelectContent></Select></div></div>
        <p className="tl-freshness">Past 30 days · checks free feeds every 5 minutes while this page is open and visible.{showingSelection&&<> Last attempt: <LocalTimestamp value={data.checkedAt}/>.</>}</p>
        {notice&&<p className="op-notice" role="status">{notice}</p>}{problem.length>0&&<p className="op-notice">Could not update {problem.map(status=>status.name).join(', ')}. Available posts are shown; see source status below.</p>}
        {TECH_CATEGORIES.map(category=><TabsContent key={category} value={category}>{!showingSelection&&busy?<p className="op-notice" role="status">Finding posts about {person?.name??'these leaders'}…</p>:matching.length?<><div className="tl-grid">{matching.slice(0,limit).map(post=><PostCard key={post.id} post={post} selectedLeaderId={leaderId}/>)}</div>{matching.length>limit&&<Button variant="outline" className="op-load" onClick={()=>setLimit(value=>value+10)}>More posts</Button>}</>:<div className="op-empty"><Radio size={28}/><h3>{!showingSelection?'This view could not be loaded':'No matching recent posts'}</h3><p>{!showingSelection?'Please try another person or refresh.':'Try another person or topic. Coverage varies, and a leader may have no matching posts in these feeds.'}</p><Button variant="outline" onClick={()=>{setActive('All updates');setLeaderId('all');}}>Show all leaders</Button></div>}</TabsContent>)}
        {showingSelection&&<details className="tl-source-status"><summary>Sources &amp; last successful checks</summary><ul>{data.sources.map(status=><li key={status.id}><a href={status.home} target="_blank" rel="noopener noreferrer">{status.name} <ExternalLink size={13}/></a><span>{status.kind==='official'?'Official company feed':'Publisher reports via Google News'} · {status.status==='available'?'Available':status.status==='cached'?'Showing cached posts':'Unavailable'}{status.lastSuccess&&<> · <LocalTimestamp value={status.lastSuccess}/></>}</span></li>)}</ul><p>A post appears when its headline, source excerpt, or author names a listed leader. Matching is automatic and may occasionally be imperfect. This page does not import personal X posts or provide continuous background monitoring. Some publishers may require a subscription to read full articles.</p></details>}
      </section></Tabs>
    </main><footer className="op-footer"><span>My Day Harbor</span><p>Original sources. A little perspective for your day.</p></footer>
  </div></div>;
}
