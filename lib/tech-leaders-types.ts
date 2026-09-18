export const TECH_CATEGORIES = ['All updates', 'AI', 'Chips', 'Robotics', 'Space', 'Fusion', 'Brain interfaces', 'Other updates'] as const;
export type TechCategory = typeof TECH_CATEGORIES[number];
export type TechSource = {
  id: string; name: string; kind: 'official' | 'coverage'; home: string;
  feed: string; hosts: string[]; imageHosts: string[]; defaultCategory: TechCategory;
  searchFeed?: boolean;
};
export const TECH_SOURCES: TechSource[] = [
  {id:'openai',name:'OpenAI',kind:'official',home:'https://openai.com/news/',feed:'https://openai.com/news/rss.xml',hosts:['openai.com'],imageHosts:['images.ctfassets.net'],defaultCategory:'AI'},
  {id:'google',name:'Google AI',kind:'official',home:'https://blog.google/technology/ai/',feed:'https://blog.google/technology/ai/rss/',hosts:['blog.google'],imageHosts:['storage.googleapis.com'],defaultCategory:'AI'},
  {id:'nvidia',name:'NVIDIA',kind:'official',home:'https://blogs.nvidia.com/',feed:'https://blogs.nvidia.com/feed/',hosts:['blogs.nvidia.com'],imageHosts:['blogs.nvidia.com'],defaultCategory:'Chips'},
  {id:'microsoft',name:'Microsoft',kind:'official',home:'https://blogs.microsoft.com/',feed:'https://blogs.microsoft.com/feed/',hosts:['blogs.microsoft.com'],imageHosts:['blogs.microsoft.com','news.microsoft.com','microsoft.com','www.microsoft.com'],defaultCategory:'Other updates'},
];
export const TECH_LEADERS = [
  {id:'sam-altman',name:'Sam Altman',company:'OpenAI',aliases:['Sam Altman']},
  {id:'dario-amodei',name:'Dario Amodei',company:'Anthropic',aliases:['Dario Amodei']},
  {id:'demis-hassabis',name:'Demis Hassabis',company:'Google DeepMind',aliases:['Demis Hassabis']},
  {id:'sundar-pichai',name:'Sundar Pichai',company:'Google',aliases:['Sundar Pichai']},
  {id:'aravind-srinivas',name:'Aravind Srinivas',company:'Perplexity',aliases:['Aravind Srinivas']},
  {id:'arthur-mensch',name:'Arthur Mensch',company:'Mistral AI',aliases:['Arthur Mensch']},
  {id:'aidan-gomez',name:'Aidan Gomez',company:'Cohere',aliases:['Aidan Gomez']},
  {id:'jensen-huang',name:'Jensen Huang',company:'NVIDIA',aliases:['Jensen Huang']},
  {id:'lisa-su',name:'Lisa Su',company:'AMD',aliases:['Lisa Su']},
  {id:'elon-musk',name:'Elon Musk',company:'Tesla · SpaceX',aliases:['Elon Musk']},
  {id:'brett-adcock',name:'Brett Adcock',company:'Figure',aliases:['Brett Adcock']},
  {id:'peter-beck',name:'Peter Beck',company:'Rocket Lab',aliases:['Peter Beck']},
  {id:'david-kirtley',name:'David Kirtley',company:'Helion',aliases:['David Kirtley']},
  {id:'tom-oxley',name:'Tom Oxley',company:'Synchron',aliases:['Tom Oxley','Thomas Oxley']},
  {id:'dmitri-dolgov',name:'Dmitri Dolgov',company:'Waymo',aliases:['Dmitri Dolgov']},
  {id:'mark-zuckerberg',name:'Mark Zuckerberg',company:'Meta',aliases:['Mark Zuckerberg']},
  {id:'satya-nadella',name:'Satya Nadella',company:'Microsoft',aliases:['Satya Nadella']},
  {id:'bill-gates',name:'Bill Gates',company:'Microsoft co-founder',aliases:['Bill Gates']},
  {id:'jeff-bezos',name:'Jeff Bezos',company:'Amazon · Blue Origin',aliases:['Jeff Bezos']},
  {id:'andy-jassy',name:'Andy Jassy',company:'Amazon',aliases:['Andy Jassy']},
  {id:'tim-cook',name:'Tim Cook',company:'Apple',aliases:['Tim Cook']},
  {id:'john-ternus',name:'John Ternus',company:'Apple',aliases:['John Ternus']},
  {id:'larry-ellison',name:'Larry Ellison',company:'Oracle',aliases:['Larry Ellison']},
  {id:'marc-benioff',name:'Marc Benioff',company:'Salesforce',aliases:['Marc Benioff']},
  {id:'melanie-perkins',name:'Melanie Perkins',company:'Canva',aliases:['Melanie Perkins']},
  {id:'patrick-collison',name:'Patrick Collison',company:'Stripe',aliases:['Patrick Collison']},
  {id:'tobi-lutke',name:'Tobi Lütke',company:'Shopify',aliases:['Tobi Lütke','Tobias Lütke','Tobi Lutke','Tobias Lutke']},
  {id:'brian-chesky',name:'Brian Chesky',company:'Airbnb',aliases:['Brian Chesky']},
  {id:'larry-page',name:'Larry Page',company:'Google',aliases:['Larry Page']},
  {id:'sergey-brin',name:'Sergey Brin',company:'Google',aliases:['Sergey Brin']},
  {id:'cc-wei',name:'C. C. Wei',company:'TSMC',aliases:['C. C. Wei','C.C. Wei','CC Wei','C.C.Wei']},
  {id:'christophe-fouquet',name:'Christophe Fouquet',company:'ASML',aliases:['Christophe Fouquet']},
  {id:'jeremy-obrien',name:"Jeremy O'Brien",company:'PsiQuantum',aliases:["Jeremy O'Brien",'Jeremy O’Brien']},
];
export type TechPost = {
  id: string; title: string; url: string; published: string; excerpt: string;
  author?: string; sourceId: string; categories: TechCategory[]; image?: string;
  leaderIds: string[]; publisher: string; kind: 'official' | 'coverage'; viaGoogle: boolean;
};
export type TechSourceStatus = {id: string; name: string; home: string; kind: 'official'|'coverage'; status: 'available' | 'cached' | 'unavailable'; lastSuccess: string | null; count: number};
export type TechFeed = {posts: TechPost[]; checkedAt: string; sources: TechSourceStatus[]; leaderId: string};
