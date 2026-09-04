/**
 * Service API — Couche de données pour backend Django.
 * En développement : utilise les mocks locaux.
 * En production : bascule sur les vrais endpoints Django.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? ''
const USE_MOCK = !BASE_URL  // VITE_API_URL défini → API réelle (même en dev)

import { invaliderCacheMetier } from './queryClient'

// Mocks locaux (fallback) — structure identique aux réponses Django attendues
const mocks = {
  bureau: [
    { id: 1, poste: 'Président', nom: 'IVO ABDOUL RHAMANE NESTOR', mission: "Anime le Bureau et représente le club. Publie l'ordre du jour.", objectif: 'Structurer la gouvernance', ordre: 1, couleur: '#0F5B3A' },
    { id: 2, poste: 'Vice-Présidente', nom: 'NASSIROU SALEY HAMIDA', mission: "Supplée le Président. Coordonne les cellules.", objectif: 'Fluidifier la coordination', ordre: 2, couleur: '#1FAF72' },
    { id: 3, poste: 'Secrétaire Générale', nom: 'ABBA KAKA ZARA KOUROU', mission: "Gère les archives, PV, correspondances.", objectif: 'Archiver tout numériquement', ordre: 3, couleur: '#2563EB' },
    { id: 4, poste: 'Resp. Programmation & Planification', nom: 'KARIDIOULA SIE ILYASS YOUSSEF', mission: 'Planifie ateliers, mentorat, veille.', objectif: '100% membres formés', ordre: 4, couleur: '#F5A623' },
    { id: 5, poste: 'Chargé de Communication', nom: 'CISSE DJENIN', mission: 'Anime les réseaux, site, newsletter.', objectif: 'Visibilité maximale', ordre: 5, couleur: '#7B61FF' },
    { id: 6, poste: 'Responsable des Cellules', nom: 'SILUE FOUNGNIGUE YAYA', mission: 'Crée et suit les cellules thématiques.', objectif: 'Des cellules actives toute l’année', ordre: 6, couleur: '#0F5B3A' },
    { id: 7, poste: 'Responsable des Activités', nom: 'SAÏDOU SAMBA FATOUMA ZAHRA', mission: 'Organise ateliers, hackathons, sorties.', objectif: 'Un événement par mois', ordre: 7, couleur: '#2563EB' },
    { id: 8, poste: 'Coordinateur Général des Opportunités', nom: 'SAVADOGO RAZAKIM', mission: 'Démarche entreprises, écoles, ONG.', objectif: '5 partenaires actifs', ordre: 8, couleur: '#1FAF72' },
    { id: 9, poste: 'Responsable Innovation & Solutions', nom: 'OUATTARA IBRAHIM', mission: 'Projets internes, R&D, prototypes.', objectif: '3 prototypes/an', ordre: 9, couleur: '#7B61FF' },
    { id: 10, poste: 'Responsable des Relations Extérieures', nom: 'À désigner', mission: 'Liaison administration, autres clubs.', objectif: 'Reconnaissance officielle', ordre: 10, couleur: '#F5A623' },
  ],
  cellules: [
    { id: 'web', nom: 'Cellule Web', icone: 'web', couleur: '#1FAF72', couleurFonce: '#0E7A50', membres: 14, description: 'Développement front & back : React, Django, déploiement. Le club construit ses propres outils ici.', programme: "Ce que tu y apprendras :\n• React + Vite, Material UI\n• Python / Django / API REST\n• Git, déploiement cloud\n\nProjet phare : cette plateforme !", image: '/photos/web.webp' },
    { id: 'ia', nom: 'Cellule IA', icone: 'ia', couleur: '#2563EB', couleurFonce: '#1D4ED8', membres: 9, description: "Intelligence artificielle et données : modèles, ateliers Python, projets d'agents.", programme: "Ce que tu y apprendras :\n• Bases de Python data\n• LLMs, prompts, agents IA\n• Mini-projets encadrés\n\nProjet phare : assistant IA du club.", image: '/photos/ia.webp' },
    { id: 'cyber', nom: 'Cellule Cybersécurité', icone: 'cyber', couleur: '#0F5B3A', couleurFonce: '#0F5B3A', membres: 11, description: "Sécurité offensive & défensive : CTF, bonnes pratiques, sensibilisation de l'école.", programme: "Ce que tu y apprendras :\n• Bases Linux & réseaux\n• Challenges CTF débutants\n• Sécurité au quotidien\n\nÉvénement : 1er CTF interne EMSP.", image: '/photos/cyber.webp' },
    { id: 'design', nom: 'Cellule Design', icone: 'design', couleur: '#7B61FF', couleurFonce: '#5B3FD6', membres: 7, description: 'UI/UX, identité visuelle, montage vidéo — tout ce qui rend le club visible.', programme: "Ce que tu y apprendras :\n• Figma & design system\n• Montage vidéo (bannières du club)\n• Charte graphique\n\nProjet : habillage vidéo des événements.", image: '/photos/design.webp' },
  ],
  activites: [
    { id: 1, titre: 'Atelier Git & GitHub', type: 'Atelier', date: '2026-09-15', lieu: 'Salle Info EMSP', places: 30, couleur: '#1FAF72', description: 'Apprends à versionner tes projets comme un pro. Branches, merges, PRs, conflits résolus.' },
    { id: 2, titre: 'Hackathon interne IT-CLUB', type: 'Compétition', date: '2026-10-10', lieu: 'EMSP - Amphithéâtre', places: 60, couleur: '#2563EB', description: '48h pour construire une idée en équipe. Prix, mentors, bonne ambiance.' },
    { id: 3, titre: "Veille IA : l'open-source", type: 'Conférence', date: '2026-11-05', lieu: 'En ligne / Hybride', places: 100, couleur: '#0F5B3A', description: "Les modèles gratuits qui changent tout : Llama, Mistral, Qwen — comment les utiliser." },
    { id: 4, titre: 'Initiation CTF', type: 'Atelier', date: '2026-12-03', lieu: 'Salle Info EMSP', places: 25, couleur: '#0F5B3A', description: 'Premiers challenges de cybersécurité : web, crypto, forensics. Débutants bienvenus.' },
    { id: 5, titre: 'Design Sprint UI/UX', type: 'Atelier', date: '2027-01-14', lieu: 'EMSP - Lab Design', places: 20, couleur: '#7B61FF', description: 'De l\'idée au prototype Figma en 4h. Méthode Google Ventures appliquée.' },
  ],
  actualites: [
    { id: 1, titre: "Lancement officiel de la plateforme !", extrait: "Fini les annonces noyées dans WhatsApp : activités, inscriptions et ressources réunies ici.", date: '2026-08-26', auteur: 'Le Bureau', tag: 'Annonce officielle', couleur: '#1FAF72' },
    { id: 2, titre: "Campagne d'adhésion ouverte", extrait: "Scanne le QR code affiché sur le campus ou remplis le formulaire en ligne pour rejoindre une cellule.", date: '2026-09-01', auteur: 'Resp. Innovation & Solutions', tag: 'Adhésion', couleur: '#2563EB' },
    { id: 3, titre: "1er Hackathon IT-CLUB : inscriptions ouvertes", extrait: "48h de code, d'équipe et de fun. 60 places. Inscris-toi avant le 5 octobre.", date: '2026-09-15', auteur: 'Resp. Événementiel', tag: 'Événement', couleur: '#2563EB' },
    { id: 4, titre: "Nouvelle cellule Design lancée", extrait: "UI/UX, montage vidéo, identité visuelle. Rejoins la 4e cellule du club.", date: '2026-09-20', auteur: 'Resp. Communication', tag: 'Cellule', couleur: '#7B61FF' },
  ],
  presentation: {
    titre: 'Le IT-CLUB EMSP',
    intro: "Le IT-CLUB est le club informatique de l'École Multinationale des Postes (EMSP). C'est un espace ouvert à tous les étudiants qui veulent apprendre, coder, partager et construire ensemble — sans prérequis, sans sélection.",
    priorites: [
      { numero: '01', titre: 'Apprendre en codant vrai', texte: "Pas de sujets de cours abstraits. Cette plateforme, les outils du club, les projets — c'est de la vraie techno qu'on construit ensemble. C'est la cellule Web qui l'a faite, les autres cellules y participent. On apprend parce qu'on veut produire quelque chose qui marche." },
      { numero: '02', titre: "Se retrouver et s'entraider", texte: "Sur le campus, toutes les bonnes idées et les bugs s'éparpillent dans des groupes WhatsApp. On a créé l'endroit où tout se retrouve : annonces, ateliers, ressources, forum. Si tu bloques, quelqu'un a déjà connu le problème — et il t'aide, ou tu prends, tu aides après." },
      { numero: '03', titre: 'Ouvrir les horizons', texte: "On va chercher ce qui se fait ailleurs — hackathons, conférences, modèles IA, CTF — et on ramène le meilleur sur le campus. Pas par vanité, mais pour que chacun voie ce qui est possible. Le club, c'est aussi pour voir plus loin et ne pas se limiter à la routine." },
    ],
    galerie: [
      { src: '/photos/galerie-1.webp', legende: 'Sortie culturelle — Grand-Bassam' },
      { src: '/photos/galerie-2.webp', legende: 'Vibeathon CI — 1er prix' },
      { src: '/photos/galerie-3.webp', legende: 'Atelier entre membres' },
      { src: '/photos/galerie-4.webp', legende: 'Session de travail du club' },
    ]
  }
}

// Helpers HTTP
function authHeaders(extra = {}) {
  // JWT stocké au login (stores/auth.js) → exigé par les endpoints protégés
  // (candidatures, inscriptions, notifications). Absent = anonyme.
  const token = localStorage.getItem('access_token')
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra
}

// GET simple — le cache/dédup est géré par React Query (lib/queryClient.js,
// staleTime 60s). Ici : juste fetch + dépliage pagination DRF.
async function fetchJson(endpoint) {
  if (USE_MOCK) return null
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: authHeaders(),
    credentials: 'include',
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  const json = await res.json()
  // DRF pagination : { count, results } → on renvoie la liste directement
  return (json && Array.isArray(json.results)) ? json.results : json
}

// Token management
export function setToken(token) {
  if (token) {
    localStorage.setItem('access_token', token)
  } else {
    localStorage.removeItem('access_token')
  }
}

// POST générique — mock d'auth en dev (le back Django livrera /auth/token)
async function postJson(endpoint, payload, method = 'POST') {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 600))
    if (endpoint === '/api/v1/auth/token') {
      return {
        access: 'mock-token-dev',
        user: { nom: 'IVO ABDOUL RHAMANE NESTOR', roles: [{ code: 'P1' }, { code: 'ADMIN' }] },
      }
    }
    return { success: true, message: 'OK (mock)' }
  }
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  // Écriture réussie → React Query rafraîchit les lectures liées
  invaliderCacheMetier()
  return res.json()
}

// API publique
export const api = {
  // Bureau
  async getBureau() {
    const data = await fetchJson('/api/v1/bureau/')
    return data ?? mocks.bureau
  },

  // Cellules
  async getCellules() {
    const data = await fetchJson('/api/v1/cellules/')
    return data ?? mocks.cellules
  },

  // Activités — backend : /evenements/ (a_venir + limit supportés)
  async getActivites({ upcoming = true, limit = 10 } = {}) {
    const params = new URLSearchParams({ a_venir: upcoming ? '1' : '0', limit: String(limit) })
    const data = await fetchJson(`/api/v1/evenements/?${params}`)
    return data ?? mocks.activites
  },

  // Actualités
  async getActualites({ limit = 6 } = {}) {
    const data = await fetchJson(`/api/v1/actualites/?limit=${limit}`)
    return data ?? mocks.actualites
  },

  // Présentation (qui sommes-nous)
  async getPresentation() {
    const data = await fetchJson('/api/v1/presentation/')
    return data ?? mocks.presentation
  },

  // Adhésion — contrat backend : { donnees: {...}, cellules_souhaitees: [slugs|ids] }
  async postAdhesion(payload) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 800))
      return { success: true, message: 'Candidature enregistrée (mock)' }
    }
    const { cellules, ...donnees } = payload ?? {}
    return postJson('/api/v1/auth/register-candidature', {
      donnees,
      cellules_souhaitees: cellules ?? [],
    })
  },

  // Auth (mock en dev : renvoie le Président avec tous les accès)
  async post(endpoint, payload) {
    return postJson(endpoint, payload)
  },

  // Espace membre — endpoints réels (Authorization via authHeaders)
  async getMe() {
    const data = await fetchJson('/api/v1/me/')
    return data ?? null
  },
  async patchMe(patch) {
    if (USE_MOCK) return { success: true, message: 'OK (mock)' }
    return postJson('/api/v1/me/', patch, 'PATCH')
  },
  async getMesInscriptions() {
    // null en mock → l'Espace garde ses démos ; [] = vide réel
    const data = await fetchJson('/api/v1/me/inscriptions')
    return data ?? null
  },
  async getMesCellules() {
    const data = await fetchJson('/api/v1/me/cellules')
    return data ?? null
  },
  async getNotifications() {
    const data = await fetchJson('/api/v1/notifications/')
    return data ?? null
  },
  async marquerNotificationsLues(ids) {
    if (USE_MOCK) return { marquees_lues: 0 }
    return postJson('/api/v1/notifications/lire/', ids ? { ids } : {})
  },
  async inscrireEvenement(id) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 600))
      return { statut: 'confirme' }
    }
    return postJson(`/api/v1/evenements/${id}/inscrire`, {})
  },
  async desinscrireEvenement(id) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 600))
      return { statut: 'desinscrit' }
    }
    const res = await fetch(`${BASE_URL}/api/v1/evenements/${id}/desinscrire`, {
      method: 'DELETE',
      headers: authHeaders(),
      credentials: 'include',
    })
    if (!res.ok) throw new Error(`API ${res.status}`)
    invaliderCacheMetier()
    return res.json()
  },

  // Registre membres — candidatures (Bureau P1/P3/P4)
  async getCandidatures() {
    const data = await fetchJson('/api/v1/candidatures/')
    return data ?? [
      { id: 101, donnees: { prenom: 'Awa', nom: 'Diallo', email: 'awa.diallo@emsp.int', filiere: 'Digitalisation, 2e année', motivation: 'Je veux apprendre React et aider sur la plateforme.' }, cellules_souhaitees: [1], statut: 'en_attente', cree_le: new Date().toISOString() },
      { id: 102, donnees: { prenom: 'Yao', nom: 'Kouassi', email: 'yao.kouassi@emsp.int', filiere: 'Réseaux, 1re année' }, cellules_souhaitees: [3], statut: 'en_attente', cree_le: new Date().toISOString() },
    ]
  },
  async validerCandidature(id) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 600))
      return { id, statut: 'validee' }
    }
    return postJson(`/api/v1/candidatures/${id}/valider/`, {})
  },
  async refuserCandidature(id) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 600))
      return { id, statut: 'refusee' }
    }
    return postJson(`/api/v1/candidatures/${id}/refuser/`, {})
  },

  // Convocations SG (P1/P3) — rappel H-48h géré par la commande périodique
  async envoyerConvocation({ titre, emails, tous_membres, date_str, lieu, ordre_du_jour }) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 800))
      return { envoyes: tous_membres ? 11 : emails.length, ignores: [] }
    }
    return postJson('/api/v1/reunions/convocation', { titre, emails, tous_membres, date_str, lieu, ordre_du_jour })
  },

  // Utilitaire : bascule mock/prod
  isMockMode() { return USE_MOCK },
}

export default api