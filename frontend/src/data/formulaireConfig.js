/**
 * data/formulaireConfig.js — Configuration du formulaire d'adhésion.
 * Les champs sont EDITABLES depuis le back-office (module « Formulaire d'adhésion »).
 * Stockage dev : localStorage. En prod : GET/PUT /api/v1/adhesion/form-config (Django).
 *
 * Format d'un champ :
 *   id       — clé technique (payload envoyé au back)
 *   label    — libellé affiché
 *   type     — 'text' | 'email' | 'tel' | 'textarea' | 'select'
 *   groupe   — 'identite' (étape 1) | 'complement' (étape 3)
 *   requis   — champ obligatoire ?
 *   options  — pour type 'select' : liste de choix
 *   aide     — placeholder / texte d'aide
 */

const CLE = 'adhesion_form_config'

export const FILIERES_DEFAUT = [
  'Informatique — 1re année',
  'Informatique — 2e année',
  'Télécommunications — 1re année',
  'Télécommunications — 2e année',
  'Digitalisation des services — 1re année',
  'Digitalisation des services — 2e année',
  'Autre filière',
]

export const configParDefaut = [
  { id: 'prenom', label: 'Prénom', type: 'text', groupe: 'identite', requis: true },
  { id: 'nom', label: 'Nom', type: 'text', groupe: 'identite', requis: true },
  { id: 'email', label: 'E-mail', type: 'email', groupe: 'identite', requis: true },
  { id: 'whatsapp', label: 'WhatsApp', type: 'tel', groupe: 'identite', requis: false },
  { id: 'filiere', label: 'Filière / niveau', type: 'select', groupe: 'identite', requis: true, options: [...FILIERES_DEFAUT], aide: 'Choisis ta filière (liste gérée par le Bureau)' },
  { id: 'motivation', label: 'Motivation', type: 'textarea', groupe: 'complement', requis: false, aide: 'Raconte-nous ce qui te donne envie de rejoindre le club…' },
]

export function chargerConfig() {
  try {
    const brut = localStorage.getItem(CLE)
    if (!brut) return structuredClone(configParDefaut)
    const champs = JSON.parse(brut)
    if (!Array.isArray(champs) || !champs.length) return structuredClone(configParDefaut)
    // Migration : l'ancienne filière texte devient la liste gérée par l'admin
    return champs.map((c) => (
      c.id === 'filiere' && c.type !== 'select'
        ? { ...c, type: 'select', options: [...FILIERES_DEFAUT], aide: 'Choisis ta filière (liste gérée par le Bureau)' }
        : c
    ))
  } catch {
    return structuredClone(configParDefaut)
  }
}

export function sauverConfig(champs) {
  localStorage.setItem(CLE, JSON.stringify(champs))
}

export function reinitialiserConfig() {
  localStorage.removeItem(CLE)
}

/** Validation d'une valeur selon le champ. Renvoie un message d'erreur ou null. */
export function validerChamp(champ, valeur) {
  const v = (valeur ?? '').toString().trim()
  if (champ.requis && !v) return `${champ.label} est requis`
  if (!v) return null
  if (champ.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'E-mail invalide'
  return null
}
