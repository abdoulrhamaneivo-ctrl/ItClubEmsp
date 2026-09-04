import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import SendIcon from '@mui/icons-material/Send'
import { api } from '../../lib/api'
import { useContenu } from '../../lib/contenu'
import { EnteteModule, MessageFlash, useFlash } from './_Commun'

/**
 * Back-office — Annonces (P1/P5/chef de cellule).
 * Publie une actualité (vitrine) + email auto à l'audience
 * (tous les membres OU une cellule — envoi coté API).
 */

const champSx = { '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#F8FAF9' } }

export default function Annonces() {
  const [message, notify] = useFlash()
  const [titre, setTitre] = useState('')
  const [extrait, setExtrait] = useState('')
  const [cellule, setCellule] = useState('tous')
  const [envoi, setEnvoi] = useState(false)
  const client = useQueryClient()

  const items = useContenu('actualites')
  const { data: cellules = [] } = useQuery({
    queryKey: ['cellules'], queryFn: () => api.getCellules(),
  })
  const idParSlug = {}
  for (const c of cellules) {
    if (c.slug) idParSlug[c.slug] = c.id
    if (c.id != null) idParSlug[String(c.id)] = c.id
  }

  const publier = async () => {
    if (!titre.trim() || !extrait.trim() || envoi) return
    setEnvoi(true)
    try {
      await api.publierAnnonce({
        titre: titre.trim(),
        extrait: extrait.trim(),
        tag_cellule: cellule === 'tous' ? null : (idParSlug[cellule] ?? null),
      })
      client.invalidateQueries({ queryKey: ['actualites'] })
      notify('success', cellule === 'tous'
        ? 'Annonce publiée sur la vitrine — email envoyé à tous les membres.'
        : 'Annonce publiée — email envoyé aux membres de la cellule.')
      setTitre(''); setExtrait(''); setCellule('tous')
    } catch (e) {
      notify('error', e.message ?? 'Publication impossible')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <Box sx={{ maxWidth: '100%' }}>
      <EnteteModule
        titre={<>Annonces <Box component="span" sx={{ color: '#9AFBD7' }}>· publication</Box></>}
        sousTitre="Vitrine + email d'un coup — choisis qui reçoit."
      />
      <MessageFlash message={message} />

      <Box sx={{ bgcolor: '#fff', borderRadius: '18px', border: '1px solid #E8ECEA', p: { xs: 2.5, md: 3.2 }, display: 'grid', gap: 2, mb: 2.5 }}>
        <TextField label="Titre de l'annonce *" value={titre} onChange={(e) => setTitre(e.target.value)}
          fullWidth sx={champSx} placeholder="Ex. Réunion générale vendredi" />
        <TextField label="Contenu *" value={extrait} onChange={(e) => setExtrait(e.target.value)}
          multiline rows={3} fullWidth sx={champSx} placeholder="Les infos essentielles…" />
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, alignItems: 'center' }}>
          <TextField select label="Audience" value={cellule} onChange={(e) => setCellule(e.target.value)} fullWidth sx={champSx}>
            <MenuItem value="tous">Tous les membres (email à tous)</MenuItem>
            {cellules.filter((c) => c.slug).map((c) => (
              <MenuItem key={c.slug} value={c.slug}>Cellule {c.nom} (email ciblé)</MenuItem>
            ))}
          </TextField>
          <Button variant="contained" startIcon={envoi ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <SendIcon />}
            disabled={!titre.trim() || !extrait.trim() || envoi} onClick={publier}
            sx={{ bgcolor: '#1FAF72', '&:hover': { bgcolor: '#179963' }, fontWeight: 800, borderRadius: '12px', py: 1.4 }}>
            {envoi ? 'Publication…' : 'Publier + envoyer'}
          </Button>
        </Box>
      </Box>

      <Typography sx={{ fontWeight: 800, color: '#111827', mb: 1.2 }}>
        Dernières annonces publiées
      </Typography>
      <Box sx={{ display: 'grid', gap: 1.2 }}>
        {items.slice(0, 6).map((a) => (
          <Box key={a.id} sx={{ bgcolor: '#fff', borderRadius: '12px', border: '1px solid #E8ECEA', px: 2.2, py: 1.5, display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {a.titre}
              </Typography>
              <Typography variant="caption" sx={{ color: '#5A6B63' }}>
                {(a.date ?? '').slice(0, 10)} · {a.tag ?? 'Annonce'}
              </Typography>
            </Box>
            <Chip label={a.cellule === 'general' ? 'Tous' : a.cellule} size="small"
              sx={{ bgcolor: '#F0F5F2', color: '#374151', fontWeight: 700, height: 22, flexShrink: 0 }} />
          </Box>
        ))}
        {items.length === 0 && (
          <Typography sx={{ color: '#5A6B63', fontSize: '0.88rem' }}>Rien publié pour le moment.</Typography>
        )}
      </Box>
    </Box>
  )
}
