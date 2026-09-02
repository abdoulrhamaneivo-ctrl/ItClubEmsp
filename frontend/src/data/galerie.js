/**
 * data/galerie.js — Médias du club (photos + vidéos).
 * Mock local structuré comme la future réponse Django GET /api/v1/galerie/.
 * `icone` : composant line art de la charte (IconesClub) affiché sur le visuel
 * dégradé tant que la vraie photo n'est pas uploadée.
 */
import { IcTrophee, IcFormation, IcLieu, IcRocket, IcCube, IcMembres, IcPhoto, IcVideo } from '../components/ui-components/IconesClub'

export const evenementsGalerie = [
  { id: 'tous', label: 'Tout' },
  { id: 'vibeathon', label: 'Vibeathon CI' },
  { id: 'atelier', label: 'Ateliers' },
  { id: 'sortie', label: 'Sorties' },
  { id: 'hackathon', label: 'Hackathons' },
]

export const mediasGalerie = [
  {
    id: 1, type: 'photo', evenement: 'vibeathon', date: '2026-06-14',
    titre: 'Vibeathon CI — 1er prix', legende: 'L’équipe du club sur le podium',
    icone: IcTrophee, couleur: '#1FAF72',
  },
  {
    id: 2, type: 'photo', evenement: 'atelier', date: '2026-05-20',
    titre: 'Atelier Git & GitHub', legende: 'Branches, merges et bonne humeur',
    icone: IcFormation, couleur: '#2563EB',
  },
  {
    id: 3, type: 'photo', evenement: 'sortie', date: '2026-04-12',
    titre: 'Sortie culturelle — Grand-Bassam', legende: 'Le club hors des salles de classe',
    icone: IcLieu, couleur: '#F5A623',
  },
  {
    id: 4, type: 'video', evenement: 'hackathon', date: '2026-03-08',
    titre: 'Hackathon — aftermovie', legende: '48h de code en 90 secondes',
    youtube: 'dQw4w9WgXcQ', icone: IcVideo, couleur: '#0F5B3A',
  },
  {
    id: 5, type: 'photo', evenement: 'atelier', date: '2026-02-25',
    titre: 'Session de travail', legende: 'Sprint de la cellule Web',
    icone: IcCube, couleur: '#7B61FF',
  },
  {
    id: 6, type: 'photo', evenement: 'vibeathon', date: '2026-06-14',
    titre: 'Stand du club', legende: 'Présentation de la plateforme',
    icone: IcMembres, couleur: '#1FAF72',
  },
  {
    id: 7, type: 'video', evenement: 'atelier', date: '2026-05-20',
    titre: 'Initiation IA — replay', legende: 'Premiers pas avec les LLMs',
    youtube: 'aircAruvnKk', icone: IcVideo, couleur: '#2563EB',
  },
  {
    id: 8, type: 'photo', evenement: 'hackathon', date: '2026-03-08',
    titre: 'Équipes en action', legende: 'Concentration maximale',
    icone: IcRocket, couleur: '#0F5B3A',
  },
]

/** Formatage date FR court. */
export function dateCourte(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}
