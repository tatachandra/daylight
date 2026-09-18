// Isolated model and D1 route tests. Never touches a visitor's account or hosted database.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
import {Miniflare} from 'miniflare';
const temp=await mkdtemp(path.join(tmpdir(),'harbor-fitness-'));
const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("test")}}',d1Databases:['DB']});
try{
 const db=await mf.getD1Database('DB');globalThis.fitnessTestDb=db;globalThis.fitnessTestUser={userId:'synthetic-a'};
 for(const sql of (await readFile('drizzle/0000_great_pestilence.sql','utf8').catch(async()=>{const {readdir}=await import('node:fs/promises');const f=(await readdir('drizzle')).find(x=>x.startsWith('0000')&&x.endsWith('.sql'));return readFile('drizzle/'+f,'utf8');})).split('--> statement-breakpoint'))if(sql.trim())await db.prepare(sql).run();
 await writeFile(path.join(temp,'accounts.mjs'),'export async function getSiteUser(){return globalThis.fitnessTestUser}');
 await writeFile(path.join(temp,'wellness.mjs'),'export function wellnessDb(){return globalThis.fitnessTestDb}');
 const files=['nutrients','wellness-types','nutrition','wellness-validation','fitness-profile','fitness-plan'];
 for(const name of [...files,'fitness-route','wellness-route']){
 const source=name==='fitness-route'?'app/api/fitness/route.ts':name==='wellness-route'?'app/api/wellness/route.ts':`lib/${name}.ts`;
 let text=ts.transpileModule(await readFile(source,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
 text=text.replace(/from ['"](?:@\/lib\/|@\/db\/|\.\/)([^'"]+)['"]/g,(_,f)=>f.endsWith('.json')?`from '${pathToFileURL(path.resolve('lib',f))}' with {type:'json'}`:`from './${f}.mjs'`).replace("from 'zod/v3'",`from '${pathToFileURL(path.resolve('node_modules/zod/v3/index.js'))}'`);await writeFile(path.join(temp,name+'.mjs'),text);
 }
 const {emptyProfile}=await import(pathToFileURL(path.join(temp,'fitness-profile.mjs')));
 const {targetsFor,suggestedMeals,workoutFor}=await import(pathToFileURL(path.join(temp,'fitness-plan.mjs')));
 const {foodById}=await import(pathToFileURL(path.join(temp,'nutrition.mjs')));
 const p={...emptyProfile,name:'Synthetic',sex:'male',diet:'indian'};const target=targetsFor(p);assert.equal(target.resting,1618);assert.equal(target.values['1090'],400);assert.equal(target.values['1089'],8);
 assert.equal(targetsFor({...p,sex:'female',age:52}).values['1087'],1200);
 for(const special of [{age:17},{sex:'unspecified'},{conditions:['Diabetes or glucose medication']},{targetWeight:30},{healthNotes:'Medication needs review'}])assert.equal(targetsFor({...p,...special}),null);
 for(const diet of ['vegan','indian','american'])for(const avoid of [[],['Milk','Fish','Shellfish','Soy','Tree nuts']]){
 const plan=suggestedMeals({...p,diet,avoid},target.kcal,[],'2026-09-17');assert.ok(plan.meals.length);
 for(const m of plan.meals){assert.ok(!m.allergens.some(a=>avoid.includes(a)));for(const i of m.data.items)assert.ok(foodById.has(i.foodId)&&i.grams>0);if(diet==='vegan')assert.ok(!/chicken|shrimp|salmon|yogurt/i.test(m.name));assert.ok(!/beef|pork/i.test(m.name));}
 }
 const eaten={id:'meal',day:'2026-09-17',createdAt:'',data:{type:'meal',meal:'Breakfast',items:[{foodId:'173904',name:'Oats',grams:70,portion:'70 g',certainty:'measured'}],notes:''}};const afterMeal=suggestedMeals(p,target.kcal,[eaten],'2026-09-17');assert.ok(afterMeal.meals.every(m=>m.slot!=='Breakfast'));assert.ok(afterMeal.summary.items>1);const partial=suggestedMeals(p,target.kcal,[{...eaten,data:{...eaten.data,items:[{foodId:null,name:'Unlisted',grams:null,portion:'unknown',certainty:'unknown'}]}}],'2026-09-17');assert.ok(partial.notes.some(n=>n.includes('incomplete')));
 const record={profile:p,startedAt:'2026-08-01',baselineWeight:70,reviews:[]};const workout=workoutFor(record,[],'2026-09-17');assert.equal(workout.sets,2);assert.equal(workoutFor({...record,profile:{...p,days:2}},[],'2026-09-17').schedule.filter(s=>s.minutes>0).length,2);
 assert.equal(workoutFor({...record,reviews:[{day:'2026-09-17',pain:true,recovery:'good',effort:'easy'}]},[],'2026-09-17').held,true);
 const route=await import(pathToFileURL(path.join(temp,'fitness-route.mjs')));const wellness=await import(pathToFileURL(path.join(temp,'wellness-route.mjs')));const origin='https://test.example';
 const post=(data,o=origin)=>route.POST(new Request(origin+'/api/fitness',{method:'POST',headers:{Origin:o,'Content-Type':'application/json'},body:JSON.stringify(data)}));const get=()=>route.GET(new Request(origin+'/api/fitness?day=2026-09-17'));
 globalThis.fitnessTestUser=null;assert.equal((await get()).status,401);globalThis.fitnessTestUser={userId:'synthetic-a'};
 assert.equal((await post({action:'profile',profile:p,day:'2026-09-17'},'https://other.example')).status,403);
 assert.equal((await post({action:'profile',profile:p,day:'2026-09-17'})).status,200);
 assert.equal((await (await get()).json()).record.profile.name,'Synthetic');
 globalThis.fitnessTestUser={userId:'synthetic-b'};assert.equal((await (await get()).json()).record,null);globalThis.fitnessTestUser={userId:'synthetic-a'};
 const settings={targets:{protein:50,fiber:28,magnesium:420},diet:'vegan',avoid:[]};assert.equal((await wellness.POST(new Request(origin+'/api/wellness',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({action:'save-settings',settings})}))).status,200);assert.equal((await (await get()).json()).record.profile.name,'Synthetic');
 assert.equal((await post({action:'review',day:'2026-09-17',review:{day:'2026-09-17',weight:71,effort:'manageable',pain:false,recovery:'good',notes:'Test'}})).status,200);assert.equal((await (await get()).json()).record.profile.weight,71);
 assert.equal((await post({action:'delete-profile',day:'2026-09-17'})).status,200);assert.equal((await (await get()).json()).record,null);
 console.log('PASS: energy/age/sex calculations, medical gates, food portions, diet/allergen exclusions, schedule limits, recovery rules, private D1 profile/review persistence, cross-user isolation, CSRF and legacy-setting preservation.');
}finally{delete globalThis.fitnessTestDb;delete globalThis.fitnessTestUser;await mf.dispose();await rm(temp,{recursive:true,force:true});}
