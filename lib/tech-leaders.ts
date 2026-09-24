import {cachedPublicFeed} from './public-feed-cache';
import {TECH_SOURCES, TECH_LEADERS, type TechSource, type TechPost, type TechFeed, type TechCategory} from './tech-leaders-types';

const INTERVAL = 300000;
const MAX_AGE = 30 * 86400000;
const MAX_BYTES = 1500000;

function decode(value: string) {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&#(x[\da-f]+|\d+);/gi, (_, n: string) => {
    const code = n[0].toLowerCase() === 'x' ? parseInt(n.slice(1), 16) : Number(n);
    return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : '';
  }).replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&nbsp;/g,' ').replace(/&amp;/g,'&');
}
function tag(xml: string, name: string) {
  return decode(xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i'))?.[1] ?? '').trim();
}
export function plainText(value: string) {
  return decode(value).replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
}
export function safeSourceUrl(value: string, hosts: string[]) {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password && !url.port && hosts.includes(url.hostname) ? url.href : null; } catch { return null; }
}
function imageFrom(item: string, source: TechSource) {
  const media = [...item.matchAll(/<(?:media:content|media:thumbnail|enclosure)\b([^>]*)>/gi)].map(match => match[1].match(/\burl\s*=\s*["']([^"']+)["']/i)?.[1]);
  const html = tag(item,'content:encoded') || tag(item,'description');
  const images = [...html.matchAll(/<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)].map(match => match[1]);
  for (const raw of [...media, ...images]) {
    if (!raw) continue;
    const url = safeSourceUrl(decode(raw), source.imageHosts);
    if (url && !/\.(?:svg|gif)(?:[?#]|$)/i.test(url)) return url;
  }
  return undefined;
}
function categoriesFor(text: string, source: TechSource): TechCategory[] {
  const categories: TechCategory[] = [];
  if (/\b(AI|artificial intelligence|GPT|LLM|machine learning|Gemini|Copilot|inference)\b/i.test(text)) categories.push('AI');
  if (/\b(chips?|semiconductors?|GPUs?|CPUs?|silicon|processors?)\b/i.test(text)) categories.push('Chips');
  if (/\b(robot(?:s|ics)?|humanoid|autonomous vehicles?)\b/i.test(text)) categories.push('Robotics');
  if (/\b(rocket|satellite|spacecraft|SpaceX|orbital)\b/i.test(text)) categories.push('Space');
  if (/\b(fusion|tokamak)\b/i.test(text)) categories.push('Fusion');
  if (/\b(brain.?computer|neural interface|Neuralink|brain implant)\b/i.test(text)) categories.push('Brain interfaces');
  return categories.length ? categories : [source.defaultCategory];
}
function normalized(value:string){return value.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
export function relatedLeaders(text:string){const haystack=' '+normalized(text)+' ';return TECH_LEADERS.filter(person=>person.aliases.some(alias=>haystack.includes(' '+normalized(alias)+' '))).map(person=>person.id);}
export function parseTechFeed(xml: string, source: TechSource, now = Date.now()): TechPost[] {
  if (!/<(?:rss|rdf:RDF)\b/i.test(xml) || /<!ENTITY\b/i.test(xml)) throw new Error('Not a supported feed');
  const posts = new Map<string, TechPost>();
  for (const match of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)) {
    const item = match[1], publisher=source.searchFeed?plainText(tag(item,'source')).slice(0,100):source.name;
    let title = plainText(tag(item,'title')).slice(0,300);
    if(source.searchFeed&&publisher&&title.endsWith(' - '+publisher))title=title.slice(0,-publisher.length-3);
    const url = safeSourceUrl(tag(item,'link'),source.hosts), time = Date.parse(tag(item,'pubDate'));
    if (!title || !url || !Number.isFinite(time) || time > now + 900000 || time < now - MAX_AGE) continue;
    const canonical = new URL(url); canonical.hash = ''; for (const key of [...canonical.searchParams.keys()]) if (/^(utm_|fbclid$|gclid$)/i.test(key)) canonical.searchParams.delete(key);
    const description = source.searchFeed?'':plainText(tag(item,'description')).replace(/\s+The post [\s\S]* appeared first on [\s\S]*$/i,'');
    const excerpt = description.length > 300 ? description.slice(0,300).replace(/\s+\S*$/,'') + '…' : description;
    const id = canonical.href;
    const author=plainText(tag(item,'dc:creator')).slice(0,120)||undefined;
    const leaderIds=relatedLeaders(title+' '+excerpt+' '+(author??''));
    if(!leaderIds.length)continue;
    posts.set(id,{id,title,url:canonical.href,published:new Date(time).toISOString(),excerpt,author,sourceId:source.id,categories:categoriesFor(title+' '+excerpt+' '+tag(item,'category'),source),image:imageFrom(item,source),leaderIds,publisher:publisher||'News publisher',kind:source.kind,viaGoogle:!!source.searchFeed});
  }
  return [...posts.values()].sort((a,b)=>Date.parse(b.published)-Date.parse(a.published)).slice(0,40);
}
async function boundedText(response: Response) {
  if (!response.body || Number(response.headers.get('content-length')) > MAX_BYTES) throw new Error('Feed too large');
  const reader = response.body.getReader(), decoder = new TextDecoder(); let bytes = 0, result = '';
  try { while (true) { const chunk = await reader.read(); if (chunk.done) break; bytes += chunk.value.byteLength; if (bytes > MAX_BYTES) throw new Error('Feed too large'); result += decoder.decode(chunk.value,{stream:true}); } return result + decoder.decode(); }
  finally { await reader.cancel().catch(()=>{}); reader.releaseLock(); }
}
export function createTechFeedLoader(fetcher: typeof fetch = fetch, now: () => number = Date.now) {
  const saved = new Map<string,{posts:TechPost[];lastSuccess:string}>();
  const sourceChecks=new Map<string,{at:number;ok:boolean}>(),sourcePending=new Map<string,Promise<boolean>>();
  const cache=new Map<string,TechFeed>(),pending=new Map<string,Promise<TechFeed>>();
  async function read(source:TechSource){
    const check=sourceChecks.get(source.id);if(check&&now()-check.at<INTERVAL)return check.ok;
    const running=sourcePending.get(source.id);if(running)return running;
    const task=(async()=>{let ok=false;try{
      const response=await fetcher(source.feed,{headers:{Accept:'application/rss+xml, application/xml, text/xml','User-Agent':'MyDayHarbor/1.0 (+https://mydayharbor.com)','Accept-Language':'en-US,en;q=0.9'},signal:AbortSignal.timeout(10000)});
      if(!response.ok)throw Error('Source HTTP '+response.status);
      const posts=parseTechFeed(await boundedText(response),source,now());saved.set(source.id,{posts,lastSuccess:new Date(now()).toISOString()});ok=true;
    }catch(error){const message=error instanceof Error?error.message:'';console.warn('tech-feed-unavailable',source.id,/^(Source HTTP \d{3}|Feed too large|Not a supported feed)$/.test(message)?message:error instanceof Error?error.name:'Unknown error');}sourceChecks.set(source.id,{at:now(),ok});return ok;})();
    sourcePending.set(source.id,task);try{return await task;}finally{sourcePending.delete(source.id);}
  }
  return async function load(leaderId='all'): Promise<TechFeed> {
    if(leaderId!=='all'&&!TECH_LEADERS.some(person=>person.id===leaderId))throw Error('Unknown leader');
    const cached=cache.get(leaderId);if(cached&&now()-Date.parse(cached.checkedAt)<INTERVAL)return cached;
    const running=pending.get(leaderId);if(running)return running;
    const task = (async()=>{
      const attempted = now();
      const selected=leaderId==='all'?TECH_LEADERS:TECH_LEADERS.filter(person=>person.id===leaderId);
      const feeds=TECH_SOURCES.filter(source=>source.kind==='official');
      for(let i=0;i<selected.length;i+=5){const group=selected.slice(i,i+5),query='('+group.flatMap(person=>leaderId==='all'?[person.name]:person.aliases).map(name=>'"'+name+'"').join(' OR ')+') when:30d';const params=new URLSearchParams({q:query,hl:'en-US',gl:'US',ceid:'US:en'});feeds.push({id:`news-${leaderId}-${i}`,name:leaderId==='all'?`Leader reports ${Math.floor(i/5)+1}`:`Reports about ${selected[0].name}`,kind:'coverage',home:'https://news.google.com/search?'+params,feed:'https://news.google.com/rss/search?'+params,hosts:['news.google.com'],imageHosts:[],defaultCategory:'Other updates',searchFeed:true});}
      const results=await Promise.all(feeds.map(read));
      const all = new Map<string,TechPost>();
      const sources = feeds.map((source,index)=>{
        const previous = saved.get(source.id);
        const posts = (previous?.posts ?? []).filter(post=>Date.parse(post.published) >= now() - MAX_AGE&&(leaderId==='all'||post.leaderIds.includes(leaderId)));
        for (const post of posts) if (!all.has(post.id)) all.set(post.id,post);
        return {id:source.id,name:source.name,home:source.home,kind:source.kind,status:results[index] ? 'available' as const : posts.length ? 'cached' as const : 'unavailable' as const,lastSuccess:previous?.lastSuccess ?? null,count:posts.length};
      });
      const data = {posts:[...all.values()].sort((a,b)=>Date.parse(b.published)-Date.parse(a.published)),sources,checkedAt:new Date(attempted).toISOString(),leaderId};cache.set(leaderId,data);return data;
    })();
    pending.set(leaderId,task);try { return await task; } finally { pending.delete(leaderId); }
  };
}
const loadTechFeed=createTechFeedLoader();
export function getTechFeed(leaderId='all'){return cachedPublicFeed('leaders-v1-'+leaderId,60,()=>loadTechFeed(leaderId),data=>data.posts.length>0,data=>({...data,sources:data.sources.map(source=>({...source,status:source.count?'cached' as const:'unavailable' as const}))}));}
