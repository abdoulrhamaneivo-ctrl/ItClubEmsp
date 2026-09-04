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
import Switch from '@mui/material/Switch'
import CircularProgress from '@mui/material/CircularProgress'
import CheckIcon from '@mui/icons-material/Check'
import AddIcon from '@mui/icons-material/Add'
import { api } from '../lib/api'
import TitreSection from '../components/ui-components/TitreSection'
import FondPropre from '../components/ui-components/FondPropre'

/**
 * Sondages des membres (bonus doc 00) : vote simple ou multiple,
 * résultats en direct, clôture par l'auteur.
 */

const champSx = { '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#F8FAF9' } }

export default function Sondages() {
  const [filtre, setFiltre] = useState('ouverts')
  const [formOuvert, setFormOuvert] = useState(false)
  const [message, setMessage] = useState(null)
  const client = useQueryClient()

  const { data: sondages = [], isLoading } = useQuery({
    queryKey: ['sondages'], queryFn: () => api.getSondages(),
  })

  const notify = (t, m) => { setMessage({ t, m }); setTimeout(() => setMessage(null), 4000) }
  const visibles = sondages.filter((s) => (filtre === 'ouverts' ? !s.clos : s.clos))

  return (
    <Box sx={{ py: { xs: 4, md: 6 }, position: 'relative', minHeight: '70vh' }}>
      <FondPropre variante="doux" />
      <Container maxWidth={false} sx={{ position: 'relative', maxWidth: '1100px !important', px: { xs: 2.5, md: 4 } }}>
        <TitreSection
          badge="Membres"
          titre="Sondages"
          sousTitre="L'avis du club en un clic — résultats en direct."
          couleur="#7B61FF"
        />
        {message && (
          <Box sx={{ mb: 2, p: 1.6, borderRadius: '12px', bgcolor: '#FDECEC', color: '#B42318', fontWeight: 700, fontSize: '0.86rem' }}>
            {message.m}
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 1, mb: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
          {['ouverts', 'clos'].map((f) => (
            <Chip key={f} label={f === 'ouverts' ? 'Ouverts' : 'Clôturés'} onClick={() => setFiltre(f)}
              sx={{ fontWeight: 800, cursor: 'pointer', textTransform: 'capitalize',
                bgcolor: filtre === f ? '#7B61FF' : '#fff', color: filtre === f ? '#fff' : '#374151', border: '1px solid #E5E7EB' }} />
          ))}
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormOuvert(!formOuvert)}
            sx={{ bgcolor: '#7B61FF', '&:hover': { bgcolor: '#5B3FD6' }, fontWeight: 800, borderRadius: '12px' }}>
            Nouveau sondage
          </Button>
        </Box>

        {formOuvert && (
          <FormulaireSondage
            onFait={() => { setFormOuvert(false); client.invalidateQueries({ queryKey: ['sondages'] }) }}
            onErreur={(m) => notify('error', m)}
          />
        )}

        {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress sx={{ color: '#7B61FF' }} /></Box>}
        {!isLoading && visibles.length === 0 && (
          <Typography sx={{ color: '#5A6B63', py: 4, textAlign: 'center' }}>
            Aucun sondage {filtre} — lance le premier !
          </Typography>
        )}
        <Box sx={{ display: 'grid', gap: 1.6 }}>
          {visibles.map((s, i) => (
            <CarteSondage key={s.id} s={s} index={i} onErreur={(m) => notify('error', m)} />
          ))}
        </Box>
      </Container>
    </Box>
  )
}

/* ── Création ───────────────────────────────────────────────── */
function FormulaireSondage({ onFait, onErreur }) {
  const [titre, setTitre] = useState('')
  const [description, setDescription] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [multiple, setMultiple] = useState(false)
  const [cellule, setCellule] = useState('')
  const [envoi, setEnvoi] = useState(false)

  const { data: cellules = [] } = useQuery({
    queryKey: ['cellules'], queryFn: () => api.getCellules(),
  })

  const creer = async () => {
    const propres = options.map((o) => o.trim()).filter(Boolean)
    if (!titre.trim() || propres.length < 2 || envoi) {
      if (!titre.trim() || propres.length < 2) onErreur('Titre + 2 options minimum.')
      return
    }
    setEnvoi(true)
    try {
      const corps = { titre: titre.trim(), description: description.trim(), options: propres, choix_multiple: multiple }
      if (cellule) {
        const c = cellules.find((x) => String(x.id) === cellule || x.slug === cellule)
        if (c) corps.cellule = c.id
      }
      await api.creerSondage(corps)
      onFait()
    } catch (e) {
      onErreur(e.message ?? 'Création impossible')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <Box sx={{ bgcolor: '#fff', borderRadius: '16px', border: '1px solid #7B61FF45', p: 2.4, display: 'grid', gap: 1.6, mb: 2 }}>
      <TextField label="Question *" value={titre} onChange={(e) => setTitre(e.target.value)} fullWidth sx={champSx} />
      <TextField label="Contexte (optionnel)" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth sx={champSx} />
      {options.map((o, i) => (
        <TextField key={i} label={`Option ${i + 1}${i < 2 ? ' *' : ''}`} value={o}
          onChange={(e) => setOptions((l) => l.map((x, j) => (j === i ? e.target.value : x)))}
          fullWidth sx={champSx} />
      ))}
      {options.length < 10 && (
        <Button size="small" onClick={() => setOptions((l) => [...l, ''])} sx={{ color: '#5B3FD6', fontWeight: 700, alignSelf: 'flex-start' }}>
          + Ajouter une option
        </Button>
      )}
      <Box sx={{ display: 'grid', gap: 1.6, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, alignItems: 'center' }}>
        <TextField select label="Audience" value={cellule} onChange={(e) => setCellule(e.target.value)} fullWidth sx={champSx}>
          <MenuItem value="">Tous les membres</MenuItem>
          {cellules.filter((c) => c.slug).map((c) => <MenuItem key={c.slug} value={c.slug}>Cellule {c.nom}</MenuItem>)}
        </TextField>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Switch checked={multiple} onChange={() => setMultiple(!multiple)}
            sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#7B61FF' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#7B61FF' } }} />
          <Typography variant="body2" sx={{ color: '#374151', fontWeight: 600 }}>Choix multiples</Typography>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" onClick={creer} disabled={envoi}
          sx={{ bgcolor: '#7B61FF', '&:hover': { bgcolor: '#5B3FD6' }, fontWeight: 800, borderRadius: '12px' }}>
          {envoi ? 'Création…' : 'Lancer le sondage'}
        </Button>
      </Box>
    </Box>
  )
}

/* ── Carte + vote ───────────────────────────────────────────── */
function CarteSondage({ s, index, onErreur }) {
  const [donnees, setDonnees] = useState(s)
  const [envoi, setEnvoi] = useState(false)
  const client = useQueryClient()
  const max = Math.max(1, ...donnees.options.map((o) => o.votes))

  const voter = async (optionId) => {
    if (donnees.clos || envoi) return
    setEnvoi(true)
    try {
      const res = await api.voter(donnees.id, optionId)
      setDonnees(res.sondage)
      client.invalidateQueries({ queryKey: ['sondages'] })
    } catch (e) {
      onErreur(e.message ?? 'Vote impossible')
    } finally {
      setEnvoi(false)
    }
  }

  const clore = async () => {
    try {
      const res = await api.majSondage(donnees.id, { clos: !donnees.clos })
      setDonnees(res)
      client.invalidateQueries({ queryKey: ['sondages'] })
    } catch (e) {
      onErreur(e.message ?? 'Action impossible')
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.04, 0.3), duration: 0.25 }}>
      <Box sx={{ bgcolor: '#fff', borderRadius: '16px', border: '1px solid #E8ECEA', p: { xs: 2.2, md: 2.8 } }}>
        <Box sx={{ display: 'flex', gap: 1.2, alignItems: 'flex-start', flexWrap: 'wrap', mb: 0.5 }}>
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: '1rem' }}>{donnees.titre}</Typography>
            <Typography variant="caption" sx={{ color: '#5A6B63' }}>
              {donnees.auteur_nom}
              {donnees.cellule_nom && ` · Cellule ${donnees.cellule_nom}`}
              {` · ${donnees.total_votes} vote${donnees.total_votes > 1 ? 's' : ''}`}
              {donnees.choix_multiple && ' · choix multiples'}
            </Typography>
          </Box>
          {donnees.clos
            ? <Chip label="Clôturé" size="small" sx={{ bgcolor: '#F0F5F2', color: '#5A6B63', fontWeight: 800 }} />
            : <Chip label="Ouvert" size="small" sx={{ bgcolor: '#EDE9FE', color: '#5B3FD6', fontWeight: 800 }} />}
        </Box>
        {donnees.description && (
          <Typography variant="body2" sx={{ color: '#5A6B63', mb: 1.5 }}>{donnees.description}</Typography>
        )}
        <Box sx={{ display: 'grid', gap: 0.8, mt: 1 }}>
          <AnimatePresence initial={false}>
            {donnees.options.map((o) => {
              const mienne = (donnees.mes_votes ?? []).includes(o.id)
              const pct = Math.round((o.votes / max) * 100)
              return (
                <Box key={o.id} component={donnees.clos ? 'div' : 'button'} onClick={donnees.clos ? undefined : () => voter(o.id)}
                  disabled={envoi}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1.2, textAlign: 'left', width: '100%',
                    border: '1px solid', borderColor: mienne ? '#7B61FF' : '#E5E7EB',
                    bgcolor: mienne ? '#EDE9FE' : '#fff', borderRadius: '12px', px: 1.6, py: 1.1,
                    cursor: donnees.clos ? 'default' : 'pointer', fontFamily: 'inherit',
                    transition: 'border-color 160ms ease, background 160ms ease',
                    '&:hover': donnees.clos ? {} : { borderColor: '#7B61FF', bgcolor: '#F6F3FF' },
                  }}>
                  {mienne && <CheckIcon sx={{ color: '#5B3FD6', fontSize: 18, flexShrink: 0 }} />}
                  <Typography sx={{ fontWeight: 700, color: '#111827', fontSize: '0.86rem', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {o.texte}
                  </Typography>
                  <Box sx={{ flex: 1, height: 8, borderRadius: 9999, bgcolor: '#EEF2F0', overflow: 'hidden', minWidth: 40 }}>
                    <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.35 }}
                      style={{ height: '100%', borderRadius: 9999, background: mienne ? '#7B61FF' : '#B9A8F5' }} />
                  </Box>
                  <Typography variant="caption" sx={{ color: '#111827', fontWeight: 800, width: 44, textAlign: 'right', flexShrink: 0 }}>
                    {o.votes} · {donnees.total_votes > 0 ? Math.round((o.votes / donnees.total_votes) * 100) : 0}%
                  </Typography>
                </Box>
              )
            })}
          </AnimatePresence>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.2 }}>
          <Button size="small" onClick={clore} sx={{ color: '#5A6B63', fontWeight: 700, fontSize: '0.74rem' }}>
            {donnees.clos ? 'Rouvrir' : 'Clôturer'}
          </Button>
        </Box>
      </Box>
    </motion.div>
  )
}
