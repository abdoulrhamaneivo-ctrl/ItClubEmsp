import { useState, useEffect, useRef } from 'react'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { motion, AnimatePresence } from 'framer-motion'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import FondPropre from '../ui-components/FondPropre'
import { BandeauAccent } from '../ui-components/FondPropre'
import TitreSection from '../ui-components/TitreSection'
import FondHalos from '../ui-components/FondHalos'
import { IcWeb, IcIA, IcCyber, IcDesign, IcMembres, IcCalendrier, IcRocket, iconesCellules } from '../ui-components/IconesClub'
import { useCellules } from '../../hooks/useApi'

/** Icône line art d'une cellule (fallback emoji uniquement si id inconnu). */
function IconeCellule({ cellule, taille = 28, couleur = 'currentColor' }) {
  const Comp = iconesCellules[cellule.id]
  if (Comp) return <Comp taille={taille} couleur={couleur} />
  return <Typography sx={{ fontSize: taille * 0.8 }}>{cellule.icone}</Typography>
}

/**
 * Nos cellules — Carrousel CIRCULAIRE 3D.
 * Les cartes tournent sur un anneau en perspective (rotationY par index,
 * translateZ = rayon). La cellule de face est active ; le panneau de droite
 * affiche sa description complète + programme. Auto-rotation, pause au hover.
 */

const RAYON_DESKTOP = 380        // rayon de l'anneau (px)
const DUREE_TOUR = 4200  // ms par cellule en auto-rotation

export default function Cellules() {
  const theme = useTheme()
  const mobile = useMediaQuery(theme.breakpoints.down('sm'))
  const RAYON = mobile ? 250 : RAYON_DESKTOP
  const { data: cellules, loading, error } = useCellules()
  const [index, setIndex] = useState(0)
  const [hover, setHover] = useState(false)
  const [openModal, setOpenModal] = useState(false)
  const ref = useRef(null)
  const n = cellules?.length || 4

  useEffect(() => {
    let t
    if (!hover && n > 0) { t = setInterval(() => setIndex((i) => (i + 1) % n), DUREE_TOUR) }
    else { if (t) clearInterval(t) }
    return () => { if (t) clearInterval(t) }
  }, [hover, n])

  const actuelle = cellules?.[index]

  if (loading) return <SqueletteCellules />
  if (error) return <ErreurChargement message={error} />
  if (!cellules || cellules.length === 0) return <Box sx={{ py: 8, textAlign: 'center' }}><Typography color="textSecondary">Aucune cellule</Typography></Box>

  return (
    <Box ref={ref} id="cellules" sx={{ py: { xs: 6, md: 8 }, position: 'relative', overflow: 'hidden' }}>
      <FondPropre variante="doux" />
      <BandeauAccent couleur="#1FAF72" />
      <FondHalos couleurs={['rgba(31,175,114,.16)', 'rgba(37,99,235,.13)', 'rgba(123,97,255,.10)']} />

      <Container maxWidth={false} sx={{ position: 'relative', maxWidth: '1440px !important', px: { xs: 2.5, md: 4 } }}>
        <TitreSection
          badge="Communautés"
          titre="Nos cellules"
          sousTitre="Quatre équipes, quatre passions. L'anneau tourne — clique sur une carte ou une pastille pour te placer face à une cellule."
          couleur="#1FAF72"
        />

        {/* ── Anneau 3D + panneau détail ─────────────────────────── */}
        <Box sx={{
          display: { xs: 'flex', md: 'grid' }, flexDirection: 'column', gap: 4,
          gridTemplateColumns: { md: 'minmax(0,1.15fr) minmax(0,1fr)' },
          alignItems: 'center', mt: 2,
        }}>
          {/* ── Scène 3D ─────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
          >
            <Box sx={{
              position: 'relative', height: { xs: 320, md: 420 },
              perspective: 1600, display: 'grid', placeItems: 'center',
            }}>
              {/* Ombre au sol de l'anneau */}
              <Box sx={{
                position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)',
                width: '72%', height: 26, borderRadius: '50%',
                background: 'radial-gradient(ellipse, rgba(13,27,42,.22), transparent 70%)', filter: 'blur(6px)',
              }} />
              {/* Plateau rotatif : rotationY = -index * (360/n) deg */}
              <motion.div
                animate={{ rotateY: -index * (360 / n) }}
                transition={{ type: 'spring', stiffness: 90, damping: 17, mass: 0.9 }}
                style={{
                  position: 'relative', width: 250, height: 320,
                  transformStyle: 'preserve-3d',
                }}
              >
                {cellules.map((c, i) => {
                  // Position sur l'anneau : chaque carte face à l'observateur quand rotateY total la ramène à 0
                  const angle = i * (360 / n)
                  const delta = i - index
                  const dMod = delta > n / 2 ? delta - n : delta < -n / 2 ? delta + n : delta
                  const abs = Math.abs(dMod)
                  return (
                    <motion.div
                      key={c.id}
                      onClick={() => i === index ? setOpenModal(true) : setIndex(i)}
                      animate={{
                        transform: `rotateY(${angle}deg) translateZ(${RAYON}px)`,
                        opacity: abs === 0 ? 1 : abs === 1 ? 0.5 : 0.22,
                        filter: abs === 0 ? 'blur(0px)' : `blur(${Math.min(abs, 2) * 1.4}px)`,
                      }}
                      transition={{ type: 'spring', stiffness: 90, damping: 17, mass: 0.9 }}
                      style={{
                        position: 'absolute', inset: 0,
                        transformStyle: 'preserve-3d', cursor: 'pointer',
                        pointerEvents: abs > 2 ? 'none' : 'auto',
                      }}
                    >
                      <CarteCellule card={c} active={abs === 0} />
                    </motion.div>
                  )
                })}
              </motion.div>
            </Box>
          </motion.div>

          {/* ── Panneau détail de la cellule active ──────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.32, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <AnimatePresence mode="wait">
              {actuelle && (
                <motion.div
                  key={actuelle.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Box sx={{
                    borderRadius: '22px', p: { xs: 2.5, md: 4 }, bgcolor: '#fff', overflowX: 'hidden',
                    border: `1px solid ${actuelle.couleur}45`,
                    boxShadow: `0 18px 44px ${actuelle.couleur}2E`,
                    position: 'relative', overflow: 'hidden',
                  }}>
                    {/* Liseré coloré à gauche */}
                    <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, background: `linear-gradient(180deg,${actuelle.couleur},${actuelle.couleur}55)` }} />
                    {/* Grande pastille icône (line art) */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 2 }}>
                      <Box sx={{
                        width: 62, height: 62, borderRadius: '18px',
                        background: `linear-gradient(135deg,${actuelle.couleur},${actuelle.couleur}CC 55%,#0D1B2A)`,
                        display: 'grid', placeItems: 'center',
                        boxShadow: `0 10px 24px ${actuelle.couleur}55`,
                      }}>
                        <IconeCellule cellule={actuelle} taille={32} couleur="#fff" />
                      </Box>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <IcMembres taille={13} couleur={actuelle.couleur} />
                          <Typography sx={{ color: actuelle.couleur, fontWeight: 800, fontSize: '0.7rem', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
                            {actuelle.membres} membres actifs
                          </Typography>
                        </Box>
                        <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: { xs: '1.25rem', md: '1.5rem' }, color: '#111827' }}>
                          {actuelle.nom}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography color="textSecondary" sx={{ lineHeight: 1.8, mb: 2.5 }}>
                      {actuelle.description}
                    </Typography>
                    {/* Programme en puces fléchées */}
                    <Box sx={{ display: 'grid', gap: 1.2, mb: 3 }}>
                      {(actuelle.programme ?? '').split('\n').filter((l) => l.trim()).slice(0, 5).map((ligne, j) => (
                        <motion.div
                          key={j}
                          initial={{ opacity: 0, x: 14 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.12 + j * 0.06, duration: 0.3 }}
                          sx={{ display: 'flex', gap: 1.2, alignItems: 'flex-start' }}
                        >
                          <Box sx={{ color: actuelle.couleur, fontWeight: 800, mt: '1px' }}>→</Box>
                          <Typography variant="body2" sx={{ color: '#374151', lineHeight: 1.65 }}>
                            {ligne.replace(/^[•\-\s]+/, '')}
                          </Typography>
                        </motion.div>
                      ))}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                      <Button
                        variant="contained"
                        href="#adhesion"
                        sx={{ bgcolor: actuelle.couleur, '&:hover': { filter: 'brightness(.9)' }, fontWeight: 800, borderRadius: '9999px', px: 3 }}
                      >
                        Rejoindre cette cellule
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => setOpenModal(true)}
                        sx={{ borderColor: actuelle.couleur, color: actuelle.couleur, fontWeight: 700, borderRadius: '9999px', px: 3 }}
                      >
                        Détails
                      </Button>
                    </Box>
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </Box>

        {/* ── Contrôles : flèches + pastilles ────────────────────── */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, mt: 4 }}>
          <IconButton onClick={() => setIndex((index - 1 + n) % n)}
            sx={{ bgcolor: '#fff', border: '1px solid #E5E7EB', boxShadow: '0 4px 14px rgba(0,0,0,.08)', transition: 'all 180ms ease', '&:hover': { bgcolor: '#1FAF72', borderColor: '#1FAF72', color: '#fff', boxShadow: '0 6px 18px rgba(31,175,114,.4)', transform: 'scale(1.06)' }, '&:active': { transform: 'scale(0.96)' } }}>
            <ArrowBackIosNewIcon fontSize="small" />
          </IconButton>
          <Box sx={{ display: 'flex', gap: 1.6 }}>
            {cellules.map((c, i) => (
              <motion.div
                key={i}
                onClick={() => setIndex(i)}
                whileHover={{ scale: 1.3 }}
                style={{ cursor: 'pointer' }}
              >
                <Box sx={{
                  width: 12, height: 12, borderRadius: '50%',
                  bgcolor: i === index ? c.couleur : '#D1D5DB',
                  boxShadow: i === index ? `0 0 10px ${c.couleur}88` : 'none',
                  transform: i === index ? 'scale(1.3)' : 'scale(1)',
                  transition: 'all 300ms cubic-bezier(0.22,1,0.36,1)',
                }} />
              </motion.div>
            ))}
          </Box>
          <IconButton onClick={() => setIndex((index + 1) % n)}
            sx={{ bgcolor: '#fff', border: '1px solid #E5E7EB', boxShadow: '0 4px 14px rgba(0,0,0,.08)', transition: 'all 180ms ease', '&:hover': { bgcolor: '#1FAF72', borderColor: '#1FAF72', color: '#fff', boxShadow: '0 6px 18px rgba(31,175,114,.4)', transform: 'scale(1.06)' }, '&:active': { transform: 'scale(0.96)' } }}>
            <ArrowForwardIosIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* KPIs dynamiques — suivent la cellule de face de l'anneau */}
        <Box sx={{ mt: 7, display: 'flex', gap: { xs: 2, md: 4 }, justifyContent: 'center', flexWrap: 'wrap' }}>
          <AnimatePresence mode="wait">
            <motion.div key={index} style={{ display: 'flex', gap: { xs: 2, md: 4 }, flexWrap: 'wrap', justifyContent: 'center' }}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}>
              <StatRapide label="Membres de la cellule" valeur={actuelle?.membres ?? '—'} icone={<IcMembres taille={22} couleur={actuelle?.couleur ?? "#1FAF72"} />} couleur={actuelle?.couleur ?? '#1FAF72'} />
              <StatRapide label="Position sur l'anneau" valeur={`${(index % n) + 1} / ${n}`} icone={<IcRocket taille={22} couleur={actuelle?.couleur ?? "#2563EB"} />} couleur={actuelle?.couleur ?? '#2563EB'} />
              <StatRapide label="Membres du club" valeur={cellules.reduce((s, c) => s + (c.membres || 0), 0)} icone={<IcCalendrier taille={22} couleur={actuelle?.couleur ?? "#F5A623"} />} couleur={actuelle?.couleur ?? '#F5A623'} />
            </motion.div>
          </AnimatePresence>
        </Box>

        <AnimatePresence>
          {openModal && actuelle && <ModaleCellule cellule={actuelle} onClose={() => setOpenModal(false)} />}
        </AnimatePresence>
      </Container>
    </Box>
  )
}

/* ── Carte d'une cellule sur l'anneau (compacte, visuelle) ──── */
function CarteCellule({ card, active }) {
  return (
    <Box sx={{
      height: '100%', borderRadius: '20px', overflow: 'hidden', bgcolor: '#fff',
      border: active ? `2.5px solid ${card.couleur}` : '1px solid #E5E7EB',
      boxShadow: active ? `0 24px 54px ${card.couleur}44` : '0 10px 26px rgba(0,0,0,.1)',
      display: 'flex', flexDirection: 'column',
      transition: 'border 300ms ease, box-shadow 300ms ease',
    }}>
      {/* Visuel dégradé + icône line art */}
      <Box sx={{
        height: '58%', position: 'relative',
        background: `linear-gradient(135deg, ${card.couleur} 0%, ${card.couleur}CC 55%, #0D1B2A 100%)`,
        display: 'grid', placeItems: 'center',
      }}>
        <IconeCellule cellule={card} taille={54} couleur="rgba(255,255,255,.95)" />
        <Box sx={{
          position: 'absolute', top: 10, left: 10, bgcolor: 'rgba(13,27,42,.6)',
          color: '#fff', px: 1.2, py: 0.35, borderRadius: 9999,
          fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.1em',
        }}>
          {card.membres} MEMBRES
        </Box>
        {active && (
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ position: 'absolute', bottom: 10, right: 10, width: 10, height: 10, borderRadius: '50%', background: '#fff' }}
          />
        )}
      </Box>
      {/* Nom */}
      <Box sx={{ p: 2, textAlign: 'center', flex: 1, display: 'grid', placeItems: 'center' }}>
        <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: '1rem', color: '#111827', lineHeight: 1.3 }}>
          {card.nom}
        </Typography>
      </Box>
    </Box>
  )
}

/* ── Modale programme complet ───────────────────────────────── */
function ModaleCellule({ cellule, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1300, background: 'rgba(17,24,39,.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        style={{ width: 'min(580px, 96vw)', maxHeight: '85vh', overflow: 'auto' }}
      >
        <Box sx={{ bgcolor: '#fff', borderRadius: 4, overflow: 'hidden', boxShadow: '0 48px 96px rgba(0,0,0,.24)' }}>
          <Box sx={{ bgcolor: cellule.couleur, color: '#fff', p: { xs: 3, md: 4 }, position: 'relative', overflow: 'hidden' }}>
            <Box sx={{ position: 'absolute', top: -50, right: -40, width: 150, height: 150, borderRadius: '50%', bgcolor: 'rgba(255,255,255,.14)' }} />
            <Typography variant="overline" sx={{ letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.9 }}>
              Programme de la cellule
            </Typography>
            <Typography variant="h5" sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 700, fontSize: { xs: '1.3rem', md: '1.6rem' } }}>
              {cellule.icone} {cellule.nom}
            </Typography>
          </Box>
          <Box sx={{ p: { xs: 3, md: 4 } }}>
            <Typography color="textSecondary" sx={{ lineHeight: 1.8, mb: 2.5 }}>
              {cellule.description}
            </Typography>
            <Box sx={{ p: 3, bgcolor: '#F6FBF9', borderRadius: 3, border: '1px solid #E3EEE8' }}>
              <Typography sx={{ fontWeight: 800, color: '#0F5B3A', mb: 1.5, fontSize: '0.9rem' }}>
                🎓 Ce que tu y apprendras
              </Typography>
              {(cellule.programme ?? '').split('\n').filter((l) => l.trim()).map((ligne, j) => (
                <Typography key={j} variant="body2" sx={{ color: '#374151', lineHeight: 1.8, display: 'flex', gap: 1 }}>
                  <Box component="span" sx={{ color: cellule.couleur, fontWeight: 800 }}>→</Box>
                  {ligne.replace(/^[•\-\s]+/, '')}
                </Typography>
              ))}
            </Box>
            <Button
              fullWidth variant="contained" href="#adhesion" onClick={onClose}
              sx={{ mt: 3, bgcolor: cellule.couleur, '&:hover': { filter: 'brightness(.9)' }, fontWeight: 800, py: 1.4, borderRadius: '12px' }}
            >
              Rejoindre {cellule.nom} →
            </Button>
          </Box>
        </Box>
      </motion.div>
    </motion.div>
  )
}

/* ── Stat rapide (pastille carrée teintée) ──────────────────── */

function StatRapide({ label, valeur, icone, couleur }) {
  return (
    <Box sx={{ textAlign: 'center', p: { xs: 2, md: 3 }, minWidth: 130, bgcolor: '#fff', borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,.04)' }}>
      <Box sx={{ width: 46, height: 46, borderRadius: '12px', mx: 'auto', mb: 1, bgcolor: `${couleur}14`, display: 'grid', placeItems: 'center', fontSize: 22 }}>
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

/* ── Squelettes & erreurs ───────────────────────────────────── */
function SqueletteCellules() {
  return (
    <Box sx={{ py: 8 }}>
      <Container>
        <Typography component="h2" sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 700, fontSize: { xs: '1.75rem', md: '2.5rem' }, color: '#111827', mb: 4 }}>
          Nos cellules
        </Typography>
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1.15fr 1fr' } }}>
          <Box sx={{ height: 420, bgcolor: '#F5F5F5', borderRadius: 4 }} />
          <Box sx={{ height: 420, bgcolor: '#F5F5F5', borderRadius: 4 }} />
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
