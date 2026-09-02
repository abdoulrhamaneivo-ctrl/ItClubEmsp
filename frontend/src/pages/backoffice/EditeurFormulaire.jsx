import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import Chip from '@mui/material/Chip'
import Select from '@mui/material/Select'
import Alert from '@mui/material/Alert'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import SaveIcon from '@mui/icons-material/Save'
import { chargerConfig, sauverConfig, reinitialiserConfig, configParDefaut } from '../../data/formulaireConfig'

/**
 * Back-office — Éditeur du formulaire d'adhésion.
 * Ajouter / supprimer / réordonner des champs, les rendre obligatoires ou non,
 * changer leur type. La config est sauvegardée (localStorage en dev, API Django en prod)
 * et le formulaire public s'y adapte instantanément.
 */

const TYPES = [
  { id: 'text', label: 'Texte court' },
  { id: 'email', label: 'E-mail' },
  { id: 'tel', label: 'Téléphone / WhatsApp' },
  { id: 'textarea', label: 'Texte long' },
  { id: 'select', label: 'Liste de choix' },
]

const GROUPES = [
  { id: 'identite', label: 'Étape 1 — Qui es-tu ?' },
  { id: 'complement', label: 'Étape 3 — Compléments' },
]

export default function EditeurFormulaire() {
  const [champs, setChamps] = useState(() => chargerConfig())
  const [message, setMessage] = useState(null)

  const majChamp = (idx, patch) => {
    setChamps((cs) => cs.map((c, i) => (i === idx ? { ...c, ...patch } : c)))
  }

  const deplacer = (idx, dir) => {
    setChamps((cs) => {
      const j = idx + dir
      if (j < 0 || j >= cs.length) return cs
      const copie = [...cs]
      ;[copie[idx], copie[j]] = [copie[j], copie[idx]]
      return copie
    })
  }

  const supprimer = (idx) => setChamps((cs) => cs.filter((_, i) => i !== idx))

  const ajouter = () => {
    setChamps((cs) => [
      ...cs,
      { id: `champ_${Date.now()}`, label: 'Nouveau champ', type: 'text', groupe: 'complement', requis: false, aide: '' },
    ])
  }

  const enregistrer = () => {
    // ids uniques
    const vus = new Set()
    for (const c of champs) {
      if (vus.has(c.id)) { setMessage({ t: 'error', m: `ID dupliqué : ${c.id}` }); return }
      vus.add(c.id)
    }
    if (!champs.some((c) => c.groupe === 'identite')) {
      setMessage({ t: 'error', m: 'L’étape 1 doit contenir au moins un champ.' })
      return
    }
    sauverConfig(champs)
    setMessage({ t: 'success', m: '✅ Formulaire enregistré — le formulaire public est mis à jour instantanément.' })
    setTimeout(() => setMessage(null), 4000)
  }

  const reinitialiser = () => {
    reinitialiserConfig()
    setChamps([...configParDefaut])
    setMessage({ t: 'info', m: 'Formulaire réinitialisé aux champs par défaut.' })
    setTimeout(() => setMessage(null), 3000)
  }

  return (
    <Box sx={{ maxWidth: '100%' }}>
      <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32 }}>
        <Box sx={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3,
          background: 'linear-gradient(135deg,#0D1B2A 0%,#0F5B3A 100%)',
          borderRadius: '20px', px: 3.5, py: 3,
        }}>
          <Box>
            <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: '1.45rem', color: '#fff' }}>
              Formulaire d&apos;adhésion <Box component="span" sx={{ color: '#9AFBD7' }}>· éditeur</Box>
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,.78)', mt: 0.5 }}>
              Ajoute, supprime, réordonne les champs — rends-les obligatoires ou non. Le formulaire public suit.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button variant="outlined" startIcon={<RestartAltIcon />} onClick={reinitialiser}
              sx={{ color: '#9AFBD7', borderColor: 'rgba(154,251,215,.4)', '&:hover': { borderColor: '#9AFBD7' } }}>
              Réinitialiser
            </Button>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button variant="contained" startIcon={<SaveIcon />} onClick={enregistrer}
                sx={{ bgcolor: '#1FAF72', '&:hover': { bgcolor: '#179963' }, borderRadius: '28px', px: 3 }}>
                Enregistrer
              </Button>
            </motion.div>
          </Box>
        </Box>
      </motion.div>

      {message && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <Alert severity={message.t} sx={{ mb: 2, borderRadius: 2 }}>{message.m}</Alert>
        </motion.div>
      )}

      <Box sx={{ display: 'grid', gap: 2 }}>
        <AnimatePresence initial={false}>
          {champs.map((c, idx) => (
            <motion.div
              key={c.id}
              layout
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <Paper elevation={0} sx={{
                p: 2.5, borderRadius: '14px', border: '1px solid #E3EEE8', bgcolor: '#fff',
                boxShadow: '0 4px 14px rgba(15,91,58,.05)',
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  {/* Ordre */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <IconButton size="small" onClick={() => deplacer(idx, -1)} disabled={idx === 0} sx={{ color: '#5A6B63' }}>
                      <ArrowUpwardIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => deplacer(idx, 1)} disabled={idx === champs.length - 1} sx={{ color: '#5A6B63' }}>
                      <ArrowDownwardIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                  </Box>

                  {/* Label */}
                  <TextField
                    size="small" label="Libellé" value={c.label}
                    onChange={(e) => majChamp(idx, { label: e.target.value })}
                    sx={{ minWidth: 180, flex: 1 }}
                  />

                  {/* Type */}
                  <Select
                    size="small" value={c.type}
                    onChange={(e) => majChamp(idx, { type: e.target.value })}
                    sx={{ minWidth: 170 }}
                  >
                    {TYPES.map((t) => <MenuItem key={t.id} value={t.id}>{t.label}</MenuItem>)}
                  </Select>

                  {/* Groupe (étape) */}
                  <Select
                    size="small" value={c.groupe}
                    onChange={(e) => majChamp(idx, { groupe: e.target.value })}
                    sx={{ minWidth: 200 }}
                  >
                    {GROUPES.map((g) => <MenuItem key={g.id} value={g.id}>{g.label}</MenuItem>)}
                  </Select>

                  {/* Requis */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Switch checked={!!c.requis} onChange={(e) => majChamp(idx, { requis: e.target.checked })} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#1FAF72' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#1FAF72' } }} />
                    <Typography variant="caption" sx={{ fontWeight: 800, color: c.requis ? '#0F5B3A' : '#9CA3AF' }}>
                      {c.requis ? 'OBLIGATOIRE' : 'OPTIONNEL'}
                    </Typography>
                  </Box>

                  {/* Supprimer */}
                  <IconButton onClick={() => supprimer(idx)} sx={{ color: '#B42318', '&:hover': { bgcolor: '#FDECEC' } }}>
                    <DeleteIcon />
                  </IconButton>
                </Box>

                {/* Aide / placeholder + options select */}
                <Box sx={{ display: 'flex', gap: 2, mt: 1.5, flexWrap: 'wrap' }}>
                  <TextField
                    size="small" label="Texte d'aide / placeholder" value={c.aide ?? ''}
                    onChange={(e) => majChamp(idx, { aide: e.target.value })}
                    sx={{ flex: 1, minWidth: 220 }}
                  />
                  {c.type === 'select' && (
                    <TextField
                      size="small" label="Options (séparées par des virgules)"
                      value={(c.options ?? []).join(', ')}
                      onChange={(e) => majChamp(idx, { options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                      sx={{ flex: 1, minWidth: 220 }}
                    />
                  )}
                  <Chip label={c.id} size="small" sx={{ bgcolor: '#F6FBF9', color: '#5A6B63', fontFamily: 'monospace', fontSize: '0.7rem' }} />
                </Box>
              </Paper>
            </motion.div>
          ))}
        </AnimatePresence>
      </Box>

      <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }} style={{ width: 'fit-content' }}>
        <Button variant="outlined" startIcon={<AddIcon />} onClick={ajouter}
          sx={{ mt: 2, borderColor: '#1FAF72', color: '#1FAF72', fontWeight: 800, borderRadius: '28px', px: 3 }}>
          Ajouter un champ
        </Button>
      </motion.div>

      <Typography variant="caption" sx={{ display: 'block', mt: 3, color: '#5A6B63' }}>
        Astuce : le champ « motivation » est rattaché à l&apos;étape 3 (compléments). Les champs de l&apos;étape 1
        (identité) apparaissent en premier. En production, cette configuration sera stockée côté Django
        (PUT /api/v1/adhesion/form-config).
      </Typography>
    </Box>
  )
}
