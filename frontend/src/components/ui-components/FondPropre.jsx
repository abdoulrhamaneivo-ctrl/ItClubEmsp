import Box from '@mui/material/Box'
import { useTheme } from '@mui/material/styles'

/**
 * Fond neutre PROPRE — voiles semi-transparents laissant deviner
 * le fond de données global (fixé derrière toute la page).
 * Lisibilité préservée : voiles à 78-92% d'opacité.
 * En mode sombre, les voiles suivent le fond nuit du thème.
 */
export default function FondPropre({ variante = 'clair' }) {
  const theme = useTheme()
  const sombre = theme.palette.mode === 'dark'
  const fonds = sombre ? {
    clair: 'rgba(10,20,32,.6)',    // Nuit translucide (background.default)
    blanc: 'rgba(16,32,47,.55)',   // Nuit papier translucide (background.paper)
    gris: 'rgba(10,20,32,.72)',    // Nuit (un peu plus couvrant)
    doux: 'rgba(10,20,32,.78)',    // Nuit (le plus couvrant)
  } : {
    clair: 'rgba(250,250,250,.6)',   // Blanc cassé translucide
    blanc: 'rgba(255,255,255,.55)',   // Blanc pur translucide
    gris: 'rgba(245,245,245,.72)',    // Gris très clair (un peu plus couvrant)
    doux: 'rgba(248,249,250,.75)',     // Très doux (le plus couvrant)
  }

  const fond = fonds[variante] ?? fonds.clair

  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        background: fond,
        // Texture ultra-subtile via CSS
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          opacity: 0.02,
          pointerEvents: 'none',
        },
      }}
    />
  )
}

/**
 * Bandeau d'accent coloré en haut de section (remplace les halos verts)
 */
export function BandeauAccent({ couleur = '#1FAF72', hauteur = 4 }) {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: hauteur,
        background: `linear-gradient(90deg, ${couleur}, ${couleur}80)`,
      }}
    />
  )
}

/**
 * Fond de section avec légère couleur de fond (pour alterner)
 */
export function FondSection({ couleur = 'transparent' }) {
  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        background: couleur,
      }}
    />
  )
}
