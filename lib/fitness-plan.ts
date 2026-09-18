import {type FitnessRecord,type FitnessProfile,goalLabels} from './fitness-profile';
import {type LogEntry,daysBefore} from './wellness-types';
import {foodById,summarize} from './nutrition';
import {MAIN,VITAMINS,OTHER} from './nutrients';
export function needsReview(p:FitnessProfile){const bmi=p.weight/(p.height/100)**2;const targetBmi=p.targetWeight/(p.height/100)**2;return p.age<19||p.age>78||p.sex==='unspecified'||p.conditions.length>0||p.healthNotes.trim().length>0||bmi<18.5||bmi>40||targetBmi<18.5||targetBmi>40;}
export function reviewReason(p:FitnessProfile){if(p.sex==='unspecified')return 'Choose a sex reference in your profile to use these equations, or keep tracking without calculated targets.';if(p.age<19||p.age>78)return 'Automatic estimates cover ages 19–78. Use an age-appropriate plan agreed with a qualified professional.';if(p.conditions.length||p.healthNotes.trim())return 'Your health details need individual guidance before an automatic exercise or nutrition plan can be appropriate.';return 'Your current or target weight is outside the range used by this general planner. A qualified professional can help set an appropriate plan.';}
export function targetsFor(p:FitnessProfile){
 if(needsReview(p))return null;
 const male=p.sex==='male';const resting=10*p.weight+6.25*p.height-5*p.age+(male?5:-161);
 const factor={sedentary:1.2,light:1.375,moderate:1.55,high:1.725}[p.activity];
 const maintenance=Math.round(resting*factor/50)*50;
 const adjustment=p.goal==='lose'&&p.targetWeight<p.weight?-250:p.goal==='muscle'&&p.targetWeight>p.weight?200:0;
 const kcal=Math.round(Math.max(maintenance+adjustment,male?1500:1200)/50)*50;
 const protein=Math.round(Math.min(p.weight*(p.goal==='muscle'?1.6:1.2),kcal*.30/4));const fat=Math.round(kcal*.30/9);const carbs=Math.round((kcal-protein*4-fat*9)/4);
 const values:Record<string,number>={energy:kcal,'1003':protein,'1004':fat,'1005':carbs,'1079':male?(p.age>50?30:38):(p.age>50?21:25),'1090':male?(p.age>30?420:400):(p.age>30?320:310),'1106':male?900:700,'1162':male?90:75,'1114':p.age>70?20:15,'1109':15,'1185':male?120:90,'1165':male?1.2:1.1,'1166':male?1.3:1.1,'1167':male?16:14,'1170':5,'1175':p.age>50?(male?1.7:1.5):1.3,'1176':30,'1190':400,'1178':2.4,'1087':p.age>70||(!male&&p.age>50)?1200:1000,'1089':male||p.age>50?8:18,'1092':male?3400:2600,'1093':2300,'1095':male?11:8,'1091':700,'1098':.9,'1101':male?2.3:1.8,'1103':55,'1100':150,'1180':male?550:425,'1096':male?(p.age>50?30:35):(p.age>50?20:25),'1102':45,'1099':male?4:3};
 return {resting:Math.round(resting),maintenance,kcal,low:Math.round(kcal*.9/50)*50,high:Math.round(kcal*1.1/50)*50,protein,fat,carbs,values,water:male?3.7:2.7,explanation:'Mifflin–St Jeor resting energy × your usual activity factor, with a modest goal adjustment. The ±10% band is a planning range, not a confidence interval. Usual activity must include your planned workouts; logged exercise calories are not added again.'};
}
export type Exercise={name:string;dose:string;cue:string;url:string};
const library='https://weighttraining.guide/exercises/';
export function workoutFor(record:FitnessRecord,entries:LogEntry[],today:string){const p=record.profile;const review=record.reviews.at(-1);const held=needsReview(p)||review?.pain===true;
 const weeks=Math.max(1,Math.floor((Date.parse(today)-Date.parse(record.startedAt))/604800000)+1);
 const previousWeek=entries.filter(e=>e.day>=daysBefore(today,7)&&e.day<=today&&e.data.type==='workout'&&e.data.activity==='Harbor · Strength');
 const completed=new Set(previousWeek.map(e=>e.day)).size;
 const reviewedRecently=!!review&&Date.parse(today)-Date.parse(review.day)<=8*86400000;
 const progress=reviewedRecently&&review?.effort==='easy'&&review.recovery==='good'&&!review.pain&&completed>=Math.min(p.days,3)&&weeks>=3;
 const ease=p.sleep<6||reviewedRecently&&(review?.effort==='hard'||review?.recovery==='tired');
 const sets=ease?1:progress||p.experience==='consistent'?3:2;
 const dose=`${sets} sets · 8–12 controlled reps`;
 const exercises:Exercise[]=p.equipment==='bodyweight'?[
 {name:'Chair squat',dose,cue:'Sit back toward a stable chair; stand through your feet. Use support if needed.',url:library},
 {name:'Wall or incline push-up',dose,cue:'Choose a stable surface and keep your body aligned. Higher surfaces make it easier.',url:library},
 {name:'Glute bridge',dose,cue:'Press through your heels and lift only as far as you can without arching your lower back.',url:library},
 {name:'Prone W raise',dose:`${sets} sets · 8–12 reps`,cue:'Lie face down, bend elbows into a W and gently lift the arms. Keep your neck relaxed.',url:library},
 {name:'Bird dog',dose:`${sets} sets · 6–8 each side`,cue:'From hands and knees extend opposite arm and leg, keeping your trunk steady.',url:library},
 ]:[
 {name:p.equipment==='gym'?'Goblet squat or leg press':'Goblet squat',dose,cue:'Use a comfortable range, stable feet and a controlled lowering phase.',url:library},
 {name:'Dumbbell bench or floor press',dose,cue:'Keep wrists stacked and lower slowly. Use a light load while learning.',url:library},
 {name:p.equipment==='gym'?'Seated cable row':'Supported dumbbell row',dose,cue:'Draw the elbow back without twisting or shrugging.',url:library},
 {name:'Dumbbell Romanian deadlift',dose,cue:'Hinge at the hips with softly bent knees and a neutral back. Get form coaching if unfamiliar.',url:library},
 {name:'Bird dog',dose:`${sets} sets · 6–8 each side`,cue:'Keep your trunk still as you extend opposite arm and leg.',url:library},
 ];
 const strengthDays=p.days===2?[0,3]:[0,2,4];const cardioMinutes=Math.min(p.minutes-10,p.goal==='endurance'?30:20);
 const schedule=Array.from({length:7},(_,i)=>({day:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i],kind:strengthDays.includes(i)?'Strength':(p.days>=4&&i===1)||(p.days>=5&&i===5)?'Walk / cycle':'Recovery',minutes:strengthDays.includes(i)?Math.min(p.minutes,45):(p.days>=4&&i===1)||(p.days>=5&&i===5)?cardioMinutes+10:0}));
 return {title:held?'A plan with professional guidance':p.goal==='endurance'?'Strength + steady movement':`${p.equipment==='bodyweight'?'At-home':'Full-body'} foundations`,held,weeks,sets,completed,exercises:p.minutes<30?exercises.slice(0,4):exercises,schedule,reason:`Selected for ${p.experience==='consistent'?'your regular training experience':'a gradual start'}, ${p.days} available days and ${p.equipment==='gym'?'gym access':p.equipment==='dumbbells'?'dumbbells':'no equipment'}. Your goal: ${goalLabels[p.goal].toLowerCase()}.`,review:held?(review?.pain?'Pain reported in your latest check-in: pause exercise progression and seek appropriate guidance.':reviewReason(p)):ease?'Your recent review suggests more recovery: use fewer sets this week.':progress?'You reported good recovery and easier sessions, with enough logged practice. An extra set is suggested; keep the load comfortable.':'Keep this foundation for 3 weeks. Review weekly; improve technique before adding more work.',cardioMinutes};
}
// Original meal combinations. Nutrient values come from the existing USDA catalog, never invented.
const part=(id:string,grams:number,label:string)=>({id,grams,label});
const meals=[
 {name:'Banana almond oats',slot:'Breakfast',diets:['vegan','indian','american'],allergens:['Tree nuts','Wheat'],parts:[part('173904',70,'Dry oats, cook with water'),part('173944',120,'Banana'),part('170567',25,'Almonds')],steps:'Cook the oats in water. Slice the banana and add chopped almonds. Use certified gluten-free oats if needed.'},
 {name:'Chickpea, lentil & spinach bowl',slot:'Lunch',diets:['vegan','indian','american'],allergens:[],parts:[part('173757',160,'Cooked chickpeas'),part('172421',180,'Cooked lentils'),part('168463',100,'Cooked spinach'),part('171413',10,'Olive oil')],steps:'Combine cooked chickpeas and lentils with warmed spinach. Add the measured oil and your preferred spices; log extra sauces and salt.'},
 {name:'Tofu rice bowl',slot:'Dinner',diets:['vegan','american'],allergens:['Soy'],parts:[part('172475',200,'Calcium-set firm tofu'),part('168875',180,'Cooked brown rice'),part('168463',100,'Cooked spinach'),part('171413',10,'Olive oil')],steps:'Cook the weighed tofu in the measured oil. Serve over cooked rice with spinach; weigh and log any additional sauce.'},
 {name:'Chicken, dal & rice plate',slot:'Lunch',diets:['indian','american'],allergens:[],parts:[part('171477',130,'Cooked chicken breast'),part('172421',150,'Cooked lentils'),part('168875',160,'Cooked brown rice'),part('168463',80,'Cooked spinach'),part('171413',10,'Olive oil')],steps:'Cook chicken thoroughly with spices. Serve with cooked lentils, rice and spinach. Weigh after cooking; gravy, ghee and extra oil need separate entries.'},
 {name:'Shrimp rice & greens',slot:'Dinner',diets:['indian','american'],allergens:['Shellfish'],parts:[part('175180',150,'Cooked shrimp'),part('168875',200,'Cooked brown rice'),part('173757',100,'Cooked chickpeas'),part('168463',100,'Cooked spinach'),part('171413',10,'Olive oil')],steps:'Cook shrimp thoroughly in the measured oil, adding spices as preferred. Serve with rice, chickpeas and spinach; include any extras in your log.'},
 {name:'Salmon & lentil dinner',slot:'Dinner',diets:['indian','american'],allergens:['Fish'],parts:[part('175168',150,'Cooked salmon'),part('172421',160,'Cooked lentils'),part('168875',150,'Cooked brown rice'),part('168463',100,'Cooked spinach')],steps:'Bake the salmon until safely cooked. Serve with warm lentils, rice and spinach. Listed portions are cooked weights.'},
 {name:'Greek yogurt breakfast bowl',slot:'Breakfast',diets:['indian','american'],allergens:['Milk','Wheat'],parts:[part('170903',250,'Plain lowfat Greek yogurt'),part('173904',60,'Dry oats'),part('173944',120,'Banana')],steps:'Cook and cool the oats, or soak them in the yogurt overnight in the refrigerator. Add banana just before eating.'},
 {name:'Banana & chickpea snack',slot:'Snack',diets:['vegan','indian','american'],allergens:[],parts:[part('173944',100,'Banana'),part('173757',100,'Cooked chickpeas')],steps:'Enjoy banana alongside cooked chickpeas, seasoned to taste. Log any oil added for roasting.'},
 {name:'Yogurt & almonds',slot:'Snack',diets:['indian','american'],allergens:['Milk','Tree nuts'],parts:[part('170903',170,'Plain lowfat Greek yogurt'),part('170567',20,'Almonds')],steps:'Top plain yogurt with chopped almonds.'},
];
export function suggestedMeals(p:FitnessProfile,kcal:number|null,entries:LogEntry[],day:string){
 if(kcal===null)return {meals:[],summary:summarize([]),missing:[],notes:['Personalized portions are paused until your profile is suitable for general estimates. You can still log food and review known nutrients.']};
 const exclude=p.dislikes.toLowerCase().split(',').map(x=>x.trim()).filter(Boolean);
 const eligible=meals.filter(m=>m.diets.includes(p.diet)&&!m.allergens.some(a=>p.avoid.includes(a as typeof p.avoid[number]))&&!exclude.some(x=>(m.name+' '+m.parts.map(a=>a.label).join(' ')).toLowerCase().includes(x)));
 const eaten=entries.filter(e=>e.day===day&&e.data.type==='meal');const eatenSummary=summarize(eaten);const filledSlots=new Set<string>(eaten.map(e=>e.data.type==='meal'?e.data.meal:''));const shares=[.25,.30,.30,.15];const slots=['Breakfast','Lunch','Dinner','Snack'];const availableShare=slots.reduce((sum,slot,i)=>sum+(filledSlots.has(slot)?0:shares[i]),0);const reliable=eatenSummary.items>0&&eatenSummary.nutrients.energy.covered===eatenSummary.items&&eatenSummary.unknownPortions===0;const remaining=reliable?Math.max(0,kcal-(eatenSummary.nutrients.energy.value??0)):kcal*availableShare;
 const rotation=Math.floor(Date.parse(day)/86400000);
 const planned=['Breakfast','Lunch','Dinner','Snack'].map((slot,i)=>{if(filledSlots.has(slot)||remaining===0)return null;const options=eligible.filter(m=>m.slot===slot);const m=options[(rotation+i)%options.length];if(!m)return null;
 const basic:LogEntry={id:'preview',day,createdAt:'',data:{type:'meal',meal:slot as 'Breakfast',notes:'',items:m.parts.map(x=>({foodId:x.id,name:x.label,grams:x.grams,portion:`${x.grams} g`,certainty:'estimated'}))}};
 const energy=summarize([basic]).nutrients.energy.value;if(!energy)return null;
 const share=shares[i]/(availableShare||1);const scale=Math.max(.6,Math.min(1.8,remaining*share/energy));
 const items=m.parts.map(x=>({foodId:x.id,name:x.label,grams:Math.round(x.grams*scale/5)*5,portion:`${Math.round(x.grams*scale/5)*5} g`,certainty:'estimated' as const}));
 const data={type:'meal' as const,meal:slot as 'Breakfast'|'Lunch'|'Dinner'|'Snack',items,notes:'Suggested recipe: '+m.name+'. Add oils, sauces and other extras actually used.'};
 const summary=summarize([{...basic,data}]);return {name:m.name,slot,steps:m.steps,allergens:m.allergens,data,summary};
 }).filter((m):m is NonNullable<typeof m>=>m!==null);
 const summary=summarize([...eaten,...planned.map((m,i)=>({id:String(i),day,createdAt:'',data:m.data}))]);
 const targets=targetsFor(p);const missing=targets?[...MAIN,...VITAMINS,...OTHER].filter(n=>!['1185','1167','1093'].includes(n.id)&&targets.values[n.id]&&((summary.nutrients[n.id]?.value??0)<targets.values[n.id]*.9)).map(n=>n.name):[];
 return {meals:planned,summary,missing,notes:[...(planned.length+filledSlots.size<4&&remaining>0?['Some meal slots have no match for your exclusions. Add your own foods; this is not a complete day.']:[]),...(remaining===0?['Your logged energy has reached the estimate. No extra meal portions are generated; this is not an instruction to skip food if you are hungry.']:[]),...(eaten.length&&!reliable?['Some logged food information is incomplete. We keep the normal remaining meal shares instead of treating unknown intake as zero.']:[]),'Meal slots already logged are removed from suggestions. Portions are scaled toward the remaining energy estimate when the log has full calorie coverage. Values exclude unlisted extras; the menu does not guarantee complete nutrition.',...(p.diet==='vegan'?['A vegan pattern needs a reliable vitamin B12 source, usually fortified foods or an appropriately chosen supplement. Review vitamin D, iodine, calcium and omega-3 sources too.']:[])]};
}
export function fitnessResult(record:FitnessRecord|null,entries:LogEntry[],day:string){if(!record)return {record:null,targets:null,workout:null,mealPlan:null,entries,summary:summarize(entries.filter(e=>e.day===day))};const targets=targetsFor(record.profile);return {record,targets,workout:workoutFor(record,entries,day),mealPlan:suggestedMeals(record.profile,targets?.kcal??null,entries,day),entries,summary:summarize(entries.filter(e=>e.day===day))};}
export type FitnessResult=ReturnType<typeof fitnessResult>;
