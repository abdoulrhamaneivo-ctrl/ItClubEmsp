import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useMediaQuery } from '@mui/material'

const CLE = 'itclub-theme'
const ThemeCtx = createContext({ sombre: false, basculer: () => {}, choix: 'systeme' })

export function FournisseurTheme({ children }) {
  const preferSombre = useMediaQuery('(prefers-color-scheme: dark)')
  const [choix, setChoix] = useState(() => {
    const v = localStorage.getItem(CLE)
    return v === 'sombre' || v === 'clair' ? v : 'systeme'
  })

  useEffect(() => {
    if (choix === 'systeme') localStorage.removeItem(CLE)
    else localStorage.setItem(CLE, choix)
  }, [choix])

  const sombre = choix === 'systeme' ? preferSombre : choix === 'sombre'
  const basculer = useCallback(() => {
    setChoix((c) => {
      const actuel = c === 'systeme' ? (preferSombre ? 'sombre' : 'clair') : c
      return actuel === 'sombre' ? 'clair' : 'sombre'
    })
  }, [preferSombre])

  const valeur = useMemo(() => ({ sombre, basculer, choix }), [sombre, basculer, choix])
  return <ThemeCtx.Provider value={valeur}>{children}</ThemeCtx.Provider>
}

export function useThemeMode() {
  return useContext(ThemeCtx)
}
