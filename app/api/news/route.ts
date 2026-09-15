import { getNews } from '@/lib/news';
export async function GET(){const data=await getNews();return Response.json(data,{status:data.stories.length?200:503,headers:{'Cache-Control':'public, max-age=60, s-maxage=300','X-Content-Type-Options':'nosniff'}});}
