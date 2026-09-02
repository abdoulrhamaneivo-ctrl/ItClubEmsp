import { useRef } from 'react'
import { motion, useScroll, useSpring, useTransform } from 'framer-motion'

/**
 * Fond animé discret — circuits très légers, halos à peine visibles.
 * Lisibilité absolue du contenu en priorité.
 */
export default function FondAnime({ variante = 'marine' }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y1 = useSpring(useTransform(scrollYProgress, [0, 1], [0, 80]), { stiffness: 40 })
  const y2 = useSpring(useTransform(scrollYProgress, [0, 1], [0, -60]), { stiffness: 40 })

  const fond =
    variante === 'marine'
      ? 'linear-gradient(160deg,#0D1B2A 0%,#0F5B3A 100%)'
      : 'linear-gradient(160deg,#0F5B3A 0%,#1FAF72 100%)'

  return (
    <div ref={ref} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: fond }}>
      {/* Halos très discrets en parallaxe légère */}
      <motion.div
        style={{
          position: 'absolute', width: 520, height: 520, borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(31,175,114,.08),transparent 70%)',
          top: '-10%', left: '-8%', y: y1,
        }}
      />
      <motion.div
        style={{
          position: 'absolute', width: 460, height: 460, borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(37,99,235,.06),transparent 70%)',
          bottom: '-15%', right: '-6%', y: y2,
        }}
      />

      {/* Lignes de circuit TRÈS légères */}
      <svg width="100%" height="100%" style={{ position: 'absolute', opacity: 0.06 }}>
        <motion.path
          d="M-40,140 C220,60 420,260 760,150 S1240,240 1560,120"
          stroke="#9AFBD7" strokeWidth="1" fill="none"
          initial={{ pathLength: 0, opacity: 0.05 }}
          animate={{ pathLength: [0, 1, 1], opacity: [0.05, 0.12, 0.05] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.path
          d="M-40,320 C300,420 520,200 860,330 S1300,180 1600,300"
          stroke="#1FAF72" strokeWidth="1" fill="none"
          initial={{ pathLength: 0, opacity: 0.04 }}
          animate={{ pathLength: [0, 1, 1], opacity: [0.04, 0.1, 0.04] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
      </svg>

      {/* Particules très discrètes (6 seulement) */}
      {[...Array(6)].map((_, i) => {
        const x = (i * 167 + 30) % 100
        const duree = 10 + (i % 4) * 3
        return (
          <motion.span
            key={i}
            style={{
              position: 'absolute', left: `${x}%`, top: `${(i * 71) % 100}%`,
              width: 3, height: 3, borderRadius: '50%',
              background: i % 3 === 0 ? '#9AFBD7' : i % 3 === 1 ? '#1FAF72' : '#2563EB',
              opacity: 0.25,
            }}
            animate={{ y: [-8, 8, -8], opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: duree, repeat: Infinity, ease: 'easeInOut', delay: i * 0.8 }}
          />
        )
      })}
    </div>
  )
}