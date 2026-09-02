import { motion } from 'framer-motion'
import Box from '@mui/material/Box'

/**
 * Bandeau défilant (marquee) — annonces courtes qui défilent en continu.
 * Ex. : "Adhésion ouverte · Hackathon le 15 oct · Rejoins la cellule IA"
 */
export default function BandeauDefilant({ items = [], vitesse = 28, sens = 'gauche', couleur = '#0F5B3A' }) {
  const texte = items.join('  ✦  ')
  return (
    <Box
      sx={{
        bgcolor: couleur,
        color: '#fff',
        overflow: 'hidden',
        py: 1.2,
        position: 'relative',
      }}
    >
      <motion.div
        style={{ display: 'flex', whiteSpace: 'nowrap', gap: 64, width: 'max-content' }}
        animate={{ x: sens === 'gauche' ? ['0%', '-50%'] : ['-50%', '0%'] }}
        transition={{ duration: vitesse, ease: 'linear', repeat: Infinity }}
      >
        {[0, 1].map((i) => (
          <Box key={i} sx={{ fontWeight: 600, letterSpacing: '0.06em', fontSize: '0.9rem' }}>
            {texte}&nbsp;&nbsp;✦&nbsp;&nbsp;
          </Box>
        ))}
      </motion.div>
    </Box>
  )
}
