import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Switch from '@mui/material/Switch'
import InputBase from '@mui/material/InputBase'
import HomeIcon from '@mui/icons-material/Home'
import SearchIcon from '@mui/icons-material/Search'
import DashboardIcon from '@mui/icons-material/Dashboard'
import LogoutIcon from '@mui/icons-material/Logout'
import NotificationsIcon from '@mui/icons-material/Notifications'
import CloseIcon from '@mui/icons-material/Close'
import { useAuth, hasRole } from '../stores/auth'
import { api } from '../lib/api'
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

/* Données de démonstration — contrat GET /api/v1/me/* (doc 04) */
const MES_INSCRIPTIONS = [
  { id: 1, titre: 'Atelier Git & GitHub', date: '2026-10-12', lieu: 'Salle info 2', statut: 'Confirmé', couleur: '#1FAF72', couleurTexte: '#0E7A50' },
  { id: 2, titre: 'Hackathon interne — 48h', date: '2026-10-25', lieu: 'Amphi A', statut: 'En liste d’attente', couleur: '#2563EB', couleurTexte: '#1D4ED8' },
  { id: 3, titre: 'Sortie culturelle — Grand-Bassam', date: '2026-11-08', lieu: 'Rendez-vous campus', statut: 'Confirmé', couleur: '#F5A623', couleurTexte: '#B45309' },
]

const MA_CELLULE = {
  id: 'web', nom: 'Cellule Web', couleur: '#1FAF72', couleurFonce: '#0E7A50', membres: 14,
  role: 'Membre actif',
  prochainesSessions: [
    { date: 'Ven 18 Oct — 15h', sujet: 'Revue de code : la plateforme du club' },
    { date: 'Ven 25 Oct — 15h', sujet: 'Atelier Django REST — suite' },
  ],
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
    else if (it.href) window.location.href = it.href
    else if (it.action === 'logout') logout()
  }, [fermer, scrollTo, logout])

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
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onClick={fermer}
          style={{ position: 'fixed', inset: 0, zIndex: 1500, background: 'rgba(5,12,22,.72)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: 'min(14vh, 110px)' }}
        >
          <motion.div
            initial={{ scale: 0.96, y: -12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.97, y: -8 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={surTouche}
            style={{ width: 'min(580px, 94vw)' }}
          >
            <Box sx={{
              bgcolor: 'rgba(13,27,42,.97)', borderRadius: '18px',
              border: '1px solid rgba(154,251,215,.3)', overflow: 'hidden',
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
                <Chip label="ESC" size="small" sx={{ bgcolor: 'rgba(154,251,215,.1)', color: 'rgba(154,251,215,.6)', fontFamily: "'JetBrains Mono',monospace", fontSize: '0.58rem', height: 20 }} />
              </Box>
              {/* Résultats */}
              <Box sx={{ maxHeight: 'min(46vh, 380px)', overflowY: 'auto', p: 1 }}>
                {items.length === 0 && (
                  <Typography sx={{ color: 'rgba(255,255,255,.62)', textAlign: 'center', py: 3, fontFamily: "'JetBrains Mono',monospace", fontSize: '0.8rem' }}>
                    Aucun résultat pour « {q} »
                  </Typography>
                )}
                {items.map((it, i) => (
                  <Box
                    key={it.label}
                    id={'palette-item-' + i}
                    onClick={() => executer(it)}
                    onMouseEnter={() => setSel(i)}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 1.8, px: 1.8, py: 1.3,
                      borderRadius: '12px', cursor: 'pointer',
                      bgcolor: i === sel ? '#1FAF72' : 'transparent',
                      color: i === sel ? '#fff' : 'rgba(255,255,255,.85)',
                      transition: 'background 120ms ease',
                    }}
                  >
                    <Box sx={{ display: 'grid', placeItems: 'center', color: i === sel ? '#fff' : '#9AFBD7' }}>{it.icone}</Box>
                    <Typography sx={{ flex: 1, fontWeight: 700, fontSize: '0.88rem' }}>{it.label}</Typography>
                    {it.section && (
                      <Typography sx={{ color: i === sel ? 'rgba(255,255,255,.7)' : 'rgba(154,251,215,.5)', fontSize: '0.62rem', fontFamily: "'JetBrains Mono',monospace" }}>
                        #{it.section}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
              {/* Aide touches + compteur résultats */}
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', px: 2.4, py: 1.4, borderTop: '1px solid rgba(154,251,215,.12)' }}>
                <Typography sx={{ color: 'rgba(154,251,215,.55)', fontSize: '0.64rem', fontFamily: "'JetBrains Mono',monospace" }}>
                  {items.length} resultat{items.length > 1 ? 's' : ''}
                </Typography>
                {[['↑↓', 'naviguer'], ['↵', 'ouvrir'], ['esc', 'fermer']].map(([touche, sens]) => (
                  <Box key={touche} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <Typography sx={{ color: 'rgba(154,251,215,.7)', fontSize: '0.6rem', fontFamily: "'JetBrains Mono',monospace", border: '1px solid rgba(154,251,215,.25)', borderRadius: '5px', px: 0.7 }}>
                      {touche}
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,.6)', fontSize: '0.64rem' }}>{sens}</Typography>
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
  const [palette, setPalette] = useState(false)
  const [sectionActive, setSectionActive] = useState('accueil')
  // Données réelles (API) — null = en chargement/mock, [] = vide réel
  const [notifsApi, setNotifsApi] = useState(null)
  const [inscApi, setInscApi] = useState(null)
  const [cellulesApi, setCellulesApi] = useState(null)

  useEffect(() => {
    let stop = false
    api.getNotifications().then((d) => { if (!stop) setNotifsApi(d) }).catch(() => {})
    api.getMesInscriptions().then((d) => { if (!stop) setInscApi(d) }).catch(() => {})
    api.getMesCellules().then((d) => { if (!stop) setCellulesApi(d) }).catch(() => {})
    return () => { stop = true }
  }, [])

  const marquerLue = (id) => {
    setNotifsApi((ns) => (ns ?? []).map((n) => (n.id === id ? { ...n, lu: true } : n)))
    api.marquerNotificationsLues([id]).catch(() => {})
  }

  const COULEURS_NOTIF = { annonce: '#1FAF72', inscription: '#2563EB', rappel: '#F5A623', convocation: '#7B61FF', satisfaction: '#0EA5E9', recap: '#64748B', promotion: '#F97316', candidature: '#0E7A50' }
  const notifs = notifsApi === null ? null : notifsApi.map((n) => ({
    id: n.id,
    titre: n.titre,
    date: n.cree_le ? new Date(n.cree_le).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '',
    couleur: COULEURS_NOTIF[n.type] ?? '#6B7280',
    lu: !!n.lu,
  }))

  const inscriptions = inscApi === null ? null : inscApi.map((i) => ({
    id: i.id,
    titre: i.evenement?.titre ?? 'Événement',
    date: i.evenement?.date ?? '',
    lieu: i.evenement?.lieu ?? '',
    couleur: i.evenement?.couleur ?? '#2563EB',
    statut: i.liste_attente ? 'En liste d’attente' : 'Confirmé',
  }))

  const celluleApi = (cellulesApi && cellulesApi.length > 0) ? cellulesApi[0] : null
  const cellule = celluleApi ? {
    nom: celluleApi.nom,
    couleur: celluleApi.couleur ?? '#1FAF72',
    couleurFonce: celluleApi.couleurFonce ?? '#0E7A50',
    role: 'Membre actif',
    description: celluleApi.description ?? '',
    membres: celluleApi.membres ?? 0,
  } : null

  const refs = {
    accueil: useRef(null), notifications: useRef(null),
    inscriptions: useRef(null), cellule: useRef(null), profil: useRef(null),
  }

  const scrollTo = useCallback((nom) => {
    refs[nom]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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

  const BoutonDock = ({ actif, label, onClick, children, href }) => (
    <Tooltip title={label} placement="left" arrow enterDelay={400} enterNextDelay={200}>
      <motion.div whileHover={{ scale: 1.14, y: -2 }} whileTap={{ scale: 0.92 }}>
        <IconButton
          href={href} onClick={onClick} aria-label={label}
          sx={{
            width: 48, height: 48, borderRadius: '14px',
            color: actif ? '#fff' : '#9AFBD7',
            bgcolor: actif ? '#1FAF72' : 'rgba(154,251,215,.08)',
            border: actif ? '1px solid rgba(255,255,255,.35)' : '1px solid rgba(154,251,215,.18)',
            boxShadow: actif ? '0 6px 18px rgba(31,175,114,.45)' : 'none',
            transition: 'background 200ms ease, box-shadow 200ms ease',
            '&:hover': { bgcolor: actif ? '#25C482' : 'rgba(154,251,215,.18)' },
          }}
        >
          {children}
        </IconButton>
      </motion.div>
    </Tooltip>
  )

  return (
    <Box sx={{ minHeight: '100vh', position: 'relative', background: 'linear-gradient(160deg,#0A1628 0%,#0D1B2A 55%,#0F5B3A 140%)' }}>
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
      <motion.div
        initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: 'fixed', top: 14, left: 14, right: { xs: 14, md: 102 }, zIndex: 1200 }}
      >
        <Box sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          bgcolor: 'rgba(13,27,42,.72)', backdropFilter: 'blur(14px)',
          border: '1px solid rgba(154,251,215,.18)', borderRadius: '16px',
          px: { xs: 1.5, md: 2.2 }, py: 1,
          boxShadow: '0 10px 30px rgba(0,0,0,.35)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.4, minWidth: 0 }}>
            <Box component="img" src="/logo-itclub.webp" alt="" sx={{ width: 30, height: 30, borderRadius: 1, objectFit: 'cover' }} />
            <Typography noWrap sx={{ color: '#fff', fontWeight: 800, fontSize: { xs: '0.78rem', md: '0.9rem' }, fontFamily: "'Orbitron',sans-serif" }}>
              EMSP<span style={{ color: '#1FAF72' }}>://</span>
              <span style={{ color: '#9AFBD7', fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, fontSize: '0.8rem' }}>espace</span>
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            {/* Bouton recherche — palette */}
            <Button onClick={() => setPalette(true)} size="small" startIcon={<SearchIcon sx={{ fontSize: 16 }} />}
              sx={{
                color: 'rgba(255,255,255,.6)', fontWeight: 600, fontSize: '0.74rem',
                border: '1px solid rgba(154,251,215,.25)', borderRadius: '10px',
                fontFamily: "'JetBrains Mono',monospace",
                '&:hover': { borderColor: '#1FAF72', color: '#fff' },
              }}>
              Chercher <Box component="span" sx={{ ml: 0.8, opacity: 0.6 }}>Ctrl·K</Box>
            </Button>
            <Avatar sx={{ width: 32, height: 32, bgcolor: '#1FAF72', fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: 14, border: '2px solid rgba(154,251,215,.4)' }}>
              {initiale}
            </Avatar>
            <Tooltip title="Déconnexion" arrow enterDelay={400}>
            <IconButton size="small" onClick={() => { if (window.confirm('Se déconnecter de ton espace ?')) logout() }} aria-label="Déconnexion"
              sx={{ color: '#fff', border: '1px solid rgba(255,255,255,.3)', borderRadius: '10px', px: 1.2 }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          </Box>
        </Box>
      </motion.div>

      {/* ── DOCK vertical (desktop) ──────────────────────────── */}
      <motion.div
        initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: 'fixed', right: 14, top: '50%', transform: 'translateY(-50%)', zIndex: 1200 }}
      >
        <Box sx={{
          display: { xs: 'none', md: 'flex' }, flexDirection: 'column', alignItems: 'center', gap: 1,
          bgcolor: 'rgba(13,27,42,.78)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(154,251,215,.2)', borderRadius: '20px',
          px: 1.2, py: 1.8,
          boxShadow: '0 14px 40px rgba(0,0,0,.4)',
        }}>
          <BoutonDock label="Rechercher (Ctrl+K)" onClick={() => setPalette(true)}>
            <SearchIcon sx={{ fontSize: 20 }} />
          </BoutonDock>
          <Box sx={{ width: 26, height: 1, bgcolor: 'rgba(154,251,215,.2)', my: 0.4 }} />
          {dockSections.map(([id, icone, label]) => (
            <BoutonDock key={id} label={label} actif={sectionActive === id} onClick={() => scrollTo(id)}>
              {icone}
            </BoutonDock>
          ))}
          <Box sx={{ width: 26, height: 1, bgcolor: 'rgba(154,251,215,.2)', my: 0.4 }} />
          {estBureau && <BoutonDock label="Back-office" href="/backoffice"><DashboardIcon sx={{ fontSize: 20 }} /></BoutonDock>}
          <BoutonDock label="Retour au site" href="/"><HomeIcon sx={{ fontSize: 20 }} /></BoutonDock>
        </Box>
      </motion.div>

      {/* ── DOCK horizontal (mobile) ─────────────────────────── */}
      <motion.div
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.45 }}
        style={{ position: 'fixed', bottom: 12, left: 12, right: 12, zIndex: 1200 }}
      >
        <Box sx={{
          display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1,
          bgcolor: 'rgba(13,27,42,.82)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(154,251,215,.2)', borderRadius: '18px',
          px: 1.4, py: 1.1, boxShadow: '0 14px 40px rgba(0,0,0,.45)',
          overflowX: 'auto', '&::-webkit-scrollbar': { height: 0 },
        }}>
          <IconButton onClick={() => setPalette(true)} aria-label="Rechercher"
            sx={{ minWidth: 44, height: 44, borderRadius: '12px', flexShrink: 0, color: '#1FAF72', bgcolor: 'rgba(31,175,114,.14)', border: '1px solid rgba(31,175,114,.4)' }}>
            <SearchIcon fontSize="small" />
          </IconButton>
          {dockSections.map(([id, icone, label]) => (
            <IconButton key={id} onClick={() => scrollTo(id)} aria-label={label}
              sx={{
                minWidth: 44, height: 44, borderRadius: '12px', flexShrink: 0,
                color: sectionActive === id ? '#fff' : '#9AFBD7',
                bgcolor: sectionActive === id ? '#1FAF72' : 'rgba(154,251,215,.08)',
                border: sectionActive === id ? '1px solid rgba(255,255,255,.35)' : '1px solid rgba(154,251,215,.15)',
              }}>
              {icone}
            </IconButton>
          ))}
          <IconButton href="/" aria-label="Site"
            sx={{ minWidth: 44, height: 44, borderRadius: '12px', flexShrink: 0, color: '#9AFBD7', bgcolor: 'rgba(154,251,215,.08)', border: '1px solid rgba(154,251,215,.15)' }}>
            <HomeIcon fontSize="small" />
          </IconButton>
        </Box>
      </motion.div>

      {/* ── Palette Ctrl+K ───────────────────────────────────── */}
      <Palette ouvert={palette} fermer={() => setPalette(false)} user={user} estBureau={estBureau} scrollTo={scrollTo} logout={logout} />

      {/* ── CONTENU ──────────────────────────────────────────── */}
      <Container maxWidth={false} sx={{
        position: 'relative', maxWidth: '1200px !important',
        px: { xs: 2.5, md: 4 }, pt: { xs: 10, md: 12 }, pb: { xs: 14, lg: 10 },
        minHeight: '100vh',
      }}>
        {/* ═══ ACCUEIL — carte membre ═══════════════════════════ */}
        <Box ref={refs.accueil} data-section="accueil" sx={{ scrollMarginTop: 90 }}>
          <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
            <Box sx={{
              borderRadius: '22px', overflow: 'hidden', position: 'relative',
              background: 'linear-gradient(120deg,#0D1B2A 0%,#0F5B3A 100%)',
              border: '1px solid rgba(154,251,215,.25)',
              boxShadow: '0 18px 44px rgba(0,0,0,.4)',
              px: { xs: 3, md: 5 }, py: { xs: 3.5, md: 4.5 }, mb: { xs: 5, md: 6 },
            }}>
              <Box sx={{ position: 'absolute', top: -70, right: '8%', width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle,rgba(31,175,114,.28),transparent 70%)', filter: 'blur(34px)' }} />
              <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', gap: { xs: 2.5, md: 4 }, flexWrap: 'wrap' }}>
                <Avatar sx={{
                  width: { xs: 72, md: 96 }, height: { xs: 72, md: 96 },
                  bgcolor: '#1FAF72', border: '3px solid rgba(154,251,215,.5)',
                  fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: { xs: 30, md: 40 },
                  boxShadow: '0 10px 26px rgba(0,0,0,.35)',
                }}>
                  {initiale}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 200 }}>
                  <Typography sx={{ color: '#9AFBD7', fontWeight: 800, fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', mb: 0.6 }}>
                    Bienvenue dans ton espace
                  </Typography>
                  <Typography sx={{ color: '#fff', fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: { xs: '1.3rem', md: '1.8rem' }, lineHeight: 1.25 }}>
                    {user.nom || 'Membre'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1.4 }}>
                    {(user.roles ?? []).map((r) => (
                      <Chip key={r.code} label={libellesRoles[r.code] ?? r.code} size="small"
                        sx={{ bgcolor: 'rgba(154,251,215,.16)', color: '#9AFBD7', fontWeight: 800, fontSize: '0.66rem', border: '1px solid rgba(154,251,215,.3)' }} />
                    ))}
                  </Box>
                </Box>
                {/* Badge MEMBRE-ID façon carte d'accès */}
                <Box sx={{
                  display: { xs: 'none', md: 'flex' }, flexDirection: 'column', gap: 0.6,
                  px: 2.4, py: 1.8, borderRadius: '12px',
                  bgcolor: 'rgba(0,0,0,.28)', border: '1px dashed rgba(154,251,215,.4)',
                  fontFamily: "'JetBrains Mono',monospace",
                }}>
                  <Typography sx={{ color: 'rgba(154,251,215,.6)', fontSize: '0.56rem', letterSpacing: '0.2em' }}>
                    MEMBRE-ID
                  </Typography>
                  <Typography sx={{ color: '#9AFBD7', fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.08em' }}>
                    IT-EMSP-{String(user.nom?.length || 5).padStart(3, '0')}-{(user.roles ?? [])[0]?.code ?? 'M'}
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,.62)', fontSize: '0.56rem', letterSpacing: '0.14em' }}>
                    VALIDE · 2026-2027
                  </Typography>
                </Box>
              </Box>
            </Box>
          </motion.div>
        </Box>

        {/* ═══ NOTIFICATIONS ════════════════════════════════════ */}
        <Section refE={refs.notifications} id="notifications" titre="notifications" sousTitre="Ce que tu as manqué" icone={<NotificationsIcon sx={{ fontSize: 18 }} />}>
          {(notifs ?? [
            { id: 1, titre: 'Ta place au Hackathon est en liste d’attente', date: 'il y a 2h', couleur: '#2563EB', lu: false },
            { id: 2, titre: 'Session Cellule Web — vendredi 15h, salle info 2', date: 'il y a 1j', couleur: '#1FAF72', lu: false },
            { id: 3, titre: 'Le PV du 7 mai est disponible dans la Documentation', date: 'il y a 3j', couleur: '#F5A623', lu: true },
          ]).map((n, i, arr) => (
            <Box key={n.id} onClick={() => { if (notifsApi !== null && !n.lu) marquerLue(n.id) }} sx={{
              display: 'flex', gap: 1.8, px: 2.6, py: 2.1,
              borderBottom: i < arr.length - 1 ? '1px solid #F0F4F2' : 'none',
              transition: 'background 160ms ease',
              '&:hover': { bgcolor: '#F6FBF9' }, cursor: notifsApi !== null ? 'pointer' : 'default',
              ...(n.lu && { opacity: 0.62 }),
            }}>
              <Box sx={{
                width: 8, height: 8, borderRadius: '50%', bgcolor: n.couleur, mt: 1, flexShrink: 0,
                ...(i === 0 && !n.lu && { boxShadow: `0 0 0 4px ${n.couleur}22` }),
              }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: n.lu ? 600 : 700, color: '#111827', fontSize: '0.88rem', lineHeight: 1.5 }}>{n.titre}</Typography>
                <Typography variant="caption" sx={{ color: '#5A6B63', fontWeight: 600, fontSize: '0.68rem' }}>{n.date}</Typography>
              </Box>
            </Box>
          ))}
          {notifs !== null && notifs.length === 0 && (
            <Typography sx={{ px: 2.6, py: 3, color: '#5A6B63', fontSize: '0.88rem' }}>
              Rien pour le moment — les annonces, rappels et promotions arrivent ici.
            </Typography>
          )}
        </Section>

        {/* ═══ INSCRIPTIONS ═════════════════════════════════════ */}
        <Section refE={refs.inscriptions} id="inscriptions" titre="mes-inscriptions" sousTitre="Où tu es attendu" icone={<IcCalendrier taille={17} couleur="#0F5B3A" />}>
          {(inscriptions ?? MES_INSCRIPTIONS).map((insc, i) => (
            <motion.div key={insc.id}
              initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '0px' }}
              transition={{ delay: i * 0.05, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
              <Box sx={{
                display: 'flex', alignItems: 'center', gap: 2.2, p: { xs: 2, md: 2.4 }, mb: 1.4,
                bgcolor: '#fff', borderRadius: '16px', border: '1px solid #E8ECEA',
                boxShadow: '0 2px 10px rgba(13,27,42,.05)',
                transition: 'box-shadow 200ms ease, border-color 200ms ease',
                '&:hover': { boxShadow: '0 8px 22px rgba(13,27,42,.1)', borderColor: '#C9DED4' },
              }}>
                <Box sx={{
                  width: 54, flexShrink: 0, borderRadius: '12px', py: 1.2,
                  bgcolor: `${insc.couleur}14`, border: `1px solid ${insc.couleur}30`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                }}>
                  <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: '1.15rem', lineHeight: 1, color: insc.couleur }}>
                    {new Date(insc.date).getDate()}
                  </Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: insc.couleur }}>
                    {new Date(insc.date).toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: '0.95rem', lineHeight: 1.35 }}>{insc.titre}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.4, flexWrap: 'wrap' }}>
                    <Typography variant="caption" sx={{ color: '#4B5563', fontWeight: 600, fontSize: '0.74rem', textTransform: 'capitalize' }}>
                      {new Date(insc.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} · {insc.lieu}
                    </Typography>
                  </Box>
                </Box>
                <Chip label={insc.statut} size="small" sx={{
                  bgcolor: insc.statut === 'Confirmé' ? '#E4F8EF' : '#FFF6E0',
                  color: insc.statut === 'Confirmé' ? '#0B7A4B' : '#B45309',
                  fontWeight: 800, fontSize: '0.66rem', flexShrink: 0,
                }} />
              </Box>
            </motion.div>
          ))}
          {inscriptions !== null && inscriptions.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography sx={{ color: '#5A6B63', fontSize: '0.9rem', mb: 1.5 }}>
                Aucune inscription pour le moment.
              </Typography>
              <Button variant="contained" href="/#activites" sx={{ bgcolor: '#1FAF72', '&:hover': { bgcolor: '#179963' }, fontWeight: 800, borderRadius: 9999 }}>
                Découvrir les activités
              </Button>
            </Box>
          )}
        </Section>

        {/* ═══ MA CELLULE ════════════════════════════════════════ */}
        <Section refE={refs.cellule} id="cellule" titre="ma-cellule" sousTitre="Ton équipe au quotidien" icone={<IcCube taille={17} couleur="#0F5B3A" />}>
          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1.2fr 1fr' }, alignItems: 'start' }}>
            <Box sx={{
              p: { xs: 2.8, md: 3.2 }, bgcolor: '#fff', borderRadius: '18px',
              border: `1.5px solid ${(cellule ?? MA_CELLULE).couleur}45`,
              boxShadow: `0 12px 30px ${(cellule ?? MA_CELLULE).couleur}1E`,
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box sx={{
                  width: 56, height: 56, borderRadius: '16px',
                  background: `linear-gradient(135deg,${(cellule ?? MA_CELLULE).couleur},${(cellule ?? MA_CELLULE).couleur}CC 60%,#0D1B2A)`,
                  display: 'grid', placeItems: 'center',
                  boxShadow: `0 8px 20px ${(cellule ?? MA_CELLULE).couleur}44`,
                }}>
                  <IcCube taille={28} couleur="#fff" />
                </Box>
                <Box>
                  <Typography sx={{ color: (cellule ?? MA_CELLULE).couleurFonce, fontWeight: 800, fontSize: '0.68rem', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                    {(cellule ?? MA_CELLULE).role ?? 'Membre actif'}
                  </Typography>
                  <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: '1.25rem', color: '#111827' }}>
                    {(cellule ?? MA_CELLULE).nom}
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: '0.9rem', mb: 1.5 }}>
                {cellule ? `À propos — ${cellule.membres} membres` : 'Prochaines sessions'}
              </Typography>
              <Box sx={{ display: 'grid', gap: 1.2 }}>
                {(cellule
                  ? [{ date: `${cellule.membres} membres actifs`, sujet: cellule.description }]
                  : MA_CELLULE.prochainesSessions
                ).map((s, i) => (
                  <Box key={i} sx={{ display: 'flex', gap: 1.4, alignItems: 'flex-start', p: 1.6, bgcolor: '#F6FBF9', borderRadius: '12px', border: '1px solid #E3EEE8' }}>
                    <IcCalendrier taille={15} couleur={(cellule ?? MA_CELLULE).couleurFonce} />
                    <Box>
                      <Typography sx={{ fontWeight: 800, color: '#0F5B3A', fontSize: '0.78rem' }}>{s.date}</Typography>
                      <Typography variant="body2" sx={{ color: '#5A6B63', lineHeight: 1.6 }}>{s.sujet}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>

            <Box sx={{ display: 'grid', gap: 2, alignContent: 'start' }}>
              {[
                { label: 'Sessions suivies', valeur: 12, icone: <IcCalendrier taille={20} couleur="#1FAF72" />, couleur: '#1FAF72' },
                { label: 'Activités participées', valeur: 5, icone: <IcTrophee taille={20} couleur="#2563EB" />, couleur: '#2563EB' },
                { label: 'Documents partagés', valeur: 3, icone: <IcDocument taille={20} couleur="#7B61FF" />, couleur: '#7B61FF' },
              ].map((s, i) => (
                <motion.div key={s.label}
                  initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '0px' }}
                  transition={{ delay: 0.1 + i * 0.06, duration: 0.28 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.2, bgcolor: '#fff', borderRadius: '16px', border: '1px solid #E8ECEA' }}>
                    <Box sx={{ width: 46, height: 46, borderRadius: '12px', bgcolor: `${s.couleur}14`, display: 'grid', placeItems: 'center' }}>
                      {s.icone}
                    </Box>
                    <Box>
                      <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: '1.4rem', color: '#111827', lineHeight: 1.2 }}>
                        {s.valeur}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#5A6B63', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.64rem' }}>
                        {s.label}
                      </Typography>
                    </Box>
                  </Box>
                </motion.div>
              ))}
            </Box>
          </Box>
        </Section>

        {/* ═══ MON PROFIL ════════════════════════════════════════ */}
        <Section refE={refs.profil} id="profil" titre="mon-profil" sousTitre="Tes informations" icone={<IcMembres taille={17} couleur="#0F5B3A" />}>
          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, alignItems: 'start' }}>
            <Box sx={{ p: { xs: 2.8, md: 3.2 }, bgcolor: '#fff', borderRadius: '18px', border: '1px solid #E8ECEA' }}>
              <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: '1rem', mb: 2 }}>
                Mes informations
              </Typography>
              {[
                ['Nom', user.nom || '—'],
                ['Email', user.email || 'prenom.nom@emsp.int'],
              ].map(([label, valeur]) => (
                <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 1.4, borderBottom: '1px solid #EEF2F0' }}>
                  <Typography variant="body2" sx={{ color: '#5A6B63', fontWeight: 600 }}>{label}</Typography>
                  <Typography variant="body2" sx={{ color: '#111827', fontWeight: 700, textAlign: 'right', wordBreak: 'break-word' }}>{valeur}</Typography>
                </Box>
              ))}
              <Typography variant="caption" sx={{ display: 'block', mt: 2, color: '#5A6B63', lineHeight: 1.7 }}>
                Pour corriger une information, contacte la Secrétaire Générale — les données viennent de l'annuaire du club.
              </Typography>
            </Box>
            <PreferencesNotifications />

            <Box sx={{ p: { xs: 2.8, md: 3.2 }, bgcolor: '#fff', borderRadius: '18px', border: '1px solid #E8ECEA' }}>
              <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: '1rem', mb: 2 }}>
                Mes rôles & permissions
              </Typography>
              <Box sx={{ display: 'grid', gap: 1.2 }}>
                {(user.roles ?? []).map((r) => {
                  const I = iconePoste(libellesRoles[r.code] ?? '')
                  return (
                    <Box key={r.code} sx={{ display: 'flex', alignItems: 'center', gap: 1.6, p: 1.6, bgcolor: '#F6FBF9', borderRadius: '12px', border: '1px solid #E3EEE8' }}>
                      <Box sx={{ width: 38, height: 38, borderRadius: '10px', bgcolor: '#0F5B3A14', display: 'grid', placeItems: 'center' }}>
                        <I taille={18} couleur="#0F5B3A" />
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: '0.86rem' }}>
                          {libellesRoles[r.code] ?? r.code}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#5A6B63', fontWeight: 600, fontFamily: "'JetBrains Mono',monospace" }}>
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
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        style={{ position: 'fixed', bottom: 14, left: 14, right: 102, zIndex: 1100 }}
      >
        <Box sx={{
          display: { xs: 'none', lg: 'flex' }, alignItems: 'center', gap: 2.5,
          bgcolor: 'rgba(13,27,42,.72)', backdropFilter: 'blur(14px)',
          border: '1px solid rgba(154,251,215,.16)', borderRadius: '12px',
          px: 2, py: 0.9,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.9 }}>
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ width: 7, height: 7, borderRadius: '50%', background: '#1FAF72' }}
            />
            <Typography sx={{ color: '#9AFBD7', fontSize: '0.68rem', fontFamily: "'JetBrains Mono',monospace", fontWeight: 600 }}>
              section: {sectionActive}
            </Typography>
          </Box>
          <Typography sx={{ color: 'rgba(255,255,255,.6)', fontSize: '0.66rem', fontFamily: "'JetBrains Mono',monospace" }}>
            rôle: {(user.roles ?? []).map((r) => r.code).join(' · ') || '—'}
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,.6)', fontSize: '0.66rem', fontFamily: "'JetBrains Mono',monospace", ml: 'auto' }}>
            <Horloge /> · itclub@espace
          </Typography>
        </Box>
      </motion.div>
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
    <Box sx={{ p: { xs: 2.8, md: 3.2 }, bgcolor: '#fff', borderRadius: '18px', border: '1px solid #E8ECEA', gridColumn: { md: '1 / -1' } }}>
      <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: '1rem', mb: 0.5 }}>
        Notifications par email
      </Typography>
      <Typography variant="caption" sx={{ color: '#5A6B63', display: 'block', mb: 1.5 }}>
        {prefs === null ? 'Chargement…' : 'Choisis ce que tu veux recevoir — le reste reste visible ici.'}
      </Typography>
      {LIGNES.map(([cle, titre, aide]) => (
        <Box key={cle} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.2, borderBottom: '1px solid #EEF2F0' }}>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 700, color: '#111827', fontSize: '0.86rem' }}>{titre}</Typography>
            <Typography variant="caption" sx={{ color: '#5A6B63' }}>{aide}</Typography>
          </Box>
          <Switch checked={prefs?.[cle] ?? true} onChange={() => basculer(cle)} disabled={prefs === null}
            sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#1FAF72' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#1FAF72' } }} />
        </Box>
      ))}
      {sauve && (
        <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: sauve.startsWith('Hors') ? '#B45309' : '#0E7A50', fontWeight: 700 }}>
          {sauve}
        </Typography>
      )}
    </Box>
  )
}

/* ── Section avec en-tête façon terminal ────────────────────── */
function Section({ refE, id, titre, sousTitre, icone, children }) {
  return (
    <Box ref={refE} data-section={id} sx={{ scrollMarginTop: 90, mb: { xs: 5, md: 7 } }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.4, mb: 2.5 }}>
        <Typography sx={{ color: '#1FAF72', fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: '0.8rem' }}>
          0{['notifications', 'inscriptions', 'cellule', 'profil'].indexOf(id) + 1}_
        </Typography>
        <Typography sx={{ color: '#fff', fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: { xs: '1.05rem', md: '1.25rem' }, display: 'flex', alignItems: 'center', gap: 1.2 }}>
          {icone} {titre}
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,.55)', fontSize: '0.72rem', fontFamily: "'JetBrains Mono',monospace", ml: 'auto', display: { xs: 'none', sm: 'block' } }}>
          // {sousTitre}
        </Typography>
      </Box>
      <Box sx={{
        bgcolor: '#fff', borderRadius: '18px', border: '1px solid #E8ECEA',
        boxShadow: '0 10px 30px rgba(0,0,0,.3)', overflow: 'hidden',
      }}>
        {children}
      </Box>
    </Box>
  )
}
