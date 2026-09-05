import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import { api } from '../../lib/api'
import { EnteteModule, MessageFlash, useFlash } from './_Commun'

/**
 * Back-office — Communication (P5) : réseaux sociaux + bannière d'accueil.
 * Stocké en paramètres club (API), lecture publique possible.
 */

const CHAMPS = [
  { cle: 'rs_whatsapp', label: 'Groupe WhatsApp (URL)', placeholder: 'https://chat.whatsapp.com/…' },
  { cle: 'rs_instagram', label: 'Instagram (URL)', placeholder: 'https://instagram.com/…' },
  { cle: 'rs_linkedin', label: 'LinkedIn (URL)', placeholder: 'https://linkedin.com/company/…' },
  { cle: 'banniere_accueil', label: 'Bannière accueil (texte court)', placeholder: 'Ex. Inscriptions hackathon ouvertes !' },
]

const champSx = { '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#F8FAF9' } }

export default function Communication() {
  const [message, notify] = useFlash()
  const [valeurs, setValeurs] = useState({})
  const [envoi, setEnvoi] = useState(false)
  const client = useQueryClient()

  const { data: parametres = [] } = useQuery({
    queryKey: ['parametres'], queryFn: () => api.getParametres(),
  })
  const distants = {}
  for (const p of parametres) distants[p.cle] = p.valeur ?? ''

  const afficher = (cle) => valeurs[cle] ?? distants[cle] ?? ''

  const toutEnregistrer = async () => {
    setEnvoi(true)
    try {
      for (const { cle } of CHAMPS) {
        if (valeurs[cle] !== undefined && valeurs[cle] !== (distants[cle] ?? '')) {
          await api.sauverParametre(cle, valeurs[cle])
        }
      }
      client.invalidateQueries({ queryKey: ['parametres'] })
      setValeurs({})
      notify('success', 'Liens et bannière mis à jour.')
    } catch (e) {
      notify('error', e.message ?? 'Enregistrement impossible')
    } finally {
      setEnvoi(false)
    }
  }

  const modifie = Object.keys(valeurs).some((k) => valeurs[k] !== (distants[k] ?? ''))

  return (
    <Box sx={{ maxWidth: '100%' }}>
      <EnteteModule
        titre={<>Communication <Box component="span" sx={{ color: '#9AFBD7' }}>· réseaux</Box></>}
        sousTitre="Où vous suivre, et le message fort de l'accueil."
      />
      <MessageFlash message={message} />

      <Box sx={{ bgcolor: '#fff', borderRadius: '18px', border: '1px solid #E8ECEA', p: { xs: 2.4, md: 3.2 }, display: 'grid', gap: 2 }}>
        {CHAMPS.map(({ cle, label, placeholder }) => (
          <TextField key={cle} label={label} value={afficher(cle)}
            onChange={(e) => setValeurs((v) => ({ ...v, [cle]: e.target.value }))}
            fullWidth sx={champSx} placeholder={placeholder} />
        ))}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" onClick={toutEnregistrer} disabled={!modifie || envoi}
            sx={{ bgcolor: '#1FAF72', '&:hover': { bgcolor: '#179963' }, fontWeight: 800, borderRadius: '12px' }}>
            {envoi ? 'Envoi…' : 'Enregistrer'}
          </Button>
        </Box>
      </Box>
      {!api.isMockMode() && (
        <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: '#5A6B63' }}>
          Le premier enregistrement crée chaque réglage ; les suivants le modifient.
        </Typography>
      )}

      <TestEmail notify={notify} />
    </Box>
  )
}

/* ── Diagnostic : vérifie que Brevo envoie vraiment ────────── */
function TestEmail({ notify }) {
  const [destinataire, setDestinataire] = useState('')
  const [envoi, setEnvoi] = useState(false)

  const tester = async () => {
    if (!destinataire.trim() || envoi) return
    setEnvoi(true)
    try {
      const res = await api.testerEmail(destinataire.trim())
      if (res.ok) notify('success', `Email parti vers ${destinataire.trim()} — vérifie la boîte (et les spams).`)
      else notify('error', `Non parti : ${res.resultat?.skipped ?? res.erreur ?? 'voir les logs serveur'}`)
    } catch (e) {
      notify('error', e.message ?? 'Test impossible')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <Box sx={{ mt: 2, bgcolor: '#fff', borderRadius: '18px', border: '1px solid #E8ECEA', p: { xs: 2.4, md: 3.2 } }}>
      <Typography sx={{ fontWeight: 800, color: '#111827', mb: 0.5 }}>Tester l'envoi d'emails</Typography>
      <Typography variant="caption" sx={{ display: 'block', color: '#5A6B63', mb: 1.5 }}>
        Envoie un vrai email via Brevo pour vérifier clé + expéditeur avant d'inviter des membres.
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <TextField size="small" label="Adresse de test" value={destinataire}
          onChange={(e) => setDestinataire(e.target.value)} placeholder="toi@exemple.com"
          sx={{ flex: 1, minWidth: 220, '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#F8FAF9' } }} />
        <Button variant="contained" onClick={tester} disabled={!destinataire.trim() || envoi}
          sx={{ bgcolor: '#1FAF72', '&:hover': { bgcolor: '#179963' }, fontWeight: 800, borderRadius: '12px' }}>
          {envoi ? 'Envoi…' : 'Envoyer le test'}
        </Button>
      </Box>
    </Box>
  )
}
