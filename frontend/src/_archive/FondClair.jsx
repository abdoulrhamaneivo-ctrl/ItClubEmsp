import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import Box from '@mui/material/Box'

/**
 * Fond clair travaillé — alternative au blanc plat. UTILISÉ PARTOUT (un seul composant).
 * Dégradé très doux + motif SVG de circuits TRÈS discret + halos à peine visibles.
 * variantes : 'clair' (vert), 'chaud' (crème/or), 'froid' (bleu)
 */

const motifs = {
  clair: {
    bg: 'linear-gradient(175deg,#FAFCFB 0%,#FFFFFF 55%,#F4FBF7 100%)',
    accent: '#1FAF72',
    motif: 'rgba(31,175,114,',
  },
  chaud: {
    bg: 'linear-gradient(175deg,#FDFAF5 0%,#FFFFFF 55%,#FDF5ED 100%)',
    accent: '#F5A623',
    motif: 'rgba(245,166,35,',
  },
  froid: {
    bg: 'linear-gradient(175deg,#F5F8FC 0%,#FFFFFF 55%,#EBF3FC 100%)',
    accent: '#2563EB',
    motif: 'rgba(37,99,235,',
  },
}

export default function FondClair({ variante = 'clair', children }) {
  const cfg = motifs[variante] ?? motifs.clair
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const ySlow = useTransform(scrollYProgress, [0, 1], [0, 30])

  const patternId = `circuit-${variante}`

  return (
    <Box sx={{ position: 'relative', overflow: 'hidden' }} ref={ref}>
      {/* Base dégradée très douce */}
      <Box sx={{ position: 'absolute', inset: 0, background: cfg.bg }} />

      {/* Motif de circuits en filigrane — TRÈS discret */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.08 }}
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id={patternId} width="140" height="100" patternUnits="userSpaceOnUse" patternTransform="rotate(4)">
            <path d="M10,50 H70 M70,50 V25 H105 M70,50 V75 H105" stroke={`${cfg.motif}0.05)`} strokeWidth="0.8" fill="none" />
            <circle cx="70" cy="50" r="1.5" fill={`${cfg.motif}0.07)`} />
            <circle cx="105" cy="25" r="1.2" fill={`${cfg.motif}0.05)`} />
            <circle cx="105" cy="75" r="1.2" fill={`${cfg.motif}0.05)`} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>

      {/* Halos TRÈS discrets, animation lente */}
      <motion.div
        aria-hidden
        style={{
          position: 'absolute', width: 480, height: 480, borderRadius: '50%',
          background: `radial-gradient(circle,${cfg.accent}06,transparent 70%)`,
          top: -140, right: -90,
        }}
        animate={{ y: [ySlow, ySlow + 15, ySlow], x: [0, -8, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        style={{
          position: 'absolute', width: 380, height: 380, borderRadius: '50%',
          background: `radial-gradient(circle,${cfg.accent}04,transparent 70%)`,
          bottom: -130, left: -80,
        }}
        animate={{ y: [ySlow, ySlow - 12, ySlow] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Contenu au-dessus */}
      <Box sx={{ position: 'relative' }}>{children}</Box>
    </Box>
  )
}