const webImg = '/photos/web.jpg'
const iaImg = '/photos/ia.jpg'
const cyberImg = '/photos/cyber.jpg'
const designImg = '/photos/design.jpg'

/** Les 4 cellules du club — avec leurs vraies photos (hackathon Vibeathon CI, etc.). */
export const cellules = [
  {
    id: 'web',
    nom: 'Cellule Web',
    icone: '💻',
    couleur: '#1FAF72',
    membres: 14,
    image: webImg,
    description: 'Développement front & back : React, Django, déploiement. Le club construit ses propres outils ici.',
    programme: "Ce que tu y apprendras :\n• React + Vite, Material UI\n• Python / Django / API REST\n• Git, déploiement cloud\n\nProjet phare : cette plateforme !",
  },
  {
    id: 'ia',
    nom: 'Cellule IA',
    icone: '🤖',
    couleur: '#2563EB',
    membres: 9,
    image: iaImg,
    description: "Intelligence artificielle et données : modèles, ateliers Python, projets d'agents.",
    programme: "Ce que tu y apprendras :\n• Bases de Python data\n• LLMs, prompts, agents IA\n• Mini-projets encadrés\n\nProjet phare : assistant IA du club.",
  },
  {
    id: 'cyber',
    nom: 'Cellule Cybersécurité',
    icone: '🛡️',
    couleur: '#0F5B3A',
    membres: 11,
    image: cyberImg,
    description: "Sécurité offensive & défensive : CTF, bonnes pratiques, sensibilisation de l'école.",
    programme: "Ce que tu y apprendras :\n• Bases Linux & réseaux\n• Challenges CTF débutants\n• Sécurité au quotidien\n\nÉvénement : 1er CTF interne EMSP.",
  },
  {
    id: 'design',
    nom: 'Cellule Design',
    icone: '🎨',
    couleur: '#7B61FF',
    membres: 7,
    image: designImg,
    description: 'UI/UX, identité visuelle, montage vidéo — tout ce qui rend le club visible.',
    programme: "Ce que tu y apprendras :\n• Figma & design system\n• Montage vidéo (bannières du club)\n• Charte graphique\n\nProjet : habillage vidéo des événements.",
  },
]
