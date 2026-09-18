import {z} from 'zod/v3';
export const daySchema=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(day=>{const d=new Date(day+'T12:00:00Z');return Number.isFinite(d.valueOf())&&d.toISOString().slice(0,10)===day&&day>='1900-01-01'&&day<='2100-12-31';},'Enter a valid date.');
const itemSchema=z.object({foodId:z.string().regex(/^\d+$/).nullable(),name:z.string().trim().min(1).max(220),grams:z.number().positive().max(10000).nullable(),portion:z.string().trim().max(120),certainty:z.enum(['measured','estimated','unknown'])}).strict().refine(x=>x.certainty==='unknown'?x.grams===null:x.grams!==null,'Add a portion or choose unknown.');
const mealSchema=z.object({type:z.literal('meal'),meal:z.enum(['Breakfast','Lunch','Dinner','Snack']),items:z.array(itemSchema).min(1).max(30),notes:z.string().trim().max(1000)}).strict();
const workoutSchema=z.object({type:z.literal('workout'),activity:z.string().trim().min(1).max(80),minutes:z.number().positive().max(1440).nullable(),steps:z.number().int().positive().max(200000).nullable(),calories:z.number().nonnegative().max(20000).nullable(),notes:z.string().trim().max(1000)}).strict().refine(x=>x.minutes!==null||x.steps!==null,'Add duration or steps.');
export const settingsSchema=z.object({targets:z.object({protein:z.number().min(1).max(500),fiber:z.number().min(1).max(150),magnesium:z.number().min(1).max(3000)}).strict(),diet:z.enum(['any','vegetarian','vegan']),avoid:z.array(z.enum(['Milk','Eggs','Fish','Shellfish','Tree nuts','Peanuts','Wheat','Soy','Sesame'])).max(9)}).strict();
export const mutationSchema=z.discriminatedUnion('action',[
 z.object({action:z.literal('save-entry'),entry:z.object({id:z.string().uuid(),day:daySchema,data:z.union([mealSchema,workoutSchema])}).strict()}).strict(),
 z.object({action:z.literal('delete-entry'),id:z.string().uuid()}).strict(),
 z.object({action:z.literal('save-settings'),settings:settingsSchema}).strict(),
 z.object({action:z.literal('complete-day'),day:daySchema,complete:z.boolean()}).strict(),
]);
