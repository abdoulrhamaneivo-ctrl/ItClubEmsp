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
    const data = await apiService.post('/auth/token', { email, password: motDePasse })
    setToken(data.access)
    localStorage.setItem('user', JSON.stringify(data.user))
    set({ user: data.user })
  },
  logout: () => {
    setToken(null)
    localStorage.removeItem('user')
    set({ user: null })
  },
}))

/** Le user a-t-il l'un de ces codes de rôle ? */
export function hasRole(user, codes) {
  if (!user?.roles) return false
  return user.roles.some((r) => codes.includes(r.code) || r.code === 'ADMIN')
}
