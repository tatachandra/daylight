import {getSiteUser} from '@/lib/accounts';
import {wellnessDb} from '@/db/wellness';
import {profileSchema,reviewSchema,type FitnessRecord} from '@/lib/fitness-profile';
import {fitnessResult} from '@/lib/fitness-plan';
import {daySchema} from '@/lib/wellness-validation';
import {DEFAULT_SETTINGS,daysBefore,type LogEntry} from '@/lib/wellness-types';
export const dynamic='force-dynamic';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store',Vary:'Cookie'}});
async function readRecord(userId:string){const row=await wellnessDb().prepare('SELECT data_json FROM wellness_settings WHERE user_id=?').bind(userId).first<{data_json:string}>();return row?JSON.parse(row.data_json).fitness as FitnessRecord|null: null;}
export async function GET(request:Request){const user=await getSiteUser();if(!user)return reply({error:'Sign in to view your private profile.'},401);const day=daySchema.safeParse(new URL(request.url).searchParams.get('day'));if(!day.success)return reply({error:'Choose a valid local date.'},400);
 try{const record=await readRecord(user.userId);const rows=await wellnessDb().prepare('SELECT id,day,data_json,created_at FROM wellness_entries WHERE user_id=? AND day>=? AND day<=? ORDER BY day DESC,created_at DESC LIMIT 1500').bind(user.userId,daysBefore(day.data,28),day.data).all<{id:string;day:string;data_json:string;created_at:string}>();const entries:LogEntry[]=rows.results.map(r=>({id:r.id,day:r.day,data:JSON.parse(r.data_json),createdAt:r.created_at}));return reply(fitnessResult(record??null,entries,day.data));}catch{return reply({error:'Your plan could not load. Please try again.'},503);}}
export async function POST(request:Request){const user=await getSiteUser();if(!user)return reply({error:'Sign in before saving your profile.'},401);if(request.headers.get('origin')!==new URL(request.url).origin||request.headers.get('sec-fetch-site')==='cross-site')return reply({error:'Request not allowed.'},403);
 if(!request.headers.get('content-type')?.includes('application/json'))return reply({error:'JSON required.'},415);
 const raw=await request.text();if(raw.length>12000)return reply({error:'This entry is too large.'},413);
 let body;try{body=JSON.parse(raw);}catch{return reply({error:'Check your entry.'},400);}
 const day=daySchema.safeParse(body.day);if(!day.success)return reply({error:'Choose a valid date.'},400);
 try{const previous=await readRecord(user.userId);let record:FitnessRecord|null;
 if(body.action==='profile'){const result=profileSchema.safeParse(body.profile);if(!result.success)return reply({error:result.error.issues[0]?.message??'Check profile fields.'},400);const p=result.data;if(p.goal==='lose'&&p.targetWeight>=p.weight)return reply({error:'For weight loss, choose a target below your current weight or choose wellbeing.'},400);if(p.goal==='muscle'&&p.targetWeight<p.weight)return reply({error:'For muscle gain, keep your target at or above your current weight, or select another goal.'},400);record={profile:p,startedAt:previous?.startedAt??day.data,baselineWeight:previous?.baselineWeight??p.weight,reviews:previous?.reviews??[]};}
 else if(body.action==='review'){const result=reviewSchema.safeParse(body.review);if(!previous||!result.success||result.data.day!==day.data)return reply({error:'Complete your profile and check your review.'},400);record={...previous,profile:{...previous.profile,weight:result.data.weight},reviews:[...previous.reviews.filter(r=>r.day!==day.data),result.data].sort((a,b)=>a.day.localeCompare(b.day)).slice(-104)};}
 else if(body.action==='delete-profile'){record=null;}
 else return reply({error:'Unknown action.'},400);
 await wellnessDb().prepare("INSERT INTO wellness_settings(user_id,data_json,updated_at) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET data_json=json_set(wellness_settings.data_json,'$.fitness',json(?)),updated_at=excluded.updated_at").bind(user.userId,JSON.stringify({...DEFAULT_SETTINGS,fitness:record}),new Date().toISOString(),JSON.stringify(record)).run();return reply({saved:true});
 }catch{return reply({error:'Your profile was not saved. Your form is still here; please retry.'},503);}}
