import { motion } from 'framer-motion'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import FondPropre from '../ui-components/FondPropre'
import { BandeauAccent } from '../ui-components/FondPropre'
import TitreSection from '../ui-components/TitreSection'
import { useContenu } from '../../lib/contenu'
import { CELLULES_TAGGABLES } from '../../lib/contenu'

/**
 * Actualités — fil d'annonces dynamique depuis le magasin de contenu
 * (back-office « Actualités & contenu »). Image d'illustration optionnelle,
 * tag cellule affiché, dates en clair.
 */
export default function Actualites() {
  const actualites = useContenu('actualites')

  return (
    <Box id="actualites" sx={{ py: { xs: 6, md: 8 }, position: 'relative', overflow: 'hidden' }}>
      <FondPropre variante="doux" />
      <BandeauAccent couleur="#1FAF72" />

      <Container maxWidth={false} sx={{ position: 'relative', maxWidth: '1440px !important', px: { xs: 2.5, md: 4 } }}>
        <TitreSection
          badge="Communication"
          titre="Actualités"
          sousTitre="Les annonces officielles du Bureau — centralisées, archivées, accessibles."
          couleur="#1FAF72"
        />

        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, alignItems: 'stretch' }}>
          {actualites.map((n, i) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.35, delay: Math.min(i * 0.05, 0.3), ease: [0.22, 1, 0.36, 1] }}
              style={{ height: '100%' }}
            >
              <Box sx={{
                height: '100%', display: 'flex', flexDirection: 'column',
                bgcolor: '#fff', borderRadius: '18px', overflow: 'hidden',
                border: '1px solid #E8ECEA', boxShadow: '0 4px 16px rgba(13,27,42,.05)',
                transition: 'box-shadow 220ms ease, transform 220ms ease',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 30px rgba(13,27,42,.1)', borderColor: '#BFD8CC' },
              }}>
                {/* Image d'illustration si présente */}
                {n.image ? (
                  <Box component="img" src={n.image} alt="" sx={{ width: '100%', height: 190, objectFit: 'cover' }} />
                ) : (
                  <Box sx={{
                    height: 90, background: `linear-gradient(135deg,${n.couleur},${n.couleur}88 60%,#0D1B2A)`,
                    position: 'relative', display: 'flex', alignItems: 'flex-end', p: 2,
                  }}>
                    <Chip label={n.tag} size="small" sx={{ bgcolor: 'rgba(255,255,255,.92)', color: n.couleur, fontWeight: 800, fontSize: '0.66rem' }} />
                  </Box>
                )}

                <Box sx={{ p: 2.8, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1.2 }}>
                    {n.image && <Chip label={n.tag} size="small" sx={{ bgcolor: `${n.couleur}14`, color: n.couleur, fontWeight: 800, fontSize: '0.66rem', height: 22 }} />}
                    <Chip
                      label={CELLULES_TAGGABLES.find((c) => c.id === n.cellule)?.label ?? 'Général'}
                      size="small"
                      sx={{ bgcolor: '#F0F5F2', color: '#374151', fontWeight: 700, fontSize: '0.64rem', height: 22 }}
                    />
                    <Typography variant="caption" sx={{ color: '#4B5563', fontWeight: 600, ml: 'auto' }}>
                      {new Date(n.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </Typography>
                  </Box>

                  <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 700, fontSize: '1.08rem', color: '#111827', lineHeight: 1.4, mb: 1 }}>
                    {n.titre}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#5A6B63', lineHeight: 1.75, flex: 1 }}>
                    {n.extrait}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, pt: 1.6, borderTop: '1px solid #EEF2F0' }}>
                    <Box sx={{
                      width: 26, height: 26, borderRadius: '50%', bgcolor: `${n.couleur}22`,
                      color: n.couleur, fontWeight: 800, fontSize: '0.7rem',
                      display: 'grid', placeItems: 'center',
                    }}>
                      {(n.auteur || 'B')[0]}
                    </Box>
                    <Typography variant="caption" sx={{ color: '#374151', fontWeight: 700 }}>
                      {n.auteur || 'Le Bureau'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </motion.div>
          ))}
        </Box>
      </Container>
    </Box>
  )
}
