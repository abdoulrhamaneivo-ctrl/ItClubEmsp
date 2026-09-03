import { motion, useScroll, useTransform } from 'framer-motion'
import Box from '@mui/material/Box'

/**
 * FondGlobalDonnees — LE fond animé de toute la vitrine :
 * positionné en fixe derrière tout (zIndex 0), il continue de vivre
 * pendant le scroll (synchronisation globale). Deux couches en
 * parallaxe : les fibres défilent légèrement plus lentement que la
 * page → sensation de profondeur et de continuité entre les sections.
 *
 * Placé UNE FOIS dans Vitrine, il relie toutes les sections entre elles.
 */

function Paquet({ path, duree, retard, couleur, taille = 4 }) {
  return (
    <motion.circle r={taille} fill={couleur} style={{ filter: `drop-shadow(0 0 5px ${couleur}55)` }}>
      <animateMotion dur={`${duree}s`} begin={`${retard}s`} repeatCount="indefinite" path={path} />
    </motion.circle>
  )
}

function Enveloppe({ x, y, taille = 26, duree, retard, opacite = 0.3 }) {
  return (
    <motion.g
      animate={{ y: [0, -14, 0], x: [0, 7, 0], rotate: [0, 3, 0] }}
      transition={{ duration: duree, repeat: Infinity, ease: 'easeInOut', delay: retard }}
      style={{ opacity: opacite, transformOrigin: `${x}px ${y}px` }}
    >
      <rect x={x} y={y} width={taille} height={taille * 0.68} rx={3} fill="none" stroke="#8FA89C" strokeWidth="1.3" />
      <path d={`M${x} ${y} l${taille / 2} ${taille * 0.42} l${taille / 2} ${-taille * 0.42}`} fill="none" stroke="#8FA89C" strokeWidth="1.3" />
    </motion.g>
  )
}

function Satellite({ cx, cy, duree = 46 }) {
  return (
    <motion.g
      animate={{ rotate: 360 }}
      transition={{ duration: duree, repeat: Infinity, ease: 'linear' }}
      style={{ transformOrigin: `${cx}px ${cy}px`, opacity: 0.28 }}
    >
      <ellipse cx={cx} cy={cy} rx={130} ry={54} fill="none" stroke="#A9BCB2" strokeWidth="0.8" strokeDasharray="3 7" />
      <g transform={`translate(${cx + 130},${cy})`}>
        <rect x={-9} y={-6} width={18} height={12} rx={2.5} fill="none" stroke="#7B9487" strokeWidth="1.4" />
        <line x1={-17} y1={-7} x2={-9} y2={-3} stroke="#7B9487" strokeWidth="1.2" />
        <line x1={-17} y1={7} x2={-9} y2={3} stroke="#7B9487" strokeWidth="1.2" />
        <line x1={9} y1={-7} x2={17} y2={-3} stroke="#7B9487" strokeWidth="1.2" />
        <line x1={9} y1={7} x2={17} y2={3} stroke="#7B9487" strokeWidth="1.2" />
        <line x1={0} y1={-6} x2={0} y2={-11} stroke="#7B9487" strokeWidth="1.2" />
        <circle cx={0} cy={-12.5} r={1.6} fill="#7B9487" />
      </g>
    </motion.g>
  )
}

export default function FondGlobalDonnees() {
  // Parallaxe : la couche fibre glisse de -80px pendant toute la page,
  // la couche enveloppes/satellite de -40px (vitesses différentes = profondeur)
  const { scrollY } = useScroll()
  const yFibres = useTransform(scrollY, [0, 8000], [0, -260])
  const yObjets = useTransform(scrollY, [0, 8000], [0, -120])

  const fibre1 = 'M-60,260 C 320,60 720,620 1560,180'
  const fibre2 = 'M-60,620 C 380,420 820,120 1560,520'
  const fibre3 = 'M-60,140 C 420,480 900,240 1560,100'
  const fibre4 = 'M-60,780 C 460,560 920,760 1560,640'

  return (
    <Box
      sx={{
        position: 'fixed', inset: 0, zIndex: 0,
        pointerEvents: 'none', overflow: 'hidden',
      }}
      aria-hidden
    >
      {/* Voile de base très léger pour unifier */}
      <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#FFFFFF 0%,#FBFCFB 60%,#F6F8F7 100%)' }} />

      {/* Couche 1 : fibres (parallaxe lente) */}
      <motion.svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', width: '100%', height: '130%', top: 0, y: yFibres }}
      >
        <motion.path d={fibre1} fill="none" stroke="#1FAF72" strokeWidth="1.2" opacity="0.15"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.4, ease: 'easeOut' }} />
        <motion.path d={fibre2} fill="none" stroke="#2563EB" strokeWidth="1.2" opacity="0.11"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.8, ease: 'easeOut', delay: 0.3 }} />
        <motion.path d={fibre3} fill="none" stroke="#8FA89C" strokeWidth="1" opacity="0.12"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 3.2, ease: 'easeOut', delay: 0.6 }} />
        <motion.path d={fibre4} fill="none" stroke="#1FAF72" strokeWidth="1" opacity="0.09"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 3.6, ease: 'easeOut', delay: 0.9 }} />

        <Paquet path={fibre1} duree={8} retard={0} couleur="#1FAF72" taille={4} />
        <Paquet path={fibre1} duree={10} retard={3.1} couleur="#0F5B3A" taille={3} />
        <Paquet path={fibre2} duree={9} retard={1.2} couleur="#2563EB" taille={3.5} />
        <Paquet path={fibre3} duree={11} retard={2} couleur="#F5A623" taille={3} />
        <Paquet path={fibre4} duree={12} retard={4.6} couleur="#1FAF72" taille={3.2} />
      </motion.svg>

      {/* Couche 2 : enveloppes + satellite (parallaxe plus rapide) */}
      <motion.svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', width: '100%', height: '130%', top: 0, y: yObjets }}
      >
        <Enveloppe x={1120} y={130} duree={9} retard={0} />
        <Enveloppe x={260} y={210} taille={22} duree={11} retard={2.5} opacite={0.24} />
        <Enveloppe x={980} y={620} taille={24} duree={10} retard={4.5} opacite={0.26} />
        <Enveloppe x={480} y={760} taille={20} duree={12} retard={1.4} opacite={0.2} />
        <Satellite cx={1160} cy={150} />
        <Satellite cx={240} cy={640} duree={58} />
      </motion.svg>
    </Box>
  )
}
