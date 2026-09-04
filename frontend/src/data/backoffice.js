/**
 * data/backoffice.js — Modules du back-office (doc 05 §4).
 * Chaque module a SON icône lucide unique (fini les doublons).
 */

// Import direct de lucide — 1 module = 1 icône distincte
import {
  Megaphone, LayoutDashboard, FolderKanban, ListChecks, FileSignature,
  BookUser, Users2, Share2, CalendarClock, QrCode, Newspaper,
  ClipboardPen, Target, CalendarRange, Presentation, ShieldCheck,
} from 'lucide-react'

export const modulesBackoffice = [
  { path: 'annonces', label: 'Annonces', roles: ['P1', 'P5', 'CHEF_CELLULE'], desc: 'Composer et publier les annonces officielles ou ciblées.', Icone: Megaphone },
  { path: 'dashboard', label: 'Dashboard global', roles: ['P1', 'P2'], desc: 'Objectifs par poste, activité, effectifs.', Icone: LayoutDashboard },
  { path: 'projets-suivi', label: 'Suivi projets', roles: ['P2', 'P7'], desc: 'Tableau des projets techniques du club.', Icone: FolderKanban },
  { path: 'taches-notion', label: 'Tâches Notion', roles: ['P1', 'P2', 'P3', 'ADMIN'], desc: 'Suivi et mise à jour des tâches du club (base Notion, temps réel).', Icone: ListChecks },
  { path: 'comptes-rendus', label: 'Comptes rendus', roles: ['P3', 'P1'], desc: 'Rédiger, valider, publier ; convocations H-48h.', Icone: FileSignature },
  { path: 'registre-membres', label: 'Registre membres', roles: ['P3', 'P4'], desc: 'Registre complet, validation des candidatures.', Icone: BookUser },
  { path: 'cellules', label: 'Cellules', roles: ['P4'], desc: 'Créer les cellules, nommer les chefs.', Icone: Users2 },
  { path: 'communication', label: 'Communication', roles: ['P5'], desc: 'Affiches, galerie, calendrier éditorial, réseaux sociaux.', Icone: Share2 },
  { path: 'evenements', label: 'Événements', roles: ['P6'], desc: 'Fiches, checklists, places, retours, bilans.', Icone: CalendarClock },
  { path: 'bilans', label: 'Retours & bilans', roles: ['P6'], desc: 'Avis des membres après l\'activité, bilan publié sur la vitrine.', Icone: CalendarClock },
  { path: 'adhesion', label: 'Adhésion & QR code', roles: ['P7'], desc: 'Formulaire, QR code téléchargeable, statistiques.', Icone: QrCode },
  { path: 'contenu', label: 'Actualités & contenu', roles: ['P1', 'P3', 'P5', 'ADMIN'], desc: 'Publier des actualités (avec image + tag cellule), gérer les documents et la galerie.', Icone: Newspaper },
  { path: 'formulaire', label: 'Éditer le formulaire', roles: ['P1', 'P7', 'P3', 'ADMIN'], desc: 'Ajouter, supprimer, modifier les champs du formulaire d’adhésion et les rendre obligatoires ou non.', Icone: ClipboardPen },
  { path: 'opportunites', label: 'Opportunités', roles: ['P8'], desc: 'Kanban hackathons/conférences, carnet de contacts.', Icone: Target },
  { path: 'calendrier', label: 'Calendrier', roles: ['P9'], desc: 'Sources externes, conflits, récap hebdomadaire.', Icone: CalendarRange },
  { path: 'ateliers', label: 'Ateliers', roles: ['P10'], desc: 'Planning hebdo, fiches types, feuilles de présence.', Icone: Presentation },
  { path: 'admin', label: 'Administration', roles: ['ADMIN'], desc: 'Comptes, rôles/passation, configuration, audit.', Icone: ShieldCheck },
]

/** Icône d'un module par path (fallback Target). */
export function iconeModule(path) {
  return modulesBackoffice.find((m) => m.path === path)?.Icone ?? Target
}

/** Les codes de rôle autorisés pour un module donné. */
export function modulesPour(user) {
  if (!user?.roles) return []
  const codes = user.roles.map((r) => r.code)
  if (codes.includes('ADMIN')) return modulesBackoffice
  return modulesBackoffice.filter((m) => m.roles.some((r) => codes.includes(r)))
}
