import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Box from '@mui/material/Box'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'
import OpenInFullIcon from '@mui/icons-material/OpenInFull'
import Typography from '@mui/material/Typography'
import Zoom from '@mui/material/Zoom'

/**
 * Carte cliquable qui ouvre une présentation dynamique (modale zoom).
 * Utilisée pour : cellules, activités, projets, galerie, logo/charte…
 */
export default function DynamicCard({ titre, sousTitre, children, detail, couleur = '#1FAF72', image }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <motion.div
        whileHover={{ y: -6, scale: 1.015 }}
        whileTap={{ scale: 0.985 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        style={{ height: '100%', cursor: 'pointer' }}
        onClick={() => setOpen(true)}
      >
        <Box
          sx={{
            height: '100%',
            bgcolor: '#fff',
            borderRadius: 4,
            borderTop: `4px solid ${couleur}`,
            p: 3,
            boxShadow: '0 8px 30px rgba(15,91,58,0.08)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {image && (
            <Box
              component="img"
              src={image}
              alt={titre}
              sx={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 2, mb: 2 }}
            />
          )}
          <Typography variant="overline" sx={{ color: couleur, fontWeight: 800 }}>
            {sousTitre}
          </Typography>
          <Typography variant="h6" fontWeight={800} gutterBottom>
            {titre}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {children}
          </Typography>
          <Box sx={{ position: 'absolute', top: 10, right: 10, opacity: 0.35 }}>
            <OpenInFullIcon fontSize="small" />
          </Box>
        </Box>
      </motion.div>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Zoom}
        transitionDuration={350}
        PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}
      >
        <Box sx={{ height: 6, bgcolor: couleur }} />
        <IconButton
          onClick={() => setOpen(false)}
          sx={{ position: 'absolute', top: 14, right: 14, bgcolor: 'rgba(255,255,255,.8)' }}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent sx={{ p: 4 }}>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06, duration: 0.45 }}
          >
            {image && (
              <Box
                component="img"
                src={image}
                alt={titre}
                sx={{ width: '100%', maxHeight: 300, objectFit: 'cover', borderRadius: 3, mb: 3 }}
              />
            )}
            <Typography variant="overline" sx={{ color: couleur, fontWeight: 800 }}>
              {sousTitre}
            </Typography>
            <Typography variant="h5" fontWeight={800} gutterBottom>
              {titre}
            </Typography>
            <Typography color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
              {detail ?? children}
            </Typography>
          </motion.div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export { AnimatePresence, motion }
