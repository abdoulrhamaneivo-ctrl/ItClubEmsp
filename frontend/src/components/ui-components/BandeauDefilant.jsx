import { motion } from 'framer-motion'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

/**
 * BandeauDefilant — marquee façon TICKER TERMINAL :
 * préfixe $ vert par item, séparateur │, JetBrains Mono, fond marine
 * (pas un bandeau d'asso générique — le fil d'infos d'un serveur).
 * Le contenu défile en boucle parfaite (2 copies, x: 0% → -50%).
 */
export default function BandeauDefilant({ items = [], vitesse = 30, sens = 'gauche' }) {
  const Copie = () => (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
      {items.map((it, i) => (
        <Box key={i} sx={{ display: 'inline-flex', alignItems: 'center' }}>
          <Typography component="span" sx={{
            color: '#1FAF72', fontFamily: "'JetBrains Mono',monospace",
            fontWeight: 700, fontSize: '0.78rem', px: 1,
          }}>
            $
          </Typography>
          <Typography component="span" sx={{
            color: 'rgba(255,255,255,.88)', fontFamily: "'JetBrains Mono',monospace",
            fontWeight: 500, fontSize: '0.78rem', letterSpacing: '0.02em',
          }}>
            {it}
          </Typography>
          <Box component="span" sx={{ px: 2, color: 'rgba(154,251,215,.35)', fontSize: '0.7rem' }}>
            │
          </Box>
        </Box>
      ))}
    </Box>
  )

  return (
    <Box
      sx={{
        bgcolor: '#0D1B2A',
        borderTop: '1px solid rgba(154,251,215,.14)',
        borderBottom: '1px solid rgba(154,251,215,.14)',
        overflow: 'hidden',
        py: 1.1,
        position: 'relative',
      }}
      aria-label="Actualités express du club"
    >
      <motion.div
        style={{ display: 'flex', whiteSpace: 'nowrap', width: 'max-content' }}
        animate={{ x: sens === 'gauche' ? ['0%', '-50%'] : ['-50%', '0%'] }}
        transition={{ duration: vitesse, ease: 'linear', repeat: Infinity }}
      >
        <Copie />
        <Copie />
      </motion.div>
    </Box>
  )
}
