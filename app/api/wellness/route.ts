import {readBoundedBody} from '@/lib/request-body';
import {getSiteUser} from '@/lib/accounts';
import {wellnessDb} from '@/db/wellness';
import {daySchema,mutationSchema} from '@/lib/wellness-validation';
import {DEFAULT_SETTINGS,type LogEntry,type WellnessSettings} from '@/lib/wellness-types';
import {targetsFor} from '@/lib/fitness-plan';
import type {FitnessRecord} from '@/lib/fitness-profile';
import {foodById,summarize,mealSuggestions} from '@/lib/nutrition';
export const dynamic='force-dynamic';
const response=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store, max-age=0',Vary:'Cookie','X-Content-Type-Options':'nosniff'}});
export async function GET(request:Request){
 const user=await getSiteUser();if(!user)return response({error:'Sign in to access your private logs.'},401);
 const url=new URL(request.url);const from=daySchema.safeParse(url.searchParams.get('from'));const to=daySchema.safeParse(url.searchParams.get('to'));
 if(!from.success||!to.success||from.data>to.data||(Date.parse(to.data)-Date.parse(from.data))>31*86400000)return response({error:'Choose a date range of up to 31 days.'},400);
 try{const db=wellnessDb();const [entryRows,settingRow,dayRows]=await Promise.all([
   db.prepare('SELECT id,day,data_json,created_at FROM wellness_entries WHERE user_id=? AND day>=? AND day<=? ORDER BY day DESC,created_at DESC LIMIT 1001').bind(user.userId,from.data,to.data).all<{id:string;day:string;data_json:string;created_at:string}>(),
   db.prepare('SELECT data_json FROM wellness_settings WHERE user_id=?').bind(user.userId).first<{data_json:string}>(),
   db.prepare('SELECT day FROM wellness_days WHERE user_id=? AND day>=? AND day<=? AND complete=1').bind(user.userId,from.data,to.data).all<{day:string}>(),
 ]);if(entryRows.results.length>1000)return response({error:'This date range contains too many entries to calculate completely. Choose a shorter date range.'},422);const entries:LogEntry[]=entryRows.results.map(row=>({id:row.id,day:row.day,data:JSON.parse(row.data_json),createdAt:row.created_at}));const stored=settingRow?JSON.parse(settingRow.data_json):DEFAULT_SETTINGS;const settings:WellnessSettings={targets:stored.targets,diet:stored.diet,avoid:stored.avoid};
 const fitness=settingRow?(JSON.parse(settingRow.data_json).fitness as FitnessRecord|null):null;const auto=fitness?targetsFor(fitness.profile):null;if(fitness){settings.diet=fitness.profile.diet==='vegan'?'vegan':'any';settings.avoid=fitness.profile.avoid;if(auto)settings.targets={protein:auto.protein,fiber:auto.values['1079'],magnesium:auto.values['1090']};}
 const completeDays=dayRows.results.map(row=>row.day);
 const history=[...new Set(entries.map(e=>e.day))].map(day=>({day,summary:summarize(entries.filter(e=>e.day===day))}));
 return response({entries,settings,completeDays,history,summary:summarize(entries.filter(e=>e.day===to.data)),suggestions:mealSuggestions(entries,settings,completeDays)});
 }catch(error){console.error('wellness-read',error instanceof Error?error.message:'Storage error');return response({error:'Your private logs could not be loaded. Please try again.'},503);}
}
export async function POST(request:Request){
 const user=await getSiteUser();if(!user)return response({error:'Sign in before saving your private logs.'},401);
 const origin=request.headers.get('origin');if((origin&&origin!==new URL(request.url).origin)||request.headers.get('sec-fetch-site')==='cross-site')return response({error:'Request not allowed.'},403);
 if(!request.headers.get('content-type')?.includes('application/json'))return response({error:'JSON is required.'},415);
 let text:string;try{text=await readBoundedBody(request,50000);}catch{return response({error:'This entry is too large or could not be read.'},413);}
 let input;try{input=mutationSchema.safeParse(JSON.parse(text));}catch{return response({error:'Could not read this entry.'},400);}
 if(!input.success)return response({error:input.error.issues[0]?.message||'Check the fields and try again.'},400);
 try{const db=wellnessDb();const now=new Date().toISOString();const action=input.data;
  if(action.action==='save-entry'){
   const {entry}=action;if(entry.data.type==='meal'&&entry.data.items.some(item=>item.foodId&&!foodById.has(item.foodId)))return response({error:'Select a food from the catalog, or save it as unlisted.'},400);
   if(entry.data.type==='meal')entry.data.items=entry.data.items.map(item=>({...item,name:item.foodId?foodById.get(item.foodId)!.name:item.name}));
   const result=await db.prepare('INSERT INTO wellness_entries(id,user_id,day,kind,data_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET day=excluded.day,kind=excluded.kind,data_json=excluded.data_json,updated_at=excluded.updated_at WHERE wellness_entries.user_id=?').bind(entry.id,user.userId,entry.day,entry.data.type,JSON.stringify(entry.data),now,now,user.userId).run();
   if(!result.meta.changes)return response({error:'Entry not found.'},404);return response({saved:true,id:entry.id});
  }
  if(action.action==='delete-entry'){await db.prepare('DELETE FROM wellness_entries WHERE id=? AND user_id=?').bind(action.id,user.userId).run();return response({deleted:true});}
  if(action.action==='save-settings'){await db.prepare('INSERT INTO wellness_settings(user_id,data_json,updated_at) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET data_json=json_patch(wellness_settings.data_json,excluded.data_json),updated_at=excluded.updated_at').bind(user.userId,JSON.stringify(action.settings),now).run();return response({saved:true});}
  await db.prepare('INSERT INTO wellness_days(user_id,day,complete) VALUES(?,?,?) ON CONFLICT(user_id,day) DO UPDATE SET complete=excluded.complete').bind(user.userId,action.day,action.complete?1:0).run();return response({saved:true});
 }catch(error){console.error('wellness-write',error instanceof Error?error.message:'Storage error');return response({error:'Your changes were not saved. Keep this form open and try again.'},503);}
}
