/**
 * ui-components/IconesClub.jsx — Facade d'icônes du club.
 * Source : lucide-react (bibliothèque professionnelle line art, MIT).
 * Normalisation : props `taille` (px) + `couleur` — stroke cohérent 1.7.
 * Aucun emoji générique.
 *
 * Utilisation : <IcWeb taille={40} couleur="#1FAF72" />
 */
import {
  Code2, BrainCircuit, ShieldCheck, PenTool, Users, CalendarDays, Rocket,
  FileText, Camera, Video, Lightbulb, Box as BoxIcon, Trophy, MapPin,
  HandHeart, Layers, Megaphone, ClipboardList, Handshake, Crown, Sparkles,
  ArrowRight as Fleche, Heart,
} from 'lucide-react'

const norm = ({ taille = 24, couleur = 'currentColor', strokeWidth = 1.7, ...rest }) => ({
  size: taille, color: couleur, strokeWidth, ...rest,
})

export const IcWeb = (p) => <Code2 {...norm(p)} />
export const IcIA = (p) => <BrainCircuit {...norm(p)} />
export const IcCyber = (p) => <ShieldCheck {...norm(p)} />
export const IcDesign = (p) => <PenTool {...norm(p)} />
export const IcMembres = (p) => <Users {...norm(p)} />
export const IcCalendrier = (p) => <CalendarDays {...norm(p)} />
export const IcRocket = (p) => <Rocket {...norm(p)} />
export const IcDocument = (p) => <FileText {...norm(p)} />
export const IcPhoto = (p) => <Camera {...norm(p)} />
export const IcVideo = (p) => <Video {...norm(p)} />
export const IcFormation = (p) => <Lightbulb {...norm(p)} />
export const IcCube = (p) => <BoxIcon {...norm(p)} />
export const IcTrophee = (p) => <Trophy {...norm(p)} />
export const IcLieu = (p) => <MapPin {...norm(p)} />
export const IcEquipe = (p) => <HandHeart {...norm(p)} />
export const IcCellules = (p) => <Layers {...norm(p)} />
export const IcCommunication = (p) => <Megaphone {...norm(p)} />
export const IcPV = (p) => <ClipboardList {...norm(p)} />
export const IcPartenariats = (p) => <Handshake {...norm(p)} />
export const IcPresident = (p) => <Crown {...norm(p)} />
export const IcVicePresident = (p) => <Sparkles {...norm(p)} />
export const IcSecretaire = (p) => <ClipboardList {...norm(p)} />
export const IcProgrammation = (p) => <CalendarDays {...norm(p)} />
export const IcInnovation = (p) => <Lightbulb {...norm(p)} />
export const IcRelations = (p) => <Handshake {...norm(p)} />
export const IcActivites = (p) => <Rocket {...norm(p)} />
export const IcOpportunites = (p) => <Fleche {...norm(p)} />
export const IcAmour = (p) => <Heart {...norm(p)} />

/** Flèche droite (exports directs pour liens / CTA). */
export const ArrowRight = (p) => <Fleche {...norm(p)} />

/** Icônes par cellule. */
export const iconesCellules = { web: IcWeb, ia: IcIA, cyber: IcCyber, design: IcDesign }

/** Icône par poste du Bureau (matching sur le libellé du poste). */
export function iconePoste(poste = '') {
  const p = poste.toLowerCase()
  if (p.includes('président') && !p.includes('vice')) return IcPresident
  if (p.includes('vice')) return IcVicePresident
  if (p.includes('secrétaire') || p.includes('secretaire')) return IcSecretaire
  if (p.includes('programmation') || p.includes('planification')) return IcProgrammation
  if (p.includes('communication')) return IcCommunication
  if (p.includes('cellules')) return IcCellules
  if (p.includes('activités') || p.includes('activites')) return IcActivites
  if (p.includes('opportunités') || p.includes('opportunites')) return IcOpportunites
  if (p.includes('innovation')) return IcInnovation
  if (p.includes('relations')) return IcRelations
  return IcMembres
}
