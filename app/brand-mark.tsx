export default function BrandMark({small=false}:{small?:boolean}) {
  return <img className={`brand-mark${small?' brand-mark-small':''}`} src="/green-leaves-v2.png" width={40} height={40} alt="" aria-hidden="true" decoding="async"/>;
}
