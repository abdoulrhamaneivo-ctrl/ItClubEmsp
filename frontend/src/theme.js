import { createTheme, alpha } from '@mui/material/styles'

/**
 * Thème IT-CLUB EMSP — charte graphique officielle (dossier CHARTE GRAPHIQUE ET LOGO).
 * Vert #0F5B3A (identité) · Émeraude #1FAF72 · Vert clair #9AFBD7 · Bleu #2563EB
 * Marine #0D1B2A · Noir · Blanc.
 * Typographie : Orbitron (titres) + Poppins (textes).
 */
export const charte = {
  vertFonce: '#0F5B3A',
  emeraude: '#1FAF72',
  vertClair: '#9AFBD7',
  bleu: '#2563EB',
  marine: '#0D1B2A',
  noir: '#000000',
  blanc: '#FFFFFF',
}

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: charte.vertFonce, contrastText: '#fff' },
    secondary: { main: charte.emeraude, contrastText: '#fff' },
    info: { main: charte.bleu },
    background: { default: charte.blanc, paper: '#F6FBF9' },
    text: { primary: charte.marine, secondary: '#5A6B63' },
  },
  typography: {
    fontFamily: "'Poppins', sans-serif",
    h1: { fontFamily: "'Orbitron', sans-serif", fontWeight: 800 },
    h2: { fontFamily: "'Orbitron', sans-serif", fontWeight: 800, letterSpacing: '0.02em' },
    h3: { fontFamily: "'Orbitron', sans-serif", fontWeight: 700 },
    h4: { fontFamily: "'Orbitron', sans-serif", fontWeight: 700 },
    h5: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 700 },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 28, paddingInline: 24 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 8px 30px rgba(15,91,58,0.08)',
          transition: 'transform .3s ease, box-shadow .3s ease',
          '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 14px 40px rgba(15,91,58,0.14)' },
        },
      },
    },
    MuiChip: { styleOverrides: { root: { fontWeight: 700 } } },
  },
})

export default theme
export { alpha }
