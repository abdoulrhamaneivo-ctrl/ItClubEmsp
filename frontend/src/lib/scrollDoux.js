/**
 * scrollDoux — défilement fluide maison (setTimeout ~16ms, plus fiable que
 * rAF qui est gelé dans les onglets non affichés), insensible aux
 * interruptions de framer-motion qui annulent le smooth natif du navigateur.
 */
export default function scrollDoux(yCible, duree = 550) {
  const depart = window.scrollY
  const delta = yCible - depart
  if (Math.abs(delta) < 2) return
  const t0 = performance.now()
  const ease = (t) => 1 - Math.pow(1 - t, 3) // easeOutCubic
  const pas = () => {
    const p = Math.min(1, (performance.now() - t0) / duree)
    window.scrollTo(0, depart + delta * ease(p))
    if (p < 1) setTimeout(pas, 16)
  }
  setTimeout(pas, 16)
}
