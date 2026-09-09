import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { useTheme } from '@mui/material/styles'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import InputBase from '@mui/material/InputBase'
import HomeIcon from '@mui/icons-material/Home'
import SearchIcon from '@mui/icons-material/Search'
import DashboardIcon from '@mui/icons-material/Dashboard'
import LogoutIcon from '@mui/icons-material/Logout'
import NotificationsIcon from '@mui/icons-material/Notifications'
import { useAuth, hasRole } from '../stores/auth'
import { useNavigate } from 'react-router-dom'
import { api, urlMedia } from '../lib/api'
import CelluleVivante from '../components/espace/CelluleVivante'
import scrollDoux from '../lib/scrollDoux'
import ChampMotDePasse from '../components/ui-components/ChampMotDePasse'
import FondGlobalDonnees from '../components/ui-components/FondGlobalDonnees'
import { IcMembres, IcCube, IcCalendrier, IcDocument, IcPhoto, IcTrophee, IcCommunication, iconePoste } from '../components/ui-components/IconesClub'

/**
 * Espace membre — même expérience que le back-office :
 * dock flottant + fond marine + topbar EMSP:// + barre de statut IDE.
 * TROUVER FACILEMENT : palette de commandes Ctrl+K (recherche instantanée
 * dans tout l'espace) + scroll-spy (le dock suit la section visible).
 */

const CODES_BUREAU = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10', 'CHEF_CELLULE', 'ADMIN']

const libellesRoles = {
  P1: 'Président', P2: 'Vice-Présidente', P3: 'Secrétaire Générale',
  P4: 'Responsable des Cellules', P5: 'Responsable Communication',
  P6: 'Responsable des Activités', P7: 'Resp. Innovation & Solutions',
  P8: 'Coordinateur des Opportunités', P9: 'Resp. Programmation',
  P10: 'Responsable des Ateliers', CHEF_CELLULE: 'Chef de cellule', ADMIN: 'Administrateur',
}

// Normalise une réponse API en tableau : l'API peut renvoyer un objet
// ({detail}, {results}) en cas d'erreur/session expirée — sans ça, un .map
// sur un objet fait planter toute la page (FrontiereErreur).
const versTableau = (d) => {
  if (d == null) return d
  if (Array.isArray(d)) return d
  if (Array.isArray(d?.results)) return d.results
  return []
}

/* ── Horloge live ───────────────────────────────────────────── */
function Horloge() {
  const [heure, setHeure] = useState('')
  useEffect(() => {
    const maj = () => setHeure(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }))
    maj()
    const t = setInterval(maj, 30000)
    return () => clearInterval(t)
  }, [])
  return <span>{heure}</span>
}

/* ── Palette de commandes (Ctrl+K) — le « trouver facilement » ── */
function Palette({ ouvert, fermer, user, estBureau, scrollTo, logout }) {
  const navigate = useNavigate()
  const reduit = useReducedMotion()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const inputRef = useRef(null)
  const focusPrecedent = useRef(null)

  const items = useMemo(() => {
    const base = [
      { label: 'Notifications', section: 'notifications', icone: <NotificationsIcon sx={{ fontSize: 18 }} />, mots: 'notif alertes messages nouvelles' },
      { label: 'Mes inscriptions', section: 'inscriptions', icone: <IcCalendrier taille={17} couleur="#9AFBD7" />, mots: 'inscriptions activités événements places ateliers hackathon' },
      { label: 'Ma cellule', section: 'cellule', icone: <IcCube taille={17} couleur="#9AFBD7" />, mots: 'cellule web ia cyber design sessions équipe' },
      { label: 'Mon profil', section: 'profil', icone: <IcMembres taille={17} couleur="#9AFBD7" />, mots: 'profil informations rôles permissions email' },
      { label: 'Les activités à venir', href: '/#activites', icone: <IcCalendrier taille={17} couleur="#9AFBD7" />, mots: 'activités club timeline calendrier site' },
      { label: 'Les actualités', href: '/#actualites', icone: <IcCommunication taille={17} couleur="#9AFBD7" />, mots: 'actualités annonces news communication' },
      { label: 'La galerie', href: '/galerie', icone: <IcPhoto taille={17} couleur="#9AFBD7" />, mots: 'galerie photos vidéos médias images' },
      { label: 'La documentation', href: '/#documentation', icone: <IcDocument taille={17} couleur="#9AFBD7" />, mots: 'documents charte règlement statuts PV pdf' },
      ...(estBureau ? [{ label: 'Mon back-office', href: '/backoffice', icone: <DashboardIcon sx={{ fontSize: 18 }} />, mots: 'back-office admin gestion modules bureau' }] : []),
      { label: 'Retour au site', href: '/', icone: <HomeIcon sx={{ fontSize: 18 }} />, mots: 'site accueil vitrine retour home' },
      { label: 'Se déconnecter', action: 'logout', icone: <LogoutIcon sx={{ fontSize: 18 }} />, mots: 'déconnexion logout quitter sortir' },
    ]
    const norm = q.trim().toLowerCase()
    if (!norm) return base
    return base.filter((it) => (it.label + ' ' + (it.mots ?? '')).toLowerCase().includes(norm))
  }, [q, estBureau])

  // Règle modale : mémoriser le focus, le donner à l'input, le RESTAURER à la fermeture
  useEffect(() => {
    if (ouvert) {
      focusPrecedent.current = document.activeElement
      setQ(''); setSel(0)
      setTimeout(() => inputRef.current?.focus(), 60)
    } else if (focusPrecedent.current) {
      focusPrecedent.current?.focus?.()
      focusPrecedent.current = null
    }
  }, [ouvert])
  useEffect(() => { setSel(0) }, [q])

  const executer = useCallback((it) => {
    fermer()
    if (!it) return
    if (it.section) setTimeout(() => scrollTo(it.section), 80)
    else if (it.href) {
      // lien d'ancre de la vitrine : naviguer puis scroller
      if (it.href.startsWith('/#')) {
        const cible = it.href.slice(2)
        navigate('/')
        setTimeout(() => document.getElementById(cible)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 350)
      } else {
        navigate(it.href)
      }
    }
    else if (it.action === 'logout') logout()
  }, [fermer, scrollTo, logout, navigate])

  // L'item sélectionné reste visible quand on navigue au clavier
  useEffect(() => {
    document.getElementById('palette-item-' + sel)?.scrollIntoView({ block: 'nearest' })
  }, [sel])

  const surTouche = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => (s + 1) % items.length) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => (s - 1 + items.length) % items.length) }
    else if (e.key === 'Enter') { e.preventDefault(); executer(items[sel]) }
    else if (e.key === 'Escape') fermer()
  }

  return (
    <AnimatePresence>
      {ouvert && (
        <motion.div
          initial={reduit ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: reduit ? 0 : 0.16 }}
          onClick={fermer}
          style={{ position: 'fixed', inset: 0, zIndex: 1500, background: 'rgba(5,12,22,.96)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: 'min(14vh, 110px)' }}
        >
          <motion.div
            initial={reduit ? false : { scale: 0.96, y: -12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.97, y: -8 }}
            transition={{ duration: reduit ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={surTouche}
            style={{ width: 'min(580px, 94vw)' }}
          >
            <Box sx={{
              bgcolor: 'rgba(13,27,42,.97)', borderRadius: '18px',
              border: '1px solid rgba(154,251,215,.16)', overflow: 'hidden',
              boxShadow: '0 30px 80px rgba(0,0,0,.6)',
            }}>
              {/* Input */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.4, px: 2.4, py: 1.8, borderBottom: '1px solid rgba(154,251,215,.15)' }}>
                <SearchIcon sx={{ color: '#1FAF72', fontSize: 20 }} />
                <InputBase
                  inputRef={inputRef}
                  value={q} onChange={(e) => setQ(e.target.value)}
                  placeholder="Chercher dans ton espace…"
                  sx={{ flex: 1, color: '#fff', fontFamily: "'JetBrains Mono',monospace", fontSize: '0.95rem' }}
                />
                <Chip label="ESC" size="small" sx={{ bgcolor: 'rgba(154,251,215,.1)', color: 'rgba(154,251,215,.6)', fontFamily: "'JetBrains Mono',monospace", fontSize: '0.875rem', height: 28 }} />
              </Box>
              {/* Résultats */}
              <Box sx={{ maxHeight: 'min(46vh, 380px)', overflowY: 'auto', p: 1 }}>
                {items.length === 0 && (
                  <Typography sx={{ color: 'rgba(255,255,255,.62)', textAlign: 'center', py: 3, fontFamily: "'JetBrains Mono',monospace", fontSize: '0.875rem' }}>
                    Aucun résultat pour « {q} »
                  </Typography>
                )}
                {items.map((it, i) => (
                  <Box
                    component="button"
                    type="button"
                    key={it.label}
                    id={'palette-item-' + i}
                    onClick={() => executer(it)}
                    onMouseEnter={() => setSel(i)}
                    onFocus={() => setSel(i)}
                    aria-selected={i === sel}
                    sx={{
                      display: 'flex', width: '100%', border: 'none', textAlign: 'left', font: 'inherit',
                      alignItems: 'center', gap: 1.8, px: 1.8, py: 1.3,
                      borderRadius: '12px', cursor: 'pointer',
                      bgcolor: i === sel ? '#1FAF72' : 'transparent',
                      color: i === sel ? '#fff' : 'rgba(255,255,255,.85)',
                      transition: 'background 120ms ease',
                      '&:focus-visible': { outline: '2px solid #fff', outlineOffset: '2px' },
                    }}
                  >
                    <Box sx={{ display: 'grid', placeItems: 'center', color: i === sel ? '#fff' : '#9AFBD7' }}>{it.icone}</Box>
                    <Typography sx={{ flex: 1, fontWeight: 700, fontSize: '0.88rem' }}>{it.label}</Typography>
                    {it.section && (
                      <Typography sx={{ color: i === sel ? 'rgba(255,255,255,.7)' : 'rgba(154,251,215,.5)', fontSize: '0.875rem', fontFamily: "'JetBrains Mono',monospace" }}>
                        #{it.section}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
              {/* Aide touches + compteur résultats */}
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', px: 2.4, py: 1.4, borderTop: '1px solid rgba(154,251,215,.12)' }}>
                <Typography sx={{ color: 'rgba(154,251,215,.55)', fontSize: '0.875rem', fontFamily: "'JetBrains Mono',monospace" }}>
                  {items.length} resultat{items.length > 1 ? 's' : ''}
                </Typography>
                {[['↑↓', 'naviguer'], ['↵', 'ouvrir'], ['esc', 'fermer']].map(([touche, sens]) => (
                  <Box key={touche} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <Typography sx={{ color: 'rgba(154,251,215,.7)', fontSize: '0.875rem', fontFamily: "'JetBrains Mono',monospace", border: '1px solid rgba(154,251,215,.16)', borderRadius: '5px', px: 0.7 }}>
                      {touche}
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,.6)', fontSize: '0.875rem' }}>{sens}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ═══ Page principale ═════════════════════════════════════════ */
export default function Espace() {
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)
  const navigate = useNavigate()
  const reduit = useReducedMotion()
  const sombre = useTheme().palette.mode === 'dark'
  // Déconnexion unique avec confirmation — utilisée par la topbar et la palette
  const demanderDeconnexion = useCallback(() => {
    if (window.confirm('Se déconnecter de ton espace ?')) logout()
  }, [logout])
  // Ancres : naviguer vers l'accueil puis scroller jusqu'à la section
  const allerVers = (cible) => {
    navigate('/')
    setTimeout(() => {
      document.getElementById(cible)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 350)
  }
  const [palette, setPalette] = useState(false)
  const [sectionActive, setSectionActive] = useState('accueil')
  // Données réelles (API) — null = en chargement/mock, [] = vide réel
  const [notifsApi, setNotifsApi] = useState(null)
  const [inscApi, setInscApi] = useState(null)
  const [cellulesApi, setCellulesApi] = useState(null)
  const [points, setPoints] = useState(null)
  const [niveau, setNiveau] = useState(null)
  const [classement, setClassement] = useState([])

  useEffect(() => {
    let stop = false
    api.getNotifications().then((d) => { if (!stop) setNotifsApi(versTableau(d)) }).catch(() => {})
    api.getMesInscriptions().then((d) => { if (!stop) setInscApi(versTableau(d)) }).catch(() => {})
    api.getMesCellules().then((d) => { if (!stop) setCellulesApi(versTableau(d)) }).catch(() => {})
    api.getMe().then((me) => { if (!stop && me && !me.detail) { setPoints(me.points ?? 0); setNiveau(me.niveau ?? null) } }).catch(() => {})
    api.getClassement().then((d) => { if (!stop) setClassement(versTableau(d ?? []).slice(0, 5)) }).catch(() => {})
    return () => { stop = true }
  }, [])

  const marquerLue = (id) => {
    setNotifsApi((ns) => versTableau(ns ?? []).map((n) => (n.id === id ? { ...n, lu: true } : n)))
    api.marquerNotificationsLues([id]).catch(() => {})
  }

  const COULEURS_NOTIF = { annonce: '#1FAF72', inscription: '#2563EB', rappel: '#F5A623', convocation: '#7B61FF', satisfaction: '#0EA5E9', recap: '#64748B', promotion: '#F97316', candidature: '#0E7A50' }
  const notifs = notifsApi === null ? null : versTableau(notifsApi).map((n) => ({
    id: n.id,
    titre: n.titre,
    date: n.cree_le ? new Date(n.cree_le).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '',
    couleur: COULEURS_NOTIF[n.type] ?? '#6B7280',
    lu: !!n.lu,
  }))

  const inscriptions = inscApi === null ? null : versTableau(inscApi).map((i) => ({
    id: i.id,
    evenementId: i.evenement?.id ?? null,
    titre: i.evenement?.titre ?? 'Événement',
    date: i.evenement?.date ?? '',
    lieu: i.evenement?.lieu ?? '',
    couleur: i.evenement?.couleur ?? '#2563EB',
    statut: i.liste_attente ? 'En liste d’attente' : 'Confirmé',
  }))

  // Présence : code saisi par inscription { [inscriptionId]: '...' }, états { [id]: 'present' | 'erreur' | 'envoi' }
  const [codesPresence, setCodesPresence] = useState({})
  const [etatsPresence, setEtatsPresence] = useState({})

  const marquerPresent = async (insc) => {
    const code = (codesPresence[insc.id] ?? '').trim()
    if (code.length !== 6 || !insc.evenementId) return
    setEtatsPresence((e) => ({ ...e, [insc.id]: 'envoi' }))
    try {
      const res = await api.marquerPresence(insc.evenementId, code)
      if (res.statut === 'present' || res.statut === 'deja-present') {
        setEtatsPresence((e) => ({ ...e, [insc.id]: `present:${res.points ?? ''}` }))
      } else {
        setEtatsPresence((e) => ({ ...e, [insc.id]: 'erreur' }))
      }
    } catch {
      setEtatsPresence((e) => ({ ...e, [insc.id]: 'erreur' }))
      setTimeout(() => setEtatsPresence((e) => {
        const copie = { ...e }
        delete copie[insc.id]
        return copie
      }), 3000)
    }
  }

  const celluleApi = (cellulesApi && cellulesApi.length > 0) ? cellulesApi[0] : null
  const cellule = celluleApi ? {
    slug: celluleApi.slug,
    nom: celluleApi.nom,
    couleur: celluleApi.couleur ?? '#1FAF72',
    couleurFonce: celluleApi.couleurFonce ?? '#0E7A50',
    role: 'Membre actif',
    description: celluleApi.description ?? '',
    membres: celluleApi.membres ?? 0,
    programme: celluleApi.programme ?? [],
  } : null

  const refs = {
    accueil: useRef(null), notifications: useRef(null),
    inscriptions: useRef(null), cellule: useRef(null), profil: useRef(null),
  }

  const scrollTo = useCallback((nom) => {
    const el = refs[nom]?.current
    if (!el) return
    const y = el.getBoundingClientRect().top + window.scrollY - 96
    scrollDoux(y)
  }, [])

  // Ctrl+K / Cmd+K → palette
  useEffect(() => {
    const h = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPalette((p) => !p)
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  // Scroll-spy : le dock suit la section visible
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => { if (en.isIntersecting) setSectionActive(en.target.dataset.section) })
      },
      { rootMargin: '-35% 0px -55% 0px' },
    )
    Object.values(refs).forEach((r) => r.current && obs.observe(r.current))
    return () => obs.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!user) return null

  const estBureau = hasRole(user, CODES_BUREAU)
  const initiale = (user.nom || 'M')[0]

  /* Boutons du dock : [section, icone, label] */
  const dockSections = [
    ['accueil', <HomeIcon sx={{ fontSize: 20 }} />, 'Accueil'],
    ['notifications', <NotificationsIcon sx={{ fontSize: 20 }} />, 'Notifications'],
    ['inscriptions', <IcCalendrier taille={20} couleur="currentColor" />, 'Mes inscriptions'],
    ['cellule', <IcCube taille={20} couleur="currentColor" />, 'Ma cellule'],
    ['profil', <IcMembres taille={20} couleur="currentColor" />, 'Mon profil'],
  ]

  const BoutonDock = ({ actif, label, onClick, children }) => (
    <Tooltip title={label} placement="left" arrow enterDelay={400} enterNextDelay={200}>
      <motion.div whileHover={reduit ? {} : { scale: 1.14, y: -2 }} whileTap={reduit ? {} : { scale: 0.92 }}>
        <IconButton
          onClick={onClick} aria-label={label}
          sx={{
            width: 48, height: 48, borderRadius: '14px',
            color: actif ? '#fff' : '#9AFBD7',
            bgcolor: actif ? '#1FAF72' : 'rgba(154,251,215,.08)',
            border: actif ? '1px solid rgba(255,255,255,.35)' : '1px solid rgba(154,251,215,.18)',
            boxShadow: actif ? '0 4px 12px rgba(13,27,42,.22)' : 'none',
            transition: 'background 200ms ease, box-shadow 200ms ease',
            '&:hover': { bgcolor: actif ? '#25C482' : 'rgba(154,251,215,.18)' },
            '&:focus-visible': { outline: '2px solid #fff', outlineOffset: '2px' },
          }}
        >
          {children}
        </IconButton>
      </motion.div>
    </Tooltip>
  )

  return (
    <Box sx={{ minHeight: '100vh', position: 'relative', background: '#0B1622' }}>
      <FondGlobalDonnees intensite={0.5} />

      {/* Grille tech */}
      <Box sx={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(154,251,215,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(154,251,215,.045) 1px, transparent 1px)',
        backgroundSize: '44px 44px',
        maskImage: 'radial-gradient(ellipse at 50% 30%, black 20%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse at 50% 30%, black 20%, transparent 80%)',
      }} aria-hidden />

      {/* ── Topbar flottante ─────────────────────────────────── */}
      <Box
        component={motion.div}
        initial={reduit ? false : { y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ duration: reduit ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
        sx={{ position: 'fixed', top: 12, left: { xs: 10, md: 14 }, right: { xs: 10, md: 102 }, zIndex: 1200 }}
      >
        <Box sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1,
          bgcolor: 'rgba(13,27,42,.97)',
          border: '1px solid rgba(154,251,215,.18)', borderRadius: '16px',
          px: { xs: 1.2, md: 2.2 }, py: 1,
          boxShadow: '0 10px 30px rgba(0,0,0,.35)',
          maxWidth: '100%', overflow: 'hidden',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flexShrink: 1 }}>
            <Box component="img" src="/logo-itclub.webp" alt="" sx={{ width: 28, height: 28, borderRadius: 1, objectFit: 'cover', flexShrink: 0 }} />
            <Typography noWrap sx={{ color: '#fff', fontWeight: 800, fontSize: { xs: '0.875rem', md: '0.9rem' }, fontFamily: "'Orbitron',sans-serif" }}>
              EMSP<span style={{ color: '#1FAF72' }}>://</span>
              <span style={{ color: '#9AFBD7', fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, fontSize: '0.875rem' }}>espace</span>
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.8, md: 1.2 }, flexShrink: 0 }}>
            {/* Recherche unique dans les docks — pas de doublon topbar (audit mobile) */}
            <Avatar src={urlMedia(user?.photo) ?? undefined} sx={{ width: 32, height: 32, bgcolor: '#1FAF72', fontWeight: 800, fontSize: 14, border: '2px solid rgba(154,251,215,.16)' }}>
              {initiale}
            </Avatar>
            <Tooltip title="Déconnexion" arrow enterDelay={400}>
            <IconButton onClick={demanderDeconnexion} aria-label="Déconnexion"
              sx={{ color: '#fff', border: '1px solid rgba(255,255,255,.3)', borderRadius: '10px', minWidth: 44, width: 44, height: 44, '&:focus-visible': { outline: '2px solid #fff', outlineOffset: '2px' } }}>
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* ── DOCK vertical (desktop) ──────────────────────────── */}
      <motion.div
        initial={reduit ? false : { x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
        transition={{ delay: reduit ? 0 : 0.05, duration: reduit ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: 'fixed', right: 14, top: '50%', transform: 'translateY(-50%)', zIndex: 1200 }}
      >
        <Box sx={{
          display: { xs: 'none', md: 'flex' }, flexDirection: 'column', alignItems: 'center', gap: 1,
          bgcolor: 'rgba(13,27,42,.97)',
          border: '1px solid rgba(154,251,215,.16)', borderRadius: '20px',
          px: 1.2, py: 1.8,
          boxShadow: '0 14px 40px rgba(0,0,0,.4)',
        }}>
          <BoutonDock label="Rechercher (Ctrl+K)" onClick={() => setPalette(true)}>
            <SearchIcon sx={{ fontSize: 20 }} />
          </BoutonDock>
          <Box sx={{ width: 26, height: 1, bgcolor: 'rgba(154,251,215,.16)', my: 0.4 }} />
          {dockSections.map(([id, icone, label]) => (
            <BoutonDock key={id} label={label} actif={sectionActive === id} onClick={() => scrollTo(id)}>
              {icone}
            </BoutonDock>
          ))}
          <Box sx={{ width: 26, height: 1, bgcolor: 'rgba(154,251,215,.16)', my: 0.4 }} />
          {estBureau && <BoutonDock label="Back-office" onClick={() => navigate('/backoffice')}><DashboardIcon sx={{ fontSize: 20 }} /></BoutonDock>}
          <BoutonDock label="Retour au site" onClick={() => navigate('/')}><HomeIcon sx={{ fontSize: 20 }} /></BoutonDock>
        </Box>
      </motion.div>

      {/* ── DOCK horizontal (mobile) — 2 rangées, sans scroll ─── */}
      <motion.div
        initial={reduit ? false : { y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ delay: reduit ? 0 : 0.05, duration: reduit ? 0 : 0.25 }}
        style={{ position: 'fixed', bottom: 12, left: 12, right: 12, zIndex: 1200 }}
      >
        <Box sx={{
          display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 0.6,
          bgcolor: 'rgba(13,27,42,.97)',
          border: '1px solid rgba(154,251,215,.16)', borderRadius: '16px',
          px: 1.2, py: 0.9, boxShadow: '0 14px 40px rgba(0,0,0,.45)',
        }}>
          {dockSections.map(([id, icone, label]) => (
            <IconButton key={id} onClick={() => scrollTo(id)} aria-label={label} aria-current={sectionActive === id ? 'true' : undefined}
              sx={{
                minWidth: 44, height: 44, borderRadius: '12px', flex: 1,
                color: sectionActive === id ? '#fff' : '#9AFBD7',
                bgcolor: sectionActive === id ? '#1FAF72' : 'rgba(154,251,215,.08)',
                border: sectionActive === id ? '1px solid rgba(255,255,255,.35)' : '1px solid rgba(154,251,215,.15)',
                '&:focus-visible': { outline: '2px solid #fff', outlineOffset: '2px' },
              }}>
              {icone}
            </IconButton>
          ))}
          <Box sx={{ width: 1, height: 30, bgcolor: 'rgba(154,251,215,.18)', mx: 0.2 }} />
          <IconButton onClick={() => setPalette(true)} aria-label="Rechercher"
            sx={{ minWidth: 44, height: 44, borderRadius: '12px', color: '#1FAF72', bgcolor: 'rgba(31,175,114,.14)', border: '1px solid rgba(31,175,114,.4)', '&:focus-visible': { outline: '2px solid #fff', outlineOffset: '2px' } }}>
            <SearchIcon fontSize="small" />
          </IconButton>
          {estBureau && (
            <IconButton onClick={() => navigate('/backoffice')} aria-label="Back-office"
              sx={{ minWidth: 44, height: 44, borderRadius: '12px', color: '#0D1B2A', bgcolor: '#9AFBD7', border: '1px solid rgba(154,251,215,.5)', '&:focus-visible': { outline: '2px solid #fff', outlineOffset: '2px' } }}>
              <DashboardIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton onClick={() => navigate('/')} aria-label="Site"
            sx={{ minWidth: 44, height: 44, borderRadius: '12px', color: '#9AFBD7', bgcolor: 'rgba(154,251,215,.08)', border: '1px solid rgba(154,251,215,.15)', '&:focus-visible': { outline: '2px solid #fff', outlineOffset: '2px' } }}>
            <HomeIcon fontSize="small" />
          </IconButton>
        </Box>
      </motion.div>

      {/* ── Palette Ctrl+K ───────────────────────────────────── */}
      <Palette ouvert={palette} fermer={() => setPalette(false)} user={user} estBureau={estBureau} scrollTo={scrollTo} logout={demanderDeconnexion} />

      {/* ── CONTENU ──────────────────────────────────────────── */}
      <Container maxWidth={false} sx={{
        position: 'relative', maxWidth: '1200px !important', mx: 'auto',
        px: { xs: 2.5, md: 4 }, pt: { xs: 10, md: 12 }, pb: { xs: 14, lg: 10 },
        minHeight: '100vh',
        // Le dock vertical fixe (desktop) ne recouvre pas le contenu
        pr: { xs: 2.5, md: '120px' },
      }}>
        {/* ═══ ACCUEIL — carte membre ═══════════════════════════ */}
        <Box ref={refs.accueil} data-section="accueil" sx={{ scrollMarginTop: 90 }}>
          <motion.div initial={reduit ? false : { opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduit ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}>
            <Box sx={{
              borderRadius: '22px', overflow: 'hidden', position: 'relative',
              background: '#0D1B2A',
              border: '1px solid rgba(154,251,215,.16)',
              boxShadow: '0 18px 44px rgba(0,0,0,.4)',
              px: { xs: 3, md: 5 }, py: { xs: 3.5, md: 4.5 }, mb: { xs: 5, md: 6 },
            }}>
              <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', gap: { xs: 2.5, md: 4 }, flexWrap: 'wrap' }}>
                <Avatar src={urlMedia(user?.photo) ?? undefined} sx={{
                  width: { xs: 72, md: 96 }, height: { xs: 72, md: 96 },
                  bgcolor: '#1FAF72', border: '3px solid rgba(154,251,215,.16)',
                  fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: { xs: 30, md: 40 },
                  boxShadow: '0 10px 26px rgba(0,0,0,.35)',
                }}>
                  {initiale}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 200 }}>
                  <Typography sx={{ color: '#9AFBD7', fontWeight: 800, fontSize: '0.875rem', letterSpacing: '0.2em', textTransform: 'uppercase', mb: 0.6 }}>
                    Bienvenue dans ton espace
                  </Typography>
                  <Typography sx={{ color: '#fff', fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: { xs: '1.3rem', md: '1.8rem' }, lineHeight: 1.25 }}>
                    {user.nom || 'Membre'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1.4 }}>
                    {(user.roles ?? []).map((r) => (
                      <Chip key={r.code} label={libellesRoles[r.code] ?? r.code} size="small"
                        sx={{ bgcolor: 'rgba(154,251,215,.16)', color: '#9AFBD7', fontWeight: 800, fontSize: '0.875rem', border: '1px solid rgba(154,251,215,.16)', height: 28 }} />
                    ))}
                  </Box>
                </Box>
                {/* Badge MEMBRE-ID façon carte d'accès */}
                <Box sx={{
                  display: { xs: 'none', md: 'flex' }, flexDirection: 'column', gap: 0.6,
                  px: 2.4, py: 1.8, borderRadius: '12px',
                  bgcolor: 'rgba(0,0,0,.28)', border: '1px dashed rgba(154,251,215,.16)',
                  fontFamily: "'JetBrains Mono',monospace",
                }}>
                  <Typography sx={{ color: 'rgba(154,251,215,.6)', fontSize: '0.875rem', letterSpacing: '0.2em' }}>
                    MEMBRE-ID
                  </Typography>
                  <Typography sx={{ color: '#9AFBD7', fontWeight: 700, fontSize: '0.875rem', letterSpacing: '0.05em' }}>
                    IT-EMSP-{String(user.nom?.length || 5).padStart(3, '0')}-{(user.roles ?? [])[0]?.code ?? 'M'}
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,.62)', fontSize: '0.875rem', letterSpacing: '0.07em' }}>
                    VALIDE · 2026-2027
                  </Typography>
                </Box>
              </Box>
            </Box>
          </motion.div>
        </Box>

{/* ═══ NOTIFICATIONS ════════════════════════════════════ */}
        <Section refE={refs.notifications} id="notifications" titre="notifications" sousTitre="Ce que tu as manqué" icone={<NotificationsIcon sx={{ fontSize: 18 }} />}>
          {notifsApi === null ? (
            <Box sx={{ px: 2.6, py: 3 }}>
              {[1, 2, 3].map((i) => (
                <Box key={i} sx={{ display: 'flex', gap: 1.8, px: 2.6, py: 2.1, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', mt: 1, flexShrink: 0, bgcolor: 'action.hover' }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ height: 16, borderRadius: 8, bgcolor: 'action.hover', mb: 0.5, width: '70%' }} />
                    <Box sx={{ height: 12, borderRadius: 6, bgcolor: 'action.hover', width: '40%' }} />
                  </Box>
                </Box>
              ))}
            </Box>
          ) : notifs.length === 0 ? (
            <Typography sx={{ px: 2.6, py: 3, color: 'text.secondary', fontSize: '0.88rem' }}>
              Rien pour le moment — les annonces, rappels et promotions arrivent ici.
            </Typography>
          ) : (
            notifs.map((n, i, arr) => (
              <Box key={n.id} role={notifsApi !== null ? 'button' : undefined} tabIndex={notifsApi !== null ? 0 : undefined}
                aria-label={notifsApi !== null && !n.lu ? `Marquer comme lue : ${n.titre}` : n.titre}
                onClick={() => { if (notifsApi !== null && !n.lu) marquerLue(n.id) }}
                onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && notifsApi !== null && !n.lu) { e.preventDefault(); marquerLue(n.id) } }}
                sx={{
                display: 'flex', gap: 1.8, px: 2.6, py: 2.1,
                borderBottom: i < arr.length - 1 ? '1px solid' : 'none', borderColor: 'divider',
                transition: 'background 160ms ease',
                '&:hover': { bgcolor: (theme) => theme.palette.background.paper }, cursor: notifsApi !== null ? 'pointer' : 'default',
                '&:focus-visible': { outline: '2px solid #1FAF72', outlineOffset: '-2px', bgcolor: (theme) => theme.palette.background.paper },
                ...(n.lu && { opacity: 0.62 }),
              }}>
                <Box sx={{
                  width: 8, height: 8, borderRadius: '50%', bgcolor: n.couleur, mt: 1, flexShrink: 0,
                  ...(i === 0 && !n.lu && { boxShadow: `0 0 0 4px ${n.couleur}22` }),
                }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: n.lu ? 600 : 700, color: 'text.primary', fontSize: '0.875rem', lineHeight: 1.5 }}>{n.titre}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.875rem' }}>{n.date}</Typography>
                </Box>
              </Box>
            ))
          )}
        </Section>

        {/* ═══ INSCRIPTIONS ═════════════════════════════════════ */}
        <Section refE={refs.inscriptions} id="inscriptions" titre="mes-inscriptions" sousTitre="Où tu es attendu" icone={<IcCalendrier taille={17} couleur="#0F5B3A" />}>
          {inscApi === null ? (
            <Box sx={{ px: 2.6, py: 3 }}>
              {[1, 2, 3].map((i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.25 }}>
                  <Box sx={{
                    display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: { xs: 1.2, md: 2.2 }, p: { xs: 1.6, md: 2.4 }, mb: 1.4,
                    bgcolor: (theme) => theme.palette.background.paper, borderRadius: '16px', border: '1px solid', borderColor: 'divider',
                  }}>
                    <Box sx={{
                      width: 54, flexShrink: 0, borderRadius: '12px', py: 1.2,
                      bgcolor: (theme) => (theme.palette.mode === 'dark' ? theme.palette.background.default : '#F5F7F6'), border: '1px solid', borderColor: 'divider',
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                    }}>
                      <Box sx={{ height: 24, width: 30, borderRadius: 4, bgcolor: 'action.hover' }} />
                      <Box sx={{ height: 12, width: 40, borderRadius: 4, bgcolor: 'action.hover', mt: 0.5 }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ height: 20, borderRadius: 8, bgcolor: 'action.hover', mb: 0.5, width: '60%' }} />
                      <Box sx={{ height: 14, borderRadius: 6, bgcolor: 'action.hover', width: '40%' }} />
                    </Box>
                    <Box sx={{ height: 28, width: 80, borderRadius: 14, bgcolor: 'action.hover' }} />
                  </Box>
                </motion.div>
              ))}
            </Box>
          ) : inscriptions.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', mb: 1.5 }}>
                Aucune inscription pour le moment.
              </Typography>
              <Button variant="contained" onClick={() => allerVers('activites')} sx={{ bgcolor: '#1FAF72', '&:hover': { bgcolor: '#179963' }, fontWeight: 800, borderRadius: 9999, minHeight: 44, fontSize: '0.875rem' }}>
                Découvrir les activités
              </Button>
            </Box>
          ) : (
            inscriptions.map((insc, i) => (
              <motion.div key={insc.id}
                initial={reduit ? false : { opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '0px' }}
                transition={{ delay: reduit ? 0 : Math.min(i * 0.05, 0.1), duration: reduit ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}>
                <Box sx={{
                  display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: { xs: 1.2, md: 2.2 }, p: { xs: 1.6, md: 2.4 }, mb: 1.4,
                  bgcolor: (theme) => theme.palette.background.paper, borderRadius: '16px', border: '1px solid', borderColor: 'divider',
                  boxShadow: '0 2px 10px rgba(13,27,42,.05)',
                  transition: 'box-shadow 200ms ease, border-color 200ms ease',
                  '&:hover': { boxShadow: '0 8px 22px rgba(13,27,42,.1)', borderColor: '#C9DED4' },
                }}>
                  <Box sx={{
                    width: 54, flexShrink: 0, borderRadius: '12px', py: 1.2,
                    bgcolor: (theme) => (theme.palette.mode === 'dark' ? theme.palette.background.default : '#F5F7F6'), border: '1px solid', borderColor: 'divider',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                  }}>
                    <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: '1.15rem', lineHeight: 1, color: insc.couleur }}>
                      {new Date(insc.date).getDate()}
                    </Typography>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.875rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: insc.couleur }}>
                      {new Date(insc.date).toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.95rem', lineHeight: 1.35 }}>{insc.titre}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.4, flexWrap: 'wrap' }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.875rem', textTransform: 'capitalize' }}>
                        {new Date(insc.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} · {insc.lieu}
                      </Typography>
                      {insc.evenementId && import.meta.env.VITE_API_URL && (
                        <Typography component="a" variant="caption"
                          href={`${import.meta.env.VITE_API_URL}/api/v1/evenements/${insc.evenementId}.ics`}
                          sx={{ color: (theme) => (theme.palette.mode === 'dark' ? '#6EE7B7' : '#0E7A50'), fontWeight: 800, fontSize: '0.875rem', textDecoration: 'none', minHeight: 44, display: 'inline-flex', alignItems: 'center', '&:hover': { textDecoration: 'underline' } }}>
                          · Agenda (.ics)
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Chip label={insc.statut} size="small" sx={{
                    bgcolor: insc.statut === 'Confirmé' ? '#E4F8EF' : '#FFF6E0',
                    color: insc.statut === 'Confirmé' ? '#0B7A4B' : '#B45309',
                    fontWeight: 800, fontSize: '0.875rem', flexShrink: 0, height: 28,
                  }} />
                </Box>
                {/* Émargement : code à 6 chiffres affiché le jour J (+5 pts) */}
                {insc.statut === 'Confirmé' && insc.evenementId && (
                  <Box sx={{
                    display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.2, mt: -0.6, mb: 1.4, ml: { xs: 0, md: 9 },
                    px: 2, py: 1.2, bgcolor: (theme) => (theme.palette.mode === 'dark' ? theme.palette.background.default : '#F6FBF9'), borderRadius: '12px', border: '1px dashed #BFD8CC',
                  }}>
                    {String(etatsPresence[insc.id] ?? '').startsWith('present') ? (
                      <Typography sx={{ fontWeight: 800, color: (theme) => (theme.palette.mode === 'dark' ? '#6EE7B7' : '#0B7A4B'), fontSize: '0.875rem' }}>
                        Présent ✓ {etatsPresence[insc.id].split(':')[1] ? `· ${etatsPresence[insc.id].split(':')[1]} pts` : ''}
                      </Typography>
                    ) : (
                      <>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, flexShrink: 0, fontSize: '0.875rem' }}>
                          J'y étais — code :
                        </Typography>
                        <InputBase
                          value={codesPresence[insc.id] ?? ''}
                          onChange={(e) => setCodesPresence((c) => ({ ...c, [insc.id]: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                          placeholder="——————"
                          inputProps={{ inputMode: 'numeric', maxLength: 6, 'aria-label': 'Code de présence à 6 chiffres' }}
                          sx={{
                            width: 110, minHeight: 44, height: 44, bgcolor: (theme) => (theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff'), borderRadius: '8px', border: '1px solid', borderColor: 'divider',
                            px: 1.2, fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, display: 'flex', alignItems: 'center',
                            letterSpacing: '0.2em', fontSize: '0.875rem', textAlign: 'center',
                            '&:focus-within': { borderColor: '#1FAF72', outline: '2px solid #1FAF72', outlineOffset: '1px' },
                          }}
                        />
                        <Button size="small" variant="contained" onClick={() => marquerPresent(insc)}
                          disabled={(codesPresence[insc.id] ?? '').length !== 6 || etatsPresence[insc.id] === 'envoi'}
                          sx={{ bgcolor: '#1FAF72', '&:hover': { bgcolor: '#179963' }, fontWeight: 800, borderRadius: '8px', minWidth: 64, minHeight: 44, height: 44, px: 2, fontSize: '0.875rem', '&:focus-visible': { outline: '2px solid #0E7A50', outlineOffset: '2px' } }}>
                          {etatsPresence[insc.id] === 'envoi' ? '…' : 'OK'}
                        </Button>
                        {etatsPresence[insc.id] === 'erreur' && (
                          <Typography variant="caption" sx={{ color: (theme) => (theme.palette.mode === 'dark' ? '#EF4444' : '#B42318'), fontWeight: 700, fontSize: '0.875rem' }}>
                            Code incorrect
                          </Typography>
                        )}
                      </>
                    )}
                  </Box>
                )}
              </motion.div>
            ))
          )}
        </Section>

{/* ═══ MA CELLULE ════════════════════════════════════════ */}
        <Section refE={refs.cellule} id="cellule" titre="ma-cellule" sousTitre="Ton équipe au quotidien" icone={<IcCube taille={17} couleur="#0F5B3A" />}>
          {cellulesApi === null ? (
            <Box sx={{ px: 2.6, py: 3 }}>
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                <Box sx={{
                  p: { xs: 2.8, md: 3.2 }, bgcolor: (theme) => theme.palette.background.paper, borderRadius: '18px',
                  border: '1px solid', borderColor: 'divider',
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box sx={{
                    width: 56, height: 56, borderRadius: '16px',
                    bgcolor: 'action.hover',
                    display: 'grid', placeItems: 'center',
                  }}>
                    <IcCube taille={28} couleur="rgba(255,255,255,0.3)" />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ height: 16, borderRadius: 8, bgcolor: 'action.hover', mb: 0.5, width: '40%' }} />
                    <Box sx={{ height: 24, borderRadius: 8, bgcolor: 'action.hover', width: '60%' }} />
                  </Box>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ height: 16, borderRadius: 8, bgcolor: 'action.hover', mb: 1.5, width: '30%' }} />
                <Box sx={{ display: 'grid', gap: 1.2 }}>
                  {[1, 2, 3].map((i) => (
                    <Box key={i} sx={{ display: 'flex', gap: 1.4, alignItems: 'flex-start', p: 1.6, bgcolor: (theme) => theme.palette.background.paper, borderRadius: '12px', border: '1px solid', borderColor: 'divider' }}>
                      <Box sx={{ width: 24, height: 24, borderRadius: 8, bgcolor: 'action.hover', flexShrink: 0 }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ height: 16, borderRadius: 8, bgcolor: 'action.hover', mb: 0.5, width: '30%' }} />
                        <Box sx={{ height: 14, borderRadius: 6, bgcolor: 'action.hover', width: '50%' }} />
                      </Box>
                    </Box>
                  ))}
                  </Box>
                </Box>
              </motion.div>
            </Box>
          ) : cellule ? (
            <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1.2fr 1fr' }, alignItems: 'start' }}>
              <Box sx={{
                p: { xs: 2.8, md: 3.2 }, bgcolor: (theme) => theme.palette.background.paper, borderRadius: '18px',
                border: `1.5px solid ${cellule.couleur}45`,
                boxShadow: `0 12px 30px ${cellule.couleur}1E`,
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box sx={{
                    width: 56, height: 56, borderRadius: '16px',
                    background: `linear-gradient(135deg,${cellule.couleur},${cellule.couleur}CC 60%,#0D1B2A)`,
                    display: 'grid', placeItems: 'center',
                    boxShadow: `0 8px 20px ${cellule.couleur}44`,
                  }}>
                    <IcCube taille={28} couleur="#fff" />
                  </Box>
                  <Box>
                    <Typography sx={{ color: (theme) => (theme.palette.mode === 'dark' ? cellule.couleur : cellule.couleurFonce), fontWeight: 800, fontSize: '0.875rem', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                      {cellule.role ?? 'Membre actif'}
                    </Typography>
                    <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: '1.25rem', color: 'text.primary' }}>
                      {cellule.nom}
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.9rem', mb: 1.5 }}>
                  À propos — {cellule.membres} membre{cellule.membres > 1 ? 's' : ''}
                </Typography>
                <Box sx={{ display: 'grid', gap: 1.2 }}>
                  {[{ date: `${cellule.membres} membres actifs`, sujet: cellule.description }].map((s, i) => (
                    <Box key={i} sx={{ display: 'flex', gap: 1.4, alignItems: 'flex-start', p: 1.6, bgcolor: (theme) => theme.palette.background.paper, borderRadius: '12px', border: '1px solid', borderColor: 'divider' }}>
                      <IcCalendrier taille={15} couleur={sombre ? '#9AFBD7' : cellule.couleurFonce} />
                      <Box>
                        <Typography sx={{ fontWeight: 800, color: (theme) => (theme.palette.mode === 'dark' ? '#9AFBD7' : '#0F5B3A'), fontSize: '0.875rem' }}>{s.date}</Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6, fontSize: '0.875rem' }}>{s.sujet}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Espace vivant de la cellule : programmation, forum, propositions */}
              <Box sx={{ gridColumn: '1 / -1' }}>
                <CelluleVivante cellule={cellule} sombre={sombre} />
              </Box>

              <Box sx={{ display: 'grid', gap: 2, alignContent: 'start' }}>
                {[
                  { label: 'Mes inscriptions', valeur: inscriptions === null ? '—' : inscriptions.length, icone: <IcCalendrier taille={20} couleur="#1FAF72" />, couleur: '#1FAF72' },
                  { label: 'Points', valeur: points === null ? '—' : points, icone: <IcTrophee taille={20} couleur="#2563EB" />, couleur: '#2563EB' },
                  { label: 'Non lues', valeur: notifs === null ? '—' : notifs.filter((n) => !n.lu).length, icone: <NotificationsIcon sx={{ fontSize: 20 }} />, couleur: '#7B61FF' },
                ].map((s, i) => (
                  <motion.div key={s.label}
                    initial={reduit ? false : { opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '0px' }}
                    transition={{ delay: reduit ? 0 : Math.min(0.1 + i * 0.06, 0.2), duration: reduit ? 0 : 0.25 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.2, bgcolor: (theme) => theme.palette.background.paper, borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
                      <Box sx={{ width: 46, height: 46, borderRadius: '12px', bgcolor: (theme) => (theme.palette.mode === 'dark' ? theme.palette.background.default : '#F5F7F6'), display: 'grid', placeItems: 'center' }}>
                        {s.icone}
                      </Box>
                      <Box>
                        <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: '1.4rem', color: 'text.primary', lineHeight: 1.2 }}>
                          {s.valeur}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.875rem' }}>
                          {s.label}
                        </Typography>
                      </Box>
                    </Box>
                  </motion.div>
                ))}
              </Box>
            </Box>
          ) : (
            <Box sx={{ px: 2.6, py: 3, textAlign: 'center' }}>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', mb: 1.5 }}>
                Tu n'appartiens à aucune cellule pour le moment.
              </Typography>
              <Button variant="contained" onClick={() => allerVers('activites')} sx={{ bgcolor: '#1FAF72', '&:hover': { bgcolor: '#179963' }, fontWeight: 800, borderRadius: 9999, minHeight: 44, fontSize: '0.875rem' }}>
                Découvrir les cellules
              </Button>
            </Box>
          )}
        </Section>

        {/* ═══ MON PROFIL ════════════════════════════════════════ */}
        <Section refE={refs.profil} id="profil" titre="mon-profil" sousTitre="Tes informations" icone={<IcMembres taille={17} couleur="#0F5B3A" />}>
          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, alignItems: 'start' }}>
            <Box sx={{ p: { xs: 2.8, md: 3.2 }, bgcolor: (theme) => theme.palette.background.paper, borderRadius: '18px', border: '1px solid', borderColor: 'divider' }}>
              <Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: '1rem', mb: 2 }}>
                Mes informations
              </Typography>
              <PhotoProfil />
              {[
                ['Nom', user.nom || '—'],
                ['Email', user.email || 'prenom.nom@emsp.int'],
                ['Points de participation', points === null ? '—' : `${points} pts${niveau ? ` · ${niveau}` : ''}`],
              ].map(([label, valeur]) => (
                <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 1.4, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>{label}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 700, textAlign: 'right', wordBreak: 'break-word' }}>{valeur}</Typography>
                </Box>
              ))}
              <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'text.secondary', lineHeight: 1.7, fontSize: '0.875rem' }}>
                Pour corriger une information, contacte la Secrétaire Générale — les données viennent de l'annuaire du club.
              </Typography>
              {classement.length > 0 && (
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.875rem', mb: 1 }}>
                    Top membres du club
                  </Typography>
                  {classement.map((j, i) => (
                    <Box key={`${j.nom}-${i}`} sx={{ display: 'flex', alignItems: 'center', gap: 1.2, py: 0.6 }}>
                      <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: '0.875rem', color: i === 0 ? '#B45309' : 'text.secondary', width: 22 }}>
                        {i + 1}
                      </Typography>
                      <Avatar src={urlMedia(j.photo) ?? undefined} sx={{ width: 26, height: 26, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(139,92,246,.18)' : '#EDE9FE', color: (theme) => theme.palette.mode === 'dark' ? '#C4B5FD' : '#5B21B6', fontWeight: 800, fontSize: '0.875rem', flexShrink: 0 }}>
                        {(j.nom || '?').slice(0, 1).toUpperCase()}
                      </Avatar>
                      <Typography variant="body2" sx={{ flex: 1, color: 'text.primary', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {j.nom}
                      </Typography>
                      <Chip label={j.niveau} size="small" sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(139,92,246,.18)' : '#EDE9FE', color: (theme) => theme.palette.mode === 'dark' ? '#C4B5FD' : '#5B21B6', fontWeight: 700, fontSize: '0.875rem', height: 28 }} />
                      <Typography variant="caption" sx={{ color: (theme) => (theme.palette.mode === 'dark' ? '#6EE7B7' : '#0B7A4B'), fontWeight: 800, fontSize: '0.875rem' }}>
                        {j.points} pts
                      </Typography>
                    </Box>
                  ))}
                  <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary', fontSize: '0.875rem' }}>
                    Bienvenue +10 · présence +5 · Niveaux : Actif (5), Pilier (20), Légende (50).
                  </Typography>
                </Box>
              )}
            </Box>
            <PreferencesNotifications />
            <ChangementMotDePasse />

            <Box sx={{ p: { xs: 2.8, md: 3.2 }, bgcolor: (theme) => theme.palette.background.paper, borderRadius: '18px', border: '1px solid', borderColor: 'divider' }}>
              <Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: '1rem', mb: 2 }}>
                Mes rôles & permissions
              </Typography>
              <Box sx={{ display: 'grid', gap: 1.2 }}>
                {(user.roles ?? []).map((r) => {
                  const I = iconePoste(libellesRoles[r.code] ?? '')
                  return (
                    <Box key={r.code} sx={{ display: 'flex', alignItems: 'center', gap: 1.6, p: 1.6, bgcolor: (theme) => theme.palette.background.paper, borderRadius: '12px', border: '1px solid', borderColor: 'divider' }}>
                      <Box sx={{ width: 38, height: 38, borderRadius: '10px', bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(154,251,215,.16)' : '#0F5B3A14'), display: 'grid', placeItems: 'center' }}>
                        <I taille={18} couleur={sombre ? '#9AFBD7' : '#0F5B3A'} />
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.875rem' }}>
                          {libellesRoles[r.code] ?? r.code}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", fontSize: '0.875rem' }}>
                          role: {r.code}
                        </Typography>
                      </Box>
                    </Box>
                  )
                })}
              </Box>
            </Box>
          </Box>
        </Section>
      </Container>

      {/* ── Barre de statut IDE (desktop) ────────────────────── */}
      <Box
        component={motion.div}
        initial={reduit ? false : { y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ delay: reduit ? 0 : 0.1, duration: reduit ? 0 : 0.25 }}
        sx={{ position: 'fixed', bottom: 14, left: 14, right: 102, zIndex: 1100, display: { xs: 'none', lg: 'block' } }}
      >
        <Box sx={{
          display: { xs: 'none', lg: 'flex' }, alignItems: 'center', gap: 2.5,
          bgcolor: 'rgba(13,27,42,.97)',
          border: '1px solid rgba(154,251,215,.16)', borderRadius: '12px',
          px: 2, py: 0.9,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.9 }}>
            <Box sx={{ width: 7, height: 7, borderRadius: '50%', background: '#1FAF72' }} aria-hidden />
            <Typography sx={{ color: '#9AFBD7', fontSize: '0.875rem', fontFamily: "'JetBrains Mono',monospace", fontWeight: 600 }}>
              section: {sectionActive}
            </Typography>
          </Box>
          <Typography sx={{ color: 'rgba(255,255,255,.6)', fontSize: '0.875rem', fontFamily: "'JetBrains Mono',monospace" }}>
            rôle: {(user.roles ?? []).map((r) => r.code).join(' · ') || '—'}
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,.6)', fontSize: '0.875rem', fontFamily: "'JetBrains Mono',monospace", ml: 'auto' }}>
            <Horloge /> · itclub@espace
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

/* ── Préférences notifications (doc 02 D10 : opt-out granulaire) ── */
function PreferencesNotifications() {
  const [prefs, setPrefs] = useState(null)
  const [sauve, setSauve] = useState('')

  useEffect(() => {
    let stop = false
    api.getMe().then((me) => { if (!stop && me) setPrefs(me.notif_prefs ?? {}) }).catch(() => {})
    return () => { stop = true }
  }, [])

  const basculer = async (cle) => {
    const nouvelles = { ...(prefs ?? {}), [cle]: !(prefs?.[cle] ?? true) }
    setPrefs(nouvelles)
    setSauve('')
    try {
      await api.patchMe({ notif_prefs: nouvelles })
      setSauve('Préférences enregistrées ✓')
    } catch {
      setSauve('Hors-ligne — réessaie plus tard')
    }
  }

  const LIGNES = [
    ['annonce', 'Annonces du Bureau', 'Publications officielles et actualités'],
    ['inscription', 'Mes inscriptions', 'Confirmations, liste d’attente, promotions'],
    ['rappel', 'Rappels J-1 / H-2h', 'Avant chaque activité où tu es inscrit'],
    ['recap', 'Récap du dimanche', 'La semaine à venir, chaque dimanche 18h'],
  ]

  return (
    <Box sx={{ p: { xs: 2.8, md: 3.2 }, bgcolor: (theme) => theme.palette.background.paper, borderRadius: '18px', border: '1px solid', borderColor: 'divider', gridColumn: { md: '1 / -1' } }}>
      <Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: '1rem', mb: 0.5 }}>
        Notifications par email
      </Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5, fontSize: '0.875rem' }}>
        {prefs === null ? 'Chargement…' : 'Choisis ce que tu veux recevoir — le reste reste visible ici.'}
      </Typography>
      {LIGNES.map(([cle, titre, aide]) => (
        <Box key={cle} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.875rem' }}>{titre}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>{aide}</Typography>
          </Box>
          <Switch checked={prefs?.[cle] ?? true} onChange={() => basculer(cle)} disabled={prefs === null}
            sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#1FAF72' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#1FAF72' } }} />
        </Box>
      ))}
      {sauve && (
        <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: sauve.startsWith('Hors') ? (theme) => (theme.palette.mode === 'dark' ? '#F5A623' : '#B45309') : (theme) => (theme.palette.mode === 'dark' ? '#6EE7B7' : '#0E7A50'), fontWeight: 700, fontSize: '0.875rem' }}>
          {sauve}
        </Typography>
      )}
    </Box>
  )
}

/* ── Photo de profil (upload réel vers /me/) ─────────────────── */
function PhotoProfil() {
  const user = useAuth((s) => s.user)
  const mettreAJour = useAuth((s) => s.mettreAJour)
  const [envoi, setEnvoi] = useState(false)
  const [retour, setRetour] = useState('')

  const choisir = async (e) => {
    const fichier = e.target.files?.[0]
    if (!fichier || envoi) return
    if (!fichier.type.startsWith('image/')) {
      setRetour('Choisis une image (JPG, PNG, WebP).')
      return
    }
    if (fichier.size > 5 * 1024 * 1024) {
      setRetour('5 Mo maximum.')
      return
    }
    setEnvoi(true)
    try {
      const me = await api.changerPhoto(fichier)
      if (me?.photo) mettreAJour({ photo: me.photo })
      else {
        const frais = await api.getMe().catch(() => null)
        if (frais?.photo) mettreAJour({ photo: frais.photo })
      }
      setRetour('Photo mise à jour ✓')
    } catch {
      setRetour('Envoi impossible — réessaie.')
    } finally {
      setEnvoi(false)
      e.target.value = ''
    }
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Avatar src={urlMedia(user?.photo) ?? undefined} sx={{ width: 64, height: 64, bgcolor: '#0F5B3A', fontWeight: 800, fontSize: '1.4rem' }}>
        {(user?.nom || 'M')[0]}
      </Avatar>
      <Box>
        <Button variant="outlined" component="label" size="small" disabled={envoi}
          sx={{ borderColor: '#1FAF72', color: (theme) => (theme.palette.mode === 'dark' ? '#6EE7B7' : '#0E7A50'), fontWeight: 800, borderRadius: '10px', minHeight: 44, fontSize: '0.875rem' }}>
          {envoi ? 'Envoi…' : 'Changer la photo'}
          <input type="file" accept="image/*" hidden onChange={choisir} />
        </Button>
        {retour && (
          <Typography variant="caption" sx={{ display: 'block', mt: 0.6, color: retour.includes('✓') ? (theme) => (theme.palette.mode === 'dark' ? '#6EE7B7' : '#0B7A4B') : (theme) => (theme.palette.mode === 'dark' ? '#EF4444' : '#B42318'), fontWeight: 700, fontSize: '0.875rem' }}>
            {retour}
          </Typography>
        )}
      </Box>
    </Box>
  )
}

/* ── Changement de mot de passe (rotation demandée au 1er login) ─ */
function ChangementMotDePasse() {
  const [ancien, setAncien] = useState('')
  const [nouveau, setNouveau] = useState('')
  const [retour, setRetour] = useState('')
  const [envoi, setEnvoi] = useState(false)

  const changer = async () => {
    if (nouveau.length < 8 || envoi) {
      if (nouveau.length < 8) setRetour('8 caractères minimum.')
      return
    }
    setEnvoi(true)
    try {
      await api.changerMotDePasse(ancien, nouveau)
      setRetour('Mot de passe changé ✓ — reconnecte-toi avec le nouveau.')
      setAncien('')
      setNouveau('')
    } catch (e) {
      setRetour(e.message ?? 'Changement impossible')
    } finally {
      setEnvoi(false)
    }
  }

  const champSx = { '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: (theme) => (theme.palette.mode === 'dark' ? theme.palette.background.default : '#F8FAF9') } }

  return (
    <Box sx={{ p: { xs: 2.8, md: 3.2 }, bgcolor: (theme) => theme.palette.background.paper, borderRadius: '18px', border: '1px solid', borderColor: 'divider' }}>
      <Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: '1rem', mb: 0.5 }}>
        Mot de passe
      </Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5, fontSize: '0.875rem' }}>
        Change le mot de passe temporaire reçu à la création du compte.
      </Typography>
      <Box sx={{ display: 'grid', gap: 1.4 }}>
        <ChampMotDePasse size="small" label="Actuel" value={ancien}
          onChange={(e) => setAncien(e.target.value)} fullWidth autoComplete="current-password" sx={champSx} />
        <ChampMotDePasse size="small" label="Nouveau (8 min)" value={nouveau}
          onChange={(e) => setNouveau(e.target.value)} fullWidth autoComplete="new-password" sx={champSx} />
        <Button variant="contained" onClick={changer} disabled={envoi || nouveau.length < 8}
          sx={{ bgcolor: '#1FAF72', '&:hover': { bgcolor: '#179963' }, fontWeight: 800, borderRadius: '12px', justifySelf: 'start', minHeight: 44, fontSize: '0.875rem' }}>
          {envoi ? '…' : 'Changer'}
        </Button>
        {retour && (
          <Typography variant="caption" sx={{ color: retour.includes('✓') ? (theme) => (theme.palette.mode === 'dark' ? '#6EE7B7' : '#0B7A4B') : (theme) => (theme.palette.mode === 'dark' ? '#EF4444' : '#B42318'), fontWeight: 700, fontSize: '0.875rem' }}>
            {retour}
          </Typography>
        )}
      </Box>
    </Box>
  )
}

/* ── Section avec en-tête façon terminal ────────────────────── */
function Section({ refE, id, titre, sousTitre, icone, children }) {
  return (
    <Box ref={refE} data-section={id} sx={{ scrollMarginTop: 90, mb: { xs: 5, md: 7 } }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.4, mb: 2.5 }}>
        <Typography sx={{ color: '#1FAF72', fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: '0.875rem' }}>
          0{['notifications', 'inscriptions', 'cellule', 'profil'].indexOf(id) + 1}_
        </Typography>
        <Typography sx={{ color: '#fff', fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: { xs: '1.05rem', md: '1.25rem' }, display: 'flex', alignItems: 'center', gap: 1.2 }}>
          {icone} {titre}
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,.55)', fontSize: '0.875rem', fontFamily: "'JetBrains Mono',monospace", ml: 'auto', display: { xs: 'none', sm: 'block' } }}>
          // {sousTitre}
        </Typography>
      </Box>
      <Box sx={{
        bgcolor: (theme) => theme.palette.background.paper, borderRadius: '18px', border: '1px solid', borderColor: 'divider',
        boxShadow: '0 10px 30px rgba(0,0,0,.3)', overflow: 'hidden',
      }}>
        {children}
      </Box>
    </Box>
  )
}
