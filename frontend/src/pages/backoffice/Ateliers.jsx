import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import AddIcon from '@mui/icons-material/Add'
import { api } from '../../lib/api'
import { EnteteModule, MessageFlash, useFlash } from './_Commun'

/**
 * Back-office — Ateliers (P10) : les 4 prochains, création
 * (conflit de salle refusé par l'API avec message clair),
 * émargement via le module Présences.
 */

const champSx = { '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#F8FAF9' } }

export default function Ateliers() {
  const [message, notify] = useFlash()
  const [formOuvert, setFormOuvert] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [form, setForm] = useState({ titre: '', description: '', date: '', lieu: '', places: '', imageFile: null, video_url: '' })
  const client = useQueryClient()

  const { data: evenements = [] } = useQuery({
    queryKey: ['evenements', 'ateliers'],
    queryFn: () => api.getActivites({ upcoming: false, limit: 100 }),
  })
  const ateliers = evenements
    .filter((e) => (e.type ?? e.type_label ?? '').toString().toLowerCase().includes('atelier') || !e.type)
    .filter((e) => new Date(e.date) >= new Date(Date.now() - 24 * 3600 * 1000))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 4)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const creer = async () => {
    if (!form.titre.trim() || !form.date || !form.lieu.trim() || envoi) {
      if (!form.titre.trim() || !form.date || !form.lieu.trim()) notify('error', 'Titre, date et lieu sont requis.')
      return
    }
    setEnvoi(true)
    try {
      const iso = new Date(form.date).toISOString()
      await api.creerAtelier({
        titre: form.titre.trim(),
        description: form.description.trim(),
        date: iso,
        lieu: form.lieu.trim(),
        places: form.places === '' ? 0 : Math.max(0, parseInt(form.places, 10) || 0),
        imageFile: form.imageFile,
        video_url: form.video_url.trim(),
      })
      client.invalidateQueries({ queryKey: ['evenements'] })
      notify('success', 'Atelier créé — visible dans les Activités.')
      setForm({ titre: '', description: '', date: '', lieu: '', places: '', imageFile: null, video_url: '' })
      setFormOuvert(false)
    } catch (e) {
      // 400 conflit de salle : le message serveur est explicite
      notify('error', e.message ?? 'Création impossible')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <Box sx={{ maxWidth: '100%' }}>
      <EnteteModule
        titre={<>Ateliers <Box component="span" sx={{ color: '#9AFBD7' }}>· planning</Box></>}
        sousTitre="Les 4 prochains — la salle déjà prise est refusée toute seule."
        actions={(
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormOuvert(!formOuvert)}
            sx={{ bgcolor: '#1FAF72', '&:hover': { bgcolor: '#179963' }, fontWeight: 800, borderRadius: '12px' }}>
            Nouvel atelier
          </Button>
        )}
      />
      <MessageFlash message={message} />

      {formOuvert && (
        <Box sx={{ bgcolor: '#fff', borderRadius: '18px', border: '1px solid #1FAF7245', p: { xs: 2.4, md: 3 }, display: 'grid', gap: 2, mb: 2.5 }}>
          <TextField label="Titre *" value={form.titre} onChange={(e) => set('titre', e.target.value)} fullWidth sx={champSx} />
          <TextField label="Description" value={form.description} onChange={(e) => set('description', e.target.value)} multiline rows={2} fullWidth sx={champSx} />
          <TextField label="Lien vidéo (teaser, replay…)" value={form.video_url} onChange={(e) => set('video_url', e.target.value)} fullWidth sx={champSx} placeholder="https://…" />
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
            <Button variant="outlined" component="label" sx={{ borderColor: '#1FAF72', color: '#0E7A50', fontWeight: 800, borderRadius: '12px' }}>
              {form.imageFile ? 'Changer l’affiche' : 'Ajouter une affiche (photo)'}
              <input type="file" accept="image/*" hidden onChange={(e) => set('imageFile', e.target.files?.[0] ?? null)} />
            </Button>
            {form.imageFile && (
              <Typography variant="caption" sx={{ color: '#374151', fontWeight: 700 }}>{form.imageFile.name}</Typography>
            )}
          </Box>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' } }}>
            <TextField type="datetime-local" label="Date et heure *" value={form.date} onChange={(e) => set('date', e.target.value)} fullWidth sx={champSx} InputLabelProps={{ shrink: true }} />
            <TextField label="Lieu *" value={form.lieu} onChange={(e) => set('lieu', e.target.value)} placeholder="Ex. salle info 2" fullWidth sx={champSx} />
            <TextField type="number" label="Places (0 = illimité)" value={form.places} onChange={(e) => set('places', e.target.value)} fullWidth sx={champSx} inputProps={{ min: 0 }} />
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
            <Button onClick={() => setFormOuvert(false)} sx={{ color: '#5A6B63', fontWeight: 700 }}>Annuler</Button>
            <Button variant="contained" onClick={creer} disabled={envoi}
              sx={{ bgcolor: '#1FAF72', '&:hover': { bgcolor: '#179963' }, fontWeight: 800, borderRadius: '12px' }}>
              {envoi ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Créer'}
            </Button>
          </Box>
        </Box>
      )}

      <Box sx={{ display: 'grid', gap: 1.4 }}>
        {ateliers.map((a) => (
          <Box key={a.id} sx={{ bgcolor: '#fff', borderRadius: '14px', border: '1px solid #E8ECEA', px: 2.4, py: 1.8, display: 'flex', gap: 1.6, alignItems: 'center', flexWrap: 'wrap' }}>
            <Box sx={{ width: 52, flexShrink: 0, borderRadius: '10px', py: 0.8, bgcolor: '#E4F8EF', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: '1.05rem', lineHeight: 1, color: '#0B7A4B' }}>
                {new Date(a.date).getDate()}
              </Typography>
              <Typography sx={{ fontWeight: 800, fontSize: '0.58rem', textTransform: 'uppercase', color: '#0B7A4B' }}>
                {new Date(a.date).toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')}
              </Typography>
            </Box>
            <Box sx={{ flex: 1, minWidth: 180 }}>
              <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: '0.92rem' }}>{a.titre}</Typography>
              <Typography variant="caption" sx={{ color: '#5A6B63' }}>
                {new Date(a.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} · {a.lieu ?? '—'}
              </Typography>
            </Box>
            {(a.presents_count ?? 0) > 0 && (
              <Chip label={`${a.presents_count} présent${a.presents_count > 1 ? 's' : ''}`} size="small"
                sx={{ bgcolor: '#E4F8EF', color: '#0B7A4B', fontWeight: 800 }} />
            )}
            {a.places > 0 && (
              <Chip label={`${a.places_disponibles ?? a.places} places`} size="small"
                sx={{ bgcolor: '#F0F5F2', color: '#374151', fontWeight: 700 }} />
            )}
          </Box>
        ))}
        {ateliers.length === 0 && (
          <Typography sx={{ color: '#5A6B63', fontSize: '0.88rem' }}>
            Aucun atelier à venir — crée le premier avec le bouton ci-dessus.
          </Typography>
        )}
      </Box>
      <Typography variant="caption" sx={{ display: 'block', mt: 2, color: '#5A6B63' }}>
        Émargement le jour J dans le module Événements (code à 6 chiffres + feuille + CSV).
      </Typography>
    </Box>
  )
}
