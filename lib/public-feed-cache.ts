// Public feed data only. Never use for account, profile, or meal responses.
// Cloudflare Cache API shares entries within a location, not globally.
const pending=new Map<string,Promise<unknown>>();
export async function cachedPublicFeed<T>(key:string,ttl:number,load:()=>Promise<T>,usable:(value:T)=>boolean,markStale:(value:T)=>T=value=>value):Promise<T>{
 const running=pending.get(key);if(running)return running as Promise<T>;
 const task=(async()=>{
  const cache=(globalThis as unknown as {caches?:{default?:Cache}}).caches?.default;
  const url='https://mydayharbor.com/__public_feed_cache/'+encodeURIComponent(key);
  let saved:{value:T;freshUntil:number}|undefined;
  try{const hit=await cache?.match(url);if(hit)saved=await hit.json();}catch{}
  if(saved&&saved.freshUntil>Date.now())return saved.value;
  try{
   const value=await load();
   if(!usable(value)&&saved)return markStale(saved.value);
   const freshUntil=Date.now()+(usable(value)?ttl:60)*1000;
   try{await cache?.put(url,Response.json({value,freshUntil},{headers:{'Cache-Control':`public, max-age=${usable(value)?21600:60}`}}));}catch{}
   return value;
  }catch(error){if(saved)return markStale(saved.value);throw error;}
 })();pending.set(key,task);try{return await task;}finally{pending.delete(key);}
}
