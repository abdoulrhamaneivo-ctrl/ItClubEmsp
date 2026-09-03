import { motion } from 'framer-motion'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

/**
 * TexteEnValeur — composants typographiques réutilisables pour la lecture :
 * - ParagrapheIntro : texte d'intro de section (plus grand, interligne généreux)
 * - MotFort : surlignage animé au scroll (surligneur fluo discret)
 * - TexteReveal : apparition ligne par ligne
 */

/** Paragraphe d'introduction — hiérarchie typographique claire. */
export function ParagrapheIntro({ children, couleur = '#1FAF72', maxWidth = 640, centre = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px' }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <Typography
        sx={{
          fontSize: { xs: '1.02rem', md: '1.12rem' },
          lineHeight: 1.85,
          color: '#374151',
          maxWidth,
          mx: centre ? 'auto' : 0,
          letterSpacing: '0.005em',
        }}
      >
        {children}
      </Typography>
    </motion.div>
  )
}

/** Mot ou groupe souligné au surligneur — la couleur anime le trait au scroll. */
export function MotFort({ children, couleur = '#1FAF72' }) {
  return (
    <Box
      component="span"
      sx={{ position: 'relative', display: 'inline-block', px: 0.3, color: '#111827', fontWeight: 700 }}
    >
      {/* Surlignage derrière le texte */}
      <motion.span
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, margin: '0px' }}
        transition={{ duration: 0.55, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 2, height: '38%',
          transformOrigin: 'left', background: `${couleur}33`, borderRadius: 2, zIndex: -1,
        }}
      />
      {children}
    </Box>
  )
}

/** Petit label de section avec trait animé (plus raffiné que l'overline simple). */
export function LabelLigne({ children, couleur = '#1FAF72' }) {
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.2, mb: 1.5 }}>
      <motion.span
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, margin: '0px' }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: 26, height: 2.5, borderRadius: 2, background: couleur, transformOrigin: 'left' }}
      />
      <Typography sx={{ color: couleur, fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
        {children}
      </Typography>
    </Box>
  )
}

/** Séparateur de sections — trait fin animé avec losange central. */
export function Separateur({ couleur = '#1FAF72' }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, my: 0.5 }}>
      <motion.span
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, margin: '0px' }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: 90, height: 1, background: `linear-gradient(90deg,transparent,${couleur}88)`, transformOrigin: 'right' }}
      />
      <motion.span
        initial={{ scale: 0, rotate: 45 }}
        whileInView={{ scale: 1, rotate: 45 }}
        viewport={{ once: true, margin: '0px' }}
        transition={{ delay: 0.15, duration: 0.3, type: 'spring', stiffness: 300, damping: 18 }}
        style={{ width: 7, height: 7, background: couleur, borderRadius: 1.5 }}
      />
      <motion.span
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, margin: '0px' }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: 90, height: 1, background: `linear-gradient(90deg,${couleur}88,transparent)`, transformOrigin: 'left' }}
      />
    </Box>
  )
}

export default { ParagrapheIntro, MotFort, LabelLigne, Separateur }
