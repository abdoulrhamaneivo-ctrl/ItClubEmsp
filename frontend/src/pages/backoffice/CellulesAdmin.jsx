import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import { api, urlMedia } from '../../lib/api'
import { EnteteModule, MessageFlash, useFlash, BoutonExport } from './_Commun'
import DialogueSuppression from './DialogueSuppression'

/**
 * Back-office — Cellules (P4) : créer, modifier, nommer le chef
 * (par email de compte), voir l'effectif. Alerte si < 3 membres.
 */

const champSx = { '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#F8FAF9' } }
const VIDE = { id: null, nom: '', slug: '', description: '', couleur: '#1FAF72', chef_email: '', imageFile: null }

export default function CellulesAdmin() {
  const [message, notify] = useFlash()
  const [formOuvert, setFormOuvert] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [form, setForm] = useState(VIDE)
  const client = useQueryClient()

  const { data: cellules = [] } = useQuery({
    queryKey: ['cellules'], queryFn: () => api.getCellules(),
  })

  const set = (k, v) => setForm((f) => {
    const n = { ...f, [k]: v }
    if (k === 'nom' && !f.id) {
      n.slug = v.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)
    }
    return n
  })
  const reset = () => { setForm(VIDE); setFormOuvert(false) }

  const enregistrer = async () => {
    if (!form.nom.trim() || envoi) {
      if (!form.nom.trim()) notify('error', 'Le nom de la cellule est requis.')
      return
    }
    setEnvoi(true)
    try {
      const corps = {
        nom: form.nom.trim(),
        description: form.description.trim(),
        couleur: form.couleur,
        chef_email: form.chef_email.trim(),
        imageFile: form.imageFile,
      }
      if (form.id) {
        await api.sauverCellule({ id: form.id, ...corps })
      } else {
        if (!form.slug.trim()) { notify('error', 'Le slug est requis.'); setEnvoi(false); return }
        await api.sauverCellule({ slug: form.slug.trim(), ...corps })
      }
      client.invalidateQueries({ queryKey: ['cellules'] })
      notify('success', form.id ? 'Cellule mise à jour.' : 'Cellule créée.')
      reset()
    } catch (e) {
      notify('error', e.message ?? 'Enregistrement impossible')
    } finally {
      setEnvoi(false)
    }
  }

  const supprimer = async (id) => {
    try {
      await api.supprimerCellule(id)
      client.invalidateQueries({ queryKey: ['cellules'] })
      notify('info', 'Cellule supprimée.')
    } catch (e) {
      notify('error', e.message ?? 'Suppression impossible')
    } finally {
      setASupprimer(null)
    }
  }
  const [aSupprimer, setASupprimer] = useState(null)

  return (
    <Box sx={{ maxWidth: '100%' }}>
      <DialogueSuppression demande={aSupprimer} nom={aSupprimer?.nom}
        onAnnuler={() => setASupprimer(null)}
        onConfirmer={async () => { await supprimer(aSupprimer.id) }} />
      <EnteteModule
        titre={<>Cellules <Box component="span" sx={{ color: '#9AFBD7' }}>· gestion</Box></>}
        sousTitre="Créer, animer, nommer les chefs — en sommeil sous 3 membres."
        actions={(
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { reset(); setFormOuvert(true) }}
            sx={{ bgcolor: '#1FAF72', '&:hover': { bgcolor: '#179963' }, fontWeight: 800, borderRadius: '12px' }}>
            Nouvelle cellule
          </Button>
        )}
      />
      <MessageFlash message={message} />

      {formOuvert && (
        <Box sx={{ bgcolor: '#fff', borderRadius: '18px', border: '1px solid #1FAF7245', p: { xs: 2.4, md: 3 }, display: 'grid', gap: 2, mb: 2.5 }}>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
            <TextField label="Nom *" value={form.nom} onChange={(e) => set('nom', e.target.value)} fullWidth sx={champSx} />
            <TextField label="Slug (identifiant URL)" value={form.slug} onChange={(e) => set('slug', e.target.value)} fullWidth sx={champSx} disabled={!!form.id} helperText={form.id ? 'Non modifiable après création' : ' '} />
          </Box>
          <TextField label="Description" value={form.description} onChange={(e) => set('description', e.target.value)} multiline rows={2} fullWidth sx={champSx} />
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
            <TextField label="Couleur" type="color" value={form.couleur} onChange={(e) => set('couleur', e.target.value)} fullWidth sx={champSx} />
            <TextField label="Chef (email du compte)" value={form.chef_email} onChange={(e) => set('chef_email', e.target.value)} fullWidth sx={champSx} placeholder="prenom.nom@emsp.int" helperText="Vide = pas de chef nommé" />
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
            <Button variant="outlined" component="label" sx={{ borderColor: '#1FAF72', color: '#0E7A50', fontWeight: 800, borderRadius: '12px' }}>
              {form.imageFile ? 'Changer le visuel' : 'Ajouter un visuel (photo)'}
              <input type="file" accept="image/*" hidden onChange={(e) => set('imageFile', e.target.files?.[0] ?? null)} />
            </Button>
            {form.imageFile && (
              <Typography variant="caption" sx={{ color: '#374151', fontWeight: 700 }}>{form.imageFile.name}</Typography>
            )}
          </Box>
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
        {cellules.map((c) => {
          const nb = c.membres ?? 0
          const sommeil = nb < 3
          return (
            <Box key={c.id} sx={{ bgcolor: '#fff', borderRadius: '14px', border: `1px solid ${sommeil ? '#F0B4B4' : '#E8ECEA'}`, px: 2.4, py: 1.8, display: 'flex', gap: 1.6, alignItems: 'center', flexWrap: 'wrap' }}>
              <Box sx={{ width: 44, height: 44, borderRadius: '12px', flexShrink: 0, overflow: 'hidden', background: `linear-gradient(135deg,${c.couleur ?? '#1FAF72'},#0D1B2A)` }}>
                {c.image && <Box component="img" src={urlMedia(c.image)} alt={c.nom} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              </Box>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: '0.92rem' }}>{c.nom}</Typography>
                <Typography variant="caption" sx={{ color: '#5A6B63' }}>
                  Chef : {c.chef_nom ?? '—'} · {nb} membre{nb > 1 ? 's' : ''}
                </Typography>
              </Box>
              {sommeil ? (
                <Chip label="En sommeil (< 3)" size="small" sx={{ bgcolor: '#FDECEC', color: '#B42318', fontWeight: 800 }} />
              ) : (
                <Chip label="Active" size="small" sx={{ bgcolor: '#E4F8EF', color: '#0B7A4B', fontWeight: 800 }} />
              )}
              <IconButton size="small" aria-label="Modifier" onClick={() => { setForm({ id: c.id, nom: c.nom, slug: c.slug ?? '', description: c.description ?? '', couleur: c.couleur ?? '#1FAF72', chef_email: '', imageFile: null }); setFormOuvert(true) }} sx={{ color: '#2563EB', width: 44, height: 44 }}>
                <EditIcon fontSize="small" />
              </IconButton>
              {c.slug && (
                <BoutonExport action={() => api.exporterMembresCellule(c.slug)} label="CSV" notify={notify} variant="contained" />
              )}
              <IconButton size="small" aria-label="Supprimer" onClick={() => setASupprimer(c)} sx={{ color: '#B42318', width: 44, height: 44 }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          )
        })}
      </Box>
      <Typography variant="caption" sx={{ display: 'block', mt: 2, color: '#5A6B63' }}>
        Pour nommer un chef, modifie la cellule et saisis l'email de son compte (vide = retirer).
      </Typography>
    </Box>
  )
}
