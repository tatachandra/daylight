export type NutrientSpec = { id:string; name:string; unit:string; reference?:number; note?:string };
export const MAIN: NutrientSpec[] = [
 {id:'1003',name:'Protein',unit:'g',reference:50},
 {id:'1079',name:'Fiber',unit:'g',reference:28},
 {id:'1090',name:'Magnesium',unit:'mg',reference:420},
];
export const VITAMINS:NutrientSpec[] = [
 {id:'1106',name:'Vitamin A',unit:'µg RAE',reference:900},
 {id:'1162',name:'Vitamin C',unit:'mg',reference:90},
 {id:'1114',name:'Vitamin D',unit:'µg',reference:20},
 {id:'1109',name:'Vitamin E',unit:'mg',reference:15,note:'Alpha-tocopherol'},
 {id:'1185',name:'Vitamin K1',unit:'µg',note:'Phylloquinone only; K2 not included'},
 {id:'1165',name:'B1 · Thiamin',unit:'mg',reference:1.2},
 {id:'1166',name:'B2 · Riboflavin',unit:'mg',reference:1.3},
 {id:'1167',name:'B3 · Niacin',unit:'mg',note:'Niacin only, not niacin equivalents'},
 {id:'1170',name:'B5 · Pantothenic acid',unit:'mg',reference:5},
 {id:'1175',name:'B6',unit:'mg',reference:1.7},
 {id:'1176',name:'B7 · Biotin',unit:'µg',reference:30},
 {id:'1190',name:'B9 · Folate',unit:'µg DFE',reference:400},
 {id:'1178',name:'B12',unit:'µg',reference:2.4},
];
export const AMINO_ACIDS:NutrientSpec[] = [
 ['1210','Tryptophan'],['1211','Threonine'],['1212','Isoleucine'],['1213','Leucine'],['1214','Lysine'],['1215','Methionine'],['1217','Phenylalanine'],['1219','Valine'],['1221','Histidine'],
 ['1220','Arginine'],['1222','Alanine'],['1223','Aspartic acid'],['1224','Glutamic acid'],['1225','Glycine'],['1226','Proline'],['1227','Serine'],['1218','Tyrosine'],
 ['unknown-cysteine','Cysteine'],['unknown-asparagine','Asparagine'],['unknown-glutamine','Glutamine'],['1216','Cystine'],['1228','Hydroxyproline'],
].map(([id,name])=>({id,name,unit:'g',...(id==='1216'?{note:'Reported separately from cysteine'}:{})}));
export const OTHER:NutrientSpec[]=[{id:'energy',name:'Energy',unit:'kcal'},{id:'1004',name:'Fat',unit:'g'},{id:'1005',name:'Carbohydrate',unit:'g'},{id:'1087',name:'Calcium',unit:'mg'},{id:'1089',name:'Iron',unit:'mg'},{id:'1092',name:'Potassium',unit:'mg'},{id:'1093',name:'Sodium',unit:'mg'},{id:'1095',name:'Zinc',unit:'mg'},{id:'1091',name:'Phosphorus',unit:'mg'},{id:'1098',name:'Copper',unit:'mg'},{id:'1101',name:'Manganese',unit:'mg'},{id:'1103',name:'Selenium',unit:'µg'},{id:'1100',name:'Iodine',unit:'µg'},{id:'1180',name:'Choline',unit:'mg'},{id:'1096',name:'Chromium',unit:'µg'},{id:'1102',name:'Molybdenum',unit:'µg'},{id:'1099',name:'Fluoride',unit:'mg',note:'Food database reports µg; converted to mg'},{id:'1258',name:'Saturated fat',unit:'g'},{id:'1404',name:'ALA omega-3',unit:'g'},{id:'1278',name:'EPA omega-3',unit:'g'},{id:'1272',name:'DHA omega-3',unit:'g'}];
export type NutrientTotal={value:number|null;covered:number;total:number};
export type NutritionSummary={nutrients:Record<string,NutrientTotal>;items:number;estimatedPortions:number;unknownPortions:number;unlistedFoods:number;mealCount:number};
export type Suggestion={name:string;ingredients:string[];allergens:string[];protein:number;fiber:number;magnesium:number;focus:string};
export type Suggestions={meals:Suggestion[];loggedDays:number;completeDays:number;basis:string};
export function amount(value:number|null,unit=''){return value===null?'Unknown':`${value>0&&value<0.01&&unit!=='kcal'?'<0.01':new Intl.NumberFormat('en-US',{maximumFractionDigits:unit==='kcal'?0:2}).format(value)}${unit?' '+unit:''}`;}
