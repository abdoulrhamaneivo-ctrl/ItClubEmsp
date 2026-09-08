import Box from '@mui/material/Box'

/**
 * FondHalos — version sobre : voiles de couleur fixes très doux.
 * (anciennement : halos flous animés en boucle — supprimés)
 */
export default function FondHalos({ couleurs = ['rgba(31,175,114,.08)', 'rgba(37,99,235,.06)', 'rgba(245,166,35,.05)'], trame = false }) {
  const positions = [
    { top: '-8%', left: '-6%' },
    { bottom: '-10%', right: '-4%' },
    { top: '30%', right: '18%' },
  ]
  return (
    <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {couleurs.map((c, i) => (
        <Box
          key={i}
          sx={{
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
