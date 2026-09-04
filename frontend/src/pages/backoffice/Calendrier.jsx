import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import LinkIcon from '@mui/icons-material/Link'
import { api } from '../../lib/api'

/**
 * Back-office — Calendrier (P9) : vue mensuelle des événements,
 * badges de conflit de salle (RG-E1, même calcul que le backend),
 * URL d'abonnement iCal (Google Agenda / Apple).
 */

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

function debutJour(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
function finEvenement(e) {
  if (e.date_fin) return new Date(e.date_fin)
  const f = new Date(e.date); f.setHours(f.getHours() + 2); return f
}

function conflits(liste) {
  // Même lieu + chevauchement → ids en conflit (miroir du backend)
  const ids = new Set()
  const avecLieu = liste.filter((e) => (e.lieu ?? '').trim())
  for (let i = 0; i < avecLieu.length; i++) {
    for (let j = i + 1; j < avecLieu.length; j++) {
      const a = avecLieu[i], b = avecLieu[j]
      if (a.lieu.trim().toLowerCase() !== b.lieu.trim().toLowerCase()) continue
      const da = new Date(a.date), fa = finEvenement(a)
      const db = new Date(b.date), fb = finEvenement(b)
      if (da < fb && fa > db) { ids.add(a.id); ids.add(b.id) }
    }
  }
  return ids
}

export default function Calendrier() {
  const REEL = !api.isMockMode()
  const [decalage, setDecalage] = useState(0)
  const [copie, setCopie] = useState(false)

  const { data: evenements = [] } = useQuery({
    queryKey: ['evenements', 'calendrier'],
    queryFn: () => api.getActivites({ upcoming: false, limit: 100 }),
  })

  const idsConflit = useMemo(() => conflits(evenements), [evenements])

  const base = new Date()
  const mois = new Date(base.getFullYear(), base.getMonth() + decalage, 1)
  const nomMois = mois.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  const premier = (mois.getDay() + 6) % 7 // lundi = 0
  const nbJours = new Date(mois.getFullYear(), mois.getMonth() + 1, 0).getDate()
  const cases = [...Array(premier).fill(null), ...Array.from({ length: nbJours }, (_, i) => i + 1)]

  const parJour = {}
  for (const e of evenements) {
    const d = new Date(e.date)
    if (d.getFullYear() === mois.getFullYear() && d.getMonth() === mois.getMonth()) {
      const cle = d.getDate()
      ;(parJour[cle] ??= []).push(e)
    }
  }

  const urlIcs = REEL ? `${import.meta.env.VITE_API_URL}/api/v1/calendrier.ics` : null
  const copierUrl = () => {
    if (!urlIcs) return
    navigator.clipboard?.writeText(urlIcs).catch(() => {})
    setCopie(true)
    setTimeout(() => setCopie(false), 3000)
  }

  const aujourdhui = debutJour(new Date()).getTime()

  return (
    <Box sx={{ maxWidth: '100%' }}>
      <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <Box sx={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3,
          background: 'linear-gradient(135deg,#0D1B2A 0%,#0F5B3A 100%)',
          borderRadius: '20px', px: 3.5, py: 3,
        }}>
          <Box>
            <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: '1.45rem', color: '#fff', textTransform: 'capitalize' }}>
              {nomMois}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,.78)', mt: 0.5 }}>
              {evenements.length} événement{evenements.length > 1 ? 's' : ''}
              {idsConflit.size > 0 && ` · ${idsConflit.size} en conflit de salle`}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <IconButton onClick={() => setDecalage((d) => d - 1)} sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,.12)' }}>
              <ChevronLeftIcon />
            </IconButton>
            <Button size="small" onClick={() => setDecalage(0)}
              sx={{ color: '#fff', fontWeight: 800, bgcolor: 'rgba(255,255,255,.12)', borderRadius: '10px' }}>
              Ce mois
            </Button>
            <IconButton onClick={() => setDecalage((d) => d + 1)} sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,.12)' }}>
              <ChevronRightIcon />
            </IconButton>
            {urlIcs && (
              <Button size="small" variant="contained" startIcon={<LinkIcon />} onClick={copierUrl}
                sx={{ bgcolor: '#1FAF72', '&:hover': { bgcolor: '#179963' }, fontWeight: 800, borderRadius: '10px', ml: 1 }}>
                {copie ? 'URL copiée ✓' : 'Abonnement iCal'}
              </Button>
            )}
          </Box>
        </Box>
      </motion.div>

      <AnimatePresence>
        {idsConflit.size > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Alert severity="warning" sx={{ mb: 2, borderRadius: '12px' }}>
              Conflit de salle : deux événements se chevauchent au même lieu (pastilles rouges).
              La création est bloquée côté API tant que ça dure.
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <Box sx={{ bgcolor: '#fff', borderRadius: '18px', border: '1px solid #E8ECEA', p: { xs: 1.5, md: 2.5 } }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 0.8, mb: 0.8 }}>
          {JOURS.map((j) => (
            <Typography key={j} sx={{ textAlign: 'center', fontWeight: 800, fontSize: '0.68rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {j}
            </Typography>
          ))}
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 0.8 }}>
          {cases.map((jour, i) => {
            if (jour === null) return <Box key={`vide-${i}`} />
            const estAujourdhui = new Date(mois.getFullYear(), mois.getMonth(), jour).getTime() === aujourdhui
            const evts = (parJour[jour] ?? []).sort((a, b) => new Date(a.date) - new Date(b.date))
            return (
              <Box key={jour} sx={{
                minHeight: { xs: 64, md: 92 }, borderRadius: '12px', p: 0.8,
                bgcolor: estAujourdhui ? '#E4F8EF' : '#F8FAF9',
                border: estAujourdhui ? '1.5px solid #1FAF72' : '1px solid #EEF2F0',
                overflow: 'hidden',
              }}>
                <Typography sx={{ fontWeight: 800, fontSize: '0.76rem', color: estAujourdhui ? '#0B7A4B' : '#374151' }}>
                  {jour}
                </Typography>
                {evts.slice(0, 3).map((e) => (
                  <Box key={e.id} title={`${e.titre} · ${e.lieu ?? ''}`} sx={{
                    display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.4,
                    bgcolor: idsConflit.has(e.id) ? '#FDECEC' : '#fff',
                    border: `1px solid ${idsConflit.has(e.id) ? '#F0B4B4' : '#E5E7EB'}`,
                    borderRadius: '7px', px: 0.6, py: 0.2, overflow: 'hidden',
                  }}>
                    <Box sx={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, bgcolor: e.couleur ?? '#2563EB' }} />
                    <Typography sx={{ fontSize: '0.66rem', fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {new Date(e.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} {e.titre}
                    </Typography>
                  </Box>
                ))}
                {evts.length > 3 && (
                  <Typography variant="caption" sx={{ color: '#6B7280', fontSize: '0.64rem' }}>
                    +{evts.length - 3} autre{evts.length - 3 > 1 ? 's' : ''}
                  </Typography>
                )}
              </Box>
            )
          })}
        </Box>
        {urlIcs && (
          <Typography variant="caption" sx={{ display: 'block', mt: 2, color: '#5A6B63', lineHeight: 1.7 }}>
            Abonnement : Google Agenda → « Ajouter un agenda par URL » → colle l'URL copiée.
            Les nouveaux événements apparaissent seuls, sans rien réinstaller.
          </Typography>
        )}
      </Box>

      {idsConflit.size > 0 && (
        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {evenements.filter((e) => idsConflit.has(e.id)).map((e) => (
            <Chip key={e.id} label={`${e.titre} · ${e.lieu}`}
              sx={{ bgcolor: '#FDECEC', color: '#B42318', fontWeight: 700 }} />
          ))}
        </Box>
      )}
    </Box>
  )
}
