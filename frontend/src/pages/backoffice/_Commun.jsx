import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'

/**
 * En-tête standard des modules back-office : dégradé marine→vert,
 * titre Orbitron + sous-titre + actions à droite.
 */
export function EnteteModule({ titre, sousTitre, actions }) {
  return (
    <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
      <Box sx={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3,
        background: 'linear-gradient(135deg,#0D1B2A 0%,#0F5B3A 100%)',
        borderRadius: '20px', px: 3.5, py: 3,
      }}>
        <Box>
          <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: '1.45rem', color: '#fff' }}>
            {titre}
          </Typography>
          {sousTitre && (
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,.78)', mt: 0.5 }}>
              {sousTitre}
            </Typography>
          )}
        </Box>
        {actions && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            {actions}
          </Box>
        )}
      </Box>
    </motion.div>
  )
}

export function MessageFlash({ message }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          <Alert severity={message.t === 'success' ? 'success' : message.t === 'info' ? 'info' : 'error'} sx={{ mb: 2, borderRadius: '12px' }}>
            {message.m}
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function useFlash() {
  const [message, setMessage] = useState(null)
  const notify = (t, m) => {
    setMessage({ t, m })
    setTimeout(() => setMessage(null), 4000)
  }
  return [message, notify]
}
