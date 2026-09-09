import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import BoutonRetour from '../components/ui-components/BoutonRetour'
import { api } from '../lib/api'

/**
 * Mot de passe oublié : l'étudiant saisit son email, le back envoie un lien
 * de réinitialisation (si le compte existe). Message identique dans tous les
 * cas — on ne révèle pas si un email est membre.
 */
export default function MotDePasseOublie() {
  const reduit = useReducedMotion()
  const [email, setEmail] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [ok, setOk] = useState(false)
  const [erreur, setErreur] = useState(null)

  const envoyer = async () => {
    if (envoi) return
    if (!email.trim() || !email.includes('@')) {
      setErreur('Saisis ton email du club (prenom.nom@emsp.int).')
      return
    }
    setErreur(null)
    setEnvoi(true)
    try {
      await api.demanderReinitialisation(email.trim())
      setOk(true)
    } catch (e) {
      setErreur(e.message ?? 'Envoi impossible — vérifie ta connexion puis réessaie.')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0D1B2A', position: 'relative', overflow: 'hidden' }}>
      <Container maxWidth="xs" sx={{ position: 'relative', py: 8 }}>
        <Box sx={{ mb: 4 }}>
          <BoutonRetour variante="sombre" label="Retour à la connexion" cible="/login" />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Box component="img" src="/logo-itclub.webp" alt="Logo" sx={{ width: 64, height: 64, borderRadius: 3, border: '2px solid #1FAF72' }} />
        </Box>

        <Typography sx={{ color: '#6EE7B7', fontWeight: 700, fontSize: '0.875rem', mb: 0.8, textAlign: 'center' }}>
          Mot de passe oublié
        </Typography>
        <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: { xs: '1.4rem', md: '1.8rem' }, color: '#FFFFFF', mb: 2, textAlign: 'center' }}>
          On te renvoie un lien
        </Typography>

        {ok ? (
          <motion.div initial={reduit ? { opacity: 1 } : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduit ? 0 : 0.25 }}>
            <Alert icon={<CheckCircleIcon fontSize="inherit" />} severity="success" sx={{ borderRadius: '12px', mb: 2, bgcolor: 'rgba(31,175,114,.14)', color: '#9AFBD7', '& .MuiAlert-icon': { color: '#6EE7B7' } }}>
              Le lien est parti si cet email correspond à un compte membre. Regarde ta boîte (et les spams) — il ne sert qu'une seule fois.
            </Alert>
            <Button variant="contained" fullWidth component={RouterLink} to="/login"
              sx={{ bgcolor: '#1FAF72', '&:hover': { bgcolor: '#179963' }, fontWeight: 800, py: 1.4, borderRadius: '14px', minHeight: 48 }}>
              Retour à la connexion
            </Button>
          </motion.div>
        ) : (
          <>
            {erreur && (
              <Box role="alert" aria-live="assertive" sx={{ mb: 2, p: 1.6, borderRadius: '12px', bgcolor: '#FDECEC', color: '#B42318', fontWeight: 700, fontSize: '0.875rem' }}>
                {erreur}
              </Box>
            )}
            <TextField
              label="Email du club"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') envoyer() }}
              fullWidth
              type="email"
              autoComplete="email"
              placeholder="prenom.nom@emsp.int"
              sx={{
                mb: 2.5,
                '& .MuiOutlinedInput-root': { borderRadius: '12px', color: '#FFFFFF' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(154,251,215,.35)' },
                '& .MuiInputLabel-root': { color: 'rgba(232,242,236,.65)' },
                '& .MuiInputLabel-root.Mui-focused': { color: '#6EE7B7' },
                '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(154,251,215,.55)' },
                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#1FAF72' },
                '& input::placeholder': { color: 'rgba(232,242,236,.4)' },
              }}
            />
            <Button variant="contained" fullWidth onClick={envoyer} disabled={envoi}
              sx={{ bgcolor: '#1FAF72', '&:hover': { bgcolor: '#179963' }, fontWeight: 800, py: 1.4, borderRadius: '14px', minHeight: 48, mb: 2 }}>
              {envoi ? 'Envoi…' : 'Recevoir le lien'}
            </Button>
            <Typography variant="body2" sx={{ textAlign: 'center', lineHeight: 1.7, fontSize: '0.875rem', color: 'rgba(232,242,236,.75)' }}>
              Mot de passe perdu ? Saisis l'email avec lequel tu as rempli ta candidature — un lien de réinitialisation part aussitôt.
            </Typography>
          </>
        )}
      </Container>
    </Box>
  )
}
