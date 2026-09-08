import { motion, useReducedMotion } from 'framer-motion'
import Box from '@mui/material/Box'

/**
 * FondGlobalDonnees — fond sobre du site : quatre fibres optiques
 * qui se dessinent une seule fois au chargement, sur fond clair.
 * Prop optionnelle : intensite (0 à 1) module l'opacité des fibres.
 */
const FIBRES = [
  { d: 'M-60,260 C 320,60 720,620 1560,180', couleur: '#1FAF72', largeur: 2, opacite: 0.4, duree: 2.4, retard: 0 },
  { d: 'M-60,620 C 380,420 820,120 1560,520', couleur: '#2563EB', largeur: 2, opacite: 0.3, duree: 2.8, retard: 0.3 },
  { d: 'M-60,140 C 420,480 900,240 1560,100', couleur: '#8FA89C', largeur: 1.8, opacite: 0.3, duree: 3.2, retard: 0.6 },
  { d: 'M-60,780 C 460,560 920,760 1560,640', couleur: '#1FAF72', largeur: 1.8, opacite: 0.26, duree: 3.6, retard: 0.9 },
]

export default function FondGlobalDonnees({ intensite = 1 }) {
  const reduit = useReducedMotion()
  return (
    <Box
      sx={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}
      aria-hidden
    >
      <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#FFFFFF 0%,#F6F8F7 100%)' }} />
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', width: '100%', height: '100%', top: 0 }}
      >
        {FIBRES.map((f) => (
          <motion.path
            key={f.d}
            d={f.d}
            fill="none"
            stroke={f.couleur}
            strokeWidth={f.largeur}
            opacity={f.opacite * intensite}
            initial={reduit ? { pathLength: 1 } : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={reduit ? { duration: 0 } : { duration: f.duree, ease: 'easeOut', delay: f.retard }}
          />
        ))}
      </svg>
    </Box>
  )
}
