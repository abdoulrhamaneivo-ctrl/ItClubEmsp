import { useState } from 'react'
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Toolbar from '@mui/material/Toolbar'
import AppBar from '@mui/material/AppBar'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import MenuIcon from '@mui/icons-material/Menu'
import Avatar from '@mui/material/Avatar'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import { useAuth, hasRole } from '../../stores/auth'
import { modulesPour, modulesBackoffice, iconeModule } from '../../data/backoffice'
import TachesNotion from './TachesNotion'
import EditeurFormulaire from './EditeurFormulaire'
import GestionContenu from './GestionContenu'

/**
 * Back-office — mise en page experte :
 * AppBar marine + drawer permanent desktop / temporaire mobile (swipe),
 * icône par module (matching libellé poste), transitions de pages animées,
 * écrans placeholder utiles (roadmap du module + statut API).
 */

const drawerWidth = 264

function IconeModule({ path, couleur = '#0F5B3A', taille = 19 }) {
  const I = iconeModule(path)
  return <I size={taille} color={couleur} strokeWidth={1.8} />
}

export default function BackofficeLayout() {
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)
  const modules = modulesPour(user)
  const location = useLocation()
  const [drawerMobile, setDrawerMobile] = useState(false)

  const drawerContenu = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ px: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.4 }}>
          <Box component="img" src="/logo-itclub.jpg" alt="" sx={{ width: 38, height: 38, borderRadius: 1.5, objectFit: 'cover' }} />
          <Box>
            <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: '0.88rem', color: '#0D1B2A', lineHeight: 1.2 }}>
              Back-office
            </Typography>
            <Typography variant="caption" sx={{ color: '#5A6B63', fontWeight: 700, fontSize: '0.62rem', letterSpacing: '0.08em' }}>
              IT-CLUB EMSP
            </Typography>
          </Box>
        </Box>
      </Toolbar>
      <Divider />
      <List sx={{ px: 1, py: 1.5, flex: 1, overflowY: 'auto' }}>
        {modules.map((m, i) => (
          <motion.div
            key={m.path}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(i * 0.03, 0.25), duration: 0.25 }}
          >
            <ListItemButton
              component={NavLink}
              to={`/backoffice/${m.path}`}
              sx={{
                borderRadius: 2, mb: 0.4, py: 1.2,
                '&.active': {
                  bgcolor: '#0F5B3A',
                  color: '#fff',
                  '& .MuiListItemIcon-root': { color: '#9AFBD7' },
                  '& .MuiListItemText-primary': { color: '#fff', fontWeight: 800 },
                  boxShadow: '0 6px 16px rgba(15,91,58,.3)',
                },
                '&:hover': { bgcolor: '#EDF7F1', '& .MuiListItemIcon-root': { color: '#0F5B3A' } },
                '&.active:hover': { bgcolor: '#0c4a2f' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <IconeModule path={m.path} />
              </ListItemIcon>
              <ListItemText primary={m.label} primaryTypographyProps={{ fontWeight: 700, fontSize: '0.88rem' }} />
            </ListItemButton>
          </motion.div>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 1.5 }}>
        <ListItemButton component="a" href="/espace" sx={{ borderRadius: 2, py: 1.1 }}>
          <ListItemIcon sx={{ minWidth: 40 }}><IconeModule path="dashboard" taille={18} couleur="#5A6B63" /></ListItemIcon>
          <ListItemText primary="Mon espace" primaryTypographyProps={{ fontWeight: 700, fontSize: '0.85rem' }} />
        </ListItemButton>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F6F8F7' }}>
      {/* ── AppBar ─────────────────────────────────────────────── */}
      <AppBar position="fixed" sx={{
        zIndex: (t) => t.zIndex.drawer + 1,
        bgcolor: 'rgba(13,27,42,.94)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(154,251,215,.18)',
      }}>
        <Toolbar sx={{ justifyContent: 'space-between', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton color="inherit" edge="start" onClick={() => setDrawerMobile(true)}
              sx={{ display: { md: 'none' }, mr: 0.5 }}>
              <MenuIcon />
            </IconButton>
            <Typography noWrap sx={{ color: '#fff', fontWeight: 800, fontSize: '1rem', fontFamily: "'Orbitron',sans-serif" }}>
              Back-office <Box component="span" sx={{ color: '#9AFBD7' }}>EMSP</Box>
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <Avatar sx={{ width: 34, height: 34, bgcolor: '#1FAF72', fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: 15 }}>
              {(user?.nom || 'M')[0]}
            </Avatar>
            <Button color="inherit" href="/espace" sx={{ color: '#9AFBD7', fontWeight: 700, display: { xs: 'none', sm: 'inline-flex' } }}>
              Mon espace
            </Button>
            <Button onClick={logout} size="small" sx={{
              color: '#fff', fontWeight: 700, minWidth: 44,
              border: '1px solid rgba(255,255,255,.3)', borderRadius: 6,
            }}>
              Quitter
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* ── Drawer permanent (desktop) ─────────────────────────── */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth, flexShrink: 0,
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', bgcolor: '#FBFDFC', borderRight: '1px solid #E8ECEA' },
        }}
      >
        {drawerContenu}
      </Drawer>

      {/* ── Drawer temporaire (mobile) ─────────────────────────── */}
      <Drawer
        variant="temporary"
        open={drawerMobile}
        onClose={() => setDrawerMobile(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: 280, boxSizing: 'border-box', bgcolor: '#FBFDFC' },
        }}
      >
        {drawerContenu}
      </Drawer>

      {/* ── Contenu principal ──────────────────────────────────── */}
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 4 }, minWidth: 0 }}>
        <Toolbar />
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <Routes location={location}>
              <Route index element={<Navigate to={modules[0]?.path ?? '/espace'} replace />} />
              {modules.map((m) => (
                <Route key={m.path} path={m.path}
                  element={
                    m.path === 'taches-notion' ? <TachesNotion /> :
                    m.path === 'formulaire' ? <EditeurFormulaire /> :
                    m.path === 'contenu' ? <GestionContenu /> :
                    <PlaceholderModule titre={m.label} desc={m.desc} roles={m.roles} path={m.path} />
                  } />
              ))}
            </Routes>
          </motion.div>
        </AnimatePresence>
      </Box>
    </Box>
  )
}

/* ── Placeholder utile : roadmap du module + statut ─────────── */
function PlaceholderModule({ titre, desc, roles, path }) {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 1, md: 2 } }}>
      <Box sx={{
        p: { xs: 3, md: 4.5 }, bgcolor: '#fff', borderRadius: '20px',
        border: '1px solid #E8ECEA', boxShadow: '0 6px 20px rgba(15,91,58,.06)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
          <Box sx={{
            width: 52, height: 52, borderRadius: '14px',
            background: 'linear-gradient(135deg,#1FAF72,#0F5B3A)',
            display: 'grid', placeItems: 'center',
            boxShadow: '0 8px 20px rgba(31,175,114,.35)',
          }}>
            <IconeModule path={path} couleur="#fff" taille={24} />
          </Box>
          <Box>
            <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: { xs: '1.2rem', md: '1.5rem' }, color: '#111827' }}>
              {titre}
            </Typography>
            <Typography variant="body2" sx={{ color: '#5A6B63', lineHeight: 1.7, maxWidth: 560 }}>
              {desc}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2.5 }} />

        <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: '0.9rem', mb: 1.5 }}>
          Feuille de route du module
        </Typography>
        <Box sx={{ display: 'grid', gap: 1.2 }}>
          {[
            ['Écrans & interactions', 'Conçu — arrives avec le design système du club'],
            ['API & données', 'Contrat prêt (doc 04) — s\'active avec le backend Django'],
            ['Permissions', `Déjà filtrées par rôle (${roles.join(', ')})`],
          ].map(([titreLigne, texte], i) => (
            <Box key={i} sx={{ display: 'flex', gap: 1.6, alignItems: 'flex-start', p: 1.8, bgcolor: '#F6FBF9', borderRadius: '12px', border: '1px solid #E3EEE8' }}>
              <Box sx={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                bgcolor: '#1FAF72', color: '#fff', fontWeight: 800, fontSize: '0.7rem',
                display: 'grid', placeItems: 'center', mt: 0.1,
              }}>
                {i + 1}
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 800, color: '#0F5B3A', fontSize: '0.8rem' }}>{titreLigne}</Typography>
                <Typography variant="body2" sx={{ color: '#5A6B63', lineHeight: 1.65 }}>{texte}</Typography>
              </Box>
            </Box>
          ))}
        </Box>

        {/* Terminal signature du club */}
        <Box sx={{
          mt: 3, borderRadius: '12px', overflow: 'hidden',
          bgcolor: '#0D1B2A', border: '1px solid rgba(154,251,215,.25)',
          boxShadow: '0 10px 26px rgba(13,27,42,.3)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, px: 1.6, py: 1, bgcolor: 'rgba(255,255,255,.06)' }}>
            {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
              <Box key={c} sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: c }} />
            ))}
            <Typography sx={{ ml: 1, color: 'rgba(255,255,255,.5)', fontSize: '0.66rem', fontFamily: "'JetBrains Mono',monospace" }}>
              itclub@emsp:~
            </Typography>
          </Box>
          <Box sx={{ p: 2, fontFamily: "'JetBrains Mono',monospace", fontSize: '0.74rem', lineHeight: 1.9 }}>
            <Typography component="div" sx={{ color: '#9AFBD7', fontFamily: 'inherit', fontSize: 'inherit' }}>
              <span style={{ color: '#1FAF72' }}>$</span> npm run module -- {path}
            </Typography>
            <Typography component="div" sx={{ color: 'rgba(255,255,255,.45)', fontFamily: 'inherit', fontSize: 'inherit' }}>
              → design système du club : <span style={{ color: '#FEBC2E' }}>prêt</span>
            </Typography>
            <Typography component="div" sx={{ color: 'rgba(255,255,255,.45)', fontFamily: 'inherit', fontSize: 'inherit' }}>
              → contrat API doc 04 : <span style={{ color: '#FEBC2E' }}>en attente du backend Django</span>
            </Typography>
            <Typography component="div" sx={{ color: 'rgba(255,255,255,.45)', fontFamily: 'inherit', fontSize: 'inherit' }}>
              → permissions {roles.join(' · ')} : <span style={{ color: '#28C840' }}>actives</span>
            </Typography>
            <motion.div
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: 'steps(1)' }}
              style={{ display: 'inline-block', width: 7, height: 13, bgcolor: '#1FAF72', background: '#1FAF72', marginTop: 4 }}
            />
          </Box>
        </Box>
      </Box>
    </Container>
  )
}
