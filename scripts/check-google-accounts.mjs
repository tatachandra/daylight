import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {memoryAdapter} from 'better-auth/adapters/memory';
import {generateKeyPair,exportJWK,SignJWT} from 'jose';
import {createAccountAuth} from '../lib/account-config.ts';

const origin='https://google-accounts-test.example';
const db={user:[],session:[],account:[],verification:[],rateLimit:[]};
const outbox=[];
const google={clientId:'test.apps.googleusercontent.com',clientSecret:'synthetic-test-secret'};
const auth=createAccountAuth({database:memoryAdapter(db),secret:randomBytes(32).toString('hex'),baseURL:origin,google,sendMail:async(to,subject,text)=>outbox.push({to,subject,text})});
const keys=await generateKeyPair('RS256');
const jwk={...await exportJWK(keys.publicKey),kid:'local-test',alg:'RS256',use:'sig'};
const originalFetch=globalThis.fetch;
let claims={sub:'google-one',email:'new@example.com',email_verified:true,name:'Google Tester'};
let expectedNonce;
let providerCalls=0;
globalThis.fetch=async(input,init)=>{
 const url=typeof input==='string'?input:input instanceof URL?input.href:input.url;
 if(url==='https://www.googleapis.com/oauth2/v3/certs')return Response.json({keys:[jwk]});
 if(url==='https://oauth2.googleapis.com/token'){
  providerCalls++;
  const idToken=await new SignJWT({...claims,nonce:expectedNonce}).setProtectedHeader({alg:'RS256',kid:'local-test'}).setIssuer('https://accounts.google.com').setAudience(google.clientId).setIssuedAt().setExpirationTime('5m').sign(keys.privateKey);
  return Response.json({access_token:'synthetic-access',token_type:'Bearer',expires_in:3600,id_token:idToken});
 }
 throw Error('Unexpected external request during isolated test: '+new URL(url).origin);
};
const cookieOf=r=>r.headers.getSetCookie().map(s=>s.split(';')[0]).join('; ');
async function call(path,body,cookie='',requestOrigin=origin){db.rateLimit.length=0;return auth.handler(new Request(origin+'/api/account/'+path,{method:body?'POST':'GET',headers:{Origin:requestOrigin,'Content-Type':'application/json','cf-connecting-ip':'192.0.2.8',...(cookie?{Cookie:cookie}:{})},...(body?{body:JSON.stringify(body)}:{})}));}
async function start(path='sign-in/social',cookie=''){
 const response=await call(path,{provider:'google',callbackURL:'/wellness',errorCallbackURL:'/account',disableRedirect:true},cookie);
 assert.equal(response.status,200);
 const data=await response.json();const url=new URL(data.url);
 assert.equal(url.origin,'https://accounts.google.com');
 assert.equal(url.searchParams.get('redirect_uri'),origin+'/api/account/callback/google');
 assert.deepEqual(new Set(url.searchParams.get('scope').split(' ')),new Set(['openid','email','profile']));
 assert.equal(url.searchParams.get('access_type'),'online');
 assert.equal(url.searchParams.get('code_challenge_method'),'S256');
 assert.ok(url.searchParams.get('state'));assert.ok(url.searchParams.get('code_challenge'));
 expectedNonce=url.searchParams.get('nonce');
 return {state:url.searchParams.get('state'),cookie:[cookie,cookieOf(response)].filter(Boolean).join('; ')};
}
async function callback(flow,state=flow.state){db.rateLimit.length=0;return auth.handler(new Request(origin+'/api/account/callback/google?code=synthetic-code&state='+encodeURIComponent(state),{headers:{Cookie:flow.cookie}}));}
try{
 let flow=await start();let r=await callback(flow);assert.equal(r.status,302);
 assert.equal(new URL(r.headers.get('location'),origin).href,origin+'/wellness');
 const sessionCookie=cookieOf(r);assert.match(r.headers.get('set-cookie'),/HttpOnly/i);assert.match(r.headers.get('set-cookie'),/Secure/i);
 let session=await (await call('get-session',null,sessionCookie)).json();assert.equal(session.user.email,'new@example.com');assert.equal(session.user.emailVerified,true);assert.ok(!session.user.username);
 assert.equal(outbox.length,0);assert.equal(db.user.length,1);assert.equal(db.account[0].providerId,'google');assert.notEqual(db.account[0].accessToken,'synthetic-access');
 const firstId=session.user.id;
 flow=await start();r=await callback(flow);session=await (await call('get-session',null,cookieOf(r))).json();assert.equal(session.user.id,firstId);assert.equal(db.user.length,1);
 const callsBefore=providerCalls;
 flow=await start();r=await callback(flow,'wrong-state');assert.ok(r.headers.get('location')?.includes('error='));assert.equal(providerCalls,callsBefore);
 r=await callback({...(await start()),cookie:''});assert.ok(r.headers.get('location')?.includes('error='));assert.equal(providerCalls,callsBefore);
 r=await call('sign-in/social',{provider:'google',callbackURL:'https://attacker.example',disableRedirect:true});assert.ok(r.status>=400);
 r=await call('sign-in/social',{provider:'google',callbackURL:'/wellness'},sessionCookie,'https://attacker.example');assert.ok(r.status>=400);
 claims={sub:'unverified',email:'unverified@example.com',email_verified:false,name:'Unverified'};
 r=await callback(await start());assert.ok(r.headers.get('location')?.includes('error='));assert.equal(db.user.some(u=>u.email==='unverified@example.com'),false);
 const password='An isolated test passphrase '+randomBytes(8).toString('hex');
 r=await call('sign-up/email',{name:'Existing',username:'existing',email:'existing@example.com',password,callbackURL:'/account'});assert.equal(r.status,200);
 const verificationURL=outbox.at(-1).text.match(/https:\/\/[^\s]+/)[0];await auth.handler(new Request(verificationURL));
 const existingId=db.user.find(u=>u.email==='existing@example.com').id;
 claims={sub:'google-existing',email:'existing@example.com',email_verified:true,name:'Existing'};
 r=await callback(await start());assert.ok(r.headers.get('location')?.includes('account_not_linked'));assert.equal(db.account.some(a=>a.accountId==='google-existing'),false);
 r=await call('sign-in/email',{email:'existing@example.com',password});assert.equal(r.status,200);const localCookie=cookieOf(r);
 r=await callback(await start('link-social',localCookie));assert.equal(new URL(r.headers.get('location'),origin).href,origin+'/wellness');assert.equal(db.account.find(a=>a.accountId==='google-existing').userId,existingId);
 r=await callback(await start());session=await (await call('get-session',null,cookieOf(r))).json();assert.equal(session.user.id,existingId);
 claims={sub:'wrong-owner',email:'different@example.com',email_verified:true,name:'Different'};
 r=await callback(await start('link-social',localCookie));assert.ok(r.headers.get('location')?.includes('error='));assert.equal(db.account.some(a=>a.accountId==='wrong-owner'),false);
 console.log('PASS: Google OAuth callback, minimal scopes, PKCE/state/cookies, encrypted token storage, verified-email gate, no username requirement, no verification email, stable returning identity, cross-origin/redirect rejection, explicit same-email linking and ownership protection.');
}finally{globalThis.fetch=originalFetch;}
