import { useMemo, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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

  // Lightbox : Escape ferme, flèches naviguent (convention universelle)
  useEffect(() => {
    if (!lightbox) return
    const h = (e) => {
      if (e.key === 'Escape') setLightbox(null)
      else if (e.key === 'ArrowRight') naviguer(1)
      else if (e.key === 'ArrowLeft') naviguer(-1)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [lightbox, liste])

  const IconeDe = (m) => {
    const Comp = ICONES[m.iconeId] ?? IcPhoto
    return <Comp taille={m.taille || 46} couleur={m.couleurIcone || 'rgba(255,255,255,.95)'} />
  }

  return (
    <Box sx={{ py: { xs: 6, md: 8 }, position: 'relative', minHeight: '80vh' }}>
      <FondPropre variante="blanc" />
      <BandeauAccent couleur="#1FAF72" />
      <FondHalos couleurs={['rgba(31,175,114,.11)', 'rgba(37,99,235,.09)', 'rgba(245,166,35,.08)']} trame={false} />

      <Container maxWidth={false} sx={{ position: 'relative', maxWidth: '1440px !important', px: { xs: 2.5, md: 4 } }}>
        <TitreSection
          badge="Médias"
          titre="La galerie du club"
          sousTitre="Le club en images, alimenté par la Communication — ateliers, compétitions, sorties. Clique sur un média pour l'ouvrir en grand."
          couleur="#1FAF72"
        />

        {/* Filtres — barre flottante */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.35 }}>
          <Box sx={{
            display: 'flex', flexWrap: 'wrap', gap: 1.4, justifyContent: 'center',
            mx: 'auto', mb: 2, width: 'fit-content', maxWidth: '100%',
            bgcolor: '#fff', border: '1px solid #E8ECEA', borderRadius: 9999,
            px: 2, py: 1.2, boxShadow: '0 4px 16px rgba(13,27,42,.06)',
          }}>
            {EVENEMENTS.map((e) => (
              <Chip
                key={e.id} label={e.label} onClick={() => setFiltre(e.id)}
                sx={{
                  fontWeight: 800, cursor: 'pointer', height: 34,
                  bgcolor: filtre === e.id ? '#0F5B3A' : 'transparent',
                  color: filtre === e.id ? '#fff' : '#374151',
                  '&:hover': { bgcolor: filtre === e.id ? '#0c4a2f' : '#F0F5F2' },
                }}
              />
            ))}
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.2, justifyContent: 'center', mb: 5 }}>
            {[{ id: 'tous', label: 'Tout type' }, { id: 'photo', label: 'Photos' }, { id: 'video', label: 'Vidéos' }].map((t) => (
              <Chip
                key={t.id} label={t.label} onClick={() => setFiltreType(t.id)} size="small"
                sx={{
                  fontWeight: 700, cursor: 'pointer',
                  bgcolor: filtreType === t.id ? '#1FAF72' : '#F0F5F2',
                  color: filtreType === t.id ? '#fff' : '#5A6B63',
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
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -5 }}
                onClick={() => setLightbox(m)}
                style={{ cursor: 'pointer' }}
              >
                <Box sx={{
                  borderRadius: '18px', overflow: 'hidden', border: '1px solid #E8ECEA',
                  boxShadow: '0 4px 14px rgba(13,27,42,.06)', background: '#fff',
                  transition: 'box-shadow 220ms ease, border-color 220ms ease',
                  '&:hover': { borderColor: '#C9D4CF', boxShadow: '0 10px 26px rgba(13,27,42,.1)' },
                }}>
                  {m.image ? (
                    <Box component="img" src={m.image} alt={m.titre} loading="lazy" decoding="async" sx={{ width: '100%', minHeight: 180, objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <Box sx={{
                      height: m.type === 'video' ? 210 : 170 + (parseInt(m.id?.slice(-1), 10) || m.id % 3) * 34,
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
                      <Box sx={{ bgcolor: 'rgba(13,27,42,.72)', color: '#fff', px: 1.1, py: 0.3, borderRadius: 9999, fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.08em' }}>
                        {m.type === 'video' ? 'VIDÉO' : 'PHOTO'}
                      </Box>
                      <Box sx={{ bgcolor: 'rgba(13,27,42,.72)', color: '#fff', px: 1.1, py: 0.3, borderRadius: 9999, fontSize: '0.6rem', fontWeight: 800 }}>
                        {dateCourte(m.date)}
                      </Box>
                    </Box>
                    <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: { xs: '0.8rem', md: '0.92rem' }, lineHeight: 1.35, mt: 1.2 }}>{m.titre}</Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ display: { xs: 'none', sm: 'block' }, mt: 0.4, lineHeight: 1.5 }}>{m.legende}</Typography>
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
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 1300, background: 'rgba(13,27,42,.92)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ type: 'spring', stiffness: 240, damping: 24 }}
              style={{ width: 'min(960px, 96vw)', maxHeight: '92vh', overflowY: 'auto' }}
            >
              <Box sx={{ bgcolor: '#0D1B2A', borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(154,251,215,.25)' }}>
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
                  <IconButton onClick={() => setLightbox(null)} sx={{ position: 'absolute', top: 10, right: 10, color: '#fff', bgcolor: 'rgba(13,27,42,.6)', '&:hover': { bgcolor: 'rgba(13,27,42,.85)' } }}>
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
                    <IconButton onClick={() => naviguer(-1)} sx={{ color: '#fff', border: '1px solid rgba(255,255,255,.3)' }}><ArrowBackIosNewIcon fontSize="small" /></IconButton>
                    <IconButton onClick={() => naviguer(1)} sx={{ color: '#fff', border: '1px solid rgba(255,255,255,.3)' }}><ArrowForwardIosIcon fontSize="small" /></IconButton>
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
