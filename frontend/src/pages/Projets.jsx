import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import TitreSection from '../components/ui-components/TitreSection'
import BoutonRetour from '../components/ui-components/BoutonRetour'
import FondPropre, { BandeauAccent } from '../components/ui-components/FondPropre'
import { IcRocket } from '../components/ui-components/IconesClub'
import { useProjets } from '../hooks/useApi'
import { urlMedia } from '../lib/api'

const STATUTS = {
  idee: { label: 'Idée en germe', couleur: '#F5A623', fond: 'rgba(245,166,35,.14)' },
  en_cours: { label: 'En cours', couleur: '#1FAF72', fond: 'rgba(31,175,114,.14)' },
  termine: { label: 'Livré', couleur: '#2563EB', fond: 'rgba(37,99,235,.14)' },
}

function CarteProjet({ p, index, reduit }) {
  const st = STATUTS[p.statut] ?? STATUTS.idee
  return (
    <motion.article
      initial={reduit ? { opacity: 1 } : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1], delay: Math.min(index * 0.05, 0.2) }}
      sx={{
        borderRadius: '18px', overflow: 'hidden', position: 'relative',
        bgcolor: (theme) => theme.palette.background.paper,
        border: '1px solid', borderColor: 'divider',
        boxShadow: '0 10px 30px rgba(13,27,42,.08)',
      }}
    >
      {p.image && (
        <Box
          component="img"
          src={urlMedia(p.image)}
          alt={p.nom}
          loading="lazy"
          sx={{ width: '100%', height: 170, objectFit: 'cover', display: 'block' }}
        />
      )}
      <Box sx={{ p: { xs: 2.2, md: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1.2 }}>
          <Chip
            label={st.label}
            size="small"
            sx={{ bgcolor: st.fond, color: st.couleur, fontWeight: 800, fontSize: '0.75rem', height: 26 }}
          />
          {p.cellule && (
            <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 700 }}>
              {p.cellule.nom}
            </Typography>
          )}
        </Box>

        <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: 'text.primary', lineHeight: 1.3, mb: 1 }}>
          {p.nom}
        </Typography>

        {p.description && (
          <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem', lineHeight: 1.7, mb: 2 }}>
            {p.description.length > 220 ? `${p.description.slice(0, 220)}…` : p.description}
          </Typography>
        )}

        {/* Barre d'avancement : Idée → En cours → Livré */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 2 }}>
          {['idee', 'en_cours', 'termine'].map((s, i) => {
            const atteint = ['idee', 'en_cours', 'termine'].indexOf(p.statut) >= i
            return (
              <Box key={s} sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 0.8, [i < 2 ? 'flex' : '']: '' }}>
                <Box sx={{
                  height: 6, flex: 1, borderRadius: 3,
                  bgcolor: atteint ? '#1FAF72' : (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,.12)' : '#E5E9E7',
                }} />
              </Box>
            )
          })}
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: st.couleur, minWidth: 64, textAlign: 'right' }}>
            {st.label}
          </Typography>
        </Box>

        {(p.lien || p.video_url) && (
          <Button
            size="small"
            component="a"
            href={p.lien || p.video_url}
            target="_blank"
            rel="noopener noreferrer"
            startIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
            sx={{ color: '#1FAF72', fontWeight: 800, fontSize: '0.812rem', minHeight: 44, borderRadius: '10px' }}
          >
            Voir le projet
          </Button>
        )}
      </Box>
    </motion.article>
  )
}

/**
 * Page publique /projets — tout le monde voit les projets du club,
 * leur statut (Idée → En cours → Livré) et leur explication.
 */
export default function PageProjets() {
  const theme = useTheme()
  const sombre = theme.palette.mode === 'dark'
  const reduit = useReducedMotion()
  const { data } = useProjets()
  const projets = data?.results ?? data ?? []
  const enCours = projets.filter((p) => p.statut === 'en_cours').length
  const livres = projets.filter((p) => p.statut === 'termine').length

  return (
    <Box sx={{ position: 'relative', minHeight: '80vh', pb: { xs: 8, md: 10 } }}>
      <FondPropre variante={sombre ? 'doux' : 'clair'} />
      <BandeauAccent couleur="#1FAF72" />
      <Container maxWidth="md" sx={{ position: 'relative', px: { xs: 2.5, md: 4 }, pt: { xs: 11, md: 13 } }}>
        <Box sx={{ mb: 3 }}>
          <BoutonRetour variante={sombre ? 'sombre' : 'clair'} />
        </Box>

        <TitreSection
          badge="Projets du club"
          titre="Ce qu'on construit"
          sousTitre="Les projets techniques des cellules, du premier croquis à la démo. Suivi ouvert à tout le monde — parce que la transparence fait partie de l'entraide."
          couleur="#1FAF72"
        />

        {/* Compteurs */}
        <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IcRocket taille={18} couleur="#1FAF72" />
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 800, color: 'text.primary' }}>
              {enCours} en cours · {livres} livrés
            </Typography>
          </Box>
        </Box>

        {projets.length === 0 ? (
          <Typography sx={{ color: 'text.secondary', fontSize: '0.937rem', lineHeight: 1.8 }}>
            Les premiers projets arrivent — le Bureau les publie ici dès qu'ils démarrent.
          </Typography>
        ) : (
          <Box sx={{ display: 'grid', gap: 3 }}>
            {projets.map((p, i) => (
              <CarteProjet key={p.slug ?? p.id ?? i} p={p} index={i} reduit={reduit} />
            ))}
          </Box>
        )}
      </Container>
    </Box>
  )
}
