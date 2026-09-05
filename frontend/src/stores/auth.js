import { create } from 'zustand'
import { api as apiService, setToken } from '../lib/api'

/**
 * Store d'authentification.
 * Le back-end renvoie { access, refresh, user: { nom, roles: [{code, cellule?}] } }.
 * Les codes de rôle pilotent le menu du back-office (doc 01).
 */
export const useAuth = create((set) => ({
  user: JSON.parse(localStorage.getItem('user') ?? 'null'),
  login: async (email, motDePasse) => {
    const data = await apiService.post('/api/v1/auth/token', { email, password: motDePasse })
    setToken(data.access)
    // Refresh (7 jours) : le refresh auto de lib/api.js le consomme sur 401
    if (data.refresh) localStorage.setItem('refresh_token', data.refresh)
    else localStorage.removeItem('refresh_token')
    localStorage.setItem('user', JSON.stringify(data.user))
    set({ user: data.user })
  },
  logout: () => {
    setToken(null)
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    set({ user: null })
  },
}))

/** Le user a-t-il l'un de ces codes de rôle ? */
export function hasRole(user, codes) {
  if (!user?.roles) return false
  return user.roles.some((r) => codes.includes(r.code) || r.code === 'ADMIN')
}
