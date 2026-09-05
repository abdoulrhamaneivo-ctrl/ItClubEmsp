import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import { api } from '../lib/api'
import { useAuth } from '../stores/auth'
import TitreSection from '../components/ui-components/TitreSection'
import FondPropre from '../components/ui-components/FondPropre'

/**
 * Veille technologique (P7, doc 02 D8) : liens partagés par les membres,
 * upvotables, par thématique. Interne — réservé aux membres connectés.
 */

const THEMES = [
  { id: 'tous', label: 'Tout', couleur: '#1FAF72' },
  { id: 'ia', label: 'IA & Data', couleur: '#7B61FF' },
  { id: 'web', label: 'Web & Mobile', couleur: '#2563EB' },
  { id: 'cyber', label: 'Cybersécurité', couleur: '#B42318' },
  { id: 'cloud', label: 'Cloud & DevOps', couleur: '#B45309' },
  { id: 'autre', label: 'Autre', couleur: '#6B7280' },
]

const champSx = { '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#F8FAF9' } }

export default function Veille() {
  const user = useAuth((s) => s.user)
  const [theme, setTheme] = useState('tous')
  const [formOuvert, setFormOuvert] = useState(false)
  const [message, setMessage] = useState(null)
  const client = useQueryClient()

  const { data: veilles = [], isLoading } = useQuery({
    queryKey: ['veille'], queryFn: () => api.getVeille(),
  })

  const notify = (t, m) => { setMessage({ t, m }); setTimeout(() => setMessage(null), 4000) }
  const visibles = theme === 'tous' ? veilles : veilles.filter((v) => v.theme === theme)

  const supprimer = async (id) => {
    try {
      await api.supprimerVeille(id)
      client.invalidateQueries({ queryKey: ['veille'] })
    } catch (e) {
      notify('error', e.message ?? 'Suppression impossible')
    }
  }

  return (
    <Box sx={{ pt: { xs: 11, md: 13 }, pb: { xs: 4, md: 6 }, position: 'relative', minHeight: '70vh' }}>
      <FondPropre variante="doux" />
      <Container maxWidth={false} sx={{ position: 'relative', maxWidth: '1100px !important', px: { xs: 2.5, md: 4 } }}>
        <TitreSection
          badge="Membres"
          titre="Veille techno"
          sousTitre="Les liens qui comptent, partagés et votés par le club."
          couleur="#2563EB"
        />
        {message && (
          <Box sx={{ mb: 2, p: 1.6, borderRadius: '12px', bgcolor: '#FDECEC', color: '#B42318', fontWeight: 700, fontSize: '0.86rem' }}>
            {message.m}
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 1, mb: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
          {THEMES.map((t) => (
            <Chip key={t.id} label={t.label} onClick={() => setTheme(t.id)}
              sx={{ fontWeight: 800, cursor: 'pointer',
                bgcolor: theme === t.id ? t.couleur : '#fff',
                color: theme === t.id ? '#fff' : '#374151', border: '1px solid #E5E7EB' }} />
          ))}
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormOuvert(!formOuvert)}
            sx={{ bgcolor: '#2563EB', '&:hover': { bgcolor: '#1D4ED8' }, fontWeight: 800, borderRadius: '12px' }}>
            Partager un lien
          </Button>
        </Box>

        {formOuvert && (
          <FormulaireVeille
            onFait={() => { setFormOuvert(false); client.invalidateQueries({ queryKey: ['veille'] }) }}
            onErreur={(m) => notify('error', m)}
          />
        )}

        {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress sx={{ color: '#2563EB' }} /></Box>}
        {!isLoading && visibles.length === 0 && (
          <Typography sx={{ color: '#5A6B63', py: 4, textAlign: 'center' }}>
            Aucun lien ici — partage le premier !
          </Typography>
        )}
        <Box sx={{ display: 'grid', gap: 1.4 }}>
          <AnimatePresence initial={false}>
            {visibles.map((v, i) => (
              <CarteVeille key={v.id} v={v} index={i} user={user} onVote={() => client.invalidateQueries({ queryKey: ['veille'] })} onErreur={notify} onSupprimer={supprimer} />
            ))}
          </AnimatePresence>
        </Box>
      </Container>
    </Box>
  )
}

/* ── Création ───────────────────────────────────────────────── */
function FormulaireVeille({ onFait, onErreur }) {
  const [titre, setTitre] = useState('')
  const [lien, setLien] = useState('')
  const [theme, setTheme] = useState('ia')
  const [resume, setResume] = useState('')
  const [envoi, setEnvoi] = useState(false)

  const partager = async () => {
    if (!titre.trim() || !lien.trim() || envoi) {
      if (!titre.trim() || !lien.trim()) onErreur('Titre et lien sont requis.')
      return
    }
    setEnvoi(true)
    try {
      await api.creerVeille({ titre: titre.trim(), lien: lien.trim(), theme, resume: resume.trim() })
      onFait()
    } catch (e) {
      onErreur(e.message ?? 'Partage impossible')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <Box sx={{ bgcolor: '#fff', borderRadius: '16px', border: '1px solid #2563EB45', p: 2.4, display: 'grid', gap: 1.6, mb: 2 }}>
      <Box sx={{ display: 'grid', gap: 1.6, gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' } }}>
        <TextField label="Titre *" value={titre} onChange={(e) => setTitre(e.target.value)} fullWidth sx={champSx} />
        <TextField select label="Thématique" value={theme} onChange={(e) => setTheme(e.target.value)} fullWidth sx={champSx}>
          {THEMES.filter((t) => t.id !== 'tous').map((t) => <MenuItem key={t.id} value={t.id}>{t.label}</MenuItem>)}
        </TextField>
      </Box>
      <TextField label="Lien *" value={lien} onChange={(e) => setLien(e.target.value)} fullWidth sx={champSx}
        placeholder="https://…" />
      <TextField label="Résumé (pourquoi ça vaut le coup)" value={resume} onChange={(e) => setResume(e.target.value)} multiline rows={2} fullWidth sx={champSx} />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" onClick={partager} disabled={envoi}
          sx={{ bgcolor: '#2563EB', '&:hover': { bgcolor: '#1D4ED8' }, fontWeight: 800, borderRadius: '12px' }}>
          {envoi ? 'Envoi…' : 'Partager'}
        </Button>
      </Box>
    </Box>
  )
}

/* ── Carte + vote ───────────────────────────────────────────── */
function CarteVeille({ v, index, user, onVote, onErreur, onSupprimer }) {
  const [donnees, setDonnees] = useState(v)
  const [envoi, setEnvi] = useState(false)
  const theme = THEMES.find((t) => t.id === donnees.theme) ?? THEMES[5]

  const voter = async () => {
    if (envoi) return
    setEnvi(true)
    try {
      const res = await api.voterVeille(donnees.id)
      setDonnees(res.ressource)
      onVote()
    } catch (e) {
      onErreur('error', e.message ?? 'Vote impossible')
    } finally {
      setEnvi(false)
    }
  }

  return (
    <motion.div key={donnees.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: Math.min(index * 0.04, 0.3), duration: 0.25 }}>
      <Box sx={{
        bgcolor: '#fff', borderRadius: '14px', border: '1px solid #E8ECEA',
        px: 2.4, py: 1.8, display: 'flex', gap: 1.6, alignItems: 'flex-start',
      }}>
        {/* Bouton vote */}
        <Box component="button" onClick={voter} disabled={envoi}
          sx={{
            display: 'grid', placeItems: 'center', gap: 0, flexShrink: 0, cursor: 'pointer',
            width: 46, py: 0.8, borderRadius: '12px', border: '1px solid', fontFamily: 'inherit',
            borderColor: donnees.jai_vote ? '#2563EB' : '#E5E7EB',
            bgcolor: donnees.jai_vote ? '#2563EB' : '#fff', color: donnees.jai_vote ? '#fff' : '#374151',
            transition: 'all 160ms ease',
            '&:hover': { borderColor: '#2563EB' },
          }}>
          <ArrowUpwardIcon sx={{ fontSize: 18 }} />
          <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', lineHeight: 1 }}>{donnees.votes_count}</Typography>
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box component="a" href={donnees.lien} target="_blank" rel="noopener"
            sx={{ display: 'flex', gap: 0.8, alignItems: 'center', textDecoration: 'none', minWidth: 0 }}>
            <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: '0.94rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', '&:hover': { color: '#2563EB' } }}>
              {donnees.titre}
            </Typography>
            <OpenInNewIcon sx={{ fontSize: 15, color: '#9CA3AF', flexShrink: 0 }} />
          </Box>
          {donnees.resume && (
            <Typography variant="body2" sx={{ color: '#5A6B63', fontSize: '0.82rem', lineHeight: 1.55, mt: 0.3 }}>
              {donnees.resume}
            </Typography>
          )}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.7, flexWrap: 'wrap' }}>
            <Chip label={donnees.theme_label ?? theme.label} size="small"
              sx={{ bgcolor: `${theme.couleur}14`, color: theme.couleur, fontWeight: 800, height: 22 }} />
            <Typography variant="caption" sx={{ color: '#6B7280' }}>
              par {donnees.auteur} · {new Date(donnees.cree_le).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </Typography>
          </Box>
        </Box>

        {user && donnees.auteur === (user.prenom ? `${user.prenom} ${user.nom}` : user.username) && (
          <Button size="small" onClick={() => onSupprimer(donnees.id)} sx={{ color: '#B42318', minWidth: 0, flexShrink: 0 }}>
            <DeleteIcon fontSize="small" />
          </Button>
        )}
      </Box>
    </motion.div>
  )
}
