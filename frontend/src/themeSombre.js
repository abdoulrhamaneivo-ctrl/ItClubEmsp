import { createTheme } from '@mui/material/styles'

/**
 * ThemeSombre — la MÊME charte IT-CLUB EMSP, déclinée pour le mode sombre :
 * verts identiques, fonds nuit profonds, surfaces gris-vert très sombres.
 * Suivi du réglage système via prefers-color-scheme (aucun bouton à gérer).
 */
const charte = {
  vertFonce: '#0F5B3A',
  emeraude: '#1FAF72',
  vertClair: '#9AFBD7',
  bleu: '#2563EB',
  marine: '#0D1B2A',
}

const themeSombre = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: charte.emeraude, contrastText: '#04110B' },
    secondary: { main: charte.vertClair, contrastText: '#04110B' },
    info: { main: '#6EE7B7', contrastText: '#04110B' },
    background: { default: '#0A1420', paper: '#10202F' },
    text: { primary: '#E8F2EC', secondary: '#9DB4A8' },
    divider: 'rgba(154,251,215,.16)',
  },
  typography: {
    fontFamily: "'Poppins', sans-serif",
    body1: { fontSize: '1.02rem', lineHeight: 1.8, color: '#C7D8CE' },
    body2: { fontSize: '0.94rem', lineHeight: 1.75, color: '#9DB4A8' },
    caption: { fontSize: '0.72rem', lineHeight: 1.6, color: '#8FA89C' },
    h1: { fontFamily: "'Orbitron', sans-serif", fontWeight: 800 },
    h2: { fontFamily: "'Orbitron', sans-serif", fontWeight: 800, letterSpacing: '0.02em' },
    h3: { fontFamily: "'Orbitron', sans-serif", fontWeight: 700 },
    h4: { fontFamily: "'Orbitron', sans-serif", fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 700 },
    subtitle1: { fontSize: '1.05rem', lineHeight: 1.7, fontWeight: 600, color: '#E8F2EC' },
    subtitle2: { fontSize: '0.9rem', lineHeight: 1.6, fontWeight: 700, color: '#E8F2EC' },
    button: { textTransform: 'none', fontWeight: 700 },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 28, paddingInline: 24 },
      },
    },
    MuiChip: { styleOverrides: { root: { fontWeight: 700 } } },
  },
})

export default themeSombre
