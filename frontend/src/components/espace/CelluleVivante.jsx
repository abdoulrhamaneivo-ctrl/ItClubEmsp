import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import TextField from '@mui/material/TextField'
import Divider from '@mui/material/Divider'
import ForumIcon from '@mui/icons-material/Forum'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { IcCalendrier } from '../ui-components/IconesClub'
import { api } from '../../lib/api'

const STATUTS = {
  proposee: { label: 'Proposée', couleur: '#F5A623' },
  examinee: { label: 'À l\u2019étude', couleur: '#2563EB' },
  adoptee: { label: 'Adoptée ✓', couleur: '#1FAF72' },
  refusee: { label: 'Non retenue', couleur: '#B42318' },
}

/**
 * CelluleVivante — l'espace dédié de la cellule du membre :
 * programmation, forum de la cellule, activités à venir, propositions.
 */
export default function CelluleVivante({ cellule, sombre }) {
  const navigate = useNavigate()
  const [propositions, setPropositions] = useState(null)
  const [form, setForm] = useState({ titre: '', detail: '' })
  const [envoi, setEnvoi] = useState(false)
  const [retour, setRetour] = useState(null)

  useEffect(() => {
    if (!cellule?.slug) return
    api.getPropositions(cellule.slug)
      .then((d) => setPropositions(d?.results ?? d ?? []))
      .catch(() => setPropositions([]))
  }, [cellule?.slug])

  if (!cellule) return null
  const accent = sombre ? cellule.couleur : cellule.couleurFonce
  const programme = (cellule.programme ?? []).filter(Boolean)

  const proposer = async () => {
    if (envoi) return
    if (form.titre.trim().length < 5) {
      setRetour({ ok: false, m: 'Donne un titre clair (5 caractères minimum).' })
      return
    }
    setEnvoi(true)
    try {
      const p = await api.proposer(cellule.slug, form.titre.trim(), form.detail.trim())
      setPropositions((l) => [p, ...(l ?? [])])
      setForm({ titre: '', detail: '' })
      setRetour({ ok: true, m: 'Proposition envoyée — ton chef de cellule la verra.' })
    } catch (e) {
      setRetour({ ok: false, m: e.message ?? 'Envoi impossible.' })
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <Box sx={{ display: 'grid', gap: 2.5 }}>
      {/* ── Actions rapides ── */}
      <Box sx={{ display: 'flex', gap: 1.2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={<ForumIcon sx={{ fontSize: 18 }} />}
          endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
          onClick={() => navigate(`/forum?cellule=${cellule.slug}`)}
          sx={{ bgcolor: '#1FAF72', '&:hover': { bgcolor: '#179963' }, fontWeight: 800, borderRadius: '12px', minHeight: 44, fontSize: '0.875rem' }}
        >
          Discussions de la cellule
        </Button>
      </Box>

      {/* ── Programmation ── */}
      {programme.length > 0 && (
        <Box sx={{ p: 2.2, borderRadius: '14px', bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(154,251,215,.05)' : '#F5F7F6', border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.5 }}>
            <IcCalendrier taille={16} couleur={accent} />
            <Typography sx={{ fontWeight: 800, fontSize: '0.875rem', color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Programmation de la cellule
            </Typography>
          </Box>
          <Box sx={{ display: 'grid', gap: 1 }}>
            {programme.map((ligne, i) => (
              <Typography key={i} sx={{ display: 'flex', gap: 1, fontSize: '0.875rem', color: 'text.secondary', lineHeight: 1.7 }}>
                <Box component="span" sx={{ color: accent, fontWeight: 800 }}>→</Box>
                {String(ligne).replace(/^[•\-\s]+/, '')}
              </Typography>
            ))}
          </Box>
        </Box>
      )}

      <Divider />

      {/* ── Propositions ── */}
      <Box>
        <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: 'text.primary', mb: 0.5 }}>
          Tes propositions
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.812rem', lineHeight: 1.6, mb: 2 }}>
          Une idée d'atelier, de projet, une amélioration ? Propose — ton chef de cellule suit chaque proposition.
        </Typography>

        {retour && (
          <Box role="status" aria-live="polite" sx={{
            mb: 2, p: 1.5, borderRadius: '10px', fontSize: '0.812rem', fontWeight: 700,
            bgcolor: retour.ok ? 'rgba(31,175,114,.12)' : 'rgba(180,35,24,.1)',
            color: retour.ok ? '#1FAF72' : '#B42318',
          }}>
            {retour.m}
          </Box>
        )}

        <Box sx={{ display: 'grid', gap: 1.4, mb: 2.5 }}>
          <TextField
            label="Titre de ta proposition"
            value={form.titre}
            onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))}
            fullWidth
            inputProps={{ maxLength: 140 }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
          />
          <TextField
            label="Détails (optionnel)"
            value={form.detail}
            onChange={(e) => setForm((f) => ({ ...f, detail: e.target.value }))}
            fullWidth
            multiline
            minRows={2}
            maxRows={4}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
          />
          <Button
            variant="contained"
            onClick={proposer}
            disabled={envoi}
            sx={{ bgcolor: '#1FAF72', '&:hover': { bgcolor: '#179963' }, fontWeight: 800, borderRadius: '12px', minHeight: 44, justifySelf: 'start', fontSize: '0.875rem' }}
          >
            {envoi ? 'Envoi…' : 'Envoyer la proposition'}
          </Button>
        </Box>

        {propositions === null ? (
          <Typography sx={{ color: 'text.secondary', fontSize: '0.812rem' }}>Chargement…</Typography>
        ) : propositions.length === 0 ? (
          <Typography sx={{ color: 'text.secondary', fontSize: '0.812rem' }}>
            Aucune proposition pour l'instant — sois le premier.
          </Typography>
        ) : (
          <Box sx={{ display: 'grid', gap: 1.2 }}>
            {propositions.map((prop) => {
              const st = STATUTS[prop.statut] ?? STATUTS.proposee
              return (
                <Box key={prop.id} sx={{
                  p: 1.8, borderRadius: '12px',
                  bgcolor: (t) => t.palette.background.paper,
                  border: '1px solid', borderColor: 'divider',
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                    <Chip
                      label={st.label}
                      size="small"
                      sx={{ bgcolor: `${st.couleur}1F`, color: st.couleur, fontWeight: 800, fontSize: '0.7rem', height: 22 }}
                    />
                    <Typography sx={{ color: 'text.secondary', fontSize: '0.7rem', fontWeight: 700 }}>
                      {prop.auteur_nom || 'Membre'}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontWeight: 800, fontSize: '0.875rem', color: 'text.primary' }}>
                    {prop.titre}
                  </Typography>
                  {prop.detail && (
                    <Typography sx={{ color: 'text.secondary', fontSize: '0.812rem', lineHeight: 1.6, mt: 0.5 }}>
                      {prop.detail}
                    </Typography>
                  )}
                </Box>
              )
            })}
          </Box>
        )}
      </Box>
    </Box>
  )
}
