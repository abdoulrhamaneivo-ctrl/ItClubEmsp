import { useMemo, useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import CloseIcon from '@mui/icons-material/Close'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import FondPropre from '../components/ui-components/FondPropre'
import { BandeauAccent } from '../components/ui-components/FondPropre'
import FondHalos from '../components/ui-components/FondHalos'
import BoutonRetour from '../components/ui-components/BoutonRetour'
import TitreSection from '../components/ui-components/TitreSection'
import { IcTrophee, IcFormation, IcLieu, IcRocket, IcCube, IcMembres, IcPhoto, IcVideo } from '../components/ui-components/IconesClub'
import { useContenu } from '../lib/contenu'

/**
 * Page Galerie — dynamique (magasin de contenu), masonry aérée,
 * filtres événement + cellule, lightbox, images réelles ou icônes line art.
 */

const ICONES = { trophee: IcTrophee, formation: IcFormation, lieu: IcLieu, rocket: IcRocket, cube: IcCube, membres: IcMembres, photo: IcPhoto, video: IcVideo }
const EVENEMENTS = [{ id: 'tous', label: 'Tout' }, { id: 'vibeathon', label: 'Vibeathon CI' }, { id: 'atelier', label: 'Ateliers' }, { id: 'sortie', label: 'Sorties' }, { id: 'hackathon', label: 'Hackathons' }]

function dateCourte(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Galerie() {
  const medias = useContenu('medias')
  const reduit = useReducedMotion()
  const dialogueRef = useRef(null)
  const fermerRef = useRef(null)
  const [filtre, setFiltre] = useState('tous')
  const [filtreType, setFiltreType] = useState('tous')
  const [lightbox, setLightbox] = useState(null)

  const liste = useMemo(
    () => medias
      .filter((m) => filtre === 'tous' || m.evenement === filtre)
      .filter((m) => filtreType === 'tous' || m.type === filtreType),
    [medias, filtre, filtreType],
  )

  const naviguer = (dir) => {
    setLightbox((cur) => {
      const idx = liste.findIndex((x) => x.id === cur.id)
      if (idx === -1) return cur
      return liste[(idx + dir + liste.length) % liste.length]
    })
  }

  // Lightbox : Escape ferme, flèches naviguent, focus piégé, scroll fond verrouillé
  useEffect(() => {
    if (!lightbox) return
    const precedent = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    fermerRef.current?.focus()
    const h = (e) => {
      if (e.key === 'Escape') setLightbox(null)
      else if (e.key === 'ArrowRight') naviguer(1)
      else if (e.key === 'ArrowLeft') naviguer(-1)
      else if (e.key === 'Tab') {
        const cibles = dialogueRef.current?.querySelectorAll('button')
        if (!cibles || cibles.length === 0) return
        const premiere = cibles[0]
        const derniere = cibles[cibles.length - 1]
        if (e.shiftKey && document.activeElement === premiere) { e.preventDefault(); derniere.focus() }
        else if (!e.shiftKey && document.activeElement === derniere) { e.preventDefault(); premiere.focus() }
      }
    }
    window.addEventListener('keydown', h)
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow = precedent }
  }, [lightbox, liste])

  const IconeDe = (m) => {
    const Comp = ICONES[m.iconeId] ?? IcPhoto
    return <Comp taille={m.taille || 46} couleur={m.couleurIcone || 'rgba(255,255,255,.95)'} />
  }

  return (
    <Box sx={{ pt: { xs: 11, md: 13 }, pb: { xs: 6, md: 8 }, position: 'relative', minHeight: '80vh' }}>
      <FondPropre variante="blanc" />
      <BandeauAccent couleur="#1FAF72" />
      <FondHalos couleurs={['rgba(31,175,114,.11)', 'rgba(37,99,235,.09)', 'rgba(245,166,35,.08)']} trame={false} />

      <Container maxWidth={false} sx={{ position: 'relative', maxWidth: '1440px !important', px: { xs: 2.5, md: 4 } }}>
        <Box sx={{ mb: 2 }}>
          <BoutonRetour variante="sombre" />
        </Box>
        <TitreSection
          badge="Médias"
          titre="La galerie du club"
          sousTitre="Le club en images, alimenté par la Communication — ateliers, compétitions, sorties. Clique sur un média pour l'ouvrir en grand."
          couleur="#1FAF72"
        />

        {/* Filtres — barre flottante */}
        <motion.div initial={reduit ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduit ? 0 : 0.25, delay: reduit ? 0 : 0.08 }}>
          <Box sx={{
            display: 'flex', flexWrap: 'wrap', gap: 1.4, justifyContent: 'center',
            mx: 'auto', mb: 2, width: 'fit-content', maxWidth: '100%',
            bgcolor: (theme) => theme.palette.background.paper, border: '1px solid', borderColor: 'divider', borderRadius: 9999,
            px: 2, py: 1.2, boxShadow: '0 4px 16px rgba(13,27,42,.06)',
          }}>
            {EVENEMENTS.map((e) => (
              <Chip
                key={e.id} label={e.label} onClick={() => setFiltre(e.id)}
                sx={{
                  fontWeight: 800, fontSize: '0.875rem', cursor: 'pointer', height: 44,
                  bgcolor: filtre === e.id ? '#0F5B3A' : 'transparent',
                  color: filtre === e.id ? '#fff' : 'text.secondary',
                  '&:hover': { bgcolor: filtre === e.id ? '#0c4a2f' : (theme) => (theme.palette.mode === 'dark' ? theme.palette.background.default : '#F0F5F2') },
                  '&:focus-visible': { outline: '2px solid #0F5B3A', outlineOffset: '2px' },
                }}
              />
            ))}
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.2, justifyContent: 'center', mb: 5 }}>
            {[{ id: 'tous', label: 'Tout type' }, { id: 'photo', label: 'Photos' }, { id: 'video', label: 'Vidéos' }].map((t) => (
              <Chip
                key={t.id} label={t.label} onClick={() => setFiltreType(t.id)}
                sx={{
                  fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem', height: 44,
                  bgcolor: filtreType === t.id ? '#1FAF72' : (theme) => (theme.palette.mode === 'dark' ? theme.palette.background.default : '#F0F5F2'),
                  color: filtreType === t.id ? (theme) => theme.palette.primary.contrastText : 'text.secondary',
                  '&:focus-visible': { outline: '2px solid #1FAF72', outlineOffset: '2px' },
                }}
              />
            ))}
          </Box>
        </motion.div>

        {/* Grille */}
        <Box sx={{ columns: { xs: 2, sm: 3, md: 3, lg: 4 }, columnGap: { xs: 1.8, md: 3.5 }, '& > *': { breakInside: 'avoid', mb: { xs: 1.8, md: 3.5 } } }}>
          <AnimatePresence mode="popLayout">
            {liste.map((m, i) => (
              <motion.div
                key={m.id}
                layout
                initial={reduit ? false : { opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ delay: reduit ? 0 : Math.min(i * 0.03, 0.3), duration: reduit ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
                whileHover={reduit ? undefined : { y: -5 }}
                style={{ cursor: 'pointer' }}
              >
                <Box
                  component="button"
                  type="button"
                  onClick={() => setLightbox(m)}
                  aria-label={`Ouvrir : ${m.titre}`}
                  sx={{
                  borderRadius: '18px', overflow: 'hidden', border: '1px solid', borderColor: 'divider',
                  boxShadow: '0 4px 14px rgba(13,27,42,.06)', background: (theme) => theme.palette.background.paper,
                  transition: 'box-shadow 220ms ease, border-color 220ms ease',
                  '&:hover': { borderColor: '#C9D4CF', boxShadow: '0 10px 26px rgba(13,27,42,.1)' },
                  '&:focus-visible': { outline: '2px solid #0F5B3A', outlineOffset: '2px' },
                  width: '100%', textAlign: 'left', padding: 0, font: 'inherit',
                }}>
                  {m.image ? (
                    <Box component="img" src={m.image} alt={m.titre} loading="lazy" decoding="async" sx={{ width: '100%', minHeight: 180, objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <Box sx={{
                      height: m.type === 'video' ? 210 : 170 + (parseInt(String(m.id ?? '').slice(-1), 10) || Number(m.id) % 3 || 0) * 34,
                      background: `linear-gradient(135deg, ${m.couleur}, ${m.couleur}88 60%, #0D1B2A)`,
                      display: 'grid', placeItems: 'center', position: 'relative',
                    }}>
                      {IconeDe(m)}
                      {m.type === 'video' && (
                        <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
                          <motion.div whileHover={{ scale: 1.12 }} style={{
                            width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,.94)',
                            display: 'grid', placeItems: 'center',
                          }}>
                            <PlayArrowIcon sx={{ fontSize: 32, color: m.couleur }} />
                          </motion.div>
                        </Box>
                      )}
                    </Box>
                  )}
                  <Box sx={{ p: { xs: 1.4, md: 2 }, position: 'relative' }}>
                    <Box sx={{ position: 'absolute', top: -12, left: 12, display: 'flex', gap: 0.8 }}>
                      <Box sx={{ bgcolor: 'rgba(13,27,42,.72)', color: '#fff', px: 1.1, py: 0.4, borderRadius: 9999, fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em' }}>
                        {m.type === 'video' ? 'VIDÉO' : 'PHOTO'}
                      </Box>
                      <Box sx={{ bgcolor: 'rgba(13,27,42,.72)', color: '#fff', px: 1.1, py: 0.4, borderRadius: 9999, fontSize: '0.72rem', fontWeight: 800 }}>
                        {dateCourte(m.date)}
                      </Box>
                    </Box>
                    <Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: { xs: '0.875rem', md: '0.95rem' }, lineHeight: 1.35, mt: 1.2 }}>{m.titre}</Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ display: { xs: 'block', sm: 'block' }, mt: 0.4, lineHeight: 1.5, fontSize: '0.812rem' }}>{m.legende}</Typography>
                  </Box>
                </Box>
              </motion.div>
            ))}
          </AnimatePresence>
        </Box>

        {liste.length === 0 && (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Typography color="textSecondary">Aucun média pour ce filtre.</Typography>
          </Box>
        )}
      </Container>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            key="lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={lightbox.titre}
            ref={dialogueRef}
            initial={reduit ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 1300, background: 'rgba(13,27,42,.92)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={reduit ? { opacity: 1 } : { opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={reduit ? { duration: 0 } : { type: 'spring', stiffness: 240, damping: 24 }}
              style={{ width: 'min(960px, 96vw)', maxHeight: '92vh', overflowY: 'auto' }}
            >
              <Box sx={{ bgcolor: '#0D1B2A', borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(154,251,215,.16)' }}>
                <Box sx={{ position: 'relative', background: '#000' }}>
                  {lightbox.type === 'video' ? (
                    <Box
                      component="iframe"
                      src={`https://www.youtube.com/embed/${lightbox.youtube}?autoplay=1`}
                      allow="autoplay; encrypted-media; fullscreen"
                      sx={{ width: '100%', aspectRatio: '16/9', border: 'none', display: 'block' }}
                    />
                  ) : lightbox.image ? (
                    <Box component="img" src={lightbox.image} alt={lightbox.titre} sx={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', display: 'block', background: '#000' }} />
                  ) : (
                    <Box sx={{
                      width: '100%', aspectRatio: '16/10', display: 'grid', placeItems: 'center',
                      background: `linear-gradient(135deg, ${lightbox.couleur}, ${lightbox.couleur}77 55%, #0D1B2A)`,
                    }}>
                      {IconeDe({ ...lightbox, taille: 92 })}
                    </Box>
                  )}
                  <IconButton onClick={() => setLightbox(null)} aria-label="Fermer" ref={fermerRef} sx={{ position: 'absolute', top: 10, right: 10, color: '#fff', bgcolor: 'rgba(13,27,42,.6)', width: 44, height: 44, '&:hover': { bgcolor: 'rgba(13,27,42,.85)' } }}>
                    <CloseIcon />
                  </IconButton>
                </Box>
                <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                  <Box>
                    <Typography sx={{ color: '#fff', fontWeight: 800, fontFamily: "'Orbitron',sans-serif" }}>
                      {lightbox.titre}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,.65)' }}>
                      {lightbox.legende} · {dateCourte(lightbox.date)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton onClick={() => naviguer(-1)} aria-label="Média précédent" sx={{ color: '#fff', border: '1px solid rgba(255,255,255,.3)', width: 44, height: 44 }}><ArrowBackIosNewIcon fontSize="small" /></IconButton>
                    <IconButton onClick={() => naviguer(1)} aria-label="Média suivant" sx={{ color: '#fff', border: '1px solid rgba(255,255,255,.3)', width: 44, height: 44 }}><ArrowForwardIosIcon fontSize="small" /></IconButton>
                  </Box>
                </Box>
              </Box>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  )
}
