// Isolated calculation/validation tests; no user records or external services.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
const temp=await mkdtemp(path.join(tmpdir(),'daylight-check-'));
try {
 for(const name of ['nutrients','wellness-types','nutrition','wellness-validation']){
  let text=ts.transpileModule(await readFile(`lib/${name}.ts`,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  text=text.replace(/from ['"]\.\/([^'"]+)['"]/g,(_,file)=>file.endsWith('.json')?`from '${pathToFileURL(path.resolve('lib',file))}' with {type:'json'}`:`from './${file}.mjs'`);
  text=text.replace("from 'zod/v3'",`from '${pathToFileURL(path.resolve('node_modules/zod/v3/index.js'))}'`);
  await writeFile(path.join(temp,`${name}.mjs`),text);
 }
 const {summarize,foodById,mealSuggestions}=await import(pathToFileURL(path.join(temp,'nutrition.mjs')));
 const {mutationSchema,daySchema}=await import(pathToFileURL(path.join(temp,'wellness-validation.mjs')));
 const {DEFAULT_SETTINGS}=await import(pathToFileURL(path.join(temp,'wellness-types.mjs')));
 const entry=(items,day='2026-09-14')=>({id:'4f9ffbc1-6b3e-4db1-a874-1d2d9f7afee0',day,createdAt:'2026-09-14',data:{type:'meal',meal:'Lunch',items,notes:''}});
 const lentils={foodId:'172421',name:'Cooked lentils',grams:200,portion:'200 g',certainty:'measured'};
 const unknown={foodId:null,name:'Unlisted stew',grams:null,portion:'a bowl',certainty:'unknown'};
 const mixed=summarize([entry([lentils,unknown])]);
 assert.equal(mixed.nutrients['1003'].value,foodById.get('172421').nutrients['1003']*2);
 assert.equal(mixed.nutrients['1003'].covered,1);assert.equal(mixed.nutrients['1003'].total,2);
 assert.equal(mixed.nutrients['1176'].value,null,'Unreported biotin must not become zero');
 assert.equal(summarize([]).nutrients['1003'].value,null,'No log must stay unknown');
 assert.equal(summarize([entry([{...lentils,grams:null,certainty:'unknown'}])]).nutrients['1003'].value,null);
 const egg={...lentils,foodId:'173424',grams:100};
 assert.equal(summarize([entry([egg])]).nutrients['1079'].value,0,'Explicit zero fiber must remain known');
 assert.equal(summarize([entry([{...lentils,foodId:'2346393',grams:100}])]).nutrients['1176'].covered,1,'Foundation biotin must be retained');
 const vegan=mealSuggestions([entry([lentils])],{...DEFAULT_SETTINGS,diet:'vegan',avoid:['Soy','Tree nuts']},[]);
 assert.equal(vegan.loggedDays,1,'Missing days must not dilute the average');
 assert.ok(vegan.meals.length>0);assert.ok(vegan.meals.every(m=>!m.allergens.length));
 assert.ok(!vegan.meals.some(m=>/yogurt|salmon|chicken|tofu|almonds/i.test(m.name)));
 assert.ok(mutationSchema.safeParse({action:'save-entry',entry:(({createdAt,...e})=>e)(entry([lentils,unknown]))}).success);
 assert.ok(!daySchema.safeParse('2026-02-30').success);
 assert.ok(!mutationSchema.safeParse({action:'save-entry',entry:{id:crypto.randomUUID(),day:'2026-09-14',data:{type:'workout',activity:'Running',minutes:-1,steps:null,calories:null,notes:''}}}).success);
 assert.ok(!mutationSchema.safeParse({action:'save-settings',settings:DEFAULT_SETTINGS,userId:'other'}).success,'Reject client identity fields');
 console.log('PASS: portion scaling, missing/zero nutrients, Foundation biotin, logged-day denominator, dietary exclusions, date and input validation.');
} finally {await rm(temp,{recursive:true,force:true});}
