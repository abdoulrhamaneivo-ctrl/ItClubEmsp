import { motion, useReducedMotion } from 'framer-motion'
import Box from '@mui/material/Box'

/**
 * FondHalos — halos de couleur à la dérive très lente + trame de points.
 * Mouvement d'ambiance discret (16-26s par cycle), coupé si reduced-motion.
 */
export default function FondHalos({ couleurs = ['rgba(31,175,114,.10)', 'rgba(37,99,235,.08)', 'rgba(245,166,35,.06)'], trame = false }) {
  const reduit = useReducedMotion()
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
          animate={reduit ? undefined : { x: [0, 22 + i * 6, 0], y: [0, -16 - i * 5, 0] }}
          transition={{ duration: 20 + i * 6, repeat: Infinity, ease: 'easeInOut' }}
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
