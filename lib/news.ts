import {cachedPublicFeed} from './public-feed-cache';
import {readBoundedBody} from './request-body';
export const TOPICS = ['World', 'Technology', 'AI', 'U.S. markets', 'India markets'] as const;
export type Topic = typeof TOPICS[number];
export type Story = { id: string; title: string; url: string; published: string; topics: Topic[]; source: string; sourceUrl: string; image?: { url: string; originalUrl: string } };
export type NewsData = { stories: Story[]; checkedAt: string; unavailable: string[]; stale?: boolean };
const SOURCES = [
  { name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', topic: 'World', source:'BBC News', sourceUrl:'https://www.bbc.com/news', hosts:['www.bbc.co.uk','www.bbc.com','bbc.com','bbc.co.uk'] },
  { name: 'BBC Technology', url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', topic: 'Technology', source:'BBC News',sourceUrl:'https://www.bbc.com/news',hosts:['www.bbc.co.uk','www.bbc.com','bbc.com','bbc.co.uk'] },
  { name: 'BBC Business', url: 'https://feeds.bbci.co.uk/news/business/rss.xml', topic: null,source:'BBC News',sourceUrl:'https://www.bbc.com/news',hosts:['www.bbc.co.uk','www.bbc.com','bbc.com','bbc.co.uk'] },
  { name: 'Economic Times Markets', url:'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms',topic:'India markets',source:'The Economic Times',sourceUrl:'https://economictimes.indiatimes.com/markets',hosts:['economictimes.indiatimes.com'] },
] as const;
function decode(value: string) { return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&#(x[\da-f]+|\d+);/gi, (_, n) => { const code = n[0].toLowerCase() === 'x' ? parseInt(n.slice(1),16) : Number(n); return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : ''; }).replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').trim(); }
function tag(xml: string, name: string) { return decode(xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i'))?.[1] ?? ''); }
function articleImage(xml: string, source: string): Story['image'] {
  const candidates = [...xml.matchAll(/<(media:content|media:thumbnail|enclosure)\b([^>]*)\/?\s*>/gi)];
  for (const candidate of candidates) {
    const attributes: Record<string, string> = {};
    for (const match of candidate[2].matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/g)) attributes[match[1].toLowerCase()] = decode(match[3]);
    if (candidate[1].toLowerCase() === 'enclosure' && !attributes.type?.startsWith('image/')) continue;
    let url: URL;
    try { url = new URL(attributes.url); } catch { continue; }
    const imageHost = source === 'BBC News' ? 'ichef.bbci.co.uk' : 'img.etimg.com';
    if (url.protocol !== 'https:' || url.hostname !== imageHost || url.username || url.password || url.port) continue;
    const originalUrl = url.href;
    // The publisher's larger rendition retains the exact image attached to this item.
    if (url.hostname === 'ichef.bbci.co.uk') url.pathname = url.pathname.replace(/^\/ace\/standard\/\d+\//, '/ace/standard/1024/');
    return { url: url.href, originalUrl };
  }
}
export function parseFeed(xml: string, feed: typeof SOURCES[number]): Story[] {
  return [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].flatMap(match => {
    const title = tag(match[1],'title'), url = tag(match[1],'link'), published = tag(match[1],'pubDate');
    let parsed:URL;try{parsed=new URL(url);}catch{return [];}
    const publishedAt=Date.parse(published);
    if (!title || parsed.protocol!=='https:' || !(feed.hosts as readonly string[]).includes(parsed.hostname) || !Number.isFinite(publishedAt) || publishedAt<Date.now()-7*86400000 || publishedAt>Date.now()+900000) return [];
    const topics: Topic[] = feed.topic ? [feed.topic] : [];
    if (/\b(AI|artificial intelligence|OpenAI|ChatGPT|Anthropic|Claude|machine learning)\b/i.test(title)) topics.push('AI');
    const businessFeed=feed.name==='BBC Business'||feed.name==='Economic Times Markets';
    const us=businessFeed&&(/\bUS\b|\bU\.S\.(?=\s|$|[,;:])/u.test(title)||/\b(United States|American|Wall Street|Nasdaq|S&P|Dow Jones|Federal Reserve|Fed|Apple|Tesla|Nvidia|Amazon|Microsoft|Meta|Google|Alphabet)\b/i.test(title));
    const india=businessFeed&&/\b(India|Indian|Mumbai|Nifty|Sensex|Rupee|Reliance|Tata|Adani)\b/i.test(title);
    if(feed.topic==='India markets'&&!india&&(parsed.pathname.includes('/us-stocks/')||parsed.pathname.includes('/cryptocurrency/')||/\b(global|China|Chinese|Hong Kong|Japan|Japanese|Korea|Europe|European|Euronext|Deutsche)\b/i.test(title)))topics.splice(topics.indexOf('India markets'),1);
    if(us){if(!india&&topics.includes('India markets'))topics.splice(topics.indexOf('India markets'),1);topics.push('U.S. markets');}
    if(india)topics.push('India markets');
    if (!topics.length) topics.push('World');
    return [{id:url.split('?')[0],title,url,published:new Date(published).toISOString(),topics:[...new Set(topics)],source:feed.source,sourceUrl:feed.sourceUrl,image:articleImage(match[1],feed.source)}];
  });
}
let cached:NewsData|undefined;
let pending:Promise<NewsData>|undefined;
let retryAfter=0;
async function loadNews():Promise<NewsData>{
  if(cached&&(Date.now()-Date.parse(cached.checkedAt)<300000||Date.now()<retryAfter))return cached;
  if(pending)return pending;
  pending=(async()=>{
    const results=await Promise.allSettled(SOURCES.map(async source=>{
      const response=await fetch(source.url,{headers:{Accept:'application/rss+xml, application/xml'},signal:AbortSignal.timeout(9000)});
      if(!response.ok)throw Error('Feed unavailable');
      const stories=parseFeed(await readBoundedBody(response,2000000),source);if(!stories.length)throw Error('Empty feed');return stories;
    }));
    const merged=new Map<string,Story>();const unavailable:string[]=[];
    results.forEach((result,i)=>{if(result.status==='rejected'){unavailable.push(SOURCES[i].name);return;}result.value.forEach(story=>{const prior=merged.get(story.id);merged.set(story.id,prior?{...prior,topics:[...new Set([...prior.topics,...story.topics])]}:story);});});
    const data={stories:[...merged.values()].sort((a,b)=>Date.parse(b.published)-Date.parse(a.published)),checkedAt:new Date().toISOString(),unavailable};
    if(!data.stories.length&&cached){cached={...cached,unavailable,stale:true};retryAfter=Date.now()+60000;return cached;}
    cached=data;if(!data.stories.length)retryAfter=Date.now()+60000;return data;
  })();try{return await pending;}finally{pending=undefined;}
}

export function getNews(){return cachedPublicFeed('news-v1',300,loadNews,data=>data.stories.length>0,data=>({...data,stale:true}));}
