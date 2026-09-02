import { motion } from 'framer-motion'
import Box from '@mui/material/Box'

/**
 * Anneau3D — carrousel circulaire 3D réutilisable.
 * Les items tournent sur un anneau (rotateY + translateZ), celui de face est actif.
 *
 * Props :
 *  - items          : tableau de données
 *  - index / onChange : item actif (contrôlé)
 *  - renderItem(item, actif) : contenu visuel d'une carte
 *  - rayon          : rayon de l'anneau (px, défaut 380)
 *  - largeur / hauteur : dimensions d'une carte (px)
 *  - autoMs         : durée d'auto-rotation (0 = off, défaut 4200)
 *  - cibleRef       : ref pour la pause auto-rotation au survol (gérée par le parent via autoMs)
 */
export default function Anneau3D({
  items,
  index,
  onChange,
  renderItem,
  rayon = 380,
  largeur = 250,
  hauteur = 320,
  autoMs = 4200,
  hauteurScene = 420,
}) {
  const n = items.length

  return (
    <Box
      sx={{
        position: 'relative',
        height: hauteurScene,
        perspective: 1600,
        display: 'grid',
        placeItems: 'center',
      }}
      onMouseEnter={(e) => e.currentTarget.dataset.hover = '1'}
    >
      {/* Ombre au sol */}
      <Box
        sx={{
          position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)',
          width: '70%', height: 24, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(13,27,42,.2), transparent 70%)',
          filter: 'blur(6px)',
        }}
      />
      {/* Plateau rotatif */}
      <motion.div
        animate={{ rotateY: -index * (360 / Math.max(n, 1)) }}
        transition={{ type: 'spring', stiffness: 90, damping: 17, mass: 0.9 }}
        style={{ position: 'relative', width: largeur, height: hauteur, transformStyle: 'preserve-3d' }}
      >
        {items.map((item, i) => {
          const delta = i - index
          const dMod = delta > n / 2 ? delta - n : delta < -n / 2 ? delta + n : delta
          const abs = Math.abs(dMod)
          return (
            <motion.div
              key={i}
              onClick={() => (i === index ? null : onChange(i))}
              animate={{
                transform: `rotateY(${i * (360 / Math.max(n, 1))}deg) translateZ(${rayon}px)`,
                opacity: abs === 0 ? 1 : abs === 1 ? 0.5 : 0.22,
                filter: abs === 0 ? 'blur(0px)' : `blur(${Math.min(abs, 2) * 1.4}px)`,
              }}
              transition={{ type: 'spring', stiffness: 90, damping: 17, mass: 0.9 }}
              style={{
                position: 'absolute', inset: 0,
                transformStyle: 'preserve-3d', cursor: 'pointer',
                pointerEvents: abs > 2 ? 'none' : 'auto',
              }}
            >
              {renderItem(item, abs === 0)}
            </motion.div>
          )
        })}
      </motion.div>
    </Box>
  )
}
