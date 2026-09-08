import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import MenuIcon from '@mui/icons-material/Menu'
import LoginIcon from '@mui/icons-material/Login'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import useScrollTrigger from '@mui/material/useScrollTrigger'
import { useAuth } from '../../stores/auth'

const liens = [
  { label: 'Le club', cible: 'club' },
  { label: 'Qui sommes-nous', cible: 'qui-sommes-nous' },
  { label: 'Bureau', cible: 'bureau' },
  { label: 'Cellules', cible: 'cellules' },
  { label: 'Activités', cible: 'activites' },
  { label: 'Actualités', cible: 'actualites' },
  { label: 'Documentation', cible: 'documentation' },
  { label: 'Galerie', cible: '/galerie', route: true },
  { label: 'Forum', cible: '/forum', route: true, membres: true },
  { label: 'Sondages', cible: '/sondages', route: true, membres: true },
  { label: 'Veille', cible: '/veille', route: true, membres: true },
]

// Liens principaux (toujours visibles) et liens regroupés (menu déroulant)
// Sondages/Veille (membres) n'apparaissent que si connecté — à ce moment-là
// le bouton Rejoindre est caché, donc la place est libre.
const LIENS_PRINCIPAUX = ['Le club', 'Activités', 'Galerie', 'Sondages', 'Veille']
const plusDe = (u) => liens.filter((l) => !LIENS_PRINCIPAUX.includes(l.label) && (!l.membres || u))

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const surAccueil = location.pathname === '/'
  const [open, setOpen] = useState(false)
  const [menuPlus, setMenuPlus] = useState(null)
  const scrolled = useScrollTrigger({ disableHysteresis: true, threshold: 80 })
  const user = useAuth((s) => s.user)
  const actif = (l) => (l.route ? location.pathname.startsWith(l.cible) : false)

  // Ancres : depuis une autre page, naviguer vers / puis scroller après rendu
  const allerVers = (cible) => {
    if (surAccueil) {
      document.getElementById(cible)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      navigate('/')
      setTimeout(() => {
        document.getElementById(cible)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 350)
    }
  }

  return (
    <AppBar
      position="fixed"
      elevation={scrolled ? 4 : 0}
      sx={{
        bgcolor: scrolled ? 'rgba(255,255,255,.97)' : 'transparent',
        backgroundImage: scrolled ? 'none' : 'linear-gradient(180deg, rgba(13,27,42,.62) 0%, rgba(13,27,42,.28) 60%, rgba(13,27,42,0) 100%)',
        color: scrolled ? '#0D1B2A' : '#fff',
        transition: 'background .35s ease',
        py: scrolled ? 0 : 1,
        boxShadow: scrolled ? undefined : 'none',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <motion.a
          href="/"
          onClick={(e) => { e.preventDefault(); navigate('/') }}
          style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit', minWidth: 0 }}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.32 }}
        >
          <Box
            component="img"
            src="/logo-itclub.webp"
            alt="Logo IT-CLUB EMSP"
            sx={{ width: 42, height: 42, borderRadius: 2, objectFit: 'cover', border: '2px solid #1FAF72', flexShrink: 0 }}
          />
          <Box sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: { xs: 15, lg: 16, xl: 17 }, whiteSpace: 'nowrap' }}>
            IT-CLUB <span style={{ color: scrolled ? '#1FAF72' : '#9AFBD7' }}>EMSP</span>
          </Box>
        </motion.a>

        <Box sx={{ display: { xs: 'none', lg: 'flex' }, gap: 0.25, alignItems: 'center', flexShrink: 1, minWidth: 0 }}>
          {liens.filter((l) => LIENS_PRINCIPAUX.includes(l.label) && (!l.membres || user)).map((l) => (
            <Button key={l.cible} color="inherit"
              href={l.route ? l.cible : `/#${l.cible}`}
              onClick={(e) => { e.preventDefault(); l.route ? navigate(l.cible) : allerVers(l.cible) }}
              sx={{
                position: 'relative', fontWeight: 600, fontSize: { lg: '0.82rem', xl: '0.9rem' }, px: { lg: 1, xl: 1.25 },
                whiteSpace: 'nowrap',
                '&::after': {
                  content: '""', position: 'absolute', bottom: 4, left: '50%',
                  width: 0, height: 2, borderRadius: 2, bgcolor: '#1FAF72',
                  transform: 'translateX(-50%)', transition: 'width 220ms cubic-bezier(0.22,1,0.36,1)',
                },
                '&:hover::after': { width: '55%' },
              }}>
              {l.label}
            </Button>
          ))}
          {/* Regroupés : tout le reste dans un menu déroulant */}
          <Button color="inherit"
            onClick={(e) => setMenuPlus(e.currentTarget)}
            endIcon={<ExpandMoreIcon sx={{ transition: 'transform 200ms ease', rotate: menuPlus ? '180deg' : '0deg' }} />}
            sx={{
              fontWeight: 600, fontSize: { lg: '0.82rem', xl: '0.9rem' }, px: { lg: 1, xl: 1.25 },
              whiteSpace: 'nowrap',
              color: plusDe(user).some((l) => actif(l)) ? '#1FAF72' : 'inherit',
            }}>
            Plus
          </Button>
          <Menu
            anchorEl={menuPlus}
            open={!!menuPlus}
            onClose={() => setMenuPlus(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{ paper: { sx: { mt: 1, borderRadius: '14px', border: '1px solid #E8ECEA', boxShadow: '0 16px 40px rgba(13,27,42,.14)', minWidth: 210, py: 0.6 } } }}
          >
            {plusDe(user).map((l) => (
              <MenuItem key={l.cible}
                onClick={() => { setMenuPlus(null); l.route ? navigate(l.cible) : allerVers(l.cible) }}
                sx={{
                  fontWeight: 600, fontSize: '0.88rem', py: 1,
                  color: actif(l) ? '#0E7A50' : '#111827',
                  bgcolor: actif(l) ? '#E4F8EF' : 'transparent',
                  '&:hover': { bgcolor: '#F6FBF9' },
                }}>
                {l.label}
              </MenuItem>
            ))}
          </Menu>
          {!user && (
            <Button
              variant="contained"
              href="/adhesion"
              sx={{ bgcolor: '#1FAF72', color: '#fff', '&:hover': { bgcolor: '#179963' }, ml: { lg: 0.5, xl: 1 }, transition: 'background 200ms ease, box-shadow 200ms ease', whiteSpace: 'nowrap', px: { lg: 1.4, xl: 2 } }}
            >
              Rejoindre le club
            </Button>
          )}
          {/* Connexion / Espace selon l'état */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} sx={{ flexShrink: 0 }}>
            <Button
              href={user ? '/espace' : '/login'}
              startIcon={<LoginIcon />}
              sx={{
                color: scrolled ? '#0F5B3A' : '#9AFBD7',
                fontWeight: 800,
                border: '1.5px solid',
                borderColor: scrolled ? 'rgba(15,91,58,.35)' : 'rgba(154,251,215,.5)',
                borderRadius: 6,
                whiteSpace: 'nowrap',
                px: { lg: 1.2, xl: 1.6 },
              }}
            >
              {user ? 'Mon espace' : 'Connexion'}
            </Button>
          </motion.div>
        </Box>

        <IconButton
          sx={{ display: { xs: 'block', lg: 'none' }, color: 'inherit', border: '1px solid rgba(154,251,215,.16)', width: 44, height: 44 }}
          aria-label="Ouvrir le menu"
          onClick={() => setOpen(true)}
        >
          <MenuIcon />
        </IconButton>

        <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
          <List sx={{ width: 250, pt: 2 }} onClick={() => setOpen(false)}>
            {liens.filter((l) => !l.membres || user).map((l) => (
              <ListItemButton key={l.cible} component="a"
                href={l.route ? l.cible : '#'}
                onClick={(e) => { if (!l.route) { e.preventDefault(); allerVers(l.cible) } }}
                sx={{ borderRadius: 2 }}>
                <ListItemText primary={l.label} primaryTypographyProps={{ fontWeight: 600, fontSize: '0.92rem' }} />
              </ListItemButton>
            ))}
            {!user && (
              <ListItemButton component="a" href="/adhesion" sx={{ borderRadius: 2, fontWeight: 700, color: '#0F5B3A' }}>
                Rejoindre le club
              </ListItemButton>
            )}
            <ListItemButton
              component="a"
              href={user ? '/espace' : '/login'}
              sx={{ borderRadius: 2, fontWeight: 800, color: '#fff', bgcolor: '#0F5B3A', mt: 1 }}
            >
              {user ? 'Mon espace' : 'Connexion'}
            </ListItemButton>
          </List>
        </Drawer>
      </Toolbar>
    </AppBar>
  )
}
