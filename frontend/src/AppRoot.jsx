import { useMemo } from 'react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import theme from './theme'
import themeSombre from './themeSombre'
import { FournisseurTheme, useThemeMode } from './hooks/useThemeMode.jsx'

import AppRoutes from './routes/AppRoutes'

/**
 * Thème : bouton clair/sombre dans la navbar (choix mémorisé),
 * sinon réglage du système d'exploitation.
 */
function ThemeActif({ children }) {
  const { sombre } = useThemeMode()
  const themeCourant = useMemo(() => (sombre ? themeSombre : theme), [sombre])
  return <ThemeProvider theme={themeCourant}>{children}</ThemeProvider>
}

export default function App() {
  return (
    <FournisseurTheme>
      <ThemeActif>
        <CssBaseline />
        <AppRoutes />
      </ThemeActif>
    </FournisseurTheme>
  )
}
