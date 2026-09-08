import { motion } from 'framer-motion'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useReducedMotion } from 'framer-motion'

/**
 * TitreSection — en-tête éditorial aligné à gauche :
 * numéro discret (index visuel) + label + titre + sous-titre.
 * Casse le rythme « tout centré » des pages générées : chaque section
 * s'ouvre comme un dossier de presse, pas comme un slide marketing.
 */
const NUMEROS = ['01', '02', '03', '04', '05', '06', '07', '08', '09']
let compteur = 0

export default function TitreSection({ badge, titre, sousTitre, couleur = '#1FAF72', maxWidthTexte = 640 }) {
  const reduit = useReducedMotion()
  const numero = NUMEROS[compteur++ % NUMEROS.length]
  return (
    <motion.div
      initial={reduit ? { opacity: 1 } : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: reduit ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      <Box sx={{ mb: 5, display: 'flex', gap: { xs: 2, md: 3 }, alignItems: 'flex-start' }}>
        {/* Numéro de dossier — repère de lecture, pas une déco */}
        <Typography
          aria-hidden
          sx={{
            fontFamily: "'JetBrains Mono',monospace", fontWeight: 700,
            fontSize: { xs: '0.812rem', md: '0.94rem' }, color: couleur,
            border: `1px solid ${couleur}40`, borderRadius: '10px',
            px: 1, py: 0.5, mt: 0.5, lineHeight: 1.4,
          }}
        >
          {numero}
        </Typography>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {badge && (
            <Typography sx={{
              color: couleur, fontWeight: 800,
              fontSize: '0.812rem', letterSpacing: '0.08em', textTransform: 'uppercase', mb: 0.5,
            }}>
              {badge}
            </Typography>
          )}
          <Typography
            component="h2"
            sx={{
              fontFamily: "'Orbitron', sans-serif", fontWeight: 700,
              fontSize: { xs: '1.55rem', md: '2.2rem' }, lineHeight: 1.2,
              color: 'text.primary', mb: sousTitre ? 1.5 : 0,
            }}
          >
            {titre}
          </Typography>
          {sousTitre && (
            <Typography sx={{ color: 'text.secondary', maxWidth: maxWidthTexte, lineHeight: 1.75, fontSize: { xs: '0.94rem', md: '1.02rem' } }}>
              {sousTitre}
            </Typography>
          )}
        </Box>
      </Box>
    </motion.div>
  )
}
