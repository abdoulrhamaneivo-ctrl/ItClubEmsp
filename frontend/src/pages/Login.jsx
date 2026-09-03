import { useState } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import InputAdornment from '@mui/material/InputAdornment'
import EmailIcon from '@mui/icons-material/Email'
import LockIcon from '@mui/icons-material/Lock'
import { useAuth } from '../stores/auth'

/** Connexion membre / Bureau — écran immersif avec panneau de marque. */
export default function Login() {
  const login = useAuth((s) => s.login)
  const navigate = useNavigate()
  const [erreur, setErreur] = useState(null)
  const [chargement, setChargement] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setChargement(true)
    try {
      await login(fd.get('email'), fd.get('password'))
      navigate('/espace')
    } catch {
      setErreur('Connexion impossible — vérifie tes identifiants.')
      setChargement(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
      {/* Panneau de marque (gauche) — fond animé charte */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, position: 'relative', overflow: 'hidden', alignItems: 'center' }}>
        <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg,#0D1B2A 0%,#0F5B3A 100%)' }} />
        {[...Array(5)].map((_, i) => (
          <motion.span
            key={i}
            style={{
              position: 'absolute', left: `${15 + i * 18}%`, top: `${(i * 27) % 90}%`,
              width: 6 + (i % 3) * 3, height: 6 + (i % 3) * 3, borderRadius: '50%',
              background: i % 2 ? '#9AFBD7' : '#1FAF72', opacity: 0.6,
            }}
            animate={{ y: [-20, 20, -20], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 6 + i * 1.7, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
        <motion.svg width="100%" height="100%" style={{ position: 'absolute', opacity: 0.22 }} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}>
          <motion.path
            d="M-40,180 C240,80 480,300 820,160 S1200,260 1400,140"
            stroke="#9AFBD7" strokeWidth="1.5" fill="none"
            animate={{ pathLength: [0, 1], opacity: [0.1, 0.45, 0.1] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.svg>
        <Box sx={{ position: 'relative', p: 8 }}>
          <motion.div initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }}>
            <Box component="img" src="/logo-itclub.jpg" alt="Logo IT-CLUB EMSP" sx={{ width: 74, height: 74, borderRadius: 3, border: '2px solid #1FAF72', mb: 3 }} />
            <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: '1.9rem', color: '#fff' }}>
              IT-CLUB <span style={{ color: '#9AFBD7' }}>EMSP</span>
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,.75)', mt: 1, maxWidth: 340 }}>
              Ensemble, innovons, communiquons. Connecte-toi pour retrouver toute la vie du club.
            </Typography>
          </motion.div>
        </Box>
      </Box>

      {/* Formulaire (droite) */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: 'min(400px, 100%)' }}
        >
          <Box sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'center', mb: 3 }}>
            <Box component="img" src="/logo-itclub.jpg" alt="Logo" sx={{ width: 64, height: 64, borderRadius: 3, border: '2px solid #1FAF72' }} />
          </Box>

          <Typography sx={{ fontFamily: "'JetBrains Mono',monospace", color: '#0E7A50', fontWeight: 700, fontSize: '0.78rem', mb: 0.8 }}>
            $ ssh membre@itclub-emsp
          </Typography>
          <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: { xs: '1.6rem', md: '2rem' }, color: '#111827', mb: 1 }}>
            Espace membre
          </Typography>
          <Typography color="text.secondary" mb={4} sx={{ lineHeight: 1.8 }}>
            Annonces, activités, ressources — tout t'attend ici.
          </Typography>

          {erreur && (
            <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}>
              <Alert severity="error" sx={{ mb: 2 }}>{erreur}</Alert>
            </motion.div>
          )}

          <Box component="form" onSubmit={submit} sx={{ display: 'grid', gap: 2.5 }}>
            <TextField
              name="email" label="E-mail (@emsp.int)" type="email" required fullWidth autoComplete="email"
              InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon fontSize="small" sx={{ color: '#1FAF72' }} /></InputAdornment> }}
            />
            <TextField
              name="password" label="Mot de passe" type="password" required fullWidth autoComplete="current-password"
              InputProps={{ startAdornment: <InputAdornment position="start"><LockIcon fontSize="small" sx={{ color: '#1FAF72' }} /></InputAdornment> }}
            />
            <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}>
              <Button type="submit" variant="contained" size="large" fullWidth disabled={chargement}
                sx={{ bgcolor: '#1FAF72', '&:hover': { bgcolor: '#179963', boxShadow: '0 8px 22px rgba(31,175,114,.4)' }, py: 1.4, fontWeight: 800, borderRadius: '14px', transition: 'background 200ms ease, box-shadow 200ms ease' }}>
                {chargement ? 'Connexion…' : 'Se connecter'}
              </Button>
            </motion.div>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', lineHeight: 1.8 }}>
              Pas encore membre ? <RouterLink to="/#adhesion" style={{ color: '#0E7A50', fontWeight: 700 }}>Remplis le formulaire d'adhésion</RouterLink>.
            </Typography>
            <Typography variant="caption" sx={{ textAlign: 'center', color: '#9CA3AF', display: 'block', fontFamily: "'JetBrains Mono',monospace", fontSize: '0.66rem' }}>
              // démo : n'importe quels identifiants fonctionnent
            </Typography>
          </Box>
        </motion.div>
      </Box>
    </Box>
  )
}
