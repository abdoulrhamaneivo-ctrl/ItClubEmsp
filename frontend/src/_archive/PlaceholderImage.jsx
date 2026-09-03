/**
 * `<PlaceholderImage />` — image élégante quand aucune photo n'est disponible.
 * Un dégradé + motif de circuits animé + titre/emoji, au lieu de la case grise.
 *
 * Props : { couleur, titre?, icone? }
 * Exemple d'utilisation dans les cartes : remplace `<Box component="img">` quand `image` est null.
 */
import { motion } from 'framer-motion'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

export default function PlaceholderImage({ couleur = '#7B61FF', titre, icone }) {
  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(120deg, ${couleur}cc, #0D1B2Acc)`,
        overflow: 'hidden',
      }}
    >
      {/* Trait animé */}
      <svg viewBox="0 0 360 130" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.28 }}>
        <motion.path
          d="M0,90 C80,40 160,110 240,60 S340,90 360,50"
          stroke="#fff"
          strokeWidth="1.3"
          fill="none"
          animate={{ pathLength: [0, 1], opacity: [0.25, 0.6, 0.25] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </svg>

      {/* Icône + titre (optionnel) */}
      {icone || titre ? (
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 1, textAlign: 'center', color: '#fff' }}>
          {icone && <Typography sx={{ fontSize: 44, textShadow: '0 4px 12px rgba(0,0,0,.3)' }}>{icone}</Typography>}
        </Box>
      ) : null}
    </Box>
  )
}
