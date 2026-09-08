import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import DeleteForeverOutlinedIcon from '@mui/icons-material/DeleteForeverOutlined'

/**
 * Dialogue de confirmation de suppression (cohérent dans tout le backoffice).
 * Usage :
 *   const [suppression, setSuppression] = useState(null)   // l'objet ou son libellé
 *   <DialogueSuppression
 *     demande={suppression}
 *     nom="Atelier Git"
 *     enCours={envoi}
 *     onAnnuler={() => setSuppression(null)}
 *     onConfirmer={async () => { await api.supprimerX(suppression.id); setSuppression(null) }}
 *   />
 * Rougi côté serveur : la suppression reste refusée si le poste n'a pas le droit.
 */
export default function DialogueSuppression({ demande, nom, enCours, onAnnuler, onConfirmer }) {
  const [tache, setTache] = useState(false)

  useEffect(() => { setTache(false) }, [demande])

  const confirmer = async () => {
    if (tache) return
    setTache(true)
    try {
      await onConfirmer()
    } finally {
      setTache(false)
    }
  }

  return (
    <AnimatePresence>
      {demande && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => !tache && onAnnuler()}
          style={{
            position: 'fixed', inset: 0, zIndex: 1500,
            background: 'rgba(10,22,40,.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            style={{ width: 'min(430px, 94vw)' }}
          >
            <Box sx={{ bgcolor: '#fff', borderRadius: '20px', p: { xs: 3, md: 3.5 }, boxShadow: '0 32px 80px rgba(13,27,42,.35)', textAlign: 'center' }}>
              <Box sx={{
                width: 58, height: 58, borderRadius: '50%', mx: 'auto', mb: 2,
                bgcolor: '#FDECEC', color: '#B42318', display: 'grid', placeItems: 'center',
              }}>
                <DeleteForeverOutlinedIcon sx={{ fontSize: 28 }} />
              </Box>
              <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: '1.05rem', color: '#111827', mb: 0.8 }}>
                Supprimer définitivement ?
              </Typography>
              <Typography variant="body2" sx={{ color: '#5A6B63', lineHeight: 1.7, mb: 0.6 }}>
                {nom && <>« <strong style={{ color: '#111827' }}>{nom}</strong> »<br /></>}
                Cette action est <strong style={{ color: '#B42318' }}>irréversible</strong>.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.4, justifyContent: 'center', mt: 3 }}>
                <Button variant="outlined" onClick={onAnnuler} disabled={tache}
                  sx={{ borderColor: '#D1D5DB', color: '#374151', fontWeight: 800, borderRadius: '12px', px: 3 }}>
                  Annuler
                </Button>
                <Button variant="contained" onClick={confirmer} disabled={tache}
                  sx={{ bgcolor: '#B42318', '&:hover': { bgcolor: '#8F1D13' }, fontWeight: 800, borderRadius: '12px', px: 3 }}>
                  {tache ? 'Suppression…' : 'Oui, supprimer'}
                </Button>
              </Box>
            </Box>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
