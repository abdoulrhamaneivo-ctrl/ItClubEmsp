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
 * Back-office — Suivi projets (P2/P7) : tableau par statut
 * (Idée / En cours / Terminé), création, avancement, suppression.
 */

const STATUTS = [
  { id: 'idee', label: 'Idées', couleur: '#6B7280', fond: '#F0F5F2' },
  { id: 'en_cours', label: 'En cours', couleur: '#1D4ED8', fond: '#E7F0FE' },
  { id: 'termine', label: 'Terminés', couleur: '#0B7A4B', fond: '#E4F8EF' },
]

const champSx = { '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#F8FAF9' } }

export default function Projets() {
  const [message, notify] = useFlash()
  const [formOuvert, setFormOuvert] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [form, setForm] = useState({ id: null, nom: '', description: '', statut: 'idee', lien: '' })
  const client = useQueryClient()

  const { data: projets = [] } = useQuery({
    queryKey: ['projets'], queryFn: () => api.getProjets(),
  })

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const reset = () => { setForm({ id: null, nom: '', description: '', statut: 'idee', lien: '' }); setFormOuvert(false) }

  const enregistrer = async () => {
    if (!form.nom.trim() || envoi) {
      if (!form.nom.trim()) notify('error', 'Le nom du projet est requis.')
      return
    }
    setEnvoi(true)
    try {
      await api.sauverProjet({ ...form, nom: form.nom.trim() })
      client.invalidateQueries({ queryKey: ['projets'] })
      notify('success', form.id ? 'Projet mis à jour.' : 'Projet ajouté au suivi.')
      reset()
    } catch (e) {
      notify('error', e.message ?? 'Enregistrement impossible')
    } finally {
      setEnvoi(false)
    }
  }

  const supprimer = async (id) => {
    try {
      await api.supprimerProjet(id)
      client.invalidateQueries({ queryKey: ['projets'] })
      notify('info', 'Projet supprimé.')
    } catch (e) {
      notify('error', e.message ?? 'Suppression impossible')
    }
  }

  const avancer = async (p) => {
    const ordre = ['idee', 'en_cours', 'termine']
    const suivant = ordre[Math.min(ordre.indexOf(p.statut) + 1, 2)]
    if (suivant === p.statut) return
    try {
      await api.sauverProjet({ id: p.id, nom: p.nom, description: p.description, statut: suivant, lien: p.lien })
      client.invalidateQueries({ queryKey: ['projets'] })
    } catch (e) {
      notify('error', e.message ?? 'Changement impossible')
    }
  }

  return (
    <Box sx={{ maxWidth: '100%' }}>
      <EnteteModule
        titre={<>Projets <Box component="span" sx={{ color: '#9AFBD7' }}>· suivi</Box></>}
        sousTitre="Idées, chantiers en cours, livrés — fais avancer d'un clic."
        actions={(
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { reset(); setFormOuvert(true) }}
            sx={{ bgcolor: '#1FAF72', '&:hover': { bgcolor: '#179963' }, fontWeight: 800, borderRadius: '12px' }}>
            Nouveau projet
          </Button>
        )}
      />
      <MessageFlash message={message} />

      {formOuvert && (
        <Box sx={{ bgcolor: '#fff', borderRadius: '18px', border: '1px solid #1FAF7245', p: { xs: 2.4, md: 3 }, display: 'grid', gap: 2, mb: 2.5 }}>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' } }}>
            <TextField label="Nom du projet *" value={form.nom} onChange={(e) => set('nom', e.target.value)} fullWidth sx={champSx} />
            <TextField select label="Statut" value={form.statut} onChange={(e) => set('statut', e.target.value)} fullWidth sx={champSx}>
              {STATUTS.map((s) => <MenuItem key={s.id} value={s.id}>{s.label}</MenuItem>)}
            </TextField>
          </Box>
          <TextField label="Description" value={form.description} onChange={(e) => set('description', e.target.value)} multiline rows={2} fullWidth sx={champSx} />
          <TextField label="Lien (repo, démo…)" value={form.lien} onChange={(e) => set('lien', e.target.value)} fullWidth sx={champSx} placeholder="https://…" />
          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
            <Button onClick={reset} sx={{ color: '#5A6B63', fontWeight: 700 }}>Annuler</Button>
            <Button variant="contained" onClick={enregistrer} disabled={envoi}
              sx={{ bgcolor: '#1FAF72', '&:hover': { bgcolor: '#179963' }, fontWeight: 800, borderRadius: '12px' }}>
              {envoi ? 'Envoi…' : 'Enregistrer'}
            </Button>
          </Box>
        </Box>
      )}

      <Box sx={{ display: 'grid', gap: 1.6, gridTemplateColumns: { xs: '1fr', md: 'repeat(3,1fr)' }, alignItems: 'start' }}>
        {STATUTS.map((s) => {
          const liste = projets.filter((p) => p.statut === s.id)
          return (
            <Box key={s.id} sx={{ bgcolor: '#F8FAF9', borderRadius: '16px', border: '1px solid #E8ECEA', p: 1.6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.2, px: 0.6 }}>
                <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: '0.9rem' }}>{s.label}</Typography>
                <Chip label={liste.length} size="small" sx={{ bgcolor: s.fond, color: s.couleur, fontWeight: 800, height: 22 }} />
              </Box>
              {liste.map((p) => (
                <Box key={p.id} sx={{ bgcolor: '#fff', borderRadius: '12px', border: '1px solid #E8ECEA', p: 1.6, mb: 1.2 }}>
                  <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: '0.88rem' }}>{p.nom}</Typography>
                  {p.description && (
                    <Typography variant="caption" sx={{ display: 'block', color: '#5A6B63', mt: 0.4, lineHeight: 1.6 }}>
                      {p.description}
                    </Typography>
                  )}
                  {(p.responsable_nom || p.cellule_nom || p.lien) && (
                    <Typography variant="caption" sx={{ display: 'block', color: '#6B7280', mt: 0.6 }}>
                      {[p.responsable_nom, p.cellule_nom ? `Cellule ${p.cellule_nom}` : null].filter(Boolean).join(' · ')}
                      {p.lien && (<> · <a href={p.lien} target="_blank" rel="noreferrer" style={{ color: '#0E7A50', fontWeight: 700 }}>lien</a></>)}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 1, alignItems: 'center' }}>
                    {p.statut !== 'termine' && (
                      <Button size="small" onClick={() => avancer(p)}
                        sx={{ color: '#0B7A4B', fontWeight: 800, fontSize: '0.72rem' }}>
                        Avancer →
                      </Button>
                    )}
                    <Box sx={{ flex: 1 }} />
                    <IconButton size="small" aria-label="Modifier" onClick={() => { setForm({ id: p.id, nom: p.nom, description: p.description ?? '', statut: p.statut, lien: p.lien ?? '' }); setFormOuvert(true) }} sx={{ color: '#2563EB' }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" aria-label="Supprimer" onClick={() => supprimer(p.id)} sx={{ color: '#B42318' }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              ))}
              {liste.length === 0 && (
                <Typography variant="caption" sx={{ color: '#9AA5B1', px: 0.6 }}>—</Typography>
              )}
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}
