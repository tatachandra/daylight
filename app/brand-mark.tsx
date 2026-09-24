export default function BrandMark({small=false}:{small?:boolean}) {
  return <span className={`brand-mark${small?' brand-mark-small':''}`} aria-hidden="true"><img src={small?'/my-day-harbor-waves-icon.png':'/my-day-harbor-glossy-e.png'} width={small?40:150} height={small?40:150} alt="" decoding="async"/></span>;
}
