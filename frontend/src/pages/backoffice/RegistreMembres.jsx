import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { api } from '../../lib/api'
import { useAuth, hasRole } from '../../stores/auth'
import { BoutonExport } from './_Commun'

/**
 * Back-office — Registre membres : validation des candidatures en 1 clic.
 * GET /candidatures + POST valider/refuser. Rôles P1/P3/P4 (voir data/backoffice).
 */

const FILTRES = [
  { id: 'en_attente', label: 'En attente' },
  { id: 'validee', label: 'Validées' },
  { id: 'refusee', label: 'Refusées' },
  { id: 'toutes', label: 'Toutes' },
]

const COULEUR_STATUT = {
  en_attente: { fond: '#FFF6E0', texte: '#B45309', label: 'En attente' },
  validee: { fond: '#E4F8EF', texte: '#0B7A4B', label: 'Validée' },
  refusee: { fond: '#FDECEC', texte: '#B42318', label: 'Refusée' },
}

function nomComplet(donnees = {}) {
  const nom = [donnees.prenom, donnees.nom].filter(Boolean).join(' ').trim()
  return nom || donnees.email || 'Sans nom'
}

export default function RegistreMembres() {
  const [filtre, setFiltre] = useState('en_attente')
  const [ouverte, setOuverte] = useState(null)
  const [actionEnCours, setActionEnCours] = useState(null)
  const [message, setMessage] = useState(null)
  const user = useAuth((s) => s.user)
  const estAdmin = hasRole(user, ['ADMIN'])
  const client = useQueryClient()

  const { data: candidatures = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['candidatures'],
    queryFn: () => api.getCandidatures(),
  })
  const { data: cellules = [] } = useQuery({
    queryKey: ['cellules'],
    queryFn: () => api.getCellules(),
  })

  const nomsCellules = {}
  for (const c of cellules) {
    nomsCellules[c.id] = c.nom
    if (c.slug) nomsCellules[c.slug] = c.nom
  }

  const notify = (t, m) => { setMessage({ t, m }); setTimeout(() => setMessage(null), 4000) }

  // Le backend dit si l'email est vraiment parti (fail-open : skipped sinon)
  const statutEmail = (res) => {
    const e = res?.email
    if (!e) return ''
    if (e.skipped) return ` — email NON parti (${e.skipped})`
    return ' — email parti.'
  }

  const agir = async (id, action) => {
    setActionEnCours(`${action}:${id}`)
    try {
      const res = action === 'valider'
        ? await api.validerCandidature(id)
        : await api.refuserCandidature(id)
      client.invalidateQueries({ queryKey: ['candidatures'] })
      const skip = res?.email?.skipped
      notify(skip ? 'error' : 'success', action === 'valider'
        ? `Candidature validée — compte créé${res.compte_cree === false ? ' (déjà existant)' : ''}${statutEmail(res)}`
        : `Candidature refusée${statutEmail(res)}`)
    } catch (e) {
      notify('error', e.message ?? 'Action impossible')
    } finally {
      setActionEnCours(null)
    }
  }

  const visibles = filtre === 'toutes'
    ? candidatures
    : candidatures.filter((c) => c.statut === filtre)
  const enAttente = candidatures.filter((c) => c.statut === 'en_attente').length

  return (
    <Box sx={{ maxWidth: '100%' }}>
      <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <Box sx={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3,
          background: 'linear-gradient(135deg,#0D1B2A 0%,#0F5B3A 100%)',
          borderRadius: '20px', px: 3.5, py: 3,
        }}>
          <Box>
            <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: '1.45rem', color: '#fff' }}>
              Registre membres <Box component="span" sx={{ color: '#9AFBD7' }}>· candidatures</Box>
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,.78)', mt: 0.5 }}>
              {enAttente === 0 ? 'Aucune candidature en attente — tout est traité.' : `${enAttente} candidature${enAttente > 1 ? 's' : ''} en attente de décision.`}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {estAdmin && (
              <BoutonExport action={() => api.exporterMembres()} label="Annuaire CSV" notify={notify} />
            )}
            {FILTRES.map((f) => (
              <Chip key={f.id} label={f.id === 'en_attente' && enAttente > 0 ? `${f.label} (${enAttente})` : f.label}
                onClick={() => setFiltre(f.id)}
                sx={{
                  fontWeight: 800, cursor: 'pointer',
                  bgcolor: filtre === f.id ? '#1FAF72' : 'rgba(255,255,255,.12)',
                  color: '#fff',
                  '&:hover': { bgcolor: filtre === f.id ? '#179963' : 'rgba(255,255,255,.22)' },
                }} />
            ))}
          </Box>
        </Box>
      </motion.div>

      <AnimatePresence>
        {message && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Alert severity={message.t === 'success' ? 'success' : 'error'} sx={{ mb: 2, borderRadius: '12px' }}>
              {message.m}
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress sx={{ color: '#1FAF72' }} />
        </Box>
      )}
      {isError && (
        <Alert severity="error" sx={{ borderRadius: '12px' }}>
          Chargement impossible.{' '}
          <Button size="small" onClick={() => refetch()} sx={{ fontWeight: 800 }}>Réessayer</Button>
        </Alert>
      )}

      {!isLoading && !isError && visibles.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 6, bgcolor: '#fff', borderRadius: '18px', border: '1px solid #E8ECEA' }}>
          <Typography sx={{ color: '#5A6B63' }}>
            Rien dans « {FILTRES.find((f) => f.id === filtre)?.label} ».
          </Typography>
        </Box>
      )}

      <Box sx={{ display: 'grid', gap: 1.6 }}>
        {visibles.map((c, i) => {
          const st = COULEUR_STATUT[c.statut] ?? COULEUR_STATUT.en_attente
          const estOuverte = ouverte === c.id
          const enCours = actionEnCours?.endsWith(`:${c.id}`)
          const champs = Object.entries(c.donnees ?? {}).filter(([k]) => !['prenom', 'nom'].includes(k))
          return (
            <motion.div key={c.id}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.3), duration: 0.28 }}>
              <Box sx={{ bgcolor: '#fff', borderRadius: '16px', border: '1px solid #E8ECEA', overflow: 'hidden' }}>
                <Box onClick={() => setOuverte(estOuverte ? null : c.id)}
                  sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.2, cursor: 'pointer', '&:hover': { bgcolor: '#F6FBF9' } }}>
                  <Box sx={{
                    width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg,#0F5B3A,#1FAF72)',
                    display: 'grid', placeItems: 'center',
                    color: '#fff', fontWeight: 800, fontSize: '1rem',
                  }}>
                    {nomComplet(c.donnees).slice(0, 1).toUpperCase()}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: '0.95rem' }}>
                      {nomComplet(c.donnees)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#5A6B63', display: 'block' }}>
                      {c.donnees?.email ?? ''}{c.donnees?.filiere ? ` · ${c.donnees.filiere}` : ''}
                    </Typography>
                  </Box>
                  <Chip label={st.label} size="small" sx={{ bgcolor: st.fond, color: st.texte, fontWeight: 800, flexShrink: 0 }} />
                  <ExpandMoreIcon sx={{
                    color: '#6B7280', flexShrink: 0,
                    transform: estOuverte ? 'rotate(180deg)' : 'none', transition: 'transform 200ms',
                  }} />
                </Box>

                <AnimatePresence initial={false}>
                  {estOuverte && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
                      <Box sx={{ px: 2.2, pb: 2.2, pt: 0.5, borderTop: '1px solid #EEF2F0' }}>
                        {champs.map(([k, v]) => (
                          <Box key={k} sx={{ display: 'flex', gap: 2, py: 0.8 }}>
                            <Typography variant="caption" sx={{ width: 130, flexShrink: 0, color: '#5A6B63', fontWeight: 700, textTransform: 'capitalize' }}>
                              {k.replace(/_/g, ' ')}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#111827', wordBreak: 'break-word' }}>
                              {String(v)}
                            </Typography>
                          </Box>
                        ))}
                        {(c.cellules_souhaitees ?? []).length > 0 && (
                          <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                            {(c.cellules_souhaitees ?? []).map((ref) => (
                              <Chip key={ref} label={nomsCellules[ref] ?? `Cellule ${ref}`} size="small"
                                sx={{ bgcolor: '#E4F8EF', color: '#0B7A4B', fontWeight: 700 }} />
                            ))}
                          </Box>
                        )}
                        <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#6B7280' }}>
                          Reçue le {c.cree_le ? new Date(c.cree_le).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                        </Typography>
                        {c.statut === 'en_attente' && (
                          <Box sx={{ display: 'flex', gap: 1.2, mt: 1.6 }}>
                            <Button variant="contained" startIcon={enCours ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <CheckIcon />}
                              disabled={!!actionEnCours} onClick={() => agir(c.id, 'valider')}
                              sx={{ bgcolor: '#1FAF72', '&:hover': { bgcolor: '#179963' }, fontWeight: 800, borderRadius: '12px' }}>
                              Valider
                            </Button>
                            <Button variant="outlined" startIcon={<CloseIcon />}
                              disabled={!!actionEnCours} onClick={() => agir(c.id, 'refuser')}
                              sx={{ borderColor: '#F0B4B4', color: '#B42318', fontWeight: 800, borderRadius: '12px' }}>
                              Refuser
                            </Button>
                          </Box>
                        )}
                      </Box>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Box>
            </motion.div>
          )
        })}
      </Box>
    </Box>
  )
}
