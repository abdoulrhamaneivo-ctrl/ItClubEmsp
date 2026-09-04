import { useQuery } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import QrCodeIcon from '@mui/icons-material/QrCode'
import DownloadIcon from '@mui/icons-material/Download'
import { api } from '../../lib/api'
import { EnteteModule } from './_Commun'

/**
 * Back-office — Adhésion & QR code (P7).
 * Statistiques de campagne (par statut, par cellule, par semaine)
 * + QR du formulaire à télécharger pour le campus.
 */

function Barre({ label, valeur, total, couleur }) {
  const pct = total > 0 ? Math.round((valeur / total) * 100) : 0
  return (
    <Box sx={{ mb: 1.4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography sx={{ fontWeight: 700, color: '#111827', fontSize: '0.84rem' }}>{label}</Typography>
        <Typography variant="caption" sx={{ color: '#5A6B63', fontWeight: 800 }}>{valeur} · {pct}%</Typography>
      </Box>
      <Box sx={{ height: 10, borderRadius: 9999, bgcolor: '#EEF2F0', overflow: 'hidden' }}>
        <Box sx={{ width: `${pct}%`, height: '100%', borderRadius: 9999, background: couleur, transition: 'width 400ms ease' }} />
      </Box>
    </Box>
  )
}

export default function StatsAdhesion() {
  const REEL = !api.isMockMode()
  const { data: candidatures = [] } = useQuery({
    queryKey: ['candidatures'], queryFn: () => api.getCandidatures(),
  })
  const { data: cellules = [] } = useQuery({
    queryKey: ['cellules'], queryFn: () => api.getCellules(),
  })
  const nomsCellules = {}
  for (const c of cellules) {
    nomsCellules[c.id] = c.nom
    if (c.slug) nomsCellules[c.slug] = c.nom
  }

  const total = candidatures.length
  const parStatut = {
    en_attente: candidatures.filter((c) => c.statut === 'en_attente').length,
    validee: candidatures.filter((c) => c.statut === 'validee').length,
    refusee: candidatures.filter((c) => c.statut === 'refusee').length,
  }
  const parCellule = {}
  for (const c of candidatures) {
    for (const ref of (c.cellules_souhaitees ?? [])) {
      const nom = nomsCellules[ref] ?? `Cellule ${ref}`
      parCellule[nom] = (parCellule[nom] ?? 0) + 1
    }
  }
  const septJours = candidatures.filter((c) => {
    if (!c.cree_le) return false
    return (Date.now() - new Date(c.cree_le).getTime()) < 7 * 24 * 3600 * 1000
  }).length

  const base = import.meta.env.VITE_API_URL
  const urlQr = base ? `${base}/api/v1/adhesion/qr?source=campus` : null

  const stats = [
    { label: 'Candidatures', valeur: total, couleur: '#1FAF72' },
    { label: 'Cette semaine', valeur: septJours, couleur: '#2563EB' },
    { label: 'Validées', valeur: parStatut.validee, couleur: '#0B7A4B' },
    { label: 'En attente', valeur: parStatut.en_attente, couleur: '#F5A623' },
  ]

  return (
    <Box sx={{ maxWidth: '100%' }}>
      <EnteteModule
        titre={<>Adhésion <Box component="span" sx={{ color: '#9AFBD7' }}>· campagne</Box></>}
        sousTitre="D'où viennent les candidatures, et le QR à afficher sur le campus."
      />

      <Box sx={{ display: 'grid', gap: 1.6, gridTemplateColumns: { xs: 'repeat(2,1fr)', md: 'repeat(4,1fr)' }, mb: 2.5 }}>
        {stats.map((s) => (
          <Box key={s.label} sx={{ bgcolor: '#fff', borderRadius: '16px', border: '1px solid #E8ECEA', p: 2.2 }}>
            <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: '1.7rem', color: s.couleur, lineHeight: 1.1 }}>
              {s.valeur}
            </Typography>
            <Typography variant="caption" sx={{ color: '#5A6B63', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.64rem' }}>
              {s.label}
            </Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1.3fr 1fr' }, alignItems: 'start' }}>
        <Box sx={{ bgcolor: '#fff', borderRadius: '18px', border: '1px solid #E8ECEA', p: { xs: 2.4, md: 3 } }}>
          <Typography sx={{ fontWeight: 800, color: '#111827', mb: 2 }}>Par statut</Typography>
          <Barre label="En attente de décision" valeur={parStatut.en_attente} total={total} couleur="#F5A623" />
          <Barre label="Validées" valeur={parStatut.validee} total={total} couleur="#1FAF72" />
          <Barre label="Refusées" valeur={parStatut.refusee} total={total} couleur="#E57373" />
          <Typography sx={{ fontWeight: 800, color: '#111827', mb: 2, mt: 3 }}>Cellules demandées</Typography>
          {Object.entries(parCellule).sort((a, b) => b[1] - a[1]).map(([nom, n]) => (
            <Barre key={nom} label={nom} valeur={n} total={total} couleur="#2563EB" />
          ))}
          {Object.keys(parCellule).length === 0 && (
            <Typography variant="caption" sx={{ color: '#5A6B63' }}>Aucune préférence exprimée pour le moment.</Typography>
          )}
        </Box>

        <Box sx={{ bgcolor: '#fff', borderRadius: '18px', border: '1px solid #E8ECEA', p: { xs: 2.4, md: 3 }, textAlign: 'center' }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <QrCodeIcon sx={{ color: '#0F5B3A' }} />
            <Typography sx={{ fontWeight: 800, color: '#111827' }}>QR du formulaire</Typography>
          </Box>
          {urlQr ? (
            <>
              <Box component="img" src={urlQr} alt="QR code du formulaire d'adhésion"
                sx={{ width: 180, height: 180, borderRadius: '14px', border: '1px solid #E3EEE8', display: 'block', mx: 'auto' }} />
              <Button size="small" variant="outlined" startIcon={<DownloadIcon />}
                href={urlQr} download="qr-adhesion-campus.png" sx={{ mt: 2, borderColor: '#1FAF72', color: '#0E7A50', fontWeight: 700 }}>
                Télécharger (campus)
              </Button>
              <Box sx={{ mt: 1.5, display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Chip label="source=campus" size="small" sx={{ bgcolor: '#F0F5F2', color: '#374151', fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", fontSize: '0.64rem' }} />
              </Box>
            </>
          ) : (
            <Typography variant="caption" sx={{ color: '#5A6B63' }}>
              QR disponible quand l'API est branchée (VITE_API_URL).
            </Typography>
          )}
          {!REEL && (
            <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: '#5A6B63' }}>
              Mode démo : chiffres d'exemple.
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  )
}
