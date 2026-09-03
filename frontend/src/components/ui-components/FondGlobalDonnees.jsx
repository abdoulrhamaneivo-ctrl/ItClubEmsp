import { motion, useScroll, useTransform } from 'framer-motion'
import Box from '@mui/material/Box'

/**
 * FondGlobalDonnees — LE fond animé du club informatique :
 * fibres optiques + paquets, colonnes de code façon « matrix » ultra-subtiles,
 * bits binaires qui pulsent, snippets de code flottants, circuits imprimés,
 * satellites, enveloppes. Deux couches en parallaxe au scroll.
 * Tout est calibré pour rester lisible : opacités faibles, gris-vert désaturé.
 */

/* ── Fragments de code qui « pleuvent » lentement (matrix discret) ── */
const FRAGMENTS_CODE = [
  'const club = "IT-EMSP"', 'npm run dev', 'git push origin main',
  'SELECT * FROM membres', 'docker compose up', 'while(apprendre) {',
  'import React', 'curl api.club.ci', 'npm install savoir-faire',
  'return Club;', 'def __init__(self):', 'printf("Hello EMSP")',
  'sudo make me a dev', 'pip install django', 'Hello, World!',
  'if (passion && rigueur)', 'git commit -m "feat: avenir"',
]

function ColonneCode({ x, duree, retard, opacite, hauteurChute = 900 }) {
  const fragment = FRAGMENTS_CODE[Math.floor((x * 7) % FRAGMENTS_CODE.length)]
  return (
    <motion.text
      x={x} y={-40}
      fill="#0F5B3A"
      fontSize="11"
      fontFamily="'JetBrains Mono','Fira Code',monospace"
      style={{ opacity: opacite }}
      animate={{ y: [null, hauteurChute] }}
      transition={{ duration: duree, repeat: Infinity, ease: 'linear', delay: retard }}
    >
      {fragment}
    </motion.text>
  )
}

/* ── Bits binaires qui pulsent ── */
function Bits({ x, y, taille = 9, duree = 4, retard = 0 }) {
  return (
    <motion.text
      x={x} y={y}
      fontSize={taille}
      fontFamily="'JetBrains Mono',monospace"
      fill="#1FAF72"
      style={{ opacity: 0.18 }}
      animate={{ opacity: [0.08, 0.26, 0.08] }}
      transition={{ duration: duree, repeat: Infinity, ease: 'easeInOut', delay: retard }}
    >
      01101
    </motion.text>
  )
}

/* ── Curseur terminal qui clignote ── */
function Curseur({ x, y, duree = 1.2, retard = 0 }) {
  return (
    <motion.rect
      x={x} y={y} width={7} height={12} rx={1.5} fill="#0F5B3A"
      style={{ opacity: 0.3 }}
      animate={{ opacity: [0.3, 0.02, 0.3] }}
      transition={{ duration: duree, repeat: Infinity, ease: 'steps(1)', delay: retard }}
    />
  )
}

/* ── Fenêtre de code flottante (mini terminal) ── */
function FenetreCode({ x, y, taille = 1, duree, retard }) {
  return (
    <motion.g
      animate={{ y: [0, -18, 0], x: [0, 9, 0] }}
      transition={{ duration: duree, repeat: Infinity, ease: 'easeInOut', delay: retard }}
      style={{ opacity: 0.5, transformOrigin: `${x}px ${y}px` }}
      transform={`translate(${x},${y}) scale(${taille})`}
    >
      <rect x={0} y={0} width={128} height={78} rx={8} fill="rgba(255,255,255,.55)" stroke="#B9CCC2" strokeWidth="1.2" />
      {/* barre de titre */}
      <line x1={0} y1={20} x2={128} y2={20} stroke="#B9CCC2" strokeWidth="1" />
      <circle cx={14} cy={10} r={3.2} fill="#FF9A8A" opacity="0.75" />
      <circle cx={26} cy={10} r={3.2} fill="#FFD666" opacity="0.75" />
      <circle cx={38} cy={10} r={3.2} fill="#7BE3A6" opacity="0.75" />
      {/* lignes de code */}
      <rect x={12} y={28} width={70} height={4} rx={2} fill="#1FAF72" opacity="0.4" />
      <rect x={20} y={38} width={88} height={4} rx={2} fill="#2563EB" opacity="0.3" />
      <rect x={20} y={48} width={56} height={4} rx={2} fill="#8FA89C" opacity="0.45" />
      <rect x={12} y={58} width={92} height={4} rx={2} fill="#2563EB" opacity="0.25" />
      <rect x={20} y={68} width={40} height={4} rx={2} fill="#1FAF72" opacity="0.35" />
    </motion.g>
  )
}

/* ── Circuit imprimé : traces + pastilles + pulsation de courant ── */
function Circuit({ x, y, echelle = 1, opacite = 0.14, duree = 6, retard = 0 }) {
  const trace = 'M0,0 h40 v-24 h36 v24 h44 v-16 h38'
  return (
    <motion.g
      transform={`translate(${x},${y}) scale(${echelle})`}
      style={{ opacity: opacite }}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: opacite }}
      viewport={{ once: true }}
      transition={{ duration: 1.2, delay: retard }}
    >
      <path d={trace} fill="none" stroke="#0F5B3A" strokeWidth="1.6" strokeLinejoin="round" />
      {/* pastilles de soudure */}
      {[[0, 0], [40, -24], [76, 0], [120, -16], [158, -16]].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={3.4} fill="none" stroke="#0F5B3A" strokeWidth="1.4" />
      ))}
      {/* courant qui circule dans la trace */}
      <motion.circle r={2.6} fill="#1FAF72">
        <animateMotion dur={`${duree}s`} begin={`${retard}s`} repeatCount="indefinite" path={trace} />
      </motion.circle>
    </motion.g>
  )
}

/* ── Éléments précédents ── */
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
  const { scrollY } = useScroll()
  const yFibres = useTransform(scrollY, [0, 8000], [0, -260])
  const yObjets = useTransform(scrollY, [0, 8000], [0, -120])
  const yCode = useTransform(scrollY, [0, 8000], [0, -420])

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
      <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#FFFFFF 0%,#FBFCFB 60%,#F6F8F7 100%)' }} />

      {/* Couche 1 : fibres + paquets (parallaxe lente) */}
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

        {/* Circuits imprimés avec courant qui circule */}
        <Circuit x={90} y={330} echelle={1.15} retard={0.4} />
        <Circuit x={1180} y={700} echelle={1.3} duree={7} retard={1.6} opacite={0.12} />
        <Circuit x={620} y={840} echelle={0.9} duree={8} retard={2.8} opacite={0.1} />
      </motion.svg>

      {/* Couche 2 : code, bits, terminaux (parallaxe moyenne) */}
      <motion.svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', width: '100%', height: '130%', top: 0, y: yCode }}
      >
        {/* Chute de code matrix ultra-discrète */}
        <ColonneCode x={140} duree={26} retard={0} opacite={0.1} />
        <ColonneCode x={310} duree={32} retard={6} opacite={0.08} />
        <ColonneCode x={560} duree={29} retard={12} opacite={0.1} />
        <ColonneCode x={880} duree={35} retard={3} opacite={0.07} />
        <ColonneCode x={1150} duree={27} retard={9} opacite={0.09} />
        <ColonneCode x={1330} duree={31} retard={15} opacite={0.07} />

        {/* Bits binaires qui pulsent */}
        <Bits x={90} y={120} retard={0} />
        <Bits x={760} y={90} retard={1.3} />
        <Bits x={1300} y={420} retard={2.2} />
        <Bits x={420} y={700} retard={0.7} />
        <Bits x={1040} y={780} retard={1.8} />

        {/* Curseurs terminaux qui clignotent */}
        <Curseur x={146} y={112} retard={0} />
        <Curseur x={766} y={82} retard={0.4} />
        <Curseur x={1306} y={412} retard={0.8} />

        {/* Fenêtres de code flottantes */}
        <FenetreCode x={1050} y={250} taille={1.15} duree={10} retard={0} />
        <FenetreCode x={200} y={560} taille={0.95} duree={13} retard={3} />
        <FenetreCode x={660} y={330} taille={0.8} duree={16} retard={6} />
      </motion.svg>

      {/* Couche 3 : enveloppes + satellites (parallaxe rapide) */}
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
