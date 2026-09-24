import type {Food} from './wellness-types';
export function parseMealSearch(input:string){
 const words:Record<string,number>={one:1,two:2,three:3,four:4,five:5,six:6};
 const match=input.trim().match(/^(\d+(?:\.\d+)?|one|two|three|four|five|six)\s+(.+)$/i);
 const query=match?match[2]:input.trim();
 return {query:query.replace(/\beggs\b/gi,'egg').replace(/\bslices? of\s+/gi,''),count:match?(words[match[1].toLowerCase()]??Number(match[1])):null};
}
// Only divide an explicit database measure; never invent a serving weight.
export function singleServings(food:Food):Food{return {...food,portions:food.portions.map(p=>{const match=p.label.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);if(!match||Number(match[1])<=1)return p;return {label:`1 ${match[2]}`,grams:p.grams/Number(match[1])};})};}
