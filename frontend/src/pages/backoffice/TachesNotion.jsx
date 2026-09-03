import { useMemo } from 'react'
import { motion } from 'framer-motion'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'
import LinearProgress from '@mui/material/LinearProgress'
import RefreshIcon from '@mui/icons-material/Refresh'
import SyncIcon from '@mui/icons-material/Sync'
import TaskAltIcon from '@mui/icons-material/TaskAlt'
import NotStartedIcon from '@mui/icons-material/RadioButtonUnchecked'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import useNotionTasks from '../../features/notion/useNotionTasks'

const STATUTS = ['À faire', 'En cours', 'Terminé']
const COULEURS_STATUT = {
  'À faire': { bg: '#FDECEC', fg: '#B42318', icon: <NotStartedIcon sx={{ fontSize: 15 }} /> },
  'En cours': { bg: '#E7F0FE', fg: '#175CD3', icon: <AutorenewIcon sx={{ fontSize: 15 }} /> },
  'Terminé': { bg: '#E4F8EF', fg: '#0E9F6E', icon: <TaskAltIcon sx={{ fontSize: 15 }} /> },
}
const COULEURS_PRIORITE = {
  Haute: { bg: '#FDECEC', fg: '#B42318' },
  Moyenne: { bg: '#FEF4E6', fg: '#B54708' },
  Basse: { bg: '#E4F8EF', fg: '#0E9F6E' },
}

function Kpi({ valeur, label, couleur, icone, delai }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: delai, ease: [0.22, 1, 0.36, 1] }}
    >
      <Paper elevation={0} sx={{
        p: 2.5, borderRadius: '16px', display: 'flex', alignItems: 'center', gap: 2,
        bgcolor: '#FFFFFF', border: '1px solid #E3EEE8',
        boxShadow: '0 8px 24px rgba(15,91,58,0.07)',
      }}>
        <Box sx={{
          width: 46, height: 46, borderRadius: '12px', display: 'grid', placeItems: 'center',
          bgcolor: `${couleur}14`, color: couleur, flexShrink: 0,
        }}>{icone}</Box>
        <Box>
          <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: '1.55rem', lineHeight: 1, color: '#0D1B2A' }}>
            {valeur}
          </Typography>
          <Typography variant="caption" sx={{ color: '#5A6B63', fontWeight: 600 }}>{label}</Typography>
        </Box>
      </Paper>
    </motion.div>
  )
}

/** Back-office — module Tâches Notion (lecture + mise à jour statut en temps réel). */
export default function TachesNotion() {
  const { taches, source, erreur, chargement, majStatut, recharger, enCours } = useNotionTasks()

  const stats = useMemo(() => {
    const aFaire = taches.filter((t) => t.statut === 'À faire').length
    const enCours = taches.filter((t) => t.statut === 'En cours').length
    const termine = taches.filter((t) => t.statut === 'Terminé').length
    const pct = taches.length ? Math.round((termine / taches.length) * 100) : 0
    return { aFaire, enCours, termine, pct }
  }, [taches])

  const libelleSource = {
    notion: '🟢 Connecté à Notion — données temps réel',
    cache: '🟠 Hors-ligne — cache local (dernière synchro)',
    demo: '🔴 Proxy éteint — jeu de démonstration',
    chargement: '… Connexion à Notion',
  }[source]

  return (
    <Box sx={{ maxWidth: '100%' }}>
      {/* ── Bandeau titre ─────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32 }}>
        <Box sx={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3,
          background: 'linear-gradient(135deg,#0D1B2A 0%,#0F5B3A 100%)',
          borderRadius: '20px', px: 3.5, py: 3,
        }}>
          <Box>
            <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: '1.45rem', color: '#fff' }}>
              Tâches du club <Box component="span" sx={{ color: '#9AFBD7' }}>· Notion</Box>
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,.78)', mt: 0.5 }}>
              {libelleSource}
            </Typography>
          </Box>
          <Tooltip title="Resynchroniser depuis Notion">
            <span>
              <Button
                variant="contained" startIcon={<RefreshIcon />} onClick={recharger}
                disabled={chargement}
                sx={{ bgcolor: '#1FAF72', '&:hover': { bgcolor: '#189c63' }, borderRadius: '28px', px: 3 }}
              >
                {chargement ? 'Synchro…' : 'Actualiser'}
              </Button>
            </span>
          </Tooltip>
        </Box>
      </motion.div>

      {/* ── KPIs ──────────────────────────────────────────────────── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4,1fr)' }, gap: 2, mb: 3 }}>
        <Kpi valeur={taches.length} label="Tâches totales" couleur="#0F5B3A" icone={<SyncIcon />} delai={0} />
        <Kpi valeur={stats.aFaire} label="À faire" couleur="#B42318" icone={<NotStartedIcon />} delai={0.06} />
        <Kpi valeur={stats.enCours} label="En cours" couleur="#175CD3" icone={<AutorenewIcon />} delai={0.12} />
        <Kpi valeur={stats.termine} label="Terminées" couleur="#0E9F6E" icone={<TaskAltIcon />} delai={0.18} />
      </Box>

      {/* ── Progression ───────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.064 }}>
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: '16px', mb: 3, bgcolor: '#fff', border: '1px solid #E3EEE8' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography sx={{ fontWeight: 700, color: '#0D1B2A', fontSize: '0.95rem' }}>
              Avancement global du club
            </Typography>
            <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, color: '#0F5B3A' }}>
              {stats.pct}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate" value={stats.pct}
            sx={{ height: 10, borderRadius: 6, bgcolor: '#E3EEE8',
                  '& .MuiLinearProgress-bar': { borderRadius: 6, background: 'linear-gradient(90deg,#0F5B3A,#1FAF72)' } }}
          />
        </Paper>
      </motion.div>

      {/* ── Alerte source dégradée ────────────────────────────────── */}
      {erreur && (
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}>
          <Chip label={erreur} sx={{ mb: 2, bgcolor: '#FEF4E6', color: '#B54708', fontWeight: 600 }} />
        </motion.div>
      )}

      {/* ── Tableau ───────────────────────────────────────────────── */}
      <Paper elevation={0} sx={{
        borderRadius: '20px', overflow: 'hidden', bgcolor: '#fff',
        border: '1px solid #E3EEE8', boxShadow: '0 10px 34px rgba(15,91,58,0.08)',
      }}>
        <Box sx={{
          px: 3, py: 2, bgcolor: '#0F5B3A', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <Typography sx={{ color: '#fff', fontWeight: 800, fontFamily: "'Orbitron',sans-serif", fontSize: '0.95rem', letterSpacing: '0.04em' }}>
            SUIVI DES TÂCHES
          </Typography>
          <Typography variant="caption" sx={{ color: '#9AFBD7', fontWeight: 600 }}>
            Clique sur un statut pour le modifier — synchronisé instantanément dans Notion
          </Typography>
        </Box>

        {chargement ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              style={{ width: 34, height: 34, margin: '0 auto', borderRadius: '50%', border: '3px solid #E3EEE8', borderTopColor: '#1FAF72' }} />
            <Typography variant="body2" sx={{ mt: 2, color: '#5A6B63' }}>Chargement des tâches…</Typography>
          </Box>
        ) : (
          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Tâche', 'Priorité', 'Échéance', 'Statut'].map((h) => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '12px 20px', fontSize: '0.72rem',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    color: '#5A6B63', borderBottom: '2px solid #E3EEE8', background: '#F6FBF9',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {taches.map((t, i) => (
                <motion.tr
                  key={t.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.15), duration: 0.3 }}
                  style={{ borderBottom: '1px solid #EDF4F0', transition: 'background 150ms ease' }}
                  sx={{
                    '&:hover': { bgcolor: '#F6FBF9' },
                  }}
                >
                  <td style={{ padding: '12px 20px', fontWeight: 600, color: '#0D1B2A', fontSize: '0.92rem' }}>
                    {t.tache || '—'}
                    {t.statut === 'Terminé' && (
                      <TaskAltIcon sx={{ fontSize: 15, ml: 1, verticalAlign: '-2px', color: '#0B7A4B' }} />
                    )}
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    {t.priorite ? (
                      <Chip size="small" label={t.priorite} sx={{
                        bgcolor: COULEURS_PRIORITE[t.priorite]?.bg ?? '#EEE',
                        color: COULEURS_PRIORITE[t.priorite]?.fg ?? '#555', fontWeight: 700, fontSize: '0.72rem',
                      }} />
                    ) : <Typography variant="caption" color="text.disabled">—</Typography>}
                  </td>
                  <td style={{ padding: '12px 20px', fontSize: '0.85rem', color: '#5A6B63' }}>{t.echeance || '—'}</td>
                  <td style={{ padding: '12px 20px' }}>
                    <Select
                      size="small" value={STATUTS.includes(t.statut) ? t.statut : 'À faire'}
                      onChange={(e) => majStatut(t.id, e.target.value)}
                      disabled={!!enCours[t.id]}
                      sx={{
                        minWidth: 132, fontWeight: 700, fontSize: '0.82rem',
                        bgcolor: COULEURS_STATUT[t.statut]?.bg ?? '#EEE',
                        borderRadius: '10px', cursor: 'pointer',
                        transition: 'box-shadow 160ms ease, transform 120ms ease',
                        '&:hover': { boxShadow: '0 0 0 3px rgba(31,175,114,.15)' },
                        '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                        '& .MuiSelect-select': { py: 0.8, color: COULEURS_STATUT[t.statut]?.fg ?? '#555' },
                      }}
                    >
                      {STATUTS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                    </Select>
                  </td>
                </motion.tr>
              ))}
              {taches.length === 0 && (
                <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center', color: '#5A6B63' }}>
                  Aucune tâche trouvée dans la base Notion « Tâches ».
                </td></tr>
              )}
            </tbody>
          </Box>
        )}
      </Paper>

      <Typography variant="caption" sx={{ display: 'block', mt: 2, color: '#5A6B63' }}>
        Source de vérité : base Notion « Tâches » du QG du Club — les modifications ici sont écrites directement dans Notion.
        {source === 'cache' && ' En mode cache, les changements de statut sont désactivés jusqu\'à la reconnexion.'}
      </Typography>
    </Box>
  )
}
