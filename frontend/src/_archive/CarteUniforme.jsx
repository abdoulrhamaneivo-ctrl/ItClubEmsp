import { motion } from 'framer-motion'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

/**
 * Carte uniforme du site — PAS de bordure verticale décorative.
 * Identité visuelle par : liseré supérieur dégradé + pastille de couleur + halo doux.
 */
export default function CarteUniforme({ titre, surTitre, children, detail, couleur = '#1FAF72', image, onClick }) {
  const cliquable = Boolean(onClick)
  return (
    <motion.div
      whileHover={{ y: -8 }}
      whileTap={cliquable ? { scale: 0.985 } : undefined}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      style={{ height: '100%', cursor: cliquable ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      <Box
        sx={{
          height: '100%',
          bgcolor: '#fff',
          borderRadius: 4,
          p: 3,
          boxShadow: '0 10px 34px rgba(15,91,58,.09)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Liseré supérieur dégradé (alternative aux bordures latérales) */}
        <Box
          sx={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 5,
            background: `linear-gradient(90deg, ${couleur}, rgba(154,251,215,.9))`,
          }}
        />
        {/* Halo de couleur en arrière-plan (profondeur) */}
        <Box
          sx={{
            position: 'absolute', top: -46, right: -46, width: 130, height: 130, borderRadius: '50%',
            background: `radial-gradient(circle, ${couleur}22, transparent 70%)`,
          }}
        />

        {image && (
          <Box component="img" src={image} alt={titre}
            sx={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 3, mb: 2, position: 'relative' }} />
        )}

        {surTitre && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, position: 'relative' }}>
            <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: couleur }} />
            <Typography variant="overline" sx={{ color: couleur, fontWeight: 800, letterSpacing: '0.1em', lineHeight: 1 }}>
              {surTitre}
            </Typography>
          </Box>
        )}

        <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 700, fontSize: '1.05rem', mb: 1, position: 'relative' }}>
          {titre}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ position: 'relative', flexGrow: 1 }}>
          {children}
        </Typography>
      </Box>
    </motion.div>
  )
}
