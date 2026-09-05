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
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import PushPinIcon from '@mui/icons-material/PushPin'
import LockIcon from '@mui/icons-material/Lock'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import { api } from '../lib/api'
import { useForumLive } from '../lib/useForumLive'
import { useAuth, hasRole } from '../stores/auth'
import TitreSection from '../components/ui-components/TitreSection'
import FondPropre from '../components/ui-components/FondPropre'

/**
 * Forum des membres (doc 03 §4) : espaces Général / Cellule / Projet,
 * sujets épinglables, fil chronologique, verrouillage + modération P1/P5.
 */

const champSx = { '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#F8FAF9' } }

function dateCourte(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function Forum() {
  const user = useAuth((s) => s.user)
  const modo = hasRole(user, ['P1', 'P5', 'ADMIN'])
  const [espace, setEspace] = useState('tous')
  const [sujetId, setSujetId] = useState(null)
  const [formOuvert, setFormOuvert] = useState(false)
  const [titre, setTitre] = useState('')
  const [nouvelEspace, setNouvelEspace] = useState('general')
  const [cible, setCible] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [message, setMessage] = useState(null)
  const client = useQueryClient()

  const { data: sujets = [], isLoading } = useQuery({
    queryKey: ['forum-sujets'], queryFn: () => api.getSujets(),
  })
  const { data: cellules = [] } = useQuery({
    queryKey: ['cellules'], queryFn: () => api.getCellules(),
  })
  const { data: projets = [] } = useQuery({
    queryKey: ['projets'], queryFn: () => api.getProjets(),
  })

  const notify = (t, m) => { setMessage({ t, m }); setTimeout(() => setMessage(null), 4000) }

  const nomEspace = (s) => s.espace_label ?? 'Général'
  const filtres = sujets.filter((s) => {
    if (espace === 'tous') return true
    if (espace === 'general') return s.espace === 'general'
    if (espace.startsWith('cellule:')) return s.espace === 'cellule' && String(s.cellule) === espace.slice(8)
    if (espace.startsWith('projet:')) return s.espace === 'projet' && String(s.projet) === espace.slice(7)
    return true
  })
  const sujet = sujets.find((s) => s.id === sujetId) ?? null

  const creerSujet = async () => {
    if (!titre.trim() || envoi) return
    setEnvoi(true)
    try {
      const corps = { titre: titre.trim(), espace: nouvelEspace }
      if (nouvelEspace === 'cellule') {
        const c = cellules.find((x) => String(x.id) === cible || x.slug === cible)
        if (!c) { notify('error', 'Choisis une cellule.'); setEnvoi(false); return }
        corps.cellule = c.id
      }
      if (nouvelEspace === 'projet') {
        if (!cible) { notify('error', 'Choisis un projet.'); setEnvoi(false); return }
        corps.projet = Number(cible)
      }
      const cree = await api.creerSujet(corps)
      client.invalidateQueries({ queryKey: ['forum-sujets'] })
      setTitre(''); setCible(''); setFormOuvert(false)
      setSujetId(cree.id)
    } catch (e) {
      notify('error', e.message ?? 'Création impossible')
    } finally {
      setEnvoi(false)
    }
  }

  const basculer = async (s, champ) => {
    try {
      await api.majSujet(s.id, { [champ]: !s[champ] })
      client.invalidateQueries({ queryKey: ['forum-sujets'] })
    } catch (e) {
      notify('error', e.message ?? 'Action impossible')
    }
  }

  return (
    <Box sx={{ py: { xs: 4, md: 6 }, position: 'relative', minHeight: '70vh' }}>
      <FondPropre variante="doux" />
      <Container maxWidth={false} sx={{ position: 'relative', maxWidth: '1100px !important', px: { xs: 2.5, md: 4 } }}>
        <TitreSection
          badge="Membres"
          titre="Forum"
          sousTitre="Discussions du club — par cellule, par projet, ou entre tous."
          couleur="#1FAF72"
        />
        {message && (
          <Box sx={{ mb: 2, p: 1.6, borderRadius: '12px', bgcolor: message.t === 'error' ? '#FDECEC' : '#E4F8EF', color: message.t === 'error' ? '#B42318' : '#0B7A4B', fontWeight: 700, fontSize: '0.86rem' }}>
            {message.m}
          </Box>
        )}

        {!sujet && (
          <>
            <Box sx={{ display: 'flex', gap: 1, mb: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
              <Chip label="Tous" onClick={() => setEspace('tous')}
                sx={{ fontWeight: 800, cursor: 'pointer', bgcolor: espace === 'tous' ? '#1FAF72' : '#fff', color: espace === 'tous' ? '#fff' : '#374151', border: '1px solid #E5E7EB' }} />
              <Chip label="Général" onClick={() => setEspace('general')}
                sx={{ fontWeight: 800, cursor: 'pointer', bgcolor: espace === 'general' ? '#1FAF72' : '#fff', color: espace === 'general' ? '#fff' : '#374151', border: '1px solid #E5E7EB' }} />
              {cellules.filter((c) => c.slug).map((c) => {
                const cle = `cellule:${c.id}`
                return (
                  <Chip key={cle} label={c.nom} onClick={() => setEspace(cle)}
                    sx={{ fontWeight: 800, cursor: 'pointer', bgcolor: espace === cle ? (c.couleur ?? '#1FAF72') : '#fff', color: espace === cle ? '#fff' : '#374151', border: '1px solid #E5E7EB' }} />
                )
              })}
              {projets.slice(0, 6).map((p) => {
                const cle = `projet:${p.id}`
                return (
                  <Chip key={cle} label={`⚙ ${p.nom}`} onClick={() => setEspace(cle)}
                    sx={{ fontWeight: 800, cursor: 'pointer', bgcolor: espace === cle ? '#7B61FF' : '#fff', color: espace === cle ? '#fff' : '#374151', border: '1px solid #E5E7EB' }} />
                )
              })}
              <Box sx={{ flex: 1 }} />
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormOuvert(!formOuvert)}
                sx={{ bgcolor: '#1FAF72', '&:hover': { bgcolor: '#179963' }, fontWeight: 800, borderRadius: '12px' }}>
                Nouveau sujet
              </Button>
            </Box>

            {formOuvert && (
              <Box sx={{ bgcolor: '#fff', borderRadius: '16px', border: '1px solid #1FAF7245', p: 2.4, display: 'grid', gap: 1.6, mb: 2 }}>
                <TextField label="Titre du sujet *" value={titre} onChange={(e) => setTitre(e.target.value)} fullWidth sx={champSx} />
                <Box sx={{ display: 'grid', gap: 1.6, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
                  <TextField select label="Espace" value={nouvelEspace} onChange={(e) => { setNouvelEspace(e.target.value); setCible('') }} fullWidth sx={champSx}>
                    <MenuItem value="general">Général (tous les membres)</MenuItem>
                    <MenuItem value="cellule">Cellule</MenuItem>
                    <MenuItem value="projet">Projet</MenuItem>
                  </TextField>
                  {nouvelEspace === 'cellule' && (
                    <TextField select label="Cellule *" value={cible} onChange={(e) => setCible(e.target.value)} fullWidth sx={champSx}>
                      {cellules.filter((c) => c.slug).map((c) => <MenuItem key={c.slug} value={c.slug}>{c.nom}</MenuItem>)}
                    </TextField>
                  )}
                  {nouvelEspace === 'projet' && (
                    <TextField select label="Projet *" value={cible} onChange={(e) => setCible(e.target.value)} fullWidth sx={champSx}>
                      {projets.map((p) => <MenuItem key={p.id} value={p.id}>{p.nom}</MenuItem>)}
                    </TextField>
                  )}
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="contained" onClick={creerSujet} disabled={envoi || !titre.trim()}
                    sx={{ bgcolor: '#1FAF72', '&:hover': { bgcolor: '#179963' }, fontWeight: 800, borderRadius: '12px' }}>
                    {envoi ? 'Création…' : 'Ouvrir la discussion'}
                  </Button>
                </Box>
              </Box>
            )}

            {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress sx={{ color: '#1FAF72' }} /></Box>}
            {!isLoading && filtres.length === 0 && (
              <Typography sx={{ color: '#5A6B63', py: 4, textAlign: 'center' }}>
                Aucun sujet ici pour le moment — ouvre le premier !
              </Typography>
            )}
            <Box sx={{ display: 'grid', gap: 1.2 }}>
              {filtres.map((s, i) => (
                <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.3), duration: 0.25 }}>
                  <Box onClick={() => setSujetId(s.id)} sx={{
                    bgcolor: '#fff', borderRadius: '14px', border: '1px solid #E8ECEA',
                    px: 2.4, py: 1.7, display: 'flex', gap: 1.5, alignItems: 'center', cursor: 'pointer',
                    transition: 'border-color 180ms ease, box-shadow 180ms ease',
                    '&:hover': { borderColor: '#BFD8CC', boxShadow: '0 6px 18px rgba(13,27,42,.08)' },
                  }}>
                    {s.epingle && <PushPinIcon sx={{ color: '#B45309', fontSize: 18, flexShrink: 0 }} />}
                    {s.verrouille && <LockIcon sx={{ color: '#6B7280', fontSize: 18, flexShrink: 0 }} />}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: '0.92rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.titre}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#5A6B63' }}>
                        {s.auteur_nom} · {s.messages_count ?? 0} message{(s.messages_count ?? 0) > 1 ? 's' : ''}
                        {s.dernier_message && ` · dernier par ${s.dernier_message.auteur}, ${dateCourte(s.dernier_message.cree_le)}`}
                      </Typography>
                    </Box>
                    <Chip label={nomEspace(s)} size="small" sx={{ bgcolor: '#F0F5F2', color: '#374151', fontWeight: 700, height: 22, flexShrink: 0 }} />
                  </Box>
                </motion.div>
              ))}
            </Box>
          </>
        )}

        {sujet && (
          <FilSujet
            sujet={sujet}
            modo={modo}
            onRetour={() => { setSujetId(null); client.invalidateQueries({ queryKey: ['forum-sujets'] }) }}
            onMute={basculer}
            notify={notify}
          />
        )}
      </Container>
    </Box>
  )
}

/* ── Fil d'un sujet ─────────────────────────────────────────── */
function FilSujet({ sujet, modo, onRetour, onMute, notify }) {
  const [texte, setTexte] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const client = useQueryClient()
  // Direct : les messages des autres arrivent sans recharger
  const { connecte, envoyer, tempsReel } = useForumLive(sujet.id, {
    onErreur: (detail) => notify('error', detail),
  })

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['forum-messages', sujet.id],
    queryFn: () => api.getMessages(sujet.id),
  })

  const poster = async () => {
    if (!texte.trim() || envoi) return
    setEnvoi(true)
    try {
      await envoyer(texte.trim())
      setTexte('')
      // En WS, le message revient par diffusion ; en REST, le hook réactualise.
    } catch (e) {
      notify('error', e.message ?? 'Envoi impossible')
    } finally {
      setEnvoi(false)
    }
  }

  const moderer = async (id) => {
    try {
      await api.modererMessage(id)
      client.invalidateQueries({ queryKey: ['forum-messages', sujet.id] })
      client.invalidateQueries({ queryKey: ['forum-sujets'] })
    } catch (e) {
      notify('error', e.message ?? 'Modération impossible')
    }
  }

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={onRetour} sx={{ color: '#5A6B63', fontWeight: 700, mb: 2 }}>
        Tous les sujets
      </Button>
      <Box sx={{ bgcolor: '#fff', borderRadius: '18px', border: '1px solid #E8ECEA', p: { xs: 2.4, md: 3.2 } }}>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', flexWrap: 'wrap', mb: 1 }}>
          <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: '1.2rem', color: '#111827', flex: 1, minWidth: 220 }}>
            {sujet.titre}
          </Typography>
          {modo && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" variant="outlined" onClick={() => onMute(sujet, 'epingle')}
                sx={{ borderColor: '#F5A623', color: '#B45309', fontWeight: 700 }}>
                {sujet.epingle ? 'Désépingler' : 'Épingler'}
              </Button>
              <Button size="small" variant="outlined" onClick={() => onMute(sujet, 'verrouille')}
                sx={{ borderColor: '#D1D5DB', color: '#374151', fontWeight: 700 }}>
                {sujet.verrouille ? 'Rouvrir' : 'Verrouiller'}
              </Button>
            </Box>
          )}
        </Box>
        <Typography variant="caption" sx={{ color: '#5A6B63', display: 'block', mb: 2 }}>
          Ouvert par {sujet.auteur_nom} · {sujet.messages_count ?? 0} message{(sujet.messages_count ?? 0) > 1 ? 's' : ''}
          {sujet.verrouille && ' · verrouillé (modération uniquement)'}
          {tempsReel && (
            <Box component="span" sx={{
              display: 'inline-flex', alignItems: 'center', gap: 0.6, ml: 1.2,
              color: connecte ? '#0B7A4B' : '#6B7280', fontWeight: 800,
            }}>
              <Box component="span" sx={{
                width: 7, height: 7, borderRadius: '50%',
                bgcolor: connecte ? '#1FAF72' : '#9CA3AF',
              }} />
              {connecte ? 'En direct' : 'Connexion…'}
            </Box>
          )}
        </Typography>

        {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={24} sx={{ color: '#1FAF72' }} /></Box>}
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
              <Box sx={{ display: 'flex', gap: 1.4, py: 1.4, borderBottom: '1px solid #EEF2F0' }}>
                <Box sx={{ width: 34, height: 34, borderRadius: '50%', bgcolor: '#0F5B3A14', display: 'grid', placeItems: 'center', color: '#0F5B3A', fontWeight: 800, flexShrink: 0 }}>
                  {(m.auteur_nom ?? '?').slice(0, 1).toUpperCase()}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: '0.82rem' }}>
                    {m.auteur_nom}{' '}
                    <Typography component="span" variant="caption" sx={{ color: '#6B7280', fontWeight: 600 }}>
                      {dateCourte(m.cree_le)}
                    </Typography>
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#374151', fontSize: '0.88rem', lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {m.contenu}
                  </Typography>
                </Box>
                {modo && (
                  <Button size="small" onClick={() => moderer(m.id)} title="Masquer (modération)"
                    sx={{ color: '#B42318', minWidth: 0, flexShrink: 0 }}>
                    <DeleteIcon fontSize="small" />
                  </Button>
                )}
              </Box>
            </motion.div>
          ))}
        </AnimatePresence>
        {messages.length === 0 && !isLoading && (
          <Typography variant="caption" sx={{ color: '#6B7280' }}>Aucun message — lance la discussion !</Typography>
        )}

        {sujet.verrouille && !modo ? (
          <Box sx={{ mt: 2, p: 1.6, borderRadius: '12px', bgcolor: '#F0F5F2', display: 'flex', gap: 1, alignItems: 'center' }}>
            <LockIcon sx={{ color: '#6B7280', fontSize: 18 }} />
            <Typography variant="caption" sx={{ color: '#5A6B63', fontWeight: 700 }}>
              Sujet verrouillé par la modération — lecture seule.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <TextField size="small" fullWidth multiline maxRows={4} placeholder="Écris ton message…"
              value={texte} onChange={(e) => setTexte(e.target.value.slice(0, 2000))}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); poster() } }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#F8FAF9' } }} />
            <Button variant="contained" onClick={poster} disabled={!texte.trim() || envoi}
              sx={{ bgcolor: '#1FAF72', '&:hover': { bgcolor: '#179963' }, fontWeight: 800, borderRadius: '12px', flexShrink: 0, alignSelf: 'flex-end' }}>
              {envoi ? '…' : 'Envoyer'}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  )
}
