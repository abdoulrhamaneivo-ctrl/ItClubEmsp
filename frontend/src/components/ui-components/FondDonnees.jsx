import { motion, useReducedMotion } from 'framer-motion'
import Box from '@mui/material/Box'

/**
 * FondDonnees — fibres optiques dessinées une fois + un paquet de données
 * qui les parcourt lentement. Animations rares : la page respire.
 * Props historiques conservées (sansSatellite etc. sans effet : déjà minimal).
 */
export default function FondDonnees({ intensite = 1 }) {
  const reduit = useReducedMotion()
  const fibres = [
    { d: 'M-60,240 C 320,60 720,420 1560,140', couleur: '#1FAF72', opacite: 0.16, duree: 2.2, retard: 0 },
    { d: 'M-60,420 C 380,300 820,80 1560,360', couleur: '#2563EB', opacite: 0.13, duree: 2.6, retard: 0.3 },
    { d: 'M-60,120 C 420,340 900,180 1560,60', couleur: '#8FA89C', opacite: 0.12, duree: 3, retard: 0.6 },
  ]
  return (
    <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }} aria-hidden>
      <svg
        viewBox="0 0 1440 520"
        preserveAspectRatio="xMidYMid slice"
        style={{ width: '100%', height: '100%', opacity: intensite }}
      >
        {fibres.map((f) => (
          <motion.path
            key={f.d}
            d={f.d}
            fill="none"
            stroke={f.couleur}
            strokeWidth="1.1"
            opacity={f.opacite}
            initial={reduit ? { pathLength: 1 } : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={reduit ? { duration: 0 } : { duration: f.duree, ease: 'easeOut', delay: f.retard }}
          />
        ))}
        {!reduit && (
          <motion.circle r="3.5" fill="#1FAF72" opacity="0.5"
            animate={{ offsetDistance: ['0%', '100%'] }}
            transition={{ duration: 13, repeat: Infinity, ease: 'linear', delay: 3 }}
            style={{ offsetPath: `path('${fibres[0].d}')` }}
          />
        )}
      </svg>
    </Box>
  )
}
