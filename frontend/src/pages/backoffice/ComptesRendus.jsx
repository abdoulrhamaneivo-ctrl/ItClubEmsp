import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Switch from '@mui/material/Switch'
import SendIcon from '@mui/icons-material/Send'
import { api } from '../../lib/api'

/**
 * Back-office — Comptes rendus & convocations (SG, P1/P3).
 * Onglet Convoquer : formulaire → POST /reunions/convocation
 * (tous les membres OU liste d'emails). Rappel H-48h auto via cron.
 * Onglet Envoyées : historique des convocations (traces Notification).
 */

const champSx = {
  '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#F8FAF9' },
}

export default function ComptesRendus() {
  const [onglet, setOnglet] = useState(0)
  const [titre, setTitre] = useState('')
  const [dateStr, setDateStr] = useState('')
  const [lieu, setLieu] = useState('')
  const [ordre, setOrdre] = useState('')
  const [tous, setTous] = useState(true)
  const [emails, setEmails] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [message, setMessage] = useState(null)

  const { data: notifs } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.getNotifications(),
  })
  const envoyees = (notifs ?? []).filter((n) => n.type === 'convocation').slice(0, 8)

  const notify = (t, m) => { setMessage({ t, m }); setTimeout(() => setMessage(null), 5000) }

  const listeEmails = emails.split(/[\n,;]+/).map((e) => e.trim()).filter(Boolean)

  const peutEnvoyer = titre.trim() && (tous || listeEmails.length > 0) && !envoi

  const envoyer = async () => {
    setEnvoi(true)
    try {
      const res = await api.envoyerConvocation({
        titre: titre.trim(),
        emails: tous ? [] : listeEmails,
        tous_membres: tous,
        date_str: dateStr.trim(),
        lieu: lieu.trim(),
        ordre_du_jour: ordre.trim(),
      })
      const nb = res.envoyes ?? 0
      notify('success', `Convocation envoyée à ${nb} destinataire${nb > 1 ? 's' : ''}${(res.ignores ?? []).length > 0 ? ` (${res.ignores.length} échec${res.ignores.length > 1 ? 's' : ''})` : ''} — rappel automatique 48h avant.`)
      setTitre(''); setDateStr(''); setLieu(''); setOrdre(''); setEmails('')
    } catch (e) {
      notify('error', e.message ?? 'Envoi impossible')
    } finally {
      setEnvoi(false)
    }
  }

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
              Réunions <Box component="span" sx={{ color: '#9AFBD7' }}>· convocations</Box>
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,.78)', mt: 0.5 }}>
              Convoque le Bureau ou tous les membres — le rappel part seul 48h avant.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {['Convoquer', `Envoyées${envoyees.length > 0 ? ` (${envoyees.length})` : ''}`].map((label, i) => (
              <Chip key={label} label={label} onClick={() => setOnglet(i)}
                sx={{
                  fontWeight: 800, cursor: 'pointer',
                  bgcolor: onglet === i ? '#1FAF72' : 'rgba(255,255,255,.12)', color: '#fff',
                  '&:hover': { bgcolor: onglet === i ? '#179963' : 'rgba(255,255,255,.22)' },
                }} />
            ))}
          </Box>
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

      {onglet === 0 && (
        <Box sx={{ bgcolor: '#fff', borderRadius: '18px', border: '1px solid #E8ECEA', p: { xs: 2.5, md: 3.2 }, display: 'grid', gap: 2 }}>
          <TextField label="Titre de la réunion *" value={titre} onChange={(e) => setTitre(e.target.value)}
            placeholder="Ex. Réunion Bureau — bilan du mois" fullWidth sx={champSx} />
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
            <TextField label="Date et heure" value={dateStr} onChange={(e) => setDateStr(e.target.value)}
              placeholder="Ex. samedi 12 octobre, 10h" fullWidth sx={champSx} />
            <TextField label="Lieu" value={lieu} onChange={(e) => setLieu(e.target.value)}
              placeholder="Ex. salle info 2" fullWidth sx={champSx} />
          </Box>
          <TextField label="Ordre du jour" value={ordre} onChange={(e) => setOrdre(e.target.value)}
            placeholder="1. Bilan activités&#10;2. Budget&#10;3. Divers" multiline rows={3} fullWidth sx={champSx} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.6, bgcolor: '#F6FBF9', borderRadius: '12px', border: '1px solid #E3EEE8' }}>
            <Switch checked={tous} onChange={() => setTous(!tous)}
              sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#1FAF72' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#1FAF72' } }} />
            <Box>
              <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: '0.88rem' }}>
                Tous les membres actifs
              </Typography>
              <Typography variant="caption" sx={{ color: '#5A6B63' }}>
                Sinon, colle ci-dessous les emails (un par ligne).
              </Typography>
            </Box>
          </Box>
          {!tous && (
            <TextField label="Emails destinataires" value={emails} onChange={(e) => setEmails(e.target.value)}
              placeholder={"prenom.nom@emsp.int\nprenom.nom@emsp.int"} multiline rows={3} fullWidth sx={champSx}
              helperText={listeEmails.length > 0 ? `${listeEmails.length} adresse${listeEmails.length > 1 ? 's' : ''} détectée${listeEmails.length > 1 ? 's' : ''}` : ' '} />
          )}
          <Box>
            <Button variant="contained" startIcon={envoi ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <SendIcon />}
              disabled={!peutEnvoyer} onClick={envoyer}
              sx={{ bgcolor: '#1FAF72', '&:hover': { bgcolor: '#179963' }, fontWeight: 800, borderRadius: '12px', px: 3.5, py: 1.2 }}>
              {envoi ? 'Envoi…' : 'Envoyer la convocation'}
            </Button>
          </Box>
        </Box>
      )}

      {onglet === 1 && (
        <Box sx={{ display: 'grid', gap: 1.4 }}>
          {envoyees.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6, bgcolor: '#fff', borderRadius: '18px', border: '1px solid #E8ECEA' }}>
              <Typography sx={{ color: '#5A6B63' }}>Aucune convocation envoyée pour le moment.</Typography>
            </Box>
          )}
          {envoyees.map((n) => (
            <Box key={n.id} sx={{ bgcolor: '#fff', borderRadius: '14px', border: '1px solid #E8ECEA', px: 2.4, py: 1.8, display: 'flex', gap: 1.6, alignItems: 'flex-start' }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#7B61FF', mt: 0.8, flexShrink: 0 }} />
              <Box>
                <Typography sx={{ fontWeight: 700, color: '#111827', fontSize: '0.88rem' }}>{n.titre}</Typography>
                <Typography variant="caption" sx={{ color: '#5A6B63' }}>
                  {n.cree_le ? new Date(n.cree_le).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : ''} → {n.destinataire_email ?? 'membres'}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}
