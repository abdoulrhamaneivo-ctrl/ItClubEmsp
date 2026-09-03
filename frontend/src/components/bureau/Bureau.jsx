import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import FondPropre from '../ui-components/FondPropre'
import { BandeauAccent } from '../ui-components/FondPropre'
import TitreSection from '../ui-components/TitreSection'
import FondDonnees from '../ui-components/FondDonnees'
import { IcMembres, IcCube, IcDocument, iconePoste } from '../ui-components/IconesClub'
import { useBureau } from '../../hooks/useApi'

/**
 * Le Bureau — Carrousel PAGE-TURN 3D (référence motion.dev) :
 * carte frontale + cartes empilées à droite dépassant, flip rotateY
 * autour de la charnière GAUCHE (effet tourner une page), translation
 * de recentrage, ancienne carte repoussée derrière à gauche, légende
 * synchronisée. Navigation : clic bord droit, flèches, auto-rotation.
 */

const DUREE = 4500
const LARGEUR_CARTE = 340
const HAUTEUR_CARTE = 400
const DECALE_PILE = 44   // décalage visible de chaque carte derrière

export default function Bureau() {
  const { data: bureau, loading, error } = useBureau()
  const [index, setIndex] = useState(0)
  const [sens, setSens] = useState(1)
  const [hover, setHover] = useState(false)

  useEffect(() => {
    let t
    const n = bureau?.length || 0
    if (!hover && n > 1) {
      t = setInterval(() => { setSens(1); setIndex((i) => (i + 1) % n) }, DUREE)
    }
    return () => clearInterval(t)
  }, [hover, bureau])

  if (loading) return <SqueletteBureau />
  if (error) return <ErreurChargement message={error} />
  if (!bureau || bureau.length === 0) return <Box sx={{ py: 8, textAlign: 'center' }}><Typography color="textSecondary">Aucun membre du bureau</Typography></Box>

  const n = bureau.length
  const tries = [...bureau].sort((a, b) => (a.ordre ?? a.id) - (b.ordre ?? b.id))
  const actuel = tries[index % n]
  const suivant = tries[(index + 1) % n]

  const tourner = (dir) => {
    setSens(dir)
    setIndex((i) => (i + dir + n) % n)
  }

  return (
    <Box id="bureau" sx={{ py: { xs: 6, md: 8 }, position: 'relative', overflow: 'hidden' }}>
      <FondPropre variante="gris" />
      <BandeauAccent couleur="#1FAF72" />
      <FondDonnees intensite={0.85} />

      <Container maxWidth={false} sx={{ position: 'relative', maxWidth: '1440px !important', px: { xs: 2.5, md: 4 } }}>
        <TitreSection
          badge="Gouvernance"
          titre="Le Bureau"
          sousTitre="Feuillette l'équipe comme un annuaire : chaque membre est une page. Clique sur la pile ou les flèches."
          couleur="#1FAF72"
        />

        {/* ═══ SCÈNE PAGE-TURN ═══════════════════════════════════ */}
        <Box sx={{
          display: 'grid', gap: { xs: 4, md: 6 }, alignItems: 'center',
          gridTemplateColumns: { xs: '1fr', md: '1.1fr 1fr' },
          justifyContent: 'center',
        }}>
          {/* ── Pile de cartes 3D ── */}
          <Box
            role="button"
            tabIndex={0}
            aria-label="Tourner la page vers le membre suivant"
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tourner(1) } }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            sx={{
              position: 'relative', height: { xs: 340, sm: 380, md: 420, lg: HAUTEUR_CARTE + 40 },
              display: 'grid', placeItems: 'center',
              perspective: 1600,
              cursor: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='17' fill='rgba(15,91,58,.9)'/%3E%3Ctext x='20' y='26' text-anchor='middle' font-size='18' fill='white' font-family='sans-serif'%3E%E2%80%BA%E2%80%BA%3C/text%3E%3C/svg%3E") 20 20, pointer`,
            }}
            onClick={() => tourner(1)}
          >
            <Box sx={{ position: 'relative', width: LARGEUR_CARTE, height: HAUTEUR_CARTE, transformStyle: 'preserve-3d', display: { xs: 'none', sm: 'block' }, scale: { xs: 0.78, sm: 0.9, md: 1 } }}>

              {/* Cartes de DERRIÈRE (pile à droite) : les 3 suivantes */}
              {tries.slice(1, 4).map((m, i) => {
                const idx = (index + 1 + i) % n
                const membre = tries[idx]
                return (
                  <Box key={membre.id} sx={{
                    position: 'absolute', inset: 0,
                    transform: `translateX(${DECALE_PILE * (i + 1)}px) translateZ(${-18 * (i + 1)}px) scale(${1 - 0.035 * (i + 1)})`,
                    borderRadius: '20px', overflow: 'hidden',
                    bgcolor: '#fff', border: '1px solid #E5E7EB',
                    boxShadow: '0 10px 26px rgba(13,27,42,.14)',
                    zIndex: 5 - i,
                    opacity: 1 - i * 0.12,
                  }}>
                    <VisuelMembre membre={membre} compact={i > 0} />
                  </Box>
                )
              })}

              {/* Carte qui REPART derrière à gauche (l'ancienne) */}
              <Box sx={{
                position: 'absolute', inset: 0,
                transform: `translateX(${-DECALE_PILE}px) translateZ(-18px) scale(0.965)`,
                borderRadius: '20px', overflow: 'hidden',
                bgcolor: '#fff', border: '1px solid #E5E7EB',
                boxShadow: '0 10px 26px rgba(13,27,42,.12)',
                zIndex: 1, opacity: 0.75,
              }}>
                <VisuelMembre membre={tries[(index - 1 + n) % n]} compact />
              </Box>

              {/* ── LA PAGE QUI TOURNE (flip rotateY charnière gauche) ── */}
              {/* On anime le recto vers rotateY -180 via spring quand index change */}
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={actuel.id}
                  initial={{ rotateY: 0, x: 0, zIndex: 10 }}
                  animate={{ rotateY: 0, x: 0 }}
                  exit={{ rotateY: sens === 1 ? -95 : 95, x: sens === 1 ? -30 : 30, opacity: 0.6, zIndex: 20 }}
                  transition={{ duration: 0.55, ease: [0.36, 0.03, 0.24, 1] }}
                  style={{
                    position: 'absolute', inset: 0,
                    transformOrigin: 'left center',
                    transformStyle: 'preserve-3d',
                    borderRadius: '20px', overflow: 'hidden',
                    bgcolor: '#fff',
                    boxShadow: '0 24px 54px rgba(13,27,42,.28)',
                  }}
                >
                  <VisuelMembre membre={actuel} />
                </motion.div>
              </AnimatePresence>
            </Box>

            {/* Mobile : carte simple sans 3D (performance + lisibilité) */}
            <Box sx={{ display: { xs: 'block', sm: 'none' }, width: '82vw', maxWidth: 320 }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={actuel.id}
                  initial={{ opacity: 0, x: 40 * sens }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 * sens }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Box sx={{ borderRadius: '18px', overflow: 'hidden', bgcolor: '#fff', border: '1px solid #E5E7EB', boxShadow: '0 16px 40px rgba(13,27,42,.18)' }}>
                    <VisuelMembre membre={actuel} />
                  </Box>
                </motion.div>
              </AnimatePresence>
            </Box>
          </Box>

          {/* ── Panneau légende synchronisée ── */}
          <Box sx={{ textAlign: { xs: 'center', md: 'left' }, position: 'relative' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={actuel.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              >
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.2, px: 1.8, py: 0.6, borderRadius: 9999, bgcolor: `${actuel.couleur}14`, mb: 2 }}>
                  {(() => { const I = iconePoste(actuel.poste); return <I taille={15} couleur={actuel.couleur === '#1FAF72' ? '#0E7A50' : actuel.couleur} /> })()}
                  <Typography sx={{ color: actuel.couleur === '#1FAF72' ? '#0E7A50' : actuel.couleur, fontWeight: 800, fontSize: '0.7rem', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
                    {actuel.poste}
                  </Typography>
                </Box>
                <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: { xs: '1.5rem', md: '2rem' }, color: '#111827', lineHeight: 1.2, mb: 1.5 }}>
                  {actuel.nom}
                </Typography>
                <Typography variant="body1" sx={{ color: '#374151', lineHeight: 1.85, maxWidth: 480, mx: { xs: 'auto', md: 0 }, mb: 2.5 }}>
                  {actuel.mission}
                </Typography>
                <Chip
                  label={`Objectif : ${actuel.objectif}`}
                  sx={{ bgcolor: '#fff', border: `1px solid ${actuel.couleur}45`, color: '#374151', fontWeight: 700, fontSize: '0.78rem', height: 'auto', py: 0.8, px: 0.5 }}
                />
              </motion.div>
            </AnimatePresence>

            {/* Contrôles */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 4, justifyContent: { xs: 'center', md: 'flex-start' } }}>
              <IconButton aria-label="Membre précédent" onClick={(e) => { e.stopPropagation(); tourner(-1) }}
                sx={{ bgcolor: '#fff', border: '1px solid #E5E7EB', transition: 'all 180ms ease', '&:hover': { bgcolor: '#0F5B3A', color: '#fff', borderColor: '#0F5B3A' } }}>
                <ArrowBackIosNewIcon fontSize="small" />
              </IconButton>
              <IconButton aria-label="Membre suivant" onClick={(e) => { e.stopPropagation(); tourner(1) }}
                sx={{ bgcolor: '#1FAF72', color: '#fff', transition: 'all 180ms ease', '&:hover': { bgcolor: '#179963', boxShadow: '0 6px 18px rgba(31,175,114,.4)' } }}>
                <ArrowForwardIosIcon fontSize="small" />
              </IconButton>
              <Typography sx={{ color: '#5A6B63', fontWeight: 700, fontSize: '0.78rem', fontFamily: "'JetBrains Mono',monospace", ml: 1 }}>
                {String((index % n) + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* KPIs */}
        <Box sx={{ mt: 7, display: 'flex', gap: { xs: 2, md: 4 }, justifyContent: 'center', flexWrap: 'wrap' }}>
          <StatRapide label="Postes du Bureau" valeur={n} icone={<IcMembres taille={22} couleur="#1FAF72" />} />
          <StatRapide label="Cellules animées" valeur={4} icone={<IcCube taille={22} couleur="#2563EB" />} />
          <StatRapide label="Documents de référence" valeur={15} icone={<IcDocument taille={22} couleur="#7B61FF" />} />
        </Box>
      </Container>
    </Box>
  )
}

/* ── Visuel d'une carte membre (dégradé + initiale/photo + icône poste) ── */
function VisuelMembre({ membre: m, compact = false }) {
  const I = iconePoste(m.poste)
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{
        flex: 1, position: 'relative',
        background: `linear-gradient(135deg, ${m.couleur} 0%, ${m.couleur}CC 55%, #0D1B2A 100%)`,
        display: 'grid', placeItems: 'center',
      }}>
        {m.photo ? (
          <Box component="img" src={m.photo} alt={m.nom} sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: compact ? 46 : 64, color: '#fff', textShadow: '0 4px 16px rgba(0,0,0,.35)' }}>
            {(m.nom || 'M')[0]}
          </Typography>
        )}
        <Box sx={{ position: 'absolute', top: 12, left: 12, bgcolor: 'rgba(13,27,42,.55)', backdropFilter: 'blur(6px)', color: '#fff', px: 1.3, py: 0.45, borderRadius: 9999, fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          {m.poste}
        </Box>
        {!compact && (
          <Box sx={{ position: 'absolute', bottom: 12, right: 12, width: 38, height: 38, borderRadius: '12px', bgcolor: 'rgba(13,27,42,.5)', backdropFilter: 'blur(6px)', display: 'grid', placeItems: 'center' }}>
            <I taille={19} couleur="#9AFBD7" />
          </Box>
        )}
      </Box>
      <Box sx={{ p: compact ? 1.2 : 2, bgcolor: '#fff', textAlign: 'center' }}>
        <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: compact ? '0.7rem' : '0.95rem', lineHeight: 1.3 }}>
          {m.nom}
        </Typography>
      </Box>
    </Box>
  )
}

/* ── Stat rapide ────────────────────────────────────────────── */
function StatRapide({ label, valeur, icone, couleur }) {
  return (
    <Box sx={{ textAlign: 'center', p: { xs: 1.5, md: 3 }, minWidth: { xs: 108, sm: 130 }, bgcolor: '#fff', borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,.04)' }}>
      <Box sx={{ width: 46, height: 46, borderRadius: '12px', mx: 'auto', mb: 1, bgcolor: `${couleur}14`, display: 'grid', placeItems: 'center' }}>
        {icone}
      </Box>
      <Typography variant="h5" sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>
        {valeur}
      </Typography>
      <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.62rem' }}>
        {label}
      </Typography>
    </Box>
  )
}

/* ── Squelette & erreur ─────────────────────────────────────── */
function SqueletteBureau() {
  return (
    <Box sx={{ py: 8 }}>
      <Container>
        <Typography component="h2" sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 700, fontSize: { xs: '1.75rem', md: '2.6rem' }, color: '#111827', mb: 4, textAlign: 'center' }}>
          Le Bureau
        </Typography>
        <Box sx={{ display: 'grid', gap: 4, gridTemplateColumns: { xs: '1fr', md: '1.1fr 1fr' }, alignItems: 'center' }}>
          <Box sx={{ height: 420, bgcolor: '#F5F5F5', borderRadius: '20px' }} />
          <Box sx={{ height: 300, bgcolor: '#F5F5F5', borderRadius: '20px' }} />
        </Box>
      </Container>
    </Box>
  )
}

function ErreurChargement({ message }) {
  return (
    <Box sx={{ py: 8, textAlign: 'center' }}>
      <Typography variant="h6" color="error" gutterBottom>Erreur de chargement</Typography>
      <Typography color="textSecondary" sx={{ mb: 3 }}>{message}</Typography>
      <Button variant="contained" onClick={() => window.location.reload()}>Réessayer</Button>
    </Box>
  )
}
