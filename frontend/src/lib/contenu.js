/**
 * lib/contenu.js — Magasin de contenu du club (actualités, documents, médias).
 * Persistance localStorage (dev) ; en prod : API Django.
 * Les pages publiques s'abonnent (useContenu) et se re-render à chaque modif back-office.
 */
import { useEffect, useState } from 'react'

const CLES = {
  actualites: 'club_actualites',
  documents: 'club_documents',
  medias: 'club_medias',
}

const listeners = new Set()
function notifier() { listeners.forEach((cb) => cb()) }
export function subscribe(cb) { listeners.add(cb); return () => listeners.delete(cb) }

function lire(cle, defaut) {
  try {
    const brut = localStorage.getItem(cle)
    if (!brut) return defaut
    const val = JSON.parse(brut)
    return Array.isArray(val) && val.length ? val : defaut
  } catch { return defaut }
}

function ecrire(cle, val) {
  localStorage.setItem(cle, JSON.stringify(val))
  notifier()
}

/* ── Graines initiales (identiques aux mocks actuels) ───────── */

const SEED_ACTUALITES = [
  { id: 'a1', titre: 'Lancement officiel de la plateforme !', extrait: 'Fini les annonces noyées dans WhatsApp : activités, inscriptions et ressources réunies ici.', auteur: 'Le Bureau', tag: 'Annonce officielle', cellule: 'general', date: '2026-08-26', couleur: '#1FAF72', image: null },
  { id: 'a2', titre: "Campagne d'adhésion ouverte", extrait: 'Scanne le QR code affiché sur le campus ou remplis le formulaire en ligne pour rejoindre une cellule.', auteur: 'Resp. Innovation & Solutions', tag: 'Adhésion', cellule: 'general', date: '2026-09-01', couleur: '#2563EB', image: null },
  { id: 'a3', titre: '1er Hackathon IT-CLUB : inscriptions ouvertes', extrait: "48h de code, d'équipe et de fun. 60 places. Inscris-toi avant le 5 octobre.", auteur: 'Resp. Programmation & Planification', tag: 'Événement', cellule: 'general', date: '2026-09-15', couleur: '#2563EB', image: null },
  { id: 'a4', titre: 'Nouvelle cellule Design lancée', extrait: 'UI/UX, montage vidéo, identité visuelle. Rejoins la 4e cellule du club.', auteur: 'Chargé de Communication', tag: 'Cellule', cellule: 'design', date: '2026-09-20', couleur: '#7B61FF', image: null },
]

const SEED_DOCUMENTS = [
  { id: 'charte', titre: 'Charte du IT-CLUB EMSP', description: 'Les valeurs, principes et engagements qui guident le club.', categorie: 'Charte', famille: 'fondamentaux', couleur: '#1FAF72', fichier: 'Charte_IT_CLUB_EMSP.pdf', format: 'PDF' },
  { id: 'reglement', titre: 'Règlement intérieur', description: 'Les règles de fonctionnement quotidien du club.', categorie: 'Règlement', famille: 'fondamentaux', couleur: '#2563EB', fichier: 'Reglement_Interieur.pdf', format: 'PDF' },
  { id: 'statuts', titre: 'Statuts de l’association', description: 'Le cadre juridique officiel du IT-CLUB EMSP (association loi 1901).', categorie: 'Statuts', famille: 'fondamentaux', couleur: '#0F5B3A', fichier: 'Statuts_IT_CLUB_EMSP.pdf', format: 'PDF' },
  { id: 'statutsCI', titre: 'Statuts CI (corrigé)', description: 'Statuts corrigés pour la Côte d’Ivoire.', categorie: 'Statuts', famille: 'fondamentaux', couleur: '#0F5B3A', fichier: 'Statuts_CI_EMSP_corrige.docx', format: 'DOCX' },
  { id: 'missions', titre: 'Missions du Bureau', description: 'Détail des missions et objectifs de chaque poste du Bureau.', categorie: 'Missions', famille: 'organisation', couleur: '#7B61FF', fichier: 'Missions_Bureau_IT_CLUB_EMSP.docx', format: 'DOCX' },
  { id: 'membres', titre: 'Liste des membres', description: 'Liste officielle des membres du club.', categorie: 'Membres', famille: 'organisation', couleur: '#0E7A50', fichier: 'Liste_Membres_IT_CLUB_EMSP.docx.pdf', format: 'PDF' },
  { id: 'pv1', titre: 'Procès-verbal AG 1', description: 'Compte-rendu de la première assemblée générale.', categorie: 'PV', famille: 'archives', couleur: '#F5A623', fichier: 'Compte_Rendu_Reunion_1_IT_Club_EMSP.docx.pdf', format: 'PDF' },
  { id: 'pv7mai', titre: 'Procès-verbal du 7 mai 2026', description: 'Compte-rendu de la réunion du 7 mai 2026.', categorie: 'PV', famille: 'archives', couleur: '#F5A623', fichier: 'Compte_rendu_Reunion_7_Mai_2026.pdf', format: 'PDF' },
]

const SEED_MEDIAS = [
  { id: 'm1', type: 'photo', evenement: 'vibeathon', cellule: 'general', date: '2026-06-14', titre: 'Vibeathon CI — 1er prix', legende: 'L’équipe du club sur le podium', iconeId: 'trophee', couleur: '#1FAF72', image: null },
  { id: 'm2', type: 'photo', evenement: 'atelier', cellule: 'web', date: '2026-05-20', titre: 'Atelier Git & GitHub', legende: 'Branches, merges et bonne humeur', iconeId: 'formation', couleur: '#2563EB', image: null },
  { id: 'm3', type: 'photo', evenement: 'sortie', cellule: 'general', date: '2026-04-12', titre: 'Sortie culturelle — Grand-Bassam', legende: 'Le club hors des salles de classe', iconeId: 'lieu', couleur: '#F5A623', image: null },
  { id: 'm4', type: 'video', evenement: 'hackathon', cellule: 'general', date: '2026-03-08', titre: 'Hackathon — aftermovie', legende: '48h de code en 90 secondes', youtube: 'dQw4w9WgXcQ', iconeId: 'video', couleur: '#0F5B3A', image: null },
  { id: 'm5', type: 'photo', evenement: 'atelier', cellule: 'design', date: '2026-02-25', titre: 'Session de travail', legende: 'Sprint de la cellule Design', iconeId: 'cube', couleur: '#7B61FF', image: null },
  { id: 'm6', type: 'photo', evenement: 'vibeathon', cellule: 'general', date: '2026-06-14', titre: 'Stand du club', legende: 'Présentation de la plateforme', iconeId: 'membres', couleur: '#1FAF72', image: null },
  { id: 'm7', type: 'video', evenement: 'atelier', cellule: 'ia', date: '2026-05-20', titre: 'Initiation IA — replay', legende: 'Premiers pas avec les LLMs', youtube: 'aircAruvnKk', iconeId: 'video', couleur: '#2563EB', image: null },
  { id: 'm8', type: 'photo', evenement: 'hackathon', cellule: 'cyber', date: '2026-03-08', titre: 'Équipes en action', legende: 'Concentration maximale', iconeId: 'rocket', couleur: '#0F5B3A', image: null },
]

/* ── API publique du magasin ────────────────────────────────── */

export function getActualites() { return lire(CLES.actualites, SEED_ACTUALITES) }
export function getDocuments() { return lire(CLES.documents, SEED_DOCUMENTS) }
export function getMedias() { return lire(CLES.medias, SEED_MEDIAS) }

export function sauverActualite(item) {
  const liste = getActualites()
  const i = liste.findIndex((x) => x.id === item.id)
  if (i >= 0) liste[i] = item
  else liste.unshift({ ...item, id: item.id || `a_${Date.now()}`, date: item.date || new Date().toISOString().slice(0, 10) })
  ecrire(CLES.actualites, liste)
}

export function supprimerActualite(id) {
  ecrire(CLES.actualites, getActualites().filter((x) => x.id !== id))
}

export function sauverDocument(item) {
  const liste = getDocuments()
  const i = liste.findIndex((x) => x.id === item.id)
  if (i >= 0) liste[i] = item
  else liste.push({ ...item, id: item.id || `d_${Date.now()}` })
  ecrire(CLES.documents, liste)
}

export function supprimerDocument(id) {
  ecrire(CLES.documents, getDocuments().filter((x) => x.id !== id))
}

export function sauverMedia(item) {
  const liste = getMedias()
  const i = liste.findIndex((x) => x.id === item.id)
  if (i >= 0) liste[i] = item
  else liste.unshift({ ...item, id: item.id || `m_${Date.now()}`, date: item.date || new Date().toISOString().slice(0, 10) })
  ecrire(CLES.medias, liste)
}

export function supprimerMedia(id) {
  ecrire(CLES.medias, getMedias().filter((x) => x.id !== id))
}

/** Hook : données réactives — re-render à chaque modification back-office. */
export function useContenu(type) {
  const lireActuel = () => type === 'actualites' ? getActualites() : type === 'documents' ? getDocuments() : getMedias()
  const [data, setData] = useState(lireActuel)
  useEffect(() => {
    setData(lireActuel())
    return subscribe(() => setData(lireActuel()))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type])
  return data
}

/** Lecture d'un fichier image → dataURL (max ~1.8 Mo, compressé si besoin). */
export function fichierVersDataUrl(file, maxOctets = 1_800_000) {
  return new Promise((resolve) => {
    if (!file) return resolve(null)
    if (file.size > maxOctets) return resolve({ erreur: `Image trop lourde (${Math.round(file.size / 1024)} Ko). Maximum : ${Math.round(maxOctets / 1024)} Ko.` })
    const fr = new FileReader()
    fr.onload = () => resolve(fr.result)
    fr.onerror = () => resolve({ erreur: 'Lecture du fichier impossible' })
    fr.readAsDataURL(file)
  })
}

export const CELLULES_TAGGABLES = [
  { id: 'general', label: 'Général (tout le club)' },
  { id: 'web', label: 'Cellule Web' },
  { id: 'ia', label: 'Cellule IA' },
  { id: 'cyber', label: 'Cellule Cybersécurité' },
  { id: 'design', label: 'Cellule Design' },
]
