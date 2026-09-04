import { useState, useEffect } from 'react'
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Avatar from '@mui/material/Avatar'
import Container from '@mui/material/Container'
import Tooltip from '@mui/material/Tooltip'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'
import HomeIcon from '@mui/icons-material/Home'
import { useAuth } from '../../stores/auth'
import { modulesPour, iconeModule } from '../../data/backoffice'
import TachesNotion from './TachesNotion'
import EditeurFormulaire from './EditeurFormulaire'
import GestionContenu from './GestionContenu'
import RegistreMembres from './RegistreMembres'
import ComptesRendus from './ComptesRendus'
import Presences from './Presences'

/**
 * Back-office — EXPERIENCE, pas un panneau d'admin :
 *   • Dock flottant vertical à droite (macOS-like, glassmorphism marine)
 *   • Hub d'accueil plein écran : grille des modules façon "sélecteur de mission"
 *   • Contenu en pleine largeur SANS sidebar — l'espace appartient au module
 *   • Barre de statut basse façon IDE (module actif, breadcrumb, heure)
 *   • Transitions wipe vertical entre modules
 * Tablette : dock horizontal en bas. Mobile : drawer plein écran.
 */

const DOCK_W = 74

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

export default function BackofficeLayout() {
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)
  const modules = modulesPour(user)
  const location = useLocation()
  const [menuMobile, setMenuMobile] = useState(false)

  const moduleActif = modules.find((m) => location.pathname.includes(m.path))

  const DockBoutons = ({ onNavigate }) => (
    <>
      {modules.map((m) => {
        const I = m.Icone ?? iconeModule(m.path)
        const actif = location.pathname.includes(m.path)
        return (
          <Tooltip key={m.path} title={m.label} placement="left" arrow enterDelay={400} enterNextDelay={200}>
            <motion.div whileHover={{ scale: 1.14, y: -2 }} whileTap={{ scale: 0.92 }}>
              <IconButton
                component={NavLink}
                to={`/backoffice/${m.path}`}
                onClick={onNavigate}
                aria-label={m.label}
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
                <I size={21} color="currentColor" strokeWidth={1.8} />
              </IconButton>
            </motion.div>
          </Tooltip>
        )
      })}
    </>
  )

  return (
    <Box sx={{
      minHeight: '100vh', position: 'relative',
      background: 'linear-gradient(160deg,#0A1628 0%,#0D1B2A 55%,#0F5B3A 140%)',
    }}>
      {/* ── Grille tech de fond ─────────────────────────────── */}
      <Box sx={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(154,251,215,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(154,251,215,.045) 1px, transparent 1px)',
        backgroundSize: '44px 44px',
        maskImage: 'radial-gradient(ellipse at 50% 30%, black 20%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse at 50% 30%, black 20%, transparent 80%)',
      }} aria-hidden />

      {/* ── Topbar minimaliste flottante ────────────────────── */}
      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: 'fixed', top: 14, left: 14, right: { xs: 74, md: DOCK_W + 28 }, zIndex: 1200 }}
      >
        <Box sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          bgcolor: 'rgba(13,27,42,.72)', backdropFilter: 'blur(14px)',
          border: '1px solid rgba(154,251,215,.18)', borderRadius: '16px',
          px: { xs: 1.5, md: 2.2 }, py: 1,
          boxShadow: '0 10px 30px rgba(0,0,0,.35)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.4, minWidth: 0 }}>
            <IconButton size="small" onClick={() => setMenuMobile(true)} sx={{ display: { md: 'none' }, color: '#9AFBD7' }}>
              <MenuIcon fontSize="small" />
            </IconButton>
            <Box component="img" src="/logo-itclub.webp" alt="" sx={{ width: 30, height: 30, borderRadius: 1, objectFit: 'cover' }} />
            <Typography noWrap sx={{ color: '#fff', fontWeight: 800, fontSize: { xs: '0.78rem', md: '0.9rem' }, fontFamily: "'Orbitron',sans-serif" }}>
              EMSP<span style={{ color: '#1FAF72' }}>://</span>
              <span style={{ color: '#9AFBD7', fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, fontSize: '0.8rem' }}>
                {moduleActif ? moduleActif.path : 'home'}
              </span>
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <Typography sx={{ display: { xs: 'none', sm: 'block' }, color: 'rgba(255,255,255,.5)', fontSize: '0.72rem', fontFamily: "'JetBrains Mono',monospace" }}>
              <Horloge />
            </Typography>
            <Button href="/" size="small" startIcon={<HomeIcon sx={{ fontSize: 17 }} />}
              sx={{ color: '#9AFBD7', fontWeight: 700, fontSize: '0.78rem', display: { xs: 'none', sm: 'inline-flex' } }}>
              Site
            </Button>
            <Avatar sx={{ width: 32, height: 32, bgcolor: '#1FAF72', fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: 14, border: '2px solid rgba(154,251,215,.4)' }}>
              {(user?.nom || 'M')[0]}
            </Avatar>
            <IconButton size="small" onClick={() => { if (window.confirm('Se déconnecter du back-office ?')) logout() }} aria-label="Déconnexion"
              sx={{ color: '#fff', border: '1px solid rgba(255,255,255,.3)', borderRadius: '10px', px: 1.2 }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </motion.div>

      {/* ── DOCK vertical flottant (desktop/tablette) ───────── */}
      <motion.div
        initial={{ x: 60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: 'fixed', right: 14, top: '50%', transform: 'translateY(-50%)', zIndex: 1200 }}
      >
        <Box sx={{
          display: { xs: 'none', md: 'flex' }, flexDirection: 'column', alignItems: 'center', gap: 1,
          bgcolor: 'rgba(13,27,42,.78)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(154,251,215,.2)', borderRadius: '20px',
          px: 1.2, py: 2,
          boxShadow: '0 14px 40px rgba(0,0,0,.4)',
          maxHeight: '78vh', overflowY: 'auto',
          '&::-webkit-scrollbar': { width: 0 },
        }}>
          <DockBoutons />
        </Box>
      </motion.div>

      {/* ── DOCK horizontal bas (mobile) ────────────────────── */}
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: 'fixed', bottom: 12, left: 12, right: 12, zIndex: 1200 }}
      >
        <Box sx={{
          display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1,
          bgcolor: 'rgba(13,27,42,.82)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(154,251,215,.2)', borderRadius: '18px',
          px: 1.4, py: 1.1,
          boxShadow: '0 14px 40px rgba(0,0,0,.45)',
          overflowX: 'auto', '&::-webkit-scrollbar': { height: 0 },
        }}>
          {(modules.map((m) => {
            const I = m.Icone ?? iconeModule(m.path)
            const actif = location.pathname.includes(m.path)
            return (
              <IconButton key={m.path} component={NavLink} to={`/backoffice/${m.path}`} aria-label={m.label}
                sx={{
                  minWidth: 44, height: 44, borderRadius: '12px', flexShrink: 0,
                  color: actif ? '#fff' : '#9AFBD7',
                  bgcolor: actif ? '#1FAF72' : 'rgba(154,251,215,.08)',
                  border: actif ? '1px solid rgba(255,255,255,.35)' : '1px solid rgba(154,251,215,.15)',
                }}>
                <I size={20} color="currentColor" strokeWidth={1.8} />
              </IconButton>
            )
          }))}
        </Box>
      </motion.div>

      {/* ── Drawer plein écran (menu mobile complet avec labels) ── */}
      <AnimatePresence>
        {menuMobile && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 1400, background: 'rgba(10,22,40,.92)', backdropFilter: 'blur(14px)' }}
            onClick={() => setMenuMobile(false)}
          >
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 'min(340px, 88vw)', background: '#0D1B2A', borderLeft: '1px solid rgba(154,251,215,.2)', overflowY: 'auto' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2.5, borderBottom: '1px solid rgba(154,251,215,.15)' }}>
                <Typography sx={{ color: '#9AFBD7', fontFamily: "'JetBrains Mono',monospace", fontSize: '0.8rem' }}>
                  modules/
                </Typography>
                <IconButton size="small" onClick={() => setMenuMobile(false)} sx={{ color: '#9AFBD7' }}><CloseIcon /></IconButton>
              </Box>
              <Box sx={{ p: 1.5 }}>
                {modules.map((m, i) => {
                  const I = m.Icone ?? iconeModule(m.path)
                  const actif = location.pathname.includes(m.path)
                  return (
                    <motion.div key={m.path}
                      initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.04 * i, duration: 0.28 }}>
                      <Button component={NavLink} to={`/backoffice/${m.path}`} onClick={() => setMenuMobile(false)} fullWidth
                        sx={{
                          justifyContent: 'flex-start', gap: 2, py: 1.7, mb: 0.6,
                          borderRadius: '14px', textAlign: 'left', px: 2.2,
                          color: actif ? '#fff' : 'rgba(255,255,255,.8)',
                          bgcolor: actif ? '#1FAF72' : 'rgba(154,251,215,.06)',
                          fontWeight: 700, fontSize: '0.92rem',
                          '&:hover': { bgcolor: actif ? '#25C482' : 'rgba(154,251,215,.14)' },
                        }}>
                        <I size={20} color={actif ? '#fff' : '#9AFBD7'} strokeWidth={1.8} />
                        {m.label}
                      </Button>
                    </motion.div>
                  )
                })}
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(154,251,215,.15)', display: 'grid', gap: 0.8 }}>
                  <Button href="/" fullWidth startIcon={<HomeIcon />}
                    sx={{ justifyContent: 'flex-start', color: '#9AFBD7', fontWeight: 700, py: 1.4 }}>
                    Retour au site
                  </Button>
                  <Button onClick={logout} fullWidth sx={{ justifyContent: 'flex-start', color: '#fff', fontWeight: 700, py: 1.4, border: '1px solid rgba(255,255,255,.25)', borderRadius: '12px' }}>
                    Déconnexion
                  </Button>
                </Box>
              </Box>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CONTENU plein écran (sans sidebar !) ────────────── */}
      <Container maxWidth={false} sx={{
        position: 'relative', maxWidth: '1280px !important',
        px: { xs: 2, md: 4 }, pt: { xs: 10, md: 12 }, pb: { xs: 14, lg: 8 },
        minHeight: '100vh',
      }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 26, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -18, filter: 'blur(4px)' }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <Routes location={location}>
              <Route index element={<Navigate to={modules[0]?.path ?? '/espace'} replace />} />
              {modules.map((m) => (
                <Route key={m.path} path={m.path}
                  element={
                    m.path === 'taches-notion' ? <TachesNotion /> :
                    m.path === 'formulaire' ? <EditeurFormulaire /> :
                    m.path === 'contenu' ? <GestionContenu /> :
                    m.path === 'registre-membres' ? <RegistreMembres /> :
                    m.path === 'comptes-rendus' ? <ComptesRendus /> :
                    m.path === 'evenements' ? <Presences /> :
                    <PlaceholderModule module={m} />
                  } />
              ))}
            </Routes>
          </motion.div>
        </AnimatePresence>
      </Container>

      {/* ── Barre de statut basse façon IDE (desktop) ───────── */}
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        style={{ position: 'fixed', bottom: 14, left: 14, right: DOCK_W + 28, zIndex: 1100 }}
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
              {moduleActif ? `module: ${moduleActif.path}` : 'ready'}
            </Typography>
          </Box>
          <Typography sx={{ color: 'rgba(255,255,255,.6)', fontSize: '0.66rem', fontFamily: "'JetBrains Mono',monospace" }}>
            rôle: {(user?.roles ?? []).map((r) => r.code).join(' · ') || '—'}
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,.6)', fontSize: '0.66rem', fontFamily: "'JetBrains Mono',monospace", ml: 'auto' }}>
            itclub@emsp
          </Typography>
        </Box>
      </motion.div>
    </Box>
  )
}

/* ── Placeholder : carte module façon fiche de mission ─────── */
function PlaceholderModule({ module: m }) {
  const I = m.Icone ?? iconeModule(m.path)
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <Box sx={{
        p: { xs: 3, md: 5 }, bgcolor: 'rgba(255,255,255,.97)', borderRadius: '24px',
        border: '1px solid rgba(154,251,215,.3)', boxShadow: '0 24px 60px rgba(0,0,0,.35)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* filigrane icône géante */}
        <I size={220} color="#1FAF72" strokeWidth={0.5} style={{ position: 'absolute', right: -50, top: -50, opacity: 0.06 }} />
        <Box sx={{ position: 'relative' }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 1.6, py: 0.5, borderRadius: 9999, bgcolor: '#E4F8EF', mb: 2 }}>
            <motion.span animate={{ opacity: [1, 0.35, 1] }} transition={{ duration: 2, repeat: Infinity }}
              style={{ width: 7, height: 7, borderRadius: '50%', background: '#1FAF72' }} />
            <Typography sx={{ color: '#0B7A4B', fontWeight: 800, fontSize: '0.62rem', letterSpacing: '0.16em', fontFamily: "'JetBrains Mono',monospace" }}>
              MODULE_CHARGÉ
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.2, mb: 2 }}>
            <Box sx={{
              width: 58, height: 58, borderRadius: '16px',
              background: 'linear-gradient(135deg,#1FAF72,#0F5B3A)',
              display: 'grid', placeItems: 'center',
              boxShadow: '0 10px 24px rgba(31,175,114,.4)',
            }}>
              <I size={28} color="#fff" strokeWidth={1.8} />
            </Box>
            <Box>
              <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: { xs: '1.35rem', md: '1.7rem' }, color: '#111827', lineHeight: 1.2 }}>
                {m.label}
              </Typography>
              <Typography variant="body2" sx={{ color: '#5A6B63', lineHeight: 1.75, maxWidth: 560, mt: 0.5 }}>
                {m.desc}
              </Typography>
            </Box>
          </Box>
          {/* Spec façon doc de code */}
          <Box sx={{
            mt: 3, p: 2.2, borderRadius: '12px', bgcolor: '#0D1B2A',
            border: '1px solid rgba(154,251,215,.2)',
            fontFamily: "'JetBrains Mono',monospace", fontSize: '0.76rem', lineHeight: 2,
          }}>
            {[
              ['écrans', 'conçus — design système du club', '#28C840'],
              ['api', 'contrat doc 04 — backend Django requis', '#FEBC2E'],
              ['permissions', m.roles.join(' · '), '#9AFBD7'],
            ].map(([cle, val, coul]) => (
              <Box key={cle} sx={{ display: 'flex', gap: 1.4 }}>
                <Typography component="span" sx={{ color: '#1FAF72', fontFamily: 'inherit', fontSize: 'inherit', minWidth: 110 }}>
                  {cle}:
                </Typography>
                <Typography component="span" sx={{ color: coul, fontFamily: 'inherit', fontSize: 'inherit' }}>
                  {val}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </motion.div>
  )
}
