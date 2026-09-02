/**
 * Documents du club — service pour accéder aux PDF/DOCX du club.
 * Les fichiers sont dans /public/documents/
 */

export const documentsClub = {
  charte: '/documents/Charte_IT_CLUB_EMSP.pdf',
  statuts: '/documents/Statuts_IT_CLUB_EMSP.pdf',
  statutsCI: '/documents/Statuts_CI_EMSP_corrige.docx',
  missionsBureau: '/documents/Missions_Bureau_IT_CLUB_EMSP.docx',
  rolesMissions: '/documents/Doc1_Roles_Missions_Nominations.docx',
  acteConstitution: '/documents/Doc2_Acte_Constitution_Bureau.docx',
  procesVerbal1: '/documents/Compte_Rendu_Reunion_1_IT_Club_EMSP.docx.pdf',
  procesVerbal7Mai: '/documents/Compte_rendu_Reunion_7_Mai_2026.pdf',
  listeMembres: '/documents/Liste_Membres_IT_CLUB_EMSP.docx.pdf',
  nominationBureau: '/documents/Acte_Nomination_Bureau_IT_CLUB (Récupération automatique).docx',
}

export async function getDocumentUrl(key) {
  return documentsClub[key] ?? null
}

export function getAllDocuments() {
  return Object.entries(documentsClub).map(([key, url]) => ({
    key,
    nom: key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase()),
    url,
    extension: url.split('.').pop().toLowerCase(),
  }))
}

// Pour les missions/objectifs du Bureau — extraits des documents
export const bureauReferences = {
  // Ces données viennent des documents officiels (Missions_Bureau_IT_CLUB_EMSP.docx, Doc1_Roles_Missions_Nominations.docx)
  // Elles servent de fallback si l'API ne renvoie pas encore les données enrichies
  references: {
    P1: { document: 'missionsBureau', section: 'Présidence', description: 'Définit la vision stratégique, représente le club, anime les réunions du Bureau.' },
    P2: { document: 'missionsBureau', section: 'Vice-Présidence', description: 'Supplée le Président, coordonne les cellules, assure le suivi des projets transverses.' },
    P3: { document: 'missionsBureau', section: 'Secrétariat Général', description: 'Gère les archives, procès-verbaux, correspondances officielles, convocations.' },
    P4: { document: 'missionsBureau', section: 'Trésorerie', description: 'Gère le budget, les cotisations, le sponsoring, la transparence financière.' },
    P5: { document: 'missionsBureau', section: 'Communication', description: 'Anime réseaux sociaux, site web, newsletter, relations presse, identité visuelle.' },
    P6: { document: 'missionsBureau', section: 'Événementiel', description: 'Organise ateliers, hackathons, conférences, sorties, logistique complète.' },
    P7: { document: 'missionsBureau', section: 'Partenariats', description: 'Démarche entreprises, écoles, ONG, conventions, recherche de financements.' },
    P8: { document: 'missionsBureau', section: 'Formation', description: 'Planifie ateliers, mentorat, veille technologique, programme de formation continue.' },
    P9: { document: 'missionsBureau', section: 'Innovation & Solutions', description: 'Projets internes R&D, prototypes, veille technologique, hackathons internes.' },
    P10: { document: 'missionsBureau', section: 'Relations Extérieures', description: 'Liaison administration EMSP, autres clubs, institutions, représentation externe.' },
  },
}