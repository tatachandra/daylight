import {getTechFeed} from '@/lib/tech-leaders';
import {TECH_LEADERS} from '@/lib/tech-leaders-types';
export async function GET(request:Request) {
  const leaderId=new URL(request.url).searchParams.get('leader')||'all';
  if(leaderId!=='all'&&!TECH_LEADERS.some(person=>person.id===leaderId))return Response.json({error:'Choose a listed tech leader.'},{status:400});
  const data = await getTechFeed(leaderId);
  return Response.json(data,{status:data.sources.some(source=>source.status !== 'unavailable') ? 200 : 503,headers:{'Cache-Control':'public, max-age=30, s-maxage=30','X-Content-Type-Options':'nosniff'}});
}
