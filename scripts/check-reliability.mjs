import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(file,caches){const module={exports:{}};const context={module,exports:module.exports,TextDecoder,Uint8Array,Response,Date,caches};vm.runInNewContext(ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,context);return module.exports;}
const {readBoundedBody}=load('lib/request-body.ts');
assert.equal(await readBoundedBody(new Request('https://example.test',{method:'POST',body:'abcd'}),4),'abcd');
await assert.rejects(readBoundedBody(new Request('https://example.test',{method:'POST',body:'abcde'}),4));
await assert.rejects(readBoundedBody(new Request('https://example.test',{method:'POST',body:'ééé'}),5));
let cancelled=false;const stream=new ReadableStream({pull(c){c.enqueue(new Uint8Array(4));},cancel(){cancelled=true;}});
await assert.rejects(readBoundedBody({headers:new Headers(),body:stream},5));assert.ok(cancelled);
const store=new Map();const cache={default:{match:async k=>store.get(k)?.clone(),put:async(k,v)=>{store.set(k,v.clone());}}};
const a=load('lib/public-feed-cache.ts',cache),b=load('lib/public-feed-cache.ts',cache);let calls=0;
const fetcher=async()=>{calls++;await Promise.resolve();return {items:[1]};};
await Promise.all(Array.from({length:50},()=>a.cachedPublicFeed('test',300,fetcher,v=>v.items.length>0)));assert.equal(calls,1);
await b.cachedPublicFeed('test',300,fetcher,v=>v.items.length>0);assert.equal(calls,1,'Independent instance must use shared cache');
const key='https://mydayharbor.com/__public_feed_cache/test';store.set(key,Response.json({value:{items:[1]},freshUntil:0}));
const fallback=await b.cachedPublicFeed('test',300,async()=>{throw Error('outage')},v=>v.items.length>0);assert.equal(fallback.items[0],1);
console.log('PASS: bounded streaming bytes/cancellation, 50-request deduplication, shared cache across instances, and stale outage fallback.');
