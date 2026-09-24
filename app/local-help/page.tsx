import {Globe2, Laptop, Smartphone, MapPin, Phone, MessageSquare, Check} from 'lucide-react';
import BrandMark from '@/app/brand-mark';
import PrimaryNav from '@/app/primary-nav';
import './local-help.css';

export const metadata = {title:'Near You — Clear Lake & Mason City | My Day Harbor',description:'Website building and patient technology assistance for residents and small businesses in Clear Lake and Mason City, Iowa. Home visits and remote help by appointment.'};

const services = [
 {icon:Globe2,title:'A website for your next step',description:'For a local business, a personal project, or a service you’re ready to share.',items:['New websites and updates to existing pages','Mobile-friendly layouts and clear service information','Help with domains, hosting, and website setup']},
 {icon:Laptop,title:'Get your everyday tech working',description:'Practical help with the computers and systems you depend on at home or at work.',items:['Computer setup and software troubleshooting','Wi-Fi, printers, email, and backups','Help organizing files and setting up everyday tools']},
 {icon:Smartphone,title:'Learn at your own pace',description:'Patient, plain-English guidance for residents, seniors, and families.',items:['Phones, tablets, smart TVs, and video calls','Password-manager setup and account navigation','Recognizing suspicious messages and scam warning signs']},
];

export default function LocalHelpPage(){return <div className="local-help-page"><div className="site-shell">
 <header className="masthead"><a className="wordmark site-brand" href="/"><BrandMark/><span>My Day Harbor</span></a><PrimaryNav active="local-help"/></header>
 <main className="local-help-main">
  <section className="local-help-intro" aria-labelledby="local-help-title"><div className="local-help-hero"><p className="local-help-location"><MapPin size={17}/>Clear Lake & Mason City, Iowa</p><h1 id="local-help-title">A little help with tech.<br/><em>A lot less frustration.</em></h1><p>Build a website, sort out a computer problem, or get comfortable with a new device. Friendly help from Arjun, at your home or remotely by appointment.</p></div><aside className="local-help-contact"><span>LET’S START WITH YOUR QUESTION</span><h2>What do you need help with?</h2><p>Tell me your city, the device or website, and what you’d like to do. We’ll agree on the scope and price before starting.</p><a className="local-help-call" href="tel:+17479770692"><Phone size={18}/>Call (747) 977-0692</a><a className="local-help-text" href="sms:+17479770692"><MessageSquare size={18}/>Send Arjun a text</a></aside></section>
  <section aria-labelledby="local-help-services"><div className="local-help-section-title"><h2 id="local-help-services">How I can help</h2><p>For residents, families, and small businesses.</p></div><div className="local-help-grid">{services.map(({icon:Icon,title,description,items})=><article className="local-help-card" key={title}><Icon size={27} strokeWidth={1.5}/><h3>{title}</h3><p>{description}</p><ul>{items.map(item=><li key={item}><Check size={16}/><span>{item}</span></li>)}</ul></article>)}</div></section>
  <section className="local-help-process" aria-labelledby="local-help-process-title"><div><p className="local-help-kicker">ONE FAMILIAR PERSON TO ASK</p><h2 id="local-help-process-title">Help that fits the problem.</h2></div><ol><li><strong>01 · Tell me what’s happening</strong><p>A quick call or text is enough to start. No technical vocabulary needed.</p></li><li><strong>02 · Choose the right kind of help</strong><p>Remote guidance when practical. A home visit in Clear Lake or Mason City when hands-on help is needed. Availability and travel are confirmed when scheduling.</p></li><li><strong>03 · Agree on the work and price</strong><p>Website projects are quoted to fit the scope. Support time, any parts, and travel costs are discussed before work begins.</p></li></ol></section>
  <div className="local-help-trust"><h2>You stay in control.</h2><p>Remote help starts only with your permission. You enter your own passwords and verification codes, and you can end a session at any time. Scam checks help you recognize warning signs; they cannot guarantee a message is safe.</p></div>
 </main><footer className="local-help-footer">Near You · Clear Lake & Mason City · <a href="tel:+17479770692">(747) 977-0692</a></footer>
 </div></div>;}
