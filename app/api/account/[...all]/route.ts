import {accountAuth,accountsEnabled} from '@/lib/accounts';
export const dynamic='force-dynamic';
async function handler(request:Request){
 if(!accountsEnabled())return Response.json({message:'Personal accounts are not available yet.'},{status:503,headers:{'Cache-Control':'no-store'}});
 if(request.method==='POST' && (request.headers.get('origin')!==new URL(request.url).origin || request.headers.get('sec-fetch-site')==='cross-site'))return Response.json({message:'Request not allowed.'},{status:403,headers:{'Cache-Control':'no-store'}});
 if(Number(request.headers.get('content-length')||0)>16384)return new Response(null,{status:413});
 try{const result=await accountAuth().handler(request);result.headers.set('Cache-Control','private, no-store');return result;}
 catch {return Response.json({message:'Account service is temporarily unavailable. Please try again.'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
export {handler as GET,handler as POST};
