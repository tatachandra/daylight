import {z} from 'zod/v3';
export const healthOptions=['Pregnant or breastfeeding','Heart or blood pressure condition','Diabetes or glucose medication','Kidney or liver condition','Eating disorder or recovery','Injury, pain or exercise restriction','Other clinician-managed condition'] as const;
export const allergies=['Milk','Eggs','Fish','Shellfish','Tree nuts','Peanuts','Wheat','Soy','Sesame'] as const;
export const profileSchema=z.object({
 name:z.string().trim().min(1).max(60),age:z.number().int().min(13).max(100),sex:z.enum(['female','male','unspecified']),height:z.number().min(100).max(230),weight:z.number().min(30).max(250),targetWeight:z.number().min(30).max(250),
 goal:z.enum(['wellbeing','lose','muscle','endurance']),experience:z.enum(['new','returning','consistent']),equipment:z.enum(['bodyweight','dumbbells','gym']),days:z.number().int().min(2).max(5),minutes:z.number().int().min(20).max(90),activity:z.enum(['sedentary','light','moderate','high']),
 diet:z.enum(['vegan','indian','american']),avoid:z.array(z.enum(allergies)).max(9),dislikes:z.string().max(300),conditions:z.array(z.enum(healthOptions)).max(7),healthNotes:z.string().max(500),sleep:z.number().min(3).max(12),
}).strict();
export type FitnessProfile=z.infer<typeof profileSchema>;
export const emptyProfile:FitnessProfile={name:'',age:30,sex:'unspecified',height:170,weight:70,targetWeight:70,goal:'wellbeing',experience:'new',equipment:'bodyweight',days:3,minutes:30,activity:'light',diet:'vegan',avoid:[],dislikes:'',conditions:[],healthNotes:'',sleep:7};
export const reviewSchema=z.object({day:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),weight:z.number().min(30).max(250),effort:z.enum(['easy','manageable','hard']),pain:z.boolean(),recovery:z.enum(['good','tired']),notes:z.string().max(500)}).strict();
export type FitnessReview=z.infer<typeof reviewSchema>;
export type FitnessRecord={profile:FitnessProfile;startedAt:string;baselineWeight:number;reviews:FitnessReview[]};
export const goalLabels={wellbeing:'Feel stronger & healthier',lose:'Gradually lose weight',muscle:'Build muscle & strength',endurance:'Improve endurance'};
export const fitnessSources=[
 {name:'Exercise technique library',url:'https://weighttraining.guide/exercises/',detail:'Look up technique, muscles and alternatives.'},
 {name:'WeightTraining.guide · men’s programs',url:'https://weighttraining.guide/training-programs/mens-training-programs/',detail:'Beginner-to-advanced reference programs.'},
 {name:'WeightTraining.guide · women’s programs',url:'https://weighttraining.guide/training-programs/womens-training-programs/',detail:'Progressive strength program references.'},
 {name:'WeightTraining.guide · cardio',url:'https://weighttraining.guide/cardio-training-programs/',detail:'Steady-state, interval and circuit references.'},
 {name:'Muscle & Strength · beginner',url:'https://www.muscleandstrength.com/workouts/beginner',detail:'Explore beginner routines and equipment choices.'},
 {name:'Muscle & Strength · full body',url:'https://www.muscleandstrength.com/workouts/full-body',detail:'Compare full-body training approaches.'},
 {name:'CDC · activity guidance',url:'https://www.cdc.gov/physical-activity-basics/guidelines/adults.html',detail:'Adult activity and strength-training guidance.'},
 {name:'USDA · personalized nutrient references',url:'https://www.nal.usda.gov/human-nutrition-and-food-safety/dri-calculator',detail:'Age- and sex-based Dietary Reference Intakes.'},
 {name:'NIH · vitamins and minerals',url:'https://ods.od.nih.gov/factsheets/list-VitaminsMinerals/',detail:'Nutrient requirements, limitations and health considerations.'},
 {name:'Mifflin–St Jeor · energy equation',url:'https://pubmed.ncbi.nlm.nih.gov/2305711/',detail:'Resting energy estimate; activity factors remain approximations.'},
 {name:'NIH · exercise nutrition',url:'https://ods.od.nih.gov/factsheets/ExerciseAndAthleticPerformance-HealthProfessional/',detail:'Protein needs for active adults; no supplements required by this planner.'},
 {name:'USDA FoodData Central',url:'https://fdc.nal.usda.gov/',detail:'Ingredient-level food composition estimates.'},
];
