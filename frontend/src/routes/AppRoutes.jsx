import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider, CssBaseline } from '@mui/material'
import theme from '../theme'
import BandeauDefilant from '../components/ui-components/BandeauDefilant'
import Adhesion from '../components/adhesion/Adhesion'
import Footer from '../components/footer/Footer'
import Navbar from '../components/navbar/Navbar'
import Hero from '../components/hero/Hero'
import QuiSommesNous from '../components/quisommesnous/QuiSommesNous'
import Bureau from '../components/bureau/Bureau'
import Cellules from '../components/cellules/Cellules'
import Activites from '../components/activites/Activites'
import Actualites from '../components/actualites/Actualites'
import Documentation from '../components/documentation/Documentation'
import Login from '../pages/Login'
import Espace from '../pages/Espace'
import RequireAuth from '../pages/RequireAuth'
import Galerie from '../pages/Galerie'
import BackofficeLayout from '../pages/backoffice/BackofficeLayout'

function Vitrine() {
  return (
    <>
      <Navbar />
      <main>
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
        <Adhesion />
      </main>
      <Footer />
    </>
  )
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Vitrine />} />
        <Route path="/galerie" element={<><Navbar /><Galerie /></>} />
        <Route path="/login" element={<Login />} />
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
    </BrowserRouter>
  )
}

export { Vitrine }