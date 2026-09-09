import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import { api } from '../../lib/api'

const STATUTS = {
  proposee: { label: 'Proposée', couleur: '#F5A623' },
  examinee: { label: 'À l’étude', couleur: '#2563EB' },
  adoptee: { label: 'Adoptée', couleur: '#1FAF72' },
  refusee: { label: 'Non retenue', couleur: '#B42318' },
}

/** Module backoffice : toutes les propositions des cellules, avec changement de statut. */
export default function Propositions() {
  const qc = useQueryClient()
  const [filtre, setFiltre] = useState('tous')
  const { data } = useQuery({ queryKey: ['propositions'], queryFn: () => api.getPropositions() })
  const liste = (data?.results ?? data ?? [])
    .filter((p) => filtre === 'tous' || p.statut === filtre)

  const changerStatut = async (id, statut) => {
    await api.changerStatutProposition(id, statut)
    qc.invalidateQueries({ queryKey: ['propositions'] })
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 2.5 }}>
        <Box>
          <Typography sx={{ color: '#fff', fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: '1.1rem' }}>
            Propositions des cellules
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,.55)', fontSize: '0.812rem' }}>
            Idées des membres — passe-les de « Proposée » à « Adoptée » quand le club les retient.
          </Typography>
        </Box>
        <TextField
          select size="small" value={filtre} onChange={(e) => setFiltre(e.target.value)}
          sx={{ minWidth: 170, '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,.06)', color: '#fff' } }}
        >
          <MenuItem value="tous">Tous les statuts</MenuItem>
          {Object.entries(STATUTS).map(([k, s]) => (
            <MenuItem key={k} value={k}>{s.label}</MenuItem>
          ))}
        </TextField>
      </Box>

      {liste.length === 0 ? (
        <Typography sx={{ color: 'rgba(255,255,255,.5)', fontSize: '0.875rem', py: 3, textAlign: 'center' }}>
          Aucune proposition pour ce filtre.
        </Typography>
      ) : (
        <Box sx={{ display: 'grid', gap: 1.4 }}>
          {liste.map((p) => {
            const st = STATUTS[p.statut] ?? STATUTS.proposee
            return (
              <Box key={p.id} sx={{
                p: 2, borderRadius: '12px',
                bgcolor: 'rgba(255,255,255,.05)', border: '1px solid rgba(154,251,215,.14)',
                display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap',
              }}>
                <Box sx={{ flex: 1, minWidth: 220 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.4 }}>
                    <Chip label={st.label} size="small"
                      sx={{ bgcolor: `${st.couleur}22`, color: st.couleur, fontWeight: 800, fontSize: '0.7rem', height: 22 }} />
                    <Typography sx={{ color: 'rgba(255,255,255,.55)', fontSize: '0.7rem', fontWeight: 700 }}>
                      {p.cellule_nom} · {p.auteur_nom || 'Membre'}
                    </Typography>
                  </Box>
                  <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '0.9rem' }}>{p.titre}</Typography>
                  {p.detail && (
                    <Typography sx={{ color: 'rgba(255,255,255,.6)', fontSize: '0.812rem', lineHeight: 1.6 }}>
                      {p.detail}
                    </Typography>
                  )}
                </Box>
                <TextField
                  select size="small" label="Statut" value={p.statut}
                  onChange={(e) => changerStatut(p.id, e.target.value)}
                  sx={{ minWidth: 150, '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,.08)', color: '#fff' } }}
                >
                  {Object.entries(STATUTS).map(([k, s]) => (
                    <MenuItem key={k} value={k}>{s.label}</MenuItem>
                  ))}
                </TextField>
              </Box>
            )
          })}
        </Box>
      )}
    </Box>
  )
}
