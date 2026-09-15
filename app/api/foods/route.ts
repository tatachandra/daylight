import {searchFoods} from '@/lib/nutrition';
export async function GET(request:Request){const query=new URL(request.url).searchParams.get('q')?.slice(0,100)||'';return Response.json({foods:searchFoods(query)},{headers:{'Cache-Control':'public, max-age=3600','X-Content-Type-Options':'nosniff'}});}
