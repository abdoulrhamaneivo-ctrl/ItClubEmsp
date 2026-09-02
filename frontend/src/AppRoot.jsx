import { ThemeProvider, CssBaseline } from '@mui/material'
import theme from './theme'

import AppRoutes from './routes/AppRoutes'

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppRoutes />
    </ThemeProvider>
  )
}