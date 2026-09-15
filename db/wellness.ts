import {env} from 'cloudflare:workers';
export function wellnessDb(){if(!env.DB)throw Error('Private storage is temporarily unavailable.');return env.DB;}
