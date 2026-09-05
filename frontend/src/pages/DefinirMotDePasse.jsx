import { useState } from 'react'
import { Link as RouterLink, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { api } from '../lib/api'

/**
 * Invitation membre : définit son mot de passe via le lien reçu par email
 * (?uid=…&token=…). Même écran immersif que Login.
 */
export default function DefinirMotDePasse() {
  const [params] = useSearchParams()
  const [mdp, setMdp] = useState('')
  const [mdp2, setMdp2] = useState('')
  const [erreur, setErreur] = useState(null)
  const [ok, setOk] = useState(false)
  const [envoi, setEnvoi] = useState(false)

  const uid = params.get('uid') ?? ''
  const token = params.get('token') ?? ''

  const submit = async (e) => {
    e.preventDefault()
    if (!uid || !token) { setErreur('Lien incomplet — reprends celui de ton email.'); return }
    if (mdp.length < 8) { setErreur('8 caractères minimum.'); return }
    if (mdp !== mdp2) { setErreur('Les deux mots de passe ne correspondent pas.'); return }
    setErreur(null)
    setEnvoi(true)
    try {
      await api.definirMotDePasse(uid, token, mdp)
      setOk(true)
    } catch {
      setErreur('Lien invalide ou déjà utilisé — demande un nouveau lien au Bureau.')
    } finally {
      setEnvoi(false)
    }
  }

  const champSx = {
    '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#F8FAF9' },
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
      {/* Panneau de marque — desktop uniquement */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, position: 'relative', overflow: 'hidden', alignItems: 'center' }}>
        <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg,#0D1B2A 0%,#0F5B3A 100%)' }} />
        <Box sx={{ position: 'relative', p: 8 }}>
          <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: '2rem', color: '#fff', lineHeight: 1.25 }}>
            Bienvenue dans le club.
          </Typography>
          <Typography sx={{ color: '#9AFBD7', mt: 2, lineHeight: 1.8 }}>
            Dernière marche : choisis ton mot de passe pour ouvrir ton espace membre.
          </Typography>
        </Box>
      </Box>

      <Container maxWidth="xs" sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', py: 6 }}>
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: '1.5rem', color: '#111827' }}>
            {ok ? 'C’est noté !' : 'Définis ton mot de passe'}
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1, mb: 3, lineHeight: 1.7 }}>
            {ok
              ? 'Ton compte est prêt — connecte-toi pour rejoindre ta cellule.'
              : '8 caractères minimum. Le lien ne sert qu’une fois.'}
          </Typography>

          {erreur && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>{erreur}</Alert>}

          {ok ? (
            <Box sx={{ display: 'grid', gap: 2, justifyItems: 'start' }}>
              <CheckCircleIcon sx={{ color: '#1FAF72', fontSize: 44 }} />
              <Button component={RouterLink} to="/login" variant="contained" size="large"
                sx={{ bgcolor: '#1FAF72', '&:hover': { bgcolor: '#179963' }, fontWeight: 800, borderRadius: '12px', px: 4 }}>
                Me connecter →
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={submit} sx={{ display: 'grid', gap: 2 }}>
              <TextField label="Mot de passe *" type="password" value={mdp}
                onChange={(e) => setMdp(e.target.value)} fullWidth autoComplete="new-password" sx={champSx} />
              <TextField label="Confirme *" type="password" value={mdp2}
                onChange={(e) => setMdp2(e.target.value)} fullWidth autoComplete="new-password" sx={champSx} />
              <Button type="submit" variant="contained" size="large" disabled={envoi || mdp.length < 8}
                sx={{ bgcolor: '#1FAF72', '&:hover': { bgcolor: '#179963' }, fontWeight: 800, borderRadius: '12px', mt: 1 }}>
                {envoi ? 'Enregistrement…' : 'Activer mon compte →'}
              </Button>
              <Typography variant="body2" sx={{ textAlign: 'center' }}>
                <RouterLink to="/login" style={{ color: '#0E7A50', fontWeight: 700 }}>Retour à la connexion</RouterLink>
              </Typography>
            </Box>
          )}
        </motion.div>
      </Container>
    </Box>
  )
}
