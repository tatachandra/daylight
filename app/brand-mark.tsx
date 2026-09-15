export default function BrandMark({small=false}:{small?:boolean}) {
  return <img className={`brand-mark${small?' brand-mark-small':''}`} src="/balanced-leaves.png" width={48} height={48} alt="" aria-hidden="true" decoding="async"/>;
}
