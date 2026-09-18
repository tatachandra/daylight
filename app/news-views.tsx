export default function NewsViews({active}:{active:'headlines'|'leaders'}) {
  return <nav className="news-views" aria-label="News views"><a href="/" aria-current={active==='headlines'?'page':undefined}>Headlines</a><a href="/tech-leaders" aria-current={active==='leaders'?'page':undefined}>Tech Leaders</a></nav>;
}
