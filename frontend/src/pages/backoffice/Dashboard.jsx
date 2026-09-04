import { useQuery } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import { api } from '../../lib/api'
import { EnteteModule } from './_Commun'

/**
 * Back-office — Dashboard global (P1/P2) : effectifs, adhésions,
 * événements, projets, opportunités, top cellules. Lecture seule.
 */

function Carte({ label, valeur, couleur, sousValeur }) {
  return (
    <Box sx={{ bgcolor: '#fff', borderRadius: '16px', border: '1px solid #E8ECEA', p: 2.4 }}>
      <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: '1.9rem', color: couleur, lineHeight: 1.1 }}>
        {valeur}
      </Typography>
      <Typography variant="caption" sx={{ color: '#5A6B63', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.64rem' }}>
        {label}
      </Typography>
      {sousValeur && (
        <Typography variant="caption" sx={{ display: 'block', color: '#6B7280', mt: 0.5 }}>
          {sousValeur}
        </Typography>
      )}
    </Box>
  )
}

function MiniBarres({ titre, entrees, couleur }) {
  const vals = Object.entries(entrees ?? {})
  const max = Math.max(1, ...vals.map(([, n]) => n))
  if (vals.length === 0) return null
  return (
    <Box sx={{ bgcolor: '#fff', borderRadius: '16px', border: '1px solid #E8ECEA', p: 2.4 }}>
      <Typography sx={{ fontWeight: 800, color: '#111827', mb: 1.5 }}>{titre}</Typography>
      {vals.map(([k, n]) => (
        <Box key={k} sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1 }}>
          <Typography variant="caption" sx={{ width: 90, flexShrink: 0, color: '#374151', fontWeight: 700, textTransform: 'capitalize' }}>
            {k.replace(/_/g, ' ')}
          </Typography>
          <Box sx={{ flex: 1, height: 9, borderRadius: 9999, bgcolor: '#EEF2F0', overflow: 'hidden' }}>
            <Box sx={{ width: `${Math.round((n / max) * 100)}%`, height: '100%', background: couleur }} />
          </Box>
          <Typography variant="caption" sx={{ width: 28, textAlign: 'right', color: '#111827', fontWeight: 800 }}>{n}</Typography>
        </Box>
      ))}
    </Box>
  )
}

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'], queryFn: () => api.getDashboard(),
  })

  if (isLoading) {
    return (
      <Box>
        <EnteteModule titre={<>Dashboard <Box component="span" sx={{ color: '#9AFBD7' }}>· global</Box></>} />
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress sx={{ color: '#1FAF72' }} />
        </Box>
      </Box>
    )
  }
  if (!data) {
    return (
      <Box>
        <EnteteModule titre={<>Dashboard <Box component="span" sx={{ color: '#9AFBD7' }}>· global</Box></>} />
        <Typography sx={{ color: '#5A6B63' }}>
          {api.isMockMode() ? 'Disponible quand l’API est branchée (VITE_API_URL).' : 'Chargement impossible — vérifie ta connexion.'}
        </Typography>
      </Box>
    )
  }

  const tauxPresence = data.evenements.inscrits_confirmes > 0
    ? Math.round((data.evenements.presents / data.evenements.inscrits_confirmes) * 100) : 0

  return (
    <Box sx={{ maxWidth: '100%' }}>
      <EnteteModule
        titre={<>Dashboard <Box component="span" sx={{ color: '#9AFBD7' }}>· global</Box></>}
        sousTitre="La santé du club en un coup d'œil."
      />
      <Box sx={{ display: 'grid', gap: 1.6, gridTemplateColumns: { xs: 'repeat(2,1fr)', md: 'repeat(4,1fr)' }, mb: 2 }}>
        <Carte label="Membres actifs" valeur={data.membres} couleur="#0F5B3A" sousValeur={`${data.points_distribues} pts distribués`} />
        <Carte label="Candidatures en attente" valeur={data.candidatures.en_attente} couleur="#F5A623" sousValeur={`${data.candidatures.validee} validées · ${data.candidatures.refusee} refusées`} />
        <Carte label="Inscriptions confirmées" valeur={data.evenements.inscrits_confirmes} couleur="#2563EB" sousValeur={`${data.evenements.en_attente} en liste d'attente`} />
        <Carte label="Présences émargées" valeur={data.evenements.presents} couleur="#1FAF72" sousValeur={`Taux de présence ~${tauxPresence}%`} />
      </Box>
      <Box sx={{ display: 'grid', gap: 1.6, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' } }}>
        <MiniBarres titre="Projets" entrees={data.projets} couleur="#7B61FF" />
        <MiniBarres titre="Opportunités" entrees={data.opportunites} couleur="#F5A623" />
        <Box sx={{ bgcolor: '#fff', borderRadius: '16px', border: '1px solid #E8ECEA', p: 2.4 }}>
          <Typography sx={{ fontWeight: 800, color: '#111827', mb: 1.5 }}>Top cellules</Typography>
          {(data.top_cellules ?? []).map((c, i) => (
            <Box key={c.nom} sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1 }}>
              <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: '0.85rem', color: i === 0 ? '#B45309' : '#6B7280', width: 22 }}>
                {i + 1}
              </Typography>
              <Typography variant="body2" sx={{ flex: 1, color: '#111827', fontWeight: 600 }}>{c.nom}</Typography>
              <Typography variant="caption" sx={{ color: '#0B7A4B', fontWeight: 800 }}>{c.membres} membres</Typography>
            </Box>
          ))}
          {(data.top_cellules ?? []).length === 0 && (
            <Typography variant="caption" sx={{ color: '#5A6B63' }}>Aucun membre affecté pour le moment.</Typography>
          )}
        </Box>
      </Box>
    </Box>
  )
}
