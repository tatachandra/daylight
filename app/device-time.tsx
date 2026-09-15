'use client';

import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import {deviceDay,formatDeviceDate,formatDeviceTimestamp} from '@/lib/device-time';

const DeviceClock=createContext<number|null>(null);

export function DeviceTimeProvider({children}:{children:ReactNode}){
  const [now,setNow]=useState<number|null>(null);
  useEffect(()=>{
    const update=()=>{if(document.visibilityState==='visible')setNow(Date.now());};
    setNow(Date.now());
    const timer=window.setInterval(update,30000);
    window.addEventListener('focus',update);
    document.addEventListener('visibilitychange',update);
    return()=>{window.clearInterval(timer);window.removeEventListener('focus',update);document.removeEventListener('visibilitychange',update);};
  },[]);
  return <DeviceClock.Provider value={now}>{children}</DeviceClock.Provider>;
}

export function useDeviceToday(){const now=useContext(DeviceClock);return now===null?'':deviceDay(now);}

export function LocalTimestamp({value}:{value:string}){
  const now=useContext(DeviceClock);
  return <time dateTime={value}>{now===null?'…':formatDeviceTimestamp(value)}</time>;
}

export function LocalToday(){
  const now=useContext(DeviceClock);
  return <time dateTime={now===null?undefined:deviceDay(now)}>{now===null?'…':formatDeviceDate(now)}</time>;
}
