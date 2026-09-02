/**
 * Modules du back-office — traduction directe du tableau doc 05 §4.
 * `roles` = codes qui voient le module dans leur menu (matrice doc 01).
 */
export const modulesBackoffice = [
  { path: 'annonces', label: 'Annonces', roles: ['P1', 'P5', 'CHEF_CELLULE'], desc: 'Composer et publier les annonces officielles ou ciblées.' },
  { path: 'dashboard', label: 'Dashboard global', roles: ['P1', 'P2'], desc: 'Objectifs par poste, activité, effectifs.' },
  { path: 'projets-suivi', label: 'Suivi projets', roles: ['P2', 'P7'], desc: 'Tableau des projets techniques du club.' },
  { path: 'taches-notion', label: 'Tâches Notion', roles: ['P1', 'P2', 'P3', 'ADMIN'], desc: 'Suivi et mise à jour des tâches du club (base Notion, temps réel).' },
  { path: 'comptes-rendus', label: 'Comptes rendus', roles: ['P3', 'P1'], desc: 'Rédiger, valider, publier ; convocations H-48h.' },
  { path: 'registre-membres', label: 'Registre membres', roles: ['P3', 'P4'], desc: 'Registre complet, validation des candidatures.' },
  { path: 'cellules', label: 'Cellules', roles: ['P4'], desc: 'Créer les cellules, nommer les chefs.' },
  { path: 'communication', label: 'Communication', roles: ['P5'], desc: 'Affiches, galerie, calendrier éditorial, réseaux sociaux.' },
  { path: 'evenements', label: 'Événements', roles: ['P6'], desc: 'Fiches, checklists, places, retours, bilans.' },
  { path: 'adhesion', label: 'Adhésion & QR code', roles: ['P7'], desc: 'Formulaire, QR code téléchargeable, statistiques.' },
  { path: 'contenu', label: 'Actualités & contenu', roles: ['P1', 'P3', 'P5', 'ADMIN'], desc: 'Publier des actualités (avec image + tag cellule), gérer les documents et la galerie.' },
  { path: 'formulaire', label: 'Éditer le formulaire', roles: ['P1', 'P7', 'P3', 'ADMIN'], desc: 'Ajouter, supprimer, modifier les champs du formulaire d’adhésion et les rendre obligatoires ou non.' },
  { path: 'opportunites', label: 'Opportunités', roles: ['P8'], desc: 'Kanban hackathons/conférences, carnet de contacts.' },
  { path: 'calendrier', label: 'Calendrier', roles: ['P9'], desc: 'Sources externes, conflits, récap hebdomadaire.' },
  { path: 'ateliers', label: 'Ateliers', roles: ['P10'], desc: 'Planning hebdo, fiches types, feuilles de présence.' },
  { path: 'admin', label: 'Administration', roles: ['ADMIN'], desc: 'Comptes, rôles/passation, configuration, audit.' },
]

/** Les codes de rôle autorisés pour un module donné. */
export function modulesPour(user) {
  if (!user?.roles) return []
  const codes = user.roles.map((r) => r.code)
  if (codes.includes('ADMIN')) return modulesBackoffice
  return modulesBackoffice.filter((m) => m.roles.some((r) => codes.includes(r)))
}
