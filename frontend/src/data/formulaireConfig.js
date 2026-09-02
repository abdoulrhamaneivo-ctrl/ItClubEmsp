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

export const configParDefaut = [
  { id: 'prenom', label: 'Prénom', type: 'text', groupe: 'identite', requis: true },
  { id: 'nom', label: 'Nom', type: 'text', groupe: 'identite', requis: true },
  { id: 'email', label: 'E-mail', type: 'email', groupe: 'identite', requis: true },
  { id: 'whatsapp', label: 'WhatsApp', type: 'tel', groupe: 'identite', requis: false },
  { id: 'filiere', label: 'Filière / niveau', type: 'text', groupe: 'identite', requis: true, aide: 'Ex. Digitalisation des services, 2e année' },
  { id: 'motivation', label: 'Motivation', type: 'textarea', groupe: 'complement', requis: false, aide: 'Raconte-nous ce qui te donne envie de rejoindre le club…' },
]

export function chargerConfig() {
  try {
    const brut = localStorage.getItem(CLE)
    if (!brut) return [...configParDefaut]
    const champs = JSON.parse(brut)
    return Array.isArray(champs) && champs.length ? champs : [...configParDefaut]
  } catch {
    return [...configParDefaut]
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
