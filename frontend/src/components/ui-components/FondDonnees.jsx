import { motion } from 'framer-motion'
import Box from '@mui/material/Box'

/**
 * FondDonnees — fond animé « le club connecte l'école au numérique » :
 * fibres optiques avec paquets de données qui circulent, enveloppes qui
 * dérivent, satellite en orbite lente. Subtil, fluide, non envahissant.
 * Conçu pour un fond SOMBRE (hero). Couleurs de la charte, opacité faible.
 */

/** Un paquet de données qui voyage le long d'une fibre. */
function Paquet({ path, duree, retard, couleur, taille = 4 }) {
  return (
    <motion.circle
      r={taille}
      fill={couleur}
      style={{ filter: `drop-shadow(0 0 6px ${couleur})` }}
    >
      <animateMotion dur={`${duree}s`} begin={`${retard}s`} repeatCount="indefinite" path={path} />
    </motion.circle>
  )
}

/** Enveloppe minimaliste qui dérive lentement. */
function Enveloppe({ x, y, taille = 26, duree, retard, opacite = 0.14 }) {
  return (
    <motion.g
      animate={{ y: [0, -16, 0], x: [0, 8, 0], rotate: [0, 4, 0] }}
      transition={{ duration: duree, repeat: Infinity, ease: 'easeInOut', delay: retard }}
      style={{ opacity: opacite, transformOrigin: `${x}px ${y}px` }}
    >
      <rect x={x} y={y} width={taille} height={taille * 0.68} rx={3} fill="none" stroke="#9AFBD7" strokeWidth="1.4" />
      <path d={`M${x} ${y} l${taille / 2} ${taille * 0.42} l${taille / 2} ${-taille * 0.42}`} fill="none" stroke="#9AFBD7" strokeWidth="1.4" />
    </motion.g>
  )
}

/** Satellite line art en orbite lente. */
function Satellite({ cx, cy, duree = 46 }) {
  return (
    <motion.g
      animate={{ rotate: 360 }}
      transition={{ duration: duree, repeat: Infinity, ease: 'linear' }}
      style={{ transformOrigin: `${cx}px ${cy}px`, opacity: 0.16 }}
    >
      {/* orbite */}
      <ellipse cx={cx} cy={cy} rx={130} ry={54} fill="none" stroke="#9AFBD7" strokeWidth="0.8" strokeDasharray="3 7" />
      {/* satellite sur l'orbite */}
      <g transform={`translate(${cx + 130},${cy})`}>
        <rect x={-9} y={-6} width={18} height={12} rx={2.5} fill="none" stroke="#9AFBD7" strokeWidth="1.4" />
        <line x1={-17} y1={-7} x2={-9} y2={-3} stroke="#9AFBD7" strokeWidth="1.2" />
        <line x1={-17} y1={7} x2={-9} y2={3} stroke="#9AFBD7" strokeWidth="1.2" />
        <line x1={9} y1={-7} x2={17} y2={-3} stroke="#9AFBD7" strokeWidth="1.2" />
        <line x1={9} y1={7} x2={17} y2={3} stroke="#9AFBD7" strokeWidth="1.2" />
        <line x1={0} y1={-6} x2={0} y2={-11} stroke="#9AFBD7" strokeWidth="1.2" />
        <circle cx={0} cy={-12.5} r={1.6} fill="#9AFBD7" />
      </g>
    </motion.g>
  )
}

export default function FondDonnees({ intensite = 1 }) {
  // Fibres : grandes courbes traversant la scène
  const fibre1 = 'M-60,240 C 320,60 720,420 1560,140'
  const fibre2 = 'M-60,420 C 380,300 820,80 1560,360'
  const fibre3 = 'M-60,120 C 420,340 900,180 1560,60'

  return (
    <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }} aria-hidden>
      <svg
        viewBox="0 0 1440 520"
        preserveAspectRatio="xMidYMid slice"
        style={{ width: '100%', height: '100%', opacity: intensite }}
      >
        {/* Fibres optiques */}
        <motion.path
          d={fibre1} fill="none" stroke="#1FAF72" strokeWidth="1.2" opacity="0.22"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 2.2, ease: 'easeOut' }}
        />
        <motion.path
          d={fibre2} fill="none" stroke="#2563EB" strokeWidth="1.2" opacity="0.18"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 2.6, ease: 'easeOut', delay: 0.3 }}
        />
        <motion.path
          d={fibre3} fill="none" stroke="#9AFBD7" strokeWidth="1" opacity="0.14"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 3, ease: 'easeOut', delay: 0.6 }}
        />

        {/* Paquets de données qui circulent */}
        <Paquet path={fibre1} duree={7} retard={0} couleur="#9AFBD7" taille={4.5} />
        <Paquet path={fibre1} duree={9} retard={2.4} couleur="#1FAF72" taille={3.5} />
        <Paquet path={fibre2} duree={8} retard={1} couleur="#7FB3FF" taille={4} />
        <Paquet path={fibre2} duree={10} retard={4.2} couleur="#9AFBD7" taille={3} />
        <Paquet path={fibre3} duree={11} retard={2} couleur="#F5A623" taille={3.5} />

        {/* Enveloppes qui dérivent */}
        <Enveloppe x={1120} y={110} duree={9} retard={0} />
        <Enveloppe x={260} y={150} taille={22} duree={11} retard={2.5} opacite={0.11} />
        <Enveloppe x={980} y={420} taille={24} duree={10} retard={4.5} opacite={0.12} />

        {/* Satellite en orbite */}
        <Satellite cx={1160} cy={130} />
      </svg>
    </Box>
  )
}
