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
  let res
  try {
    res = await fetchAuth(endpoint)
  } catch {
    // Backend injoignable (éteint, réseau) : les `?? repli` des getters
    // affichent les mocks au lieu d'une page en erreur.
    return null
  }
  if (!res.ok) throw new Error(`API ${res.status}`)
  const json = await res.json()
  // DRF pagination : { count, results } → on renvoie la liste directement
  return (json && Array.isArray(json.results)) ? json.results : json
}

// ── Session : refresh auto du JWT (access = 30 min) ────────────
// Sans ça, tout appel authentifié répond 401 après 30 min alors que le
// membre semble connecté. Un seul refresh partagé (pas de rafale).
let refreshEnCours = null

function deconnecterSilencieuse() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user')
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

async function rafraichirToken() {
  if (!refreshEnCours) {
    refreshEnCours = (async () => {
      const refresh = localStorage.getItem('refresh_token')
      if (!refresh || USE_MOCK) throw new Error('pas de refresh')
      const res = await fetchAuth(`/api/v1/auth/token/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ refresh }),
      })
      if (!res.ok) throw new Error(`refresh ${res.status}`)
      const data = await res.json()
      localStorage.setItem('access_token', data.access)
      return data.access
    })().finally(() => { refreshEnCours = null })
  }
  return refreshEnCours
}

/** fetch authentifié : sur 401, un refresh puis une seule relance. */
async function fetchAuth(endpoint, options = {}, retente = true) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: authHeaders(options.headers),
    credentials: 'include',
  })
  const estLogin = endpoint.includes('/auth/token')
  if (res.status === 401 && retente && !estLogin && localStorage.getItem('refresh_token')) {
    try {
      await rafraichirToken()
      return fetchAuth(endpoint, options, false)
    } catch {
      deconnecterSilencieuse()
      throw new Error('API 401')
    }
  }
  return res
}

// Token management
export function setToken(token) {
  if (token) {
    localStorage.setItem('access_token', token)
  } else {
    localStorage.removeItem('access_token')
  }
}

// POST/PATCH multipart (FormData : fichiers réels, pas de Content-Type manuel)
async function postForm(endpoint, formData, method = 'POST') {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 600))
    return { success: true, message: 'OK (mock)' }
  }
  const res = await fetchAuth(endpoint, {
    method,
    body: formData,
  })
  if (!res.ok) {
    let detail = ''
    try { detail = JSON.stringify(await res.json()).slice(0, 200) } catch { /* ignore */ }
    throw new Error(`API ${res.status}${detail ? ` — ${detail}` : ''}`)
  }
  invaliderCacheMetier()
  return res.status === 204 ? null : res.json()
}

async function supprimerRessource(endpoint) {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 400))
    return { success: true }
  }
  const res = await fetchAuth(endpoint, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  invaliderCacheMetier()
  return { success: true }
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
  const res = await fetchAuth(endpoint, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    let detail = ''
    try { detail = JSON.stringify(await res.json()).slice(0, 200) } catch { /* ignore */ }
    throw new Error(`API ${res.status}${detail ? ` — ${detail}` : ''}`)
  }
  // Écriture réussie → React Query rafraîchit les lectures liées
  invaliderCacheMetier()
  return res.json()
}

// API publique
export const api = {
  // Chiffres vitrine (public, zéro chiffre en dur sur l'accueil)
  async getStatsPubliques() {
    return fetchJson('/api/v1/stats-publiques/')
  },
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
  // Événements passés (avec note + bilan pour la vitrine)
  async getEvenementsPasses(limit = 6) {
    const data = await fetchJson(`/api/v1/evenements/?a_venir=0&limit=${limit}`)
    return data ?? []
  },

  // Actualités
  async getActualites({ limit = 6 } = {}) {
    const data = await fetchJson(`/api/v1/actualites/?limit=${limit}`)
    return data ?? mocks.actualites
  },
  // Version brute (null en mock) — pour lib/contenu qui gère le fallback local
  async getActualitesBrutes() {
    return fetchJson('/api/v1/actualites/')
  },
  async getDocuments() {
    return fetchJson('/api/v1/documents/')
  },
  async getMedias() {
    return fetchJson('/api/v1/galerie/')
  },

  // Publication multipart (fichiers réels) — crée ou modifie (id/slug fourni)
  async publierActualite({ id, titre, extrait, imageFile, tag_cellule }) {
    const fd = new FormData()
    fd.append('titre', titre)
    fd.append('extrait', extrait ?? '')
    if (tag_cellule) fd.append('tag_cellule', tag_cellule)
    if (imageFile) fd.append('image', imageFile)
    return postForm(id ? `/api/v1/actualites/${id}/` : '/api/v1/actualites/', fd, id ? 'PATCH' : 'POST')
  },
  async supprimerActualite(id) {
    return supprimerRessource(`/api/v1/actualites/${id}/`)
  },
  async publierDocument({ slug, titre, description, fichierFile, famille, couleur }) {
    const fd = new FormData()
    if (slug) fd.append('slug', slug)
    fd.append('titre', titre)
    fd.append('description', description ?? '')
    fd.append('famille_id', famille ?? 'fondamentaux')
    if (couleur) fd.append('couleur', couleur)
    if (fichierFile) fd.append('fichier', fichierFile)
    // slug existant → PATCH, sinon POST (le slug est la clé primaire)
    return postForm(slug ? `/api/v1/documents/${slug}/` : '/api/v1/documents/', fd, slug ? 'PATCH' : 'POST')
  },
  async supprimerDocument(slug) {
    return supprimerRessource(`/api/v1/documents/${slug}/`)
  },
  async publierMedia({ id, titre, legende, type, imageFile, youtube_id, evenement, tag_cellule, icone }) {
    const fd = new FormData()
    fd.append('titre', titre)
    fd.append('legende', legende ?? '')
    fd.append('type', type ?? 'photo')
    if (youtube_id) fd.append('youtube_id', youtube_id)
    if (evenement) fd.append('evenement', evenement)
    if (tag_cellule) fd.append('tag_cellule', tag_cellule)
    if (icone) fd.append('icone', icone)
    if (imageFile) fd.append('image', imageFile)
    return postForm(id ? `/api/v1/galerie/${id}/` : '/api/v1/galerie/', fd, id ? 'PATCH' : 'POST')
  },
  async supprimerMedia(id) {
    return supprimerRessource(`/api/v1/galerie/${id}/`)
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
  // Invitation : le membre choisit son mot de passe (lien email)
  async definirMotDePasse(uid, token, password) {
    return postJson('/api/v1/auth/definir-mot-de-passe', { uid, token, password })
  },
  // Rotation : le membre connecté change son mot de passe
  async changerMotDePasse(ancien, nouveau) {
    return postJson('/api/v1/me/mot-de-passe', { ancien, nouveau })
  },
  // Diagnostic Bureau : tester l'envoi Brevo vers une adresse
  async testerEmail(destinataire) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 500))
      return { ok: true, resultat: { id: 'mock' } }
    }
    return postJson('/api/v1/emails/test', { to: destinataire })
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
    const res = await fetchAuth(`/api/v1/evenements/${id}/desinscrire`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error(`API ${res.status}`)
    invaliderCacheMetier()
    return res.json()
  },

  // Présence : émargement via code à 6 chiffres (+5 pts)
  async marquerPresence(evenementId, code) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 600))
      return { statut: 'present', points: 5, gagnes: 5 }
    }
    return postJson(`/api/v1/evenements/${evenementId}/presence`, { code })
  },
  async emargerMembre(evenementId, email) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 400))
      return { statut: 'present', points: 5, gagnes: 5 }
    }
    return postJson(`/api/v1/evenements/${evenementId}/presence`, { email })
  },
  async getPresences(evenementId) {
    const data = await fetchJson(`/api/v1/evenements/${evenementId}/presence/`)
    return data ?? { evenement: '', code: '', presents: [] }
  },
  // Téléchargement authentifié (blob) : CSV orga + QR présence
  async telechargerFichier(url, nomFichier) {
    const res = await fetchAuth(url)
    if (!res.ok) throw new Error(`API ${res.status}`)
    const blob = await res.blob()
    const lien = document.createElement('a')
    lien.href = URL.createObjectURL(blob)
    lien.download = nomFichier
    document.body.appendChild(lien)
    lien.click()
    lien.remove()
    setTimeout(() => URL.revokeObjectURL(lien.href), 5000)
  },
  async telechargerCSVPresences(evenementId) {
    return this.telechargerFichier(`/api/v1/evenements/${evenementId}/export-presences.csv`, `presences-evenement-${evenementId}.csv`)
  },
  // Exports CSV du Bureau (même mécanisme blob authentifié)
  async exporterMembres() {
    return this.telechargerFichier('/api/v1/admin/export-membres.csv', 'membres-club.csv')
  },
  async exporterMembresCellule(slug) {
    return this.telechargerFichier(`/api/v1/cellules/${slug}/export-membres.csv`, `membres-${slug}.csv`)
  },
  async exporterSondage(sondageId) {
    return this.telechargerFichier(`/api/v1/sondages/${sondageId}/export.csv`, `sondage-${sondageId}.csv`)
  },
  async exporterComptesRendus() {
    return this.telechargerFichier('/api/v1/comptes-rendus/export.csv', 'comptes-rendus.csv')
  },
  async exporterRetours(evenementId) {
    const qs = evenementId ? `?evenement=${evenementId}` : ''
    return this.telechargerFichier(`/api/v1/retours/export.csv${qs}`, 'retours-membres.csv')
  },
  // Photo de profil (multipart) : POST = FormData, PATCH /me/
  async changerPhoto(fichier) {
    const fd = new FormData()
    fd.append('photo', fichier)
    return postForm('/api/v1/me/', fd, 'PATCH')
  },
  async telechargerQRPresence(evenementId) {
    return this.telechargerFichier(`/api/v1/evenements/${evenementId}/qr-presence`, `qr-presence-${evenementId}.png`)
  },

  // Réactions + commentaires (actus) — login requis pour écrire
  async reagir(actualiteId, emoji) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 300))
      return { statut: 'ajoutee', reactions: { '👍': 1, '❤️': 0, '🔥': 0 }, ma_reaction: emoji }
    }
    return postJson(`/api/v1/actualites/${actualiteId}/reagir/`, { emoji })
  },
  async getCommentaires(actualiteId) {
    const data = await fetchJson(`/api/v1/actualites/${actualiteId}/commentaires/`)
    return data ?? []
  },
  async posterCommentaire(actualiteId, contenu, reponse_a = null) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 400))
      return { id: Date.now(), statut: 'publie' }
    }
    return postJson(`/api/v1/actualites/${actualiteId}/commentaires/`, { contenu, reponse_a })
  },
  // Gamification : classement public
  async getClassement() {
    const data = await fetchJson('/api/v1/classement/')
    return data ?? []
  },

  // Dashboard direction (P1/P2)
  async getDashboard() {
    const data = await fetchJson('/api/v1/dashboard/')
    return data ?? null
  },

  // Projets (P2/P7) — CRUD, écriture Bureau
  async getProjets() {
    const data = await fetchJson('/api/v1/projets/')
    return data ?? []
  },
  async sauverProjet({ id, nom, description, statut, lien }) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 500))
      return { id: id ?? Date.now(), nom, statut }
    }
    return postJson(id ? `/api/v1/projets/${id}/` : '/api/v1/projets/', { nom, description, statut, lien }, id ? 'PATCH' : 'POST')
  },
  async supprimerProjet(id) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 300))
      return { success: true }
    }
    const res = await fetchAuth(`/api/v1/projets/${id}/`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error(`API ${res.status}`)
    invaliderCacheMetier()
    return { success: true }
  },

  // Opportunités (P8) — CRUD + carnet de contacts
  async getOpportunites() {
    const data = await fetchJson('/api/v1/opportunites/')
    return data ?? []
  },
  async sauverOpportunite(o) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 500))
      return { id: o.id ?? Date.now(), ...o }
    }
    const { id, ...corps } = o
    return postJson(id ? `/api/v1/opportunites/${id}/` : '/api/v1/opportunites/', corps, id ? 'PATCH' : 'POST')
  },
  async supprimerOpportunite(id) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 300))
      return { success: true }
    }
    const res = await fetchAuth(`/api/v1/opportunites/${id}/`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error(`API ${res.status}`)
    invaliderCacheMetier()
    return { success: true }
  },

  // Paramètres club (P5) : réseaux sociaux, bannière…
  async getParametres() {
    const data = await fetchJson('/api/v1/parametres/')
    return data ?? []
  },
  async sauverParametre(cle, valeur) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 300))
      return { cle, valeur }
    }
    // Upsert : POST crée ou remplace (jamais de 404 au premier enregistrement)
    return postJson('/api/v1/parametres/', { cle, valeur })
  },

  // Admin : annuaire + passation
  async getAdminUsers() {
    const data = await fetchJson('/api/v1/admin/utilisateurs/')
    return data ?? []
  },
  async majAdminUser(id, patch) {
    if (USE_MOCK) return { id, ...patch }
    return postJson(`/api/v1/admin/utilisateurs/${id}/`, patch, 'PATCH')
  },
  async getAdminRoles() {
    const data = await fetchJson('/api/v1/admin/roles/')
    return data ?? []
  },
  async passationRole(code, email) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 400))
      return { code, titulaire: email }
    }
    return postJson(`/api/v1/admin/roles/${code}/`, { email }, 'PATCH')
  },

  // Annonces = actualités (P1/P5/chef) : audience tous ou cellule
  async publierAnnonce({ titre, extrait, tag_cellule }) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 600))
      return { id: Date.now(), titre }
    }
    return postJson('/api/v1/actualites/', { titre, extrait, tag_cellule })
  },

  // Ateliers = événements type=atelier (P10) : création anti-conflit serveur
  async creerAtelier({ titre, description, date, lieu, places }) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 600))
      return { id: Date.now(), titre }
    }
    return postJson('/api/v1/evenements/', { titre, description, type: 'atelier', date, lieu, places })
  },
  // Cellules (P4) — création, modification, chef par email
  async sauverCellule({ id, slug, nom, description, couleur, chef_email }) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 500))
      return { id: id ?? Date.now(), nom }
    }
    const corps = { nom, description, couleur }
    if (chef_email !== undefined) corps.chef_email = chef_email
    if (id) return postJson(`/api/v1/cellules/${id}/`, corps, 'PATCH')
    return postJson('/api/v1/cellules/', { slug, ...corps })
  },
  async supprimerCellule(id) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 300))
      return { success: true }
    }
    const res = await fetchAuth(`/api/v1/cellules/${id}/`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error(`API ${res.status}`)
    invaliderCacheMetier()
    return { success: true }
  },

  // Forum (membres connectés) : sujets + messages + modération
  async getSujets() {
    const data = await fetchJson('/api/v1/forum/sujets/')
    return data ?? []
  },
  async creerSujet({ titre, espace, cellule, projet }) {
    return postJson('/api/v1/forum/sujets/', { titre, espace, cellule, projet })
  },
  async majSujet(id, patch) {
    return postJson(`/api/v1/forum/sujets/${id}/`, patch, 'PATCH')
  },
  async getMessages(sujetId) {
    const data = await fetchJson(`/api/v1/forum/messages/?sujet=${sujetId}`)
    return data ?? []
  },
  async posterMessage(sujetId, contenu) {
    return postJson('/api/v1/forum/messages/', { sujet: sujetId, contenu })
  },
  async modererMessage(id) {
    const res = await fetchAuth(`/api/v1/forum/messages/${id}/`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error(`API ${res.status}`)
    invaliderCacheMetier()
    return { success: true }
  },
  // Sondages (membres) : liste, création, vote, clôture
  async getSondages() {
    const data = await fetchJson('/api/v1/sondages/')
    return data ?? []
  },
  async creerSondage({ titre, description, options, choix_multiple, cellule }) {
    return postJson('/api/v1/sondages/', { titre, description, options, choix_multiple, cellule })
  },
  async majSondage(id, patch) {
    return postJson(`/api/v1/sondages/${id}/`, patch, 'PATCH')
  },
  async voter(sondageId, optionId) {
    return postJson(`/api/v1/sondages/${sondageId}/voter/`, { option: optionId })
  },
  // Comptes rendus (P3/P1) : brouillon → validation → publié
  async getComptesRendus() {
    const data = await fetchJson('/api/v1/comptes-rendus/')
    return data ?? []
  },
  async creerCR({ titre, reunion_date, lieu, ordre_du_jour, contenu }) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 500))
      return { id: Date.now(), titre, statut: 'brouillon' }
    }
    return postJson('/api/v1/comptes-rendus/', { titre, reunion_date, lieu, ordre_du_jour, contenu })
  },
  async majCR(id, patch) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 400))
      return { id, ...patch }
    }
    return postJson(`/api/v1/comptes-rendus/${id}/`, patch, 'PATCH')
  },
  async supprimerCR(id) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 300))
      return { success: true }
    }
    const res = await fetchAuth(`/api/v1/comptes-rendus/${id}/`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error(`API ${res.status}`)
    invaliderCacheMetier()
    return { success: true }
  },
  // Retours post-activité : donner/modifier son avis
  async donnerRetour(evenementId, note, avis = '') {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 500))
      return { statut: 'enregistre', note_moyenne: note, nb_retours: 1 }
    }
    return postJson(`/api/v1/evenements/${evenementId}/retour`, { note, avis })
  },
  async getRetours(evenementId) {
    const data = await fetchJson(`/api/v1/evenements/${evenementId}/retours/`)
    return data ?? { evenement: '', note_moyenne: null, nb_retours: 0, avis: [] }
  },
  // Bilan (orga) : brouillon + publication
  async getBilan(evenementId) {
    const data = await fetchJson(`/api/v1/evenements/${evenementId}/bilan/`)
    return data ?? { evenement: '', bilan: null }
  },
  async majBilan(evenementId, patch) {
    return postJson(`/api/v1/evenements/${evenementId}/bilan/`, patch, 'PATCH')
  },

  // Veille techno (membres) : partage + upvote toggle
  async getVeille() {
    const data = await fetchJson('/api/v1/veille/')
    return data ?? []
  },
  async creerVeille({ titre, lien, theme, resume }) {
    return postJson('/api/v1/veille/', { titre, lien, theme, resume })
  },
  async voterVeille(veilleId) {
    return postJson(`/api/v1/veille/${veilleId}/voter/`, {})
  },
  async supprimerVeille(id) {
    const res = await fetchAuth(`/api/v1/veille/${id}/`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error(`API ${res.status}`)
    invaliderCacheMetier()
    return { success: true }
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