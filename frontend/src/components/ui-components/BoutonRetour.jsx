import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

/**
 * BoutonRetour — retour visible vers la vitrine (ou l'écran précédent).
 * Variante 'clair' (pages claires) ou 'sombre' (pages à fond nuit).
 */
export default function BoutonRetour({ variante = 'clair', label = 'Retour au site', cible = '/' }) {
  const navigate = useNavigate()
  const sombre = variante === 'sombre'
  return (
    <Button
      startIcon={<ArrowBackIcon sx={{ fontSize: 18 }} />}
      onClick={() => navigate(cible)}
      sx={{
        minHeight: 44, px: 2, borderRadius: '12px', fontWeight: 800, fontSize: '0.875rem',
        color: sombre ? '#9AFBD7' : '#0F5B3A',
        border: '1px solid', borderColor: sombre ? 'rgba(154,251,215,.16)' : '#E8ECEA',
        bgcolor: sombre ? 'rgba(154,251,215,.06)' : '#fff',
        '&:hover': { bgcolor: sombre ? 'rgba(154,251,215,.12)' : '#F0F5F2' },
        '&:focus-visible': { outline: '2px solid #1FAF72', outlineOffset: '2px' },
      }}
    >
      {label}
    </Button>
  )
}
