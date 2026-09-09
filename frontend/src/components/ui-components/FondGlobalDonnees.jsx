import { motion, useReducedMotion } from 'framer-motion'
import Box from '@mui/material/Box'
import { useTheme } from '@mui/material/styles'

/**
 * FondGlobalDonnees — fond vivant du club : quatre fibres optiques qui se
 * dessinent au chargement, puis quelques paquets de données les parcourent
 * lentement. Animations rares et lentes : la page respire sans distraire.
 * Prop : intensite (0-1) module l'opacité globale.
 */
const FIBRES = [
  { d: 'M-60,260 C 320,60 720,620 1560,180', couleur: '#1FAF72', largeur: 2, opacite: 0.4, duree: 2.4, retard: 0 },
  { d: 'M-60,620 C 380,420 820,120 1560,520', couleur: '#2563EB', largeur: 2, opacite: 0.3, duree: 2.8, retard: 0.3 },
  { d: 'M-60,140 C 420,480 900,240 1560,100', couleur: '#8FA89C', largeur: 1.8, opacite: 0.3, duree: 3.2, retard: 0.6 },
  { d: 'M-60,780 C 460,560 920,760 1560,640', couleur: '#1FAF72', largeur: 1.8, opacite: 0.26, duree: 3.6, retard: 0.9 },
]

const PAQUETS = [
  { chemin: 0, couleur: '#1FAF72', taille: 5, duree: 14, retard: 2 },
  { chemin: 1, couleur: '#2563EB', taille: 4, duree: 18, retard: 7 },
  { chemin: 2, couleur: '#1FAF72', taille: 4, duree: 16, retard: 12 },
]

function Paquet({ d, couleur, taille, duree, retard, reduit }) {
  if (reduit) return null
  return (
    <motion.circle r={taille} fill={couleur} opacity={0.55}
      animate={{ offsetDistance: ['0%', '100%'] }}
      transition={{ duration: duree, repeat: Infinity, ease: 'linear', delay: retard }}
      style={{ offsetPath: `path('${d}')` }}
    />
  )
}

export default function FondGlobalDonnees({ intensite = 1 }) {
  const reduit = useReducedMotion()
  const theme = useTheme()
  const sombre = theme.palette.mode === 'dark'
  return (
    <Box
      sx={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}
      aria-hidden
    >
      <Box sx={{ position: 'absolute', inset: 0, background: sombre ? '#0A1420' : 'linear-gradient(180deg,#FFFFFF 0%,#F6F8F7 100%)' }} />
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
        {PAQUETS.map((p) => (
          <Paquet key={p.retard} d={FIBRES[p.chemin].d} {...p} reduit={reduit} />
        ))}
      </svg>
    </Box>
  )
}
