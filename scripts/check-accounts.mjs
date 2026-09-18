import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {memoryAdapter} from 'better-auth/adapters/memory';
import {readFileSync} from 'node:fs';
import {Miniflare} from 'miniflare';
import {drizzle} from 'drizzle-orm/d1';
import {drizzleAdapter} from '@better-auth/drizzle-adapter';
import * as schema from '../db/schema.ts';
import {createAccountAuth} from '../lib/account-config.ts';

const db={user:[],session:[],account:[],verification:[],rateLimit:[]};
const outbox=[];
let mf;let database=memoryAdapter(db);
if(process.argv.includes('--d1')){
 mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("test")}}',d1Databases:['DB']});
 const binding=await mf.getD1Database('DB');
 for(const sql of readFileSync(new URL('../drizzle/0001_slow_blade.sql',import.meta.url),'utf8').split('--> statement-breakpoint'))if(sql.trim())await binding.prepare(sql).run();
 database=drizzleAdapter(drizzle(binding,{schema}),{provider:'sqlite',schema,transaction:false});
}
try {
const origin='https://accounts-test.example';
const auth=createAccountAuth({database,secret:randomBytes(32).toString('hex'),baseURL:origin,sendMail:async(to,subject,text)=>outbox.push({to,subject,text})});
const password='Unique test passphrase '+randomBytes(12).toString('hex');
async function call(path,body,cookie='',requestOrigin=origin){return auth.handler(new Request(origin+'/api/account/'+path,{method:body?'POST':'GET',headers:{Origin:requestOrigin,'Content-Type':'application/json','cf-connecting-ip':'192.0.2.3',...(cookie?{Cookie:cookie}:{})},...(body?{body:JSON.stringify(body)}:{})}));}
let r=await call('sign-up/email',{name:'Tester',username:'tester_one',email:'one@example.com',password:'short'});assert.equal(r.ok,false);
r=await call('sign-up/email',{name:'Tester',username:'tester_one',email:'one@example.com',password,callbackURL:'/account'});assert.equal(r.status,200);assert.equal(outbox.length,1);if(!mf){assert.equal(db.user.length,1);assert.notEqual(db.account[0].password,password);}
r=await call('sign-in/username',{username:'tester_one',password});assert.equal(r.status,403);
const verifyURL=outbox[0].text.match(/https:\/\/[^\s]+/)[0];r=await auth.handler(new Request(verifyURL));assert.ok(r.status<400);if(!mf)assert.equal(db.user[0].emailVerified,true);
r=await call('sign-in/username',{username:'tester_one',password});assert.equal(r.status,200);const cookie=r.headers.getSetCookie().map(s=>s.split(';')[0]).join('; ');assert.ok(cookie);assert.match(r.headers.get('set-cookie'),/HttpOnly/i);assert.match(r.headers.get('set-cookie'),/Secure/i);
r=await call('get-session',null,cookie);let data=await r.json();assert.equal(data.user.email,'one@example.com');
r=await call('sign-out',{},cookie,'https://attacker.example');assert.equal(r.ok,false);
r=await call('request-password-reset',{email:'one@example.com',redirectTo:origin+'/account'});assert.equal(r.status,200);assert.equal(outbox.length,2);
const resetURL=outbox[1].text.match(/https:\/\/[^\s]+/)[0];r=await auth.handler(new Request(resetURL));const token=new URL(r.headers.get('location')).searchParams.get('token');assert.ok(token);
const newPassword=password+' renewed';r=await call('reset-password',{token,newPassword});assert.equal(r.status,200);
r=await call('reset-password',{token,newPassword:password});assert.equal(r.ok,false);
r=await call('get-session',null,cookie);data=await r.json();assert.equal(data,null);
r=await call('sign-in/username',{username:'tester_one',password});assert.equal(r.ok,false);
r=await call('sign-in/username',{username:'tester_one',password:newPassword});assert.equal(r.status,200);
r=await call('request-password-reset',{email:'nobody@example.com',redirectTo:origin+'/account'});assert.equal(r.status,200);assert.equal(outbox.length,2);
console.log('PASS: password validation/hashing, email verification, username login, secure cookies, cross-origin rejection, recovery, one-use reset tokens, session revocation, unknown-email recovery.');

} finally {if(mf)await mf.dispose();}
