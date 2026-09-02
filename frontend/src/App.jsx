import { ThemeProvider, CssBaseline } from '@mui/material'
import theme, { charte } from './theme'
import BandeauDefilant from './components/ui-components/BandeauDefilant'
import Adhesion from './components/adhesion/Adhesion'
import Footer from './components/footer/Footer'
import Navbar from './components/navbar/Navbar'
import Hero from './components/hero/Hero'
import Bureau from './components/bureau/Bureau'
import Cellules from './components/cellules/Cellules'
import Activites from './components/activites/Activites'
import Actualites from './components/actualites/Actualites'

function Vitrine() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        {/* Bandeau d'infos qui défilent — contenu pilotable depuis le back-office plus tard */}
        <BandeauDefilant
          items={[
            "Adhésion ouverte — scanne le QR code du campus",
            '1er atelier Git & GitHub bientôt',
            'Rejoins la cellule IA, Web, Cybersécurité ou Design',
            'Hackathon interne en préparation',
          ]}
          vitesse={32}
        />
        <Bureau />
        <Cellules />
        <Activites />
        <Actualites />
        <Adhesion />
      </main>
      <Footer />
    </>
  )
}

export { charte }

// Re-export de l'app complète (vitrine + routes membre/backoffice)
export { default } from './routes/AppRoutes'

// Composants exposés pour les autres surfaces
export { Vitrine }
