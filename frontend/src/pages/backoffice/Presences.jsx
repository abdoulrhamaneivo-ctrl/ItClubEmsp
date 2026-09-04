import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import DownloadIcon from '@mui/icons-material/Download'
import QrCodeIcon from '@mui/icons-material/QrCode'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { api } from '../../lib/api'

/**
 * Back-office — Événements & présences (P1/P6).
 * Sélecteur d'événement → code à 6 chiffres (copie + QR à projeter),
 * feuille d'émargement en direct, émargement manuel, export CSV.
 */

export default function Presences() {
  const [evtId, setEvtId] = useState('')
  const [email, setEmail] = useState('')
  const [qrUrl, setQrUrl] = useState(null)
  const [message, setMessage] = useState(null)
  const [action, setAction] = useState(false)

  const { data: evenements = [] } = useQuery({
    queryKey: ['evenements', 'gestion'],
    queryFn: () => api.getActivites({ upcoming: false, limit: 50 }),
  })
  const { data: feuille, refetch } = useQuery({
    queryKey: ['presences', evtId],
    queryFn: () => api.getPresences(evtId),
    enabled: !!evtId && !api.isMockMode(),
  })

  // QR : endpoint authentifié → blob → URL locale (un <img> ne porte pas le JWT)
  useEffect(() => {
    if (!evtId || api.isMockMode()) { setQrUrl(null); return }
    let stop = false
    let url = null
    fetch(`${import.meta.env.VITE_API_URL}/api/v1/evenements/${evtId}/qr-presence`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token') ?? ''}` },
    })
      .then((r) => { if (!r.ok) throw new Error(); return r.blob() })
      .then((b) => { if (!stop) { url = URL.createObjectURL(b); setQrUrl(url) } })
      .catch(() => { if (!stop) setQrUrl(null) })
    return () => { stop = true; if (url) URL.revokeObjectURL(url) }
  }, [evtId])

  const notify = (t, m) => { setMessage({ t, m }); setTimeout(() => setMessage(null), 4000) }

  const copierCode = () => {
    if (feuille?.code) {
      navigator.clipboard?.writeText(feuille.code).catch(() => {})
      notify('success', 'Code copié — affiche-le au vidéoprojecteur.')
    }
  }

  const emarger = async () => {
    if (!email.trim() || !evtId) return
    setAction(true)
    try {
      const res = await api.emargerMembre(evtId, email.trim())
      notify('success', res.statut === 'deja-present' ? 'Déjà émargé.' : `Émargé — ${res.points ?? ''} pts.`)
      setEmail('')
      refetch()
    } catch (e) {
      notify('error', e.message ?? 'Émargement impossible')
    } finally {
      setAction(false)
    }
  }

  const telecharger = async (fn) => {
    try {
      await fn()
    } catch {
      notify('error', 'Téléchargement impossible')
    }
  }

  const presents = feuille?.presents ?? []

  return (
    <Box sx={{ maxWidth: '100%' }}>
      <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <Box sx={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3,
          background: 'linear-gradient(135deg,#0D1B2A 0%,#0F5B3A 100%)',
          borderRadius: '20px', px: 3.5, py: 3,
        }}>
          <Box>
            <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: '1.45rem', color: '#fff' }}>
              Présences <Box component="span" sx={{ color: '#9AFBD7' }}>· émargement</Box>
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,.78)', mt: 0.5 }}>
              Le code du jour, la feuille en direct, l'export pour le bilan.
            </Typography>
          </Box>
          <TextField select value={evtId} onChange={(e) => setEvtId(e.target.value)}
            label="Événement" sx={{ minWidth: 260, bgcolor: '#fff', borderRadius: '12px', '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}>
            {evenements.map((e) => (
              <MenuItem key={e.id} value={e.id}>{e.titre}</MenuItem>
            ))}
          </TextField>
        </Box>
      </motion.div>

      <AnimatePresence>
        {message && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Alert severity={message.t === 'success' ? 'success' : 'error'} sx={{ mb: 2, borderRadius: '12px' }}>
              {message.m}
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {!evtId && (
        <Box sx={{ textAlign: 'center', py: 6, bgcolor: '#fff', borderRadius: '18px', border: '1px solid #E8ECEA' }}>
          <Typography sx={{ color: '#5A6B63' }}>Choisis un événement pour ouvrir sa feuille d'émargement.</Typography>
        </Box>
      )}

      {evtId && (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1.4fr' }, alignItems: 'start' }}>
          {/* Code + QR */}
          <Box sx={{ bgcolor: '#fff', borderRadius: '18px', border: '1px solid #E8ECEA', p: 3, textAlign: 'center' }}>
            <Typography sx={{ fontWeight: 800, color: '#111827', mb: 1 }}>Code du jour</Typography>
            <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: '2.6rem', letterSpacing: '0.18em', color: '#0F5B3A' }}>
              {feuille?.code ?? '······'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 1.5, flexWrap: 'wrap' }}>
              <Button size="small" variant="outlined" startIcon={<ContentCopyIcon />} onClick={copierCode}
                sx={{ borderColor: '#1FAF72', color: '#0E7A50', fontWeight: 700 }}>
                Copier
              </Button>
              <Button size="small" variant="outlined" startIcon={<QrCodeIcon />}
                onClick={() => telecharger(() => api.telechargerQRPresence(evtId))}
                sx={{ borderColor: '#1FAF72', color: '#0E7A50', fontWeight: 700 }}>
                QR PNG
              </Button>
            </Box>
            {qrUrl && (
              <Box component="img" src={qrUrl} alt="QR du code de présence"
                sx={{ width: 170, height: 170, mt: 2, borderRadius: '12px', border: '1px solid #E3EEE8' }} />
            )}
            <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: '#5A6B63' }}>
              Projette le code ou le QR — les membres s'émargent depuis leur Espace (+5 pts).
            </Typography>
          </Box>

          {/* Feuille + émargement manuel + export */}
          <Box sx={{ bgcolor: '#fff', borderRadius: '18px', border: '1px solid #E8ECEA', p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
              <Typography sx={{ fontWeight: 800, color: '#111827' }}>
                Feuille d'émargement{' '}
                <Chip label={`${presents.length} présent${presents.length > 1 ? 's' : ''}`} size="small"
                  sx={{ bgcolor: '#E4F8EF', color: '#0B7A4B', fontWeight: 800, ml: 1 }} />
              </Typography>
              <Button size="small" variant="contained" startIcon={<DownloadIcon />}
                onClick={() => telecharger(() => api.telechargerCSVPresences(evtId))}
                sx={{ bgcolor: '#2563EB', '&:hover': { bgcolor: '#1D4ED8' }, fontWeight: 800, borderRadius: '10px' }}>
                Export CSV
              </Button>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField size="small" label="Émarger manuellement (email)" value={email}
                onChange={(e) => setEmail(e.target.value)} fullWidth
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
              <Button variant="contained" onClick={emarger} disabled={!email.trim() || action}
                sx={{ bgcolor: '#1FAF72', '&:hover': { bgcolor: '#179963' }, fontWeight: 800, borderRadius: '10px', flexShrink: 0 }}>
                {action ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'OK'}
              </Button>
            </Box>
            {presents.length === 0 && (
              <Typography sx={{ color: '#5A6B63', fontSize: '0.88rem' }}>Personne pour le moment.</Typography>
            )}
            {presents.map((p) => (
              <Box key={p.email} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.1, borderBottom: '1px solid #EEF2F0' }}>
                <Box sx={{ width: 34, height: 34, borderRadius: '50%', bgcolor: '#E4F8EF', display: 'grid', placeItems: 'center', color: '#0B7A4B', fontWeight: 800, flexShrink: 0 }}>
                  {(p.nom ?? p.email).slice(0, 1).toUpperCase()}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700, color: '#111827', fontSize: '0.86rem' }}>{p.nom}</Typography>
                  <Typography variant="caption" sx={{ color: '#5A6B63' }}>{p.email}</Typography>
                </Box>
                {p.par_orga && (
                  <Chip label="orga" size="small" sx={{ bgcolor: '#EDE9FE', color: '#5B21B6', fontWeight: 700, height: 20 }} />
                )}
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  )
}
