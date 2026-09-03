import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'

/** Apparition douce au scroll (fade + montée). */
export function FadeIn({ children, delay = 0, y = 28, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px' }}
      transition={{ duration: 0.38, delay, ease: [0.22, 1, 0.36, 1] }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

/** Parallaxe légère au scroll — pour fonds/décor. */
export function Parallax({ children, strength = 60, ...props }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [strength, -strength])
  return (
    <div ref={ref} {...props}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  )
}

/** Compteur animé (chiffres clés) — se déclenche quand il entre à l'écran. */
export function Compteur({ valeur, suffixe = '', duree = 1.6 }) {
  return (
    <motion.span initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
      <AnimatedNumber valeur={valeur} duree={duree} />
      {suffixe}
    </motion.span>
  )
}

function AnimatedNumber({ valeur, duree }) {
  const start = (el) => {
    if (!el || el.dataset.done) return
    el.dataset.done = '1'
    const t0 = performance.now()
    const tick = (t) => {
      const p = Math.min((t - t0) / (duree * 1000), 1)
      el.textContent = Math.round(valeur * (1 - Math.pow(1 - p, 3)))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }
  return (
    <motion.span
      ref={(el) => el && start(el)}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
    >
      0
    </motion.span>
  )
}
