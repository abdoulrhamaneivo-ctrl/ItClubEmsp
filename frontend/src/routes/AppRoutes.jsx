import { lazy, Suspense, useEffect, Component } from 'react'
import { motion } from 'framer-motion'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { ThemeProvider, CssBaseline } from '@mui/material'
import theme from '../theme'
import BandeauDefilant from '../components/ui-components/BandeauDefilant'
import Adhesion from '../components/adhesion/Adhesion'
import Footer from '../components/footer/Footer'
import Navbar from '../components/navbar/Navbar'
import FondGlobalDonnees from '../components/ui-components/FondGlobalDonnees'
import BarreProgression from '../components/ui-components/BarreProgression'
import Hero from '../components/hero/Hero'
import QuiSommesNous from '../components/quisommesnous/QuiSommesNous'
import Bureau from '../components/bureau/Bureau'
import Cellules from '../components/cellules/Cellules'
import Activites from '../components/activites/Activites'
import Actualites from '../components/actualites/Actualites'
import Documentation from '../components/documentation/Documentation'
const Login = lazy(() => import('../pages/Login'))
const DefinirMotDePasse = lazy(() => import('../pages/DefinirMotDePasse'))
const Espace = lazy(() => import('../pages/Espace'))
import RequireAuth from '../pages/RequireAuth'
const Galerie = lazy(() => import('../pages/Galerie'))
const Forum = lazy(() => import('../pages/Forum'))
const Sondages = lazy(() => import('../pages/Sondages'))
const Veille = lazy(() => import('../pages/Veille'))
const BackofficeLayout = lazy(() => import('../pages/backoffice/BackofficeLayout'))

function Vitrine() {
  return (
    <>
      <BarreProgression />
      <FondGlobalDonnees />
      <Navbar />
      <main style={{ position: 'relative', zIndex: 1 }}>
        <Hero />
        <BandeauDefilant
          items={[
            "Adhésion ouverte — scanne le QR code du campus",
            '1er atelier Git & GitHub bientôt',
            'Rejoins la cellule IA, Web, Cybersécurité ou Design',
            'Hackathon interne en préparation',
          ]}
          vitesse={32}
        />
        <QuiSommesNous />
        <Bureau />
        <Cellules />
        <Activites />
        <Actualites />
        <Galerie />
        <Documentation />
      </main>
      <Footer />
    </>
  )
}

/* ── Fallback lazy : même splash que index.html, continuité visuelle ── */
function FallbackPage() {
  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(140deg,#0A1628,#0D1B2A 42%,#0F5B3A)',
    }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
        style={{ width: 42, height: 42, borderRadius: '50%', border: '3px solid rgba(154,251,215,.25)', borderTopColor: '#1FAF72' }} />
    </Box>
  )
}

/* ── Page 404 — cohérente avec la charte, jamais de blanc ── */
function Page404() {
  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 2.5,
      background: 'linear-gradient(140deg,#0A1628,#0D1B2A 42%,#0F5B3A 135%)',
      px: 3, textAlign: 'center',
    }}>
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 16 }}
      >
        <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: { xs: '4.5rem', md: '7rem' }, color: '#9AFBD7', lineHeight: 1 }}>
          404
        </Typography>
      </motion.div>
      <Typography sx={{ color: '#fff', fontFamily: "'Orbitron',sans-serif", fontWeight: 700, fontSize: { xs: '1.1rem', md: '1.4rem' } }}>
        Cette page n'existe pas (encore).
      </Typography>
      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,.7)', maxWidth: 420, lineHeight: 1.8 }}>
        Le lien est peut-être obsolète — retourne à l'accueil, tout le club t'y attend.
      </Typography>
      <Button variant="contained" href="/" size="large" sx={{
        bgcolor: '#1FAF72', color: '#fff', '&:hover': { bgcolor: '#25C482' },
        fontWeight: 800, borderRadius: 9999, px: 4, py: 1.4, mt: 1.5,
        boxShadow: '0 8px 24px rgba(31,175,114,.45)',
      }}>
        ← Retour à l'accueil
      </Button>
    </Box>
  )
}

/* ── ScrollToTop : remonte en haut à chaque changement de page,
      sauf s'il y a un #hash (alors le navigateur gère l'ancre) ── */
function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (!hash) window.scrollTo({ top: 0, behavior: 'instant' in document.documentElement.style ? 'instant' : 'auto' })
    // Titre d'onglet lisible par page — historique navigateur clair
    const titres = {
      '/': 'IT-CLUB EMSP — Ensemble, innovons, communiquons',
      '/galerie': 'Galerie — IT-CLUB EMSP',
      '/adhesion': 'Adhésion — IT-CLUB EMSP',
      '/forum': 'Forum — IT-CLUB EMSP',
      '/sondages': 'Sondages — IT-CLUB EMSP',
      '/veille': 'Veille techno — IT-CLUB EMSP',
      '/login': 'Connexion — IT-CLUB EMSP',
      '/definir-mot-de-passe': 'Activer mon compte — IT-CLUB EMSP',
      '/espace': 'Mon espace — IT-CLUB EMSP',
      '/backoffice': 'Back-office — IT-CLUB EMSP',
    }
    document.title = titres[pathname] ?? 'IT-CLUB EMSP'
  }, [pathname, hash])
  return null
}

/* ── Filet anti page-blanche : une erreur d'un module affiche un
      message + bouton au lieu d'un chargement infini ── */
class FrontiereErreur extends Component {
  constructor(props) { super(props); this.state = { erreur: null } }
  static getDerivedStateFromError(erreur) { return { erreur } }
  render() {
    if (!this.state.erreur) return this.props.children
    return (
      <Box sx={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, px: 3, textAlign: 'center' }}>
        <Typography sx={{ fontWeight: 800, color: '#111827' }}>Oups — cette page a planté.</Typography>
        <Typography variant="body2" color="textSecondary" sx={{ maxWidth: 480 }}>
          {String(this.state.erreur?.message ?? this.state.erreur).slice(0, 220)}
        </Typography>
        <Button variant="contained" onClick={() => window.location.reload()}
          sx={{ bgcolor: '#1FAF72', '&:hover': { bgcolor: '#179963' }, fontWeight: 800, borderRadius: 9999 }}>
          Recharger la page
        </Button>
      </Box>
    )
  }
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<FallbackPage />}>
      <FrontiereErreur>
      <Routes>
        <Route path="/" element={<Vitrine />} />
        <Route path="*" element={<Page404 />} />
        <Route path="/galerie" element={<><Navbar /><Galerie /></>} />
        <Route path="/adhesion" element={<><Navbar /><Box sx={{ pt: { xs: 8, md: 9 } }}><Adhesion /></Box><Footer /></>} />
        <Route
          path="/forum"
          element={
            <RequireAuth>
              <><Navbar /><Forum /></>
            </RequireAuth>
          }
        />
        <Route
          path="/sondages"
          element={
            <RequireAuth>
              <><Navbar /><Sondages /></>
            </RequireAuth>
          }
        />
        <Route
          path="/veille"
          element={
            <RequireAuth>
              <><Navbar /><Veille /></>
            </RequireAuth>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/definir-mot-de-passe" element={<DefinirMotDePasse />} />
        <Route
          path="/espace"
          element={
            <RequireAuth>
              <><Navbar /><Espace /></>
            </RequireAuth>
          }
        />
        <Route
          path="/backoffice/*"
          element={
            <RequireAuth roles={['P1','P2','P3','P4','P5','P6','P7','P8','P9','P10','CHEF_CELLULE','ADMIN']}>
              <BackofficeLayout />
            </RequireAuth>
          }
        />
      </Routes>
      </FrontiereErreur>
          </Suspense>
    </BrowserRouter>
  )
}

export { Vitrine }