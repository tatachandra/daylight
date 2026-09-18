import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
const require=createRequire(import.meta.url),loaded=new Map();
function load(file){
  if(loaded.has(file))return loaded.get(file).exports;
  const module={exports:{}};loaded.set(file,module);
  const code=ts.transpileModule(readFileSync(new URL('../'+file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(code,{module,exports:module.exports,require:name=>name==='./tech-leaders-types'?load('lib/tech-leaders-types.ts'):require(name),Date,URL,URLSearchParams,TextDecoder,AbortSignal,fetch,Response},{filename:file});return module.exports;
}
const {TECH_SOURCES,TECH_LEADERS}=load('lib/tech-leaders-types.ts');
const {LEADER_PORTRAITS}=load('lib/tech-leader-portraits.ts');
assert.ok(LEADER_PORTRAITS.length>0,'Real portraits must be present before release');
assert.equal(new Set(LEADER_PORTRAITS.map(photo=>photo.leaderId)).size,LEADER_PORTRAITS.length);
for(const photo of LEADER_PORTRAITS){assert.ok(TECH_LEADERS.some(person=>person.id===photo.leaderId));assert.ok(['upload.wikimedia.org','thumb.wikimedia.org'].includes(new URL(photo.imageUrl).hostname));assert.equal(new URL(photo.sourceUrl).hostname,'commons.wikimedia.org');assert.ok(photo.credit&&photo.license&&photo.licenseUrl.startsWith('https://'));}
const {parseTechFeed,relatedLeaders,safeSourceUrl,createTechFeedLoader}=load('lib/tech-leaders.ts');
let now=Date.parse('2026-09-17T12:00:00Z');
const item=(title,link='https://openai.com/index/example',extra='')=>`<item><title><![CDATA[${title}]]></title><link>${link}</link><pubDate>${new Date(now-60000).toUTCString()}</pubDate>${extra}</item>`;
const feed=(...items)=>`<rss><channel>${items.join('')}</channel></rss>`;
assert.equal(TECH_LEADERS.length,33);
assert.equal(parseTechFeed(feed(item('A company release without a person')),TECH_SOURCES[0],now).length,0,'Company affiliation must not imply personal relevance');
const matching=parseTechFeed(feed(item('Sam Altman introduces a model','https://openai.com/index/example','<description><![CDATA[<script>ignore this</script><p>Details &amp; context</p>]]></description>')),TECH_SOURCES[0],now);
assert.equal(matching.length,1);assert.equal(matching[0].leaderIds[0],'sam-altman');assert.equal(matching[0].excerpt,'Details & context');
assert.equal(parseTechFeed(feed(item('Sam Altman','https://evil.example/post')),TECH_SOURCES[0],now).length,0);
assert.equal(parseTechFeed(feed(item('Sam Altman','javascript:alert(1)')),TECH_SOURCES[0],now).length,0);
assert.equal(safeSourceUrl('https://name:password@openai.com/index/post',['openai.com']),null);
assert.equal(relatedLeaders('Tobias Lutke and Jeremy O’Brien').length,2);
assert.equal(relatedLeaders('Altman and Huang').length,0);
assert.equal(relatedLeaders('Sam Altmanson').length,0);
assert.throws(()=>parseTechFeed('<html>Access denied</html>',TECH_SOURCES[0],now));
assert.throws(()=>parseTechFeed('<!ENTITY bad "x"><rss/>',TECH_SOURCES[0],now));
const news={...TECH_SOURCES[0],id:'news',searchFeed:true,hosts:['news.google.com'],imageHosts:[],kind:'coverage'};
const report=parseTechFeed(feed(item('Sam Altman announces Example - Example News','https://news.google.com/rss/articles/example','<source url="https://example.com">Example News</source>')),news,now)[0];
assert.equal(report.publisher,'Example News');assert.equal(report.title,'Sam Altman announces Example');assert.equal(report.viaGoogle,true);assert.equal(report.excerpt,'');
let calls=0,fail=false,empty=false;
const loader=createTechFeedLoader(async url=>{calls++;if(fail)throw Error('Offline');if(empty)return new Response('<rss><channel/></rss>');if(url.includes('openai.com'))return new Response(feed(item('Sam Altman introduces a model')));return new Response('<rss><channel/></rss>');},()=>now);
const [first,concurrent]=await Promise.all([loader('sam-altman'),loader('sam-altman')]);
assert.equal(first.posts.length,1);assert.equal(concurrent.posts.length,1);assert.equal(calls,5,'Overlapping readers must reuse in-flight work');
await loader('sam-altman');assert.equal(calls,5,'Refresh must respect TTL');
const other=await loader('lisa-su');assert.equal(other.posts.length,0,'A person must not inherit another person’s posts');assert.equal(calls,6,'Official sources must share their cache');
now+=300001;fail=true;const stale=await loader('sam-altman');assert.equal(stale.posts.length,1);assert.equal(stale.sources[0].status,'cached');assert.equal(stale.sources[0].lastSuccess,first.sources[0].lastSuccess);
now+=300001;fail=false;empty=true;const cleared=await loader('sam-altman');assert.equal(cleared.posts.length,0);assert.ok(cleared.sources.every(source=>source.status==='available'),'A valid empty feed is a successful check');
await assert.rejects(()=>loader('not-a-leader'));
if(process.argv.includes('--live')){
  const root='http://localhost:5173';
  const response=await fetch(root+'/api/tech-leaders');assert.equal(response.status,200);const data=await response.json();assert.ok(data.posts.length>0,'Expected live posts');assert.ok(data.posts.every(post=>post.leaderIds.length&&post.publisher&&post.url.startsWith('https://')));
  const selected=await fetch(root+'/api/tech-leaders?leader=sam-altman');assert.equal(selected.status,200);const person=await selected.json();assert.ok(person.posts.length);assert.ok(person.posts.every(post=>post.leaderIds.includes('sam-altman')));
  assert.equal((await fetch(root+'/api/tech-leaders?leader=https://example.com')).status,400);
  for(const path of ['/','/tech-leaders','/wellness','/communities']){const r=await fetch(root+path);assert.equal(r.status,200,path);const html=await r.text();assert.ok(html.includes('My Day Harbor'));if(path==='/'||path==='/tech-leaders')assert.ok(html.includes('Tech Leaders'));}
  console.log(JSON.stringify({livePosts:data.posts.length,personPosts:person.posts.length,availableSources:data.sources.filter(source=>source.status==='available').length,totalSources:data.sources.length,example:data.posts[0].title}));
}
console.log('Tech Leaders checks passed: person matching, safe source links, publisher labels, caching, outages, empty results and source isolation.');
