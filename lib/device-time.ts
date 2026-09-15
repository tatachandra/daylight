import {localDay} from './wellness-types';

export function formatDeviceTimestamp(value:string){
  const date=new Date(value);
  return Number.isFinite(date.valueOf())?date.toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'}):'Time unavailable';
}

export function formatDeviceDate(now:number){
  return new Date(now).toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'});
}

export function deviceDay(now:number){return localDay(new Date(now));}

export function dayAfterClockChange(selected:string,previousToday:string,today:string){
  return selected===previousToday?today:selected;
}
