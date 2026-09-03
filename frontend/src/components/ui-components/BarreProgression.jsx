import { motion, useScroll, useSpring } from 'framer-motion'
import Box from '@mui/material/Box'

/**
 * BarreProgression — indicateur de lecture fixé en haut :
 * le scroll anime directement la barre (resort amorti = fluide).
 * Le défilement crée l'animation → le visiteur voit sa progression.
 */
export default function BarreProgression() {
  const { scrollYProgress } = useScroll()
  const largeur = useSpring(scrollYProgress, { stiffness: 120, damping: 26, mass: 0.4 })

  return (
    <Box
      sx={{
        position: 'fixed', top: 0, left: 0, right: 0,
        height: 3.5, zIndex: 1300, pointerEvents: 'none',
        background: 'rgba(13,27,42,.06)',
      }}
      aria-hidden
    >
      <motion.div
        style={{
          width: largeur, height: '100%',
          transformOrigin: 'left',
          background: 'linear-gradient(90deg,#0F5B3A,#1FAF72 55%,#9AFBD7)',
          boxShadow: '0 0 10px rgba(31,175,114,.5)',
        }}
      />
    </Box>
  )
}
