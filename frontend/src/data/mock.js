/**
 * Données factices (mock) — seront remplacées par l'API Django (doc 04)
 * quand le back-end sera branché : GET /api/v1/roles, /cellules, /evenements…
 */

export const bureau = [
  { poste: 'Président', nom: 'Titulaire à définir', mission: 'Anime le Bureau, publie les annonces officielles.' },
  { poste: 'Vice-Présidente', nom: 'Nassirou Saley Hamida', mission: "Coordination inter-postes, suivi des projets techniques." },
  { poste: 'Secrétaire Générale', nom: 'Titulaire à définir', mission: 'Comptes rendus, registre des membres, convocations.' },
  { poste: 'Responsable des Cellules', nom: 'Titulaire à définir', mission: 'Crée et anime les cellules thématiques.' },
  { poste: 'Responsable Communication', nom: 'Titulaire à définir', mission: 'Charte graphique, réseaux sociaux, galerie.' },
  { poste: 'Responsable des Activités', nom: 'Titulaire à définir', mission: 'Événements, inscriptions, bilans.' },
  { poste: 'Responsable Innovation & Solutions', nom: 'Titulaire à définir', mission: 'Adhésion en ligne, QR code, veille.' },
  { poste: 'Coordinateur des Opportunités', nom: 'Titulaire à définir', mission: 'Hackathons, conférences, partenariats.' },
  { poste: 'Responsable Programmation', nom: 'Titulaire à définir', mission: 'Calendrier officiel, récap hebdomadaire.' },
  { poste: 'Responsable des Ateliers', nom: 'Titulaire à définir', mission: 'Ateliers hebdomadaires, feuilles de présence.' },
]

export const cellules = [
  {
    nom: 'Cellule Web',
    description: 'Développement web front et back : React, Django, déploiement. Le club construit ses propres outils ici.',
    couleur: '#F5A623',
  },
  {
    nom: 'Cellule IA',
    description: "Intelligence artificielle et données : découverte des modèles, ateliers Python, projets d'agents.",
    couleur: '#4A90D9',
  },
  {
    nom: 'Cellule Cybersécurité',
    description: "Sécurité offensive et défensive : CTF, bonnes pratiques, sensibilisation de l'école.",
    couleur: '#D9534F',
  },
  {
    nom: 'Cellule Design',
    description: 'UI/UX, identité visuelle, montage vidéo — tout ce qui rend le club visible et beau.',
    couleur: '#7B61FF',
  },
]

export const activites = [
  { titre: 'Atelier découverte Git & GitHub', date: 'À planifier', lieu: 'EMSP', type: 'Atelier', places: 30 },
  { titre: 'Hackathon interne IT-CLUB', date: 'À planifier', lieu: 'EMSP', type: 'Compétition', places: 60 },
  { titre: 'Veille IA : les modèles open-source', date: 'À planifier', lieu: 'En ligne', type: 'Conférence', places: null },
  { titre: 'Initiation Cybersécurité (CTF)', date: 'À planifier', lieu: 'EMSP', type: 'Atelier', places: 25 },
]

export const actualites = [
  {
    titre: "Lancement officiel de la plateforme du club !",
    extrait:
      "Fini les annonces noyées dans WhatsApp : retrouvez ici toutes les activités, inscriptions et ressources du IT-CLUB EMSP.",
    date: 'Août 2026',
    auteur: 'Le Bureau',
  },
  {
    titre: "Campagne d'adhésion ouverte",
    extrait:
      "Scannez le QR code affiché sur le campus ou remplissez le formulaire en ligne pour rejoindre une cellule (Web, IA, Cybersécurité, Design).",
    date: 'Septembre 2026',
    auteur: 'Resp. Innovation & Solutions',
  },
]
