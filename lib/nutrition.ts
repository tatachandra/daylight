import catalog from './food-catalog.json';
import {MAIN,VITAMINS,AMINO_ACIDS,OTHER,type NutritionSummary,type Suggestions} from './nutrients';
import type {Food,LogEntry,WellnessSettings} from './wellness-types';
const foods=catalog as Food[];
export const foodById=new Map(foods.map(food=>[food.id,food]));
const featured=['172421','173757','171477','172475','170903','173904','173944','169097','168463','170567','173424','175168'];
export function searchFoods(query:string):Food[]{
 const normalized=query.toLowerCase().trim().replace(/\bdal\b/g,'lentils').replace(/\bcurd\b/g,'yogurt');
 if(!normalized)return featured.map(id=>foodById.get(id)!);
 const words=normalized.split(/\s+/);
 return foods.map(food=>{const name=food.name.toLowerCase();return{food,score:words.every(w=>name.includes(w))?words.reduce((n,w)=>n+(name.startsWith(w)?5:1),0)+(name.includes('cooked')?1:0):0};}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.food.name.length-b.food.name.length).slice(0,30).map(x=>x.food);
}
const specs=[...MAIN,...VITAMINS,...AMINO_ACIDS,...OTHER];
export function summarize(entries:LogEntry[]):NutritionSummary{
 const meals=entries.filter(e=>e.data.type==='meal');
 const items=meals.flatMap(e=>e.data.type==='meal'?e.data.items:[]);
 const nutrients=Object.fromEntries(specs.map(spec=>[spec.id,{value:null as number|null,covered:0,total:items.length}]));
 for(const item of items){const food=item.foodId?foodById.get(item.foodId):undefined;if(!food||item.grams===null||item.certainty==='unknown')continue;
  for(const spec of specs){const value=spec.id==='energy'?(food.nutrients['1008']??food.nutrients['2048']??food.nutrients['2047']):food.nutrients[spec.id];
   if(value===undefined||!Number.isFinite(value)||value<0)continue;
   const total=nutrients[spec.id];total.value=(total.value??0)+value*item.grams/100;total.covered++;
  }
 }
 return {nutrients,items:items.length,estimatedPortions:items.filter(i=>i.certainty==='estimated').length,unknownPortions:items.filter(i=>i.grams===null).length,unlistedFoods:items.filter(i=>!i.foodId).length,mealCount:meals.length};
}
const recipes=[
 {name:'Lentil & spinach bowl',diet:'vegan',allergens:[],parts:[['172421',180,'Cooked lentils'],['168463',100,'Cooked spinach']]},
 {name:'Tofu & chickpea bowl',diet:'vegan',allergens:['Soy'],parts:[['172475',120,'Firm calcium-set tofu, weighed before cooking'],['173757',120,'Cooked chickpeas']]},
 {name:'Oats, banana & almonds',diet:'vegan',allergens:['Tree nuts'],parts:[['173904',50,'Dry oats, cook with water'],['173944',120,'Banana'],['170567',20,'Almonds']]},
 {name:'Greek yogurt & oats',diet:'vegetarian',allergens:['Milk'],parts:[['170903',170,'Plain lowfat Greek yogurt'],['173904',40,'Dry oats'],['173944',100,'Banana']]},
 {name:'Chicken & lentil bowl',diet:'any',allergens:[],parts:[['171477',100,'Roasted chicken breast'],['172421',150,'Cooked lentils'],['168463',80,'Cooked spinach']]},
 {name:'Salmon & chickpeas',diet:'any',allergens:['Fish'],parts:[['175168',120,'Cooked salmon'],['173757',150,'Cooked chickpeas']]},
] as const;
export function mealSuggestions(entries:LogEntry[],settings:WellnessSettings,completeDays:string[]):Suggestions{
 const dayList=[...new Set(entries.filter(e=>e.data.type==='meal').map(e=>e.day))];
 const averages=MAIN.map(spec=>{const values=dayList.map(day=>summarize(entries.filter(e=>e.day===day)).nutrients[spec.id].value).filter((x):x is number=>x!==null);return values.length?values.reduce((a,b)=>a+b,0)/values.length:null;});
 const targets=[settings.targets.protein,settings.targets.fiber,settings.targets.magnesium];
 const gaps=averages.map((v,i)=>v===null?1:Math.max(0,1-v/targets[i]));
 const focusIndex=gaps.indexOf(Math.max(...gaps));
 const meals=recipes.filter(r=>(settings.diet==='any'||r.diet===settings.diet||(settings.diet==='vegetarian'&&r.diet==='vegan'))&&!r.allergens.some(a=>settings.avoid.includes(a))).map(recipe=>{
  const nutrients=MAIN.map(spec=>recipe.parts.reduce((sum,[id,grams])=>sum+(foodById.get(id)?.nutrients[spec.id]??0)*grams/100,0));
  return {name:recipe.name,ingredients:recipe.parts.map(([,grams,label])=>`${label} · ${grams} g`),allergens:[...recipe.allergens],protein:nutrients[0],fiber:nutrients[1],magnesium:nutrients[2],focus:dayList.length&&gaps[focusIndex]>0?`Adds ${MAIN[focusIndex].name.toLowerCase()} to your logged intake`:'A protein, fiber and magnesium option',score:nutrients.reduce((n,v,i)=>n+Math.min(v/targets[i],1)*gaps[i],0)};
 }).sort((a,b)=>b.score-a.score).slice(0,3).map(({score,...meal})=>meal);
 return {meals,loggedDays:dayList.length,completeDays:dayList.filter(d=>completeDays.includes(d)).length,basis:dayList.length?`Based on ${dayList.length} day${dayList.length===1?'':'s'} with food entries in this 7-day window. Unlogged days are excluded; partial days can understate intake.`:'Start with a meal log to tailor the order. These are general food combinations.'};
}
