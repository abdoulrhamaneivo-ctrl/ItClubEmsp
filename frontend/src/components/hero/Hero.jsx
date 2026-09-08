import { useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import { useTheme, useMediaQuery } from '@mui/material'
import { api } from '../../lib/api'
import { useAuth } from '../../stores/auth'
import FondDonnees from '../ui-components/FondDonnees'

/**
 * Hero — style « feuille » : fond sombre immersif, badge glassmorphism,
 * bande de stats translucide en pied, grande feuille claire arrondie qui
 * remonte sur le hero et ouvre la vitrine.
 */
export default function Hero() {
  const ref = useRef(null)
  const theme = useTheme()
  const user = useAuth((s) => s.user)

  // Chiffres réels (API) — repli statique le temps du chargement
  const [statsReelles, setStatsReelles] = useState(null)
  useEffect(() => {
    let stop = false
    api.getStatsPubliques()
      .then((s) => { if (!stop && s) setStatsReelles(s) })
      .catch(() => {})
    return () => { stop = true }
  }, [])

  const stats = [
    { valeur: statsReelles ? String(statsReelles.cellules) : '4', label: 'Domaines tech' },
    { valeur: statsReelles ? String(statsReelles.activites_a_venir) : '—', label: 'Activités à venir' },
    { valeur: statsReelles ? String(statsReelles.documents) : '—', label: 'Ressources' },
    { valeur: '0 FCFA', label: 'Adhésion gratuite' },
  ]

  return (
    <Box
      id="club"
      ref={ref}
      sx={{
        position: 'relative',
        minHeight: { xs: 'auto', sm: '94vh', md: '100vh' },
        overflow: 'hidden',
        background: '#0A1628',
      }}
    >
      {/* ── Décor : halo unique discret (pas d'orbes flottants IA) ── */}
      <FondDonnees intensite={0.45} sansSatellite sansEnveloppes fibresSeules />
      <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <Box
          sx={{
            position: 'absolute', top: '-14%', left: '-6%', width: { xs: 300, md: 460 }, height: { xs: 300, md: 460 },
            borderRadius: '50%', background: 'radial-gradient(circle,rgba(31,175,114,.16),transparent 65%)',
            filter: 'blur(60px)',
          }}
        />
        <Box
          sx={{
            position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(rgba(154,251,215,.1) 1px, transparent 1px)',
            backgroundSize: '26px 26px',
            maskImage: 'radial-gradient(ellipse at 30% 40%, black 30%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 30% 40%, black 30%, transparent 75%)',
          }}
        />
        {/* Ligne d'horizon lumineuse */}
        <Box sx={{ position: 'absolute', left: 0, right: 0, top: 0, height: 3, background: 'linear-gradient(90deg,#1FAF72,#9AFBD7 45%,transparent)' }} />
      </Box>

      {/* ── Contenu principal ────────────────────────────────────── */}
      <Container
        maxWidth={false}
        sx={{
          position: 'relative', maxWidth: '1440px !important', px: { xs: 2.5, md: 4 },
          height: '100%', minHeight: { xs: 'auto', sm: '94vh', md: '100vh' },
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          pt: { xs: '104px', md: '88px' }, pb: { xs: 5, md: '170px' },
        }}
      >
        {/* Badge glassmorphism */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: 'inline-flex', width: 'fit-content' }}
        >
          <Box
            sx={{
              display: 'inline-flex', alignItems: 'center', gap: 1.2,
              px: 2.2, py: 0.9, borderRadius: 9999,
              bgcolor: 'rgba(255,255,255,.08)', border: '1px solid rgba(154,251,215,.16)',
            }}
          >
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: '#1FAF72' }} />
            <Typography sx={{ color: '#9AFBD7', fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
              Le club informatique — EMSP
            </Typography>
          </Box>
        </motion.div>

        {/* Titre — apparition sobre */}
        <Box
          component="h1"
          sx={{
            fontFamily: "'Orbitron', sans-serif", fontWeight: 800,
            fontSize: { xs: '2.4rem', md: '4.4rem' }, lineHeight: 1.08,
            my: 3, color: '#fff', maxWidth: 900,
          }}
        >
          {['Construire', 'l’avenir numérique', 'ensemble.'].map((mot, i) => (
            <motion.span
              key={mot}
              style={{ display: 'block' }}
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + i * 0.1, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              {i === 1 ? (
                <>
                  l’avenir <Box component="span" sx={{ color: '#6EE7B7' }}>numérique</Box>
                </>
              ) : (
                mot
              )}
            </motion.span>
          ))}
        </Box>

        {/* Sous-titre */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <Typography sx={{ color: 'rgba(255,255,255,.82)', fontSize: { xs: '1.05rem', md: '1.22rem' }, lineHeight: 1.8, maxWidth: 640, mb: 4 }}>
            Le IT-CLUB EMSP, c’est l’endroit où les étudiants de l’École Multinationale
            des Postes se retrouvent pour coder, apprendre, partager et construire ensemble.
            <Box component="span" sx={{ display: 'block', mt: 1, color: '#9AFBD7', fontWeight: 700 }}>
              Pas de prérequis, pas de sélection — juste l’envie de faire.
            </Box>
          </Typography>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.44, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}
        >
          <Button
            variant="contained" size="large" href={user ? '/espace' : '/adhesion'}
            sx={{
              bgcolor: '#1FAF72', color: '#fff', '&:hover': { bgcolor: '#179963' },
              fontWeight: 800, px: 4.5, py: 1.6, borderRadius: 9999, fontSize: '1rem',
              boxShadow: '0 2px 8px rgba(13,27,42,.18)',
            }}
          >
            {user ? 'Mon espace' : 'Nous rejoindre'}
          </Button>
          <Button
            variant="contained" size="large" href="#activites"
            sx={{
              bgcolor: '#fff', color: '#0D1B2A', '&:hover': { bgcolor: '#E8F5EE' },
              fontWeight: 800, px: 4.5, py: 1.6, borderRadius: 9999, fontSize: '1rem',
              boxShadow: '0 4px 14px rgba(0,0,0,.25)',
            }}
          >
            Nos activités
          </Button>
        </motion.div>
      </Container>

      {/* ── Bande de stats — dans le flux sur mobile (jamais de
          chevauchement), superposée au pied sur desktop ──────────── */}
      <Box sx={{
        position: { xs: 'relative', md: 'absolute' },
        left: 0, right: 0, bottom: { md: 56 }, zIndex: 3,
        mt: { xs: 4, md: 0 }, pb: { xs: 4, md: 0 },
      }}>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        <Box
          sx={{
            bgcolor: 'rgba(10,22,40,.72)',
            borderTop: '1px solid rgba(154,251,215,.16)',
            borderBottom: '1px solid rgba(154,251,215,.16)',
          }}
        >
          <Container
            maxWidth={false}
            sx={{ maxWidth: '1440px !important', px: { xs: 2, md: 4 }, py: { xs: 2.5, md: 3 } }}
          >
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', md: 'repeat(4,1fr)' }, gap: { xs: 2.5, md: 0 }, alignItems: 'center' }}>
              {stats.map((s, i) => (
                <Box
                  key={s.label}
                  sx={{
                    px: { xs: 1, md: 3 },
                    borderLeft: { xs: 'none', md: i === 0 ? 'none' : '1px solid rgba(255,255,255,.18)' },
                    textAlign: 'center',
                  }}
                >
                  <Typography sx={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: { xs: '1.75rem', md: '2.15rem' }, color: '#fff', fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>
                    {s.valeur}
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,.85)', fontSize: { xs: '0.66rem', md: '0.74rem' }, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', lineHeight: 1.5 }}>
                    {s.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Container>
        </Box>
      </motion.div>
      </Box>

        {/* ── Feuille claire arrondie qui ouvre la vitrine (desktop) ── */}
        <Box
        sx={{
          display: { xs: 'none', md: 'block' },
          position: 'absolute', left: 0, right: 0, bottom: -2, height: 56,
          bgcolor: '#fff', borderRadius: '52px 52px 0 0', zIndex: 4,
        }}
      />
    </Box>
  )
}
