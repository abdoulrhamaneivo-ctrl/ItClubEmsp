import { useEffect, useMemo, useState } from 'react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { useMediaQuery } from '@mui/material'
import theme from './theme'
import themeSombre from './themeSombre'

import AppRoutes from './routes/AppRoutes'

/**
 * Mode sombre : suit le réglage du système d'exploitation
 * (prefers-color-scheme). Les pages à fond nuit assumé (vitrine, Espace,
 * Login) ont déjà leur propre identité sombre et ignorent ce thème.
 */
export default function App() {
  const preferSombre = useMediaQuery('(prefers-color-scheme: dark)')
  const [sombre, setSombre] = useState(preferSombre)

  // useMediaQuery est synchrone après le premier rendu — resynchronise si l'OS change
  useEffect(() => { setSombre(preferSombre) }, [preferSombre])

  const themeActif = useMemo(() => (sombre ? themeSombre : theme), [sombre])

  return (
    <ThemeProvider theme={themeActif}>
      <CssBaseline />
      <AppRoutes />
    </ThemeProvider>
  )
}
