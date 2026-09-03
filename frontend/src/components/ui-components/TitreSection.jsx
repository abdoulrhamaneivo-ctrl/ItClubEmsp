import { motion } from 'framer-motion'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { LabelLigne } from './Typographie'

/**
 * TitreSection — en-tête de section standardisé (style vitrine) :
 * label avec trait animé + titre centré + sous-titre centré.
 */
export default function TitreSection({ badge, titre, sousTitre, couleur = '#1FAF72', maxWidthTexte = 640 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        {badge && (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <LabelLigne couleur={couleur}>{badge}</LabelLigne>
          </Box>
        )}
        <Typography
          component="h2"
          sx={{
            fontFamily: "'Orbitron', sans-serif", fontWeight: 700,
            fontSize: { xs: '1.75rem', md: '2.6rem' }, lineHeight: 1.2,
            color: '#111827', mb: sousTitre ? 2 : 0,
          }}
        >
          {titre}
        </Typography>
        {sousTitre && (
          <Typography sx={{ color: '#4B5563', maxWidth: maxWidthTexte, lineHeight: 1.8, mx: 'auto', fontSize: { xs: '0.98rem', md: '1.1rem' } }}>
            {sousTitre}
          </Typography>
        )}
      </Box>
    </motion.div>
  )
}
