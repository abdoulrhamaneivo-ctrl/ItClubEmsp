import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import { api } from '../../lib/api'
import { EnteteModule, MessageFlash, useFlash } from './_Commun'

/**
 * Back-office — Opportunités (P8) : kanban hackathons / conférences /
 * partenariats (Veille → Intéressé → Inscrit → Clôturé) + carnet de contacts.
 */

const TYPES = [
  { id: 'hackathon', label: 'Hackathons' },
  { id: 'conference', label: 'Conférences' },
  { id: 'partenariat', label: 'Partenariats' },
]

const STATUTS = [
  { id: 'veille', label: 'En veille' },
  { id: 'interesse', label: 'Intéressé' },
  { id: 'inscrit', label: 'Inscrit' },
  { id: 'cloture', label: 'Clôturé' },
]

const COULEUR_STATUT = { veille: '#6B7280', interesse: '#B45309', inscrit: '#1D4ED8', cloture: '#0B7A4B' }

const champSx = { '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#F8FAF9' } }

const VIDE = { id: null, titre: '', type: 'hackathon', statut: 'veille', date_limite: '', lien: '', contact_nom: '', contact_email: '', notes: '' }

export default function Opportunites() {
  const [message, notify] = useFlash()
  const [onglet, setOnglet] = useState('hackathon')
  const [formOuvert, setFormOuvert] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [form, setForm] = useState(VIDE)
  const client = useQueryClient()

  const { data: opportunites = [] } = useQuery({
    queryKey: ['opportunites'], queryFn: () => api.getOpportunites(),
  })

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const reset = () => { setForm(VIDE); setFormOuvert(false) }

  const enregistrer = async () => {
    if (!form.titre.trim() || envoi) {
      if (!form.titre.trim()) notify('error', 'Le titre est requis.')
      return
    }
    setEnvoi(true)
    try {
      await api.sauverOpportunite({
        ...form,
        titre: form.titre.trim(),
        date_limite: form.date_limite || null,
      })
      client.invalidateQueries({ queryKey: ['opportunites'] })
      notify('success', form.id ? 'Opportunité mise à jour.' : 'Opportunité ajoutée à la veille.')
      reset()
    } catch (e) {
      notify('error', e.message ?? 'Enregistrement impossible')
    } finally {
      setEnvoi(false)
    }
  }

  const changerStatut = async (o, statut) => {
    try {
      await api.sauverOpportunite({ ...o, statut })
      client.invalidateQueries({ queryKey: ['opportunites'] })
    } catch (e) {
      notify('error', e.message ?? 'Changement impossible')
    }
  }

  const supprimer = async (id) => {
    try {
      await api.supprimerOpportunite(id)
      client.invalidateQueries({ queryKey: ['opportunites'] })
      notify('info', 'Opportunité supprimée.')
    } catch (e) {
      notify('error', e.message ?? 'Suppression impossible')
    }
  }

  const liste = opportunites.filter((o) => o.type === onglet)

  return (
    <Box sx={{ maxWidth: '100%' }}>
      <EnteteModule
        titre={<>Opportunités <Box component="span" sx={{ color: '#9AFBD7' }}>· veille</Box></>}
        sousTitre="Repérer, suivre, s'inscrire — plus aucune deadline ratée."
        actions={(
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setForm({ ...VIDE, type: onglet }); setFormOuvert(true) }}
            sx={{ bgcolor: '#1FAF72', '&:hover': { bgcolor: '#179963' }, fontWeight: 800, borderRadius: '12px' }}>
            Nouvelle opportunité
          </Button>
        )}
      />
      <MessageFlash message={message} />

      <Box sx={{ display: 'flex', gap: 1, mb: 2.5, flexWrap: 'wrap' }}>
        {TYPES.map((t) => {
          const n = opportunites.filter((o) => o.type === t.id && o.statut !== 'cloture').length
          return (
            <Chip key={t.id} label={n > 0 ? `${t.label} (${n})` : t.label} onClick={() => setOnglet(t.id)}
              sx={{
                fontWeight: 800, cursor: 'pointer', px: 1,
                bgcolor: onglet === t.id ? '#1FAF72' : '#fff', color: onglet === t.id ? '#fff' : '#374151',
                border: '1px solid #E5E7EB',
              }} />
          )
        })}
      </Box>

      {formOuvert && (
        <Box sx={{ bgcolor: '#fff', borderRadius: '18px', border: '1px solid #1FAF7245', p: { xs: 2.4, md: 3 }, display: 'grid', gap: 2, mb: 2.5 }}>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr' } }}>
            <TextField label="Titre *" value={form.titre} onChange={(e) => set('titre', e.target.value)} fullWidth sx={champSx} />
            <TextField select label="Type" value={form.type} onChange={(e) => set('type', e.target.value)} fullWidth sx={champSx}>
              {TYPES.map((t) => <MenuItem key={t.id} value={t.id}>{t.label.slice(0, -1)}</MenuItem>)}
            </TextField>
            <TextField type="date" label="Date limite" value={form.date_limite} onChange={(e) => set('date_limite', e.target.value)} fullWidth sx={champSx} InputLabelProps={{ shrink: true }} />
          </Box>
          <TextField label="Lien externe" value={form.lien} onChange={(e) => set('lien', e.target.value)} fullWidth sx={champSx} placeholder="https://…" />
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
            <TextField label="Contact (nom)" value={form.contact_nom} onChange={(e) => set('contact_nom', e.target.value)} fullWidth sx={champSx} />
            <TextField label="Contact (email)" value={form.contact_email} onChange={(e) => set('contact_email', e.target.value)} fullWidth sx={champSx} />
          </Box>
          <TextField label="Notes" value={form.notes} onChange={(e) => set('notes', e.target.value)} multiline rows={2} fullWidth sx={champSx} />
          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
            <Button onClick={reset} sx={{ color: '#5A6B63', fontWeight: 700 }}>Annuler</Button>
            <Button variant="contained" onClick={enregistrer} disabled={envoi}
              sx={{ bgcolor: '#1FAF72', '&:hover': { bgcolor: '#179963' }, fontWeight: 800, borderRadius: '12px' }}>
              {envoi ? 'Envoi…' : 'Enregistrer'}
            </Button>
          </Box>
        </Box>
      )}

      <Box sx={{ display: 'grid', gap: 1.4 }}>
        {liste.map((o) => (
          <Box key={o.id} sx={{ bgcolor: '#fff', borderRadius: '14px', border: '1px solid #E8ECEA', px: 2.4, py: 1.8 }}>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: '0.92rem' }}>
                  {o.lien ? <a href={o.lien} target="_blank" rel="noreferrer" style={{ color: '#111827' }}>{o.titre}</a> : o.titre}
                </Typography>
                <Typography variant="caption" sx={{ color: '#5A6B63' }}>
                  {[o.date_limite ? `Limite : ${new Date(o.date_limite).toLocaleDateString('fr-FR')}` : null,
                    o.contact_nom ? `Contact : ${o.contact_nom}${o.contact_email ? ` (${o.contact_email})` : ''}` : null]
                    .filter(Boolean).join(' · ') || '—'}
                </Typography>
                {o.notes && (
                  <Typography variant="body2" sx={{ color: '#374151', fontSize: '0.82rem', mt: 0.5 }}>{o.notes}</Typography>
                )}
              </Box>
              <TextField select size="small" value={o.statut} onChange={(e) => changerStatut(o, e.target.value)}
                sx={{ minWidth: 130, '& .MuiOutlinedInput-root': { borderRadius: '10px', fontWeight: 800, fontSize: '0.76rem', color: COULEUR_STATUT[o.statut] ?? '#374151' } }}>
                {STATUTS.map((s) => <MenuItem key={s.id} value={s.id}>{s.label}</MenuItem>)}
              </TextField>
              <IconButton size="small" aria-label="Modifier" onClick={() => { setForm({ id: o.id, titre: o.titre, type: o.type, statut: o.statut, date_limite: (o.date_limite ?? '').slice(0, 10), lien: o.lien ?? '', contact_nom: o.contact_nom ?? '', contact_email: o.contact_email ?? '', notes: o.notes ?? '' }); setFormOuvert(true) }} sx={{ color: '#2563EB' }}>
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" aria-label="Supprimer" onClick={() => supprimer(o.id)} sx={{ color: '#B42318' }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        ))}
        {liste.length === 0 && (
          <Typography sx={{ color: '#5A6B63', fontSize: '0.88rem' }}>
            Aucune opportunité suivie ici — ajoute la première avec le bouton ci-dessus.
          </Typography>
        )}
      </Box>
    </Box>
  )
}
