import { motion } from 'framer-motion'
import Box from '@mui/material/Box'

/**
 * FondHalos — fond léger animé réutilisable : halos de couleur qui dérivent
 * + trame de points en masque radial. Tue le fond neutre sans gêner la lecture.
 * Props : couleurs (3 rgba), intensite (opacité de la trame).
 */
export default function FondHalos({ couleurs = ['rgba(31,175,114,.14)', 'rgba(37,99,235,.12)', 'rgba(245,166,35,.10)'], trame = true }) {
  const positions = [
    { top: '-8%', left: '-6%' },
    { bottom: '-10%', right: '-4%' },
    { top: '30%', right: '18%' },
  ]
  return (
    <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {couleurs.map((c, i) => (
        <motion.div
          key={i}
          animate={{ x: [0, 26 + i * 8, 0], y: [0, -20 - i * 6, 0] }}
          transition={{ duration: 16 + i * 5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', ...positions[i % 3],
            width: 340 + i * 45, height: 340 + i * 45, borderRadius: '50%',
            background: `radial-gradient(circle, ${c} 0%, transparent 65%)`,
            filter: 'blur(58px)',
          }}
        />
      ))}
      {trame && (
        <Box
          sx={{
            position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(rgba(15,91,58,.07) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            maskImage: 'radial-gradient(ellipse at 50% 40%, black 25%, transparent 72%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 50% 40%, black 25%, transparent 72%)',
          }}
        />
      )}
    </Box>
  )
}
