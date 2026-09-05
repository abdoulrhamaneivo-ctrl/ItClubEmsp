import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Chip from '@mui/material/Chip'
import Switch from '@mui/material/Switch'
import StarIcon from '@mui/icons-material/Star'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import { api } from '../../lib/api'
import { EnteteModule, MessageFlash, useFlash, BoutonExport } from './_Commun'

/**
 * Back-office — Bilan d'événement (P6) : rédige, publie → vitrine.
 * Inclut la lecture des retours membres (notes + avis).
 */

export default function Bilans() {
  const [message, notify] = useFlash()
  const [evtId, setEvtId] = useState('')
  const [texte, setTexte] = useState('')
  const [forts, setForts] = useState('')
  const [ameliorer, setAmeliorer] = useState('')
  const [publie, setPublie] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [charge, setCharge] = useState(null)
  const client = useQueryClient()

  const { data: evenements = [] } = useQuery({
    queryKey: ['evenements', 'bilan'],
    queryFn: () => api.getActivites({ upcoming: false, limit: 50 }),
  })

  // Charge le bilan à la sélection (uniquement après choix utilisateur)
  useQuery({
    queryKey: ['bilan', evtId],
    queryFn: async () => {
      const res = await api.getBilan(evtId)
      setCharge(res)
      setTexte(res.bilan?.texte ?? '')
      setForts(res.bilan?.points_forts ?? '')
      setAmeliorer(res.bilan?.points_ameliorer ?? '')
      setPublie(!!res.bilan?.publie)
      return res
    },
    enabled: !!evtId,
  })

  const { data: retours } = useQuery({
    queryKey: ['retours', evtId],
    queryFn: () => api.getRetours(evtId),
    enabled: !!evtId,
  })

  const evtChoisi = evenements.find((e) => String(e.id) === String(evtId))

  const enregistrer = async (nouveauPublie) => {
    if (!texte.trim()) { notify('error', 'Le bilan ne peut pas être vide.'); return }
    setEnvoi(true)
    try {
      await api.majBilan(evtId, {
        texte: texte.trim(), points_forts: forts.trim(),
        points_ameliorer: ameliorer.trim(), publie: nouveauPublie,
      })
      setPublie(nouveauPublie)
      client.invalidateQueries({ queryKey: ['evenements'] })
      client.invalidateQueries({ queryKey: ['bilan', evtId] })
      notify('success', nouveauPublie
        ? 'Bilan publié — visible sur la fiche de l\'événement.'
        : 'Bilan enregistré (brouillon).')
    } catch (e) {
      notify('error', e.message ?? 'Enregistrement impossible')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <Box sx={{ maxWidth: '100%' }}>
      <EnteteModule
        titre={<>Bilans <Box component="span" sx={{ color: '#9AFBD7' }}>· retours & bilan</Box></>}
        sousTitre="Ce que les membres ont pensé, et le bilan que tout le club lira."
        actions={(
          <TextField select size="small" value={evtId} onChange={(e) => setEvtId(e.target.value)}
            label="Événement" sx={{ minWidth: 240, bgcolor: '#fff', borderRadius: '12px', '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}>
            {evenements.map((e) => <MenuItem key={e.id} value={e.id}>{e.titre}</MenuItem>)}
          </TextField>
        )}
      />
      <MessageFlash message={message} />

      {!evtId && (
        <Box sx={{ textAlign: 'center', py: 6, bgcolor: '#fff', borderRadius: '18px', border: '1px solid #E8ECEA' }}>
          <Typography sx={{ color: '#5A6B63' }}>
            Choisis un événement pour rédiger son bilan et lire les retours.
          </Typography>
        </Box>
      )}

      {evtId && (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, alignItems: 'start' }}>
          {/* Retours membres */}
          <Box sx={{ bgcolor: '#fff', borderRadius: '18px', border: '1px solid #E8ECEA', p: { xs: 2.4, md: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.5, flexWrap: 'wrap' }}>
              <Typography sx={{ fontWeight: 800, color: '#111827' }}>Retours des membres</Typography>
              {retours?.note_moyenne && (
                <Chip label={`Moyenne ${retours.note_moyenne}/5 · ${retours.nb_retours} retour${retours.nb_retours > 1 ? 's' : ''}`}
                  size="small" sx={{ bgcolor: '#FFF6E0', color: '#B45309', fontWeight: 800 }} />
              )}
              <BoutonExport action={() => api.exporterRetours(evtId)} label="CSV" notify={notify} variant="contained" />
            </Box>
            {(retours?.avis ?? []).length === 0 && (
              <Typography variant="caption" sx={{ color: '#5A6B63' }}>Aucun retour pour le moment.</Typography>
            )}
            {(retours?.avis ?? []).map((a) => (
              <Box key={a.nom} sx={{ py: 1.2, borderBottom: '1px solid #EEF2F0' }}>
                <Box sx={{ display: 'flex', gap: 0.4, alignItems: 'center' }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    n <= a.note
                      ? <StarIcon key={n} sx={{ color: '#F5A623', fontSize: 16 }} />
                      : <StarBorderIcon key={n} sx={{ color: '#D1D5DB', fontSize: 16 }} />
                  ))}
                  <Typography variant="caption" sx={{ color: '#111827', fontWeight: 800, ml: 0.8 }}>{a.nom}</Typography>
                </Box>
                {a.avis && (
                  <Typography variant="body2" sx={{ color: '#374151', fontSize: '0.84rem', lineHeight: 1.6, mt: 0.4 }}>
                    {a.avis}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>

          {/* Rédaction bilan */}
          <Box sx={{ bgcolor: '#fff', borderRadius: '18px', border: '1px solid #E8ECEA', p: { xs: 2.4, md: 3 } }}>
            <Typography sx={{ fontWeight: 800, color: '#111827', mb: 0.5 }}>
              Bilan {evtChoisi ? `— ${evtChoisi.titre}` : ''}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', color: '#5A6B63', mb: 1.5 }}>
              Publié, il s'affiche sur la fiche publique de l'événement.
            </Typography>
            <Box sx={{ display: 'grid', gap: 1.6 }}>
              <TextField label="Bilan *" value={texte} onChange={(e) => setTexte(e.target.value)} multiline rows={4} fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#F8FAF9' } }} />
              <TextField label="Points forts" value={forts} onChange={(e) => setForts(e.target.value)} multiline rows={2} fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#F8FAF9' } }} />
              <TextField label="À améliorer" value={ameliorer} onChange={(e) => setAmeliorer(e.target.value)} multiline rows={2} fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#F8FAF9' } }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <Switch checked={publie} onChange={() => enregistrer(!publie)} disabled={envoi}
                  sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#1FAF72' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#1FAF72' } }} />
                <Typography variant="body2" sx={{ fontWeight: 700, color: publie ? '#0B7A4B' : '#5A6B63' }}>
                  {publie ? 'Publié' : 'Brouillon'}
                </Typography>
                <Box sx={{ flex: 1 }} />
                <Button variant="outlined" onClick={() => enregistrer(publie)} disabled={envoi || !texte.trim()}
                  sx={{ borderColor: '#1FAF72', color: '#0E7A50', fontWeight: 700 }}>
                  {envoi ? 'Envoi…' : 'Enregistrer'}
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  )
}
