import { useState } from 'react'
import { motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
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
]

export default function Navbar() {
  const location = useLocation()
  const surAccueil = location.pathname === '/'
  const [open, setOpen] = useState(false)
  const scrolled = useScrollTrigger({ disableHysteresis: true, threshold: 80 })
  const user = useAuth((s) => s.user)

  return (
    <AppBar
      position="fixed"
      elevation={scrolled ? 4 : 0}
      sx={{
        bgcolor: scrolled ? 'rgba(255,255,255,.92)' : 'transparent',
        backgroundImage: scrolled ? 'none' : 'linear-gradient(180deg, rgba(13,27,42,.62) 0%, rgba(13,27,42,.28) 60%, rgba(13,27,42,0) 100%)',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        color: scrolled ? '#0D1B2A' : '#fff',
        transition: 'background .35s ease',
        py: scrolled ? 0 : 1,
        boxShadow: scrolled ? undefined : 'none',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <motion.a
          href={surAccueil ? '#club' : '/#club'}
          style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.32 }}
        >
          <Box
            component="img"
            src="/logo-itclub.webp"
            alt="Logo IT-CLUB EMSP"
            sx={{ width: 42, height: 42, borderRadius: 2, objectFit: 'cover', border: '2px solid #1FAF72' }}
          />
          <Box sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: 17 }}>
            IT-CLUB <span style={{ color: scrolled ? '#1FAF72' : '#9AFBD7' }}>EMSP</span>
          </Box>
        </motion.a>

        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5, alignItems: 'center' }}>
          {liens.map((l) => (
            <Button key={l.cible} color="inherit"
              href={l.route ? l.cible : (surAccueil ? `#${l.cible}` : `/#${l.cible}`)}
              sx={{
                position: 'relative', fontWeight: 600, fontSize: '0.9rem',
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
          <Button
            variant="contained"
            href={surAccueil ? '#adhesion' : '/#adhesion'}
            sx={{ bgcolor: '#1FAF72', color: '#fff', '&:hover': { bgcolor: '#179963', boxShadow: '0 6px 18px rgba(31,175,114,.45)' }, mx: 0.5, transition: 'background 200ms ease, box-shadow 200ms ease' }}
          >
            Rejoindre le club
          </Button>
          {/* Connexion / Espace selon l'état */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              href={user ? '/espace' : '/login'}
              startIcon={<LoginIcon />}
              sx={{
                color: scrolled ? '#0F5B3A' : '#9AFBD7',
                fontWeight: 800,
                border: '1.5px solid',
                borderColor: scrolled ? 'rgba(15,91,58,.35)' : 'rgba(154,251,215,.5)',
                borderRadius: 6,
              }}
            >
              {user ? 'Mon espace' : 'Connexion'}
            </Button>
          </motion.div>
        </Box>

        <IconButton sx={{ display: { xs: 'block', md: 'none' } }} onClick={() => setOpen(true)}>
          <MenuIcon />
        </IconButton>

        <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
          <List sx={{ width: 240, pt: 2 }} onClick={() => setOpen(false)}>
            {liens.map((l) => (
              <ListItemButton key={l.cible} component="a" href={l.route ? l.cible : (surAccueil ? `#${l.cible}` : `/#${l.cible}`)} sx={{ borderRadius: 2 }}>
                {l.label}
              </ListItemButton>
            ))}
            <ListItemButton component="a" href={surAccueil ? '#adhesion' : '/#adhesion'} sx={{ borderRadius: 2, fontWeight: 700, color: '#0F5B3A' }}>
              Rejoindre le club
            </ListItemButton>
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
