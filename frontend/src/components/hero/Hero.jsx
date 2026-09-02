import { useRef } from 'react'
import { motion } from 'framer-motion'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'

/**
 * Hero — style « feuille » : fond sombre immersif, badge glassmorphism,
 * bande de stats translucide en pied, grande feuille claire arrondie qui
 * remonte sur le hero et ouvre la vitrine.
 */
export default function Hero() {
  const ref = useRef(null)

  const stats = [
    { valeur: '142+', label: 'Membres actifs' },
    { valeur: '5', label: 'Cellules & pôles' },
    { valeur: '28', label: 'Activités / an' },
    { valeur: '15', label: 'Documents officiels' },
  ]

  return (
    <Box
      id="club"
      ref={ref}
      sx={{
        position: 'relative',
        minHeight: { xs: '92vh', md: '100vh' },
        overflow: 'hidden',
        background: 'linear-gradient(140deg,#0A1628 0%,#0D1B2A 42%,#0F5B3A 135%)',
      }}
    >
      {/* ── Décor : orbes lumineux + trame de points ─────────────── */}
      <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: '-12%', left: '-8%', width: 480, height: 480,
            borderRadius: '50%', background: 'radial-gradient(circle,#1FAF72 0%,transparent 65%)',
            opacity: 0.28, filter: 'blur(70px)',
          }}
        />
        <motion.div
          animate={{ x: [0, -50, 0], y: [0, 40, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', bottom: '6%', right: '-6%', width: 560, height: 560,
            borderRadius: '50%', background: 'radial-gradient(circle,#2563EB 0%,transparent 65%)',
            opacity: 0.2, filter: 'blur(80px)',
          }}
        />
        <Box
          sx={{
            position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(rgba(154,251,215,.14) 1px, transparent 1px)',
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
          height: '100%', minHeight: { xs: '92vh', md: '100vh' },
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          pt: '72px', pb: '170px',
        }}
      >
        {/* Badge glassmorphism */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: 'inline-flex', width: 'fit-content' }}
        >
          <Box
            sx={{
              display: 'inline-flex', alignItems: 'center', gap: 1.2,
              px: 2.2, py: 0.9, borderRadius: 9999,
              bgcolor: 'rgba(255,255,255,.08)', border: '1px solid rgba(154,251,215,.28)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <motion.span
              animate={{ opacity: [1, 0.4, 1], scale: [1, 0.85, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              style={{ width: 8, height: 8, borderRadius: '50%', background: '#1FAF72', boxShadow: '0 0 10px #1FAF72' }}
            />
            <Typography sx={{ color: '#9AFBD7', fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.22em', textTransform: 'uppercase' }}>
              Le club informatique — EMSP
            </Typography>
          </Box>
        </motion.div>

        {/* Titre — apparition mot à mot */}
        <Box
          component="h1"
          sx={{
            fontFamily: "'Orbitron', sans-serif", fontWeight: 800,
            fontSize: { xs: '2.4rem', md: '4.4rem' }, lineHeight: 1.08,
            my: 3, color: '#fff', maxWidth: 900,
            textShadow: '0 4px 30px rgba(0,0,0,.35)',
          }}
        >
          {['Construire', 'l’avenir numérique', 'ensemble.'].map((mot, i) => (
            <motion.span
              key={mot}
              style={{ display: 'block' }}
              initial={{ opacity: 0, y: 34 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + i * 0.13, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {i === 1 ? (
                <>
                  l’avenir <Box component="span" sx={{ color: '#1FAF72' }}>numérique</Box>
                </>
              ) : (
                mot
              )}
            </motion.span>
          ))}
        </Box>

        {/* Sous-titre */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.0628, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.0668, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}
        >
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              variant="contained" size="large" href="#adhesion"
              sx={{
                bgcolor: '#1FAF72', color: '#fff', '&:hover': { bgcolor: '#179963' },
                fontWeight: 800, px: 4.5, py: 1.6, borderRadius: 9999, fontSize: '1rem',
                boxShadow: '0 8px 28px rgba(31,175,114,.45)',
              }}
            >
              Nous rejoindre
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              variant="contained" size="large" href="#activites"
              sx={{
                bgcolor: '#fff', color: '#0D1B2A', '&:hover': { bgcolor: '#E8F5EE' },
                fontWeight: 800, px: 4.5, py: 1.6, borderRadius: 9999, fontSize: '1rem',
                boxShadow: '0 8px 28px rgba(0,0,0,.3)',
              }}
            >
              Nos activités
            </Button>
          </motion.div>
        </motion.div>
      </Container>

      {/* ── Bande de stats translucide (pleine largeur) ──────────── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.064, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 52, zIndex: 3 }}
      >
        <Box
          sx={{
            bgcolor: 'rgba(10,22,40,.55)', backdropFilter: 'blur(14px)',
            borderTop: '1px solid rgba(154,251,215,.16)',
            borderBottom: '1px solid rgba(154,251,215,.16)',
          }}
        >
          <Container
            maxWidth={false}
            sx={{ maxWidth: '1440px !important', px: { xs: 2.5, md: 4 }, py: 2.4, display: 'flex', alignItems: 'center' }}
          >
            <Box sx={{ display: 'flex', flex: 1, flexWrap: 'wrap', alignItems: 'center', justifyContent: { xs: 'center', md: 'flex-start' } }}>
              {stats.map((s, i) => (
                <Box
                  key={s.label}
                  sx={{
                    px: { xs: 2.5, md: 4.5 },
                    py: { xs: 1, md: 0 },
                    borderLeft: i === 0 ? 'none' : '1px solid rgba(255,255,255,.16)',
                    textAlign: 'center',
                  }}
                >
                  <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: { xs: '1.4rem', md: '1.8rem' }, color: '#fff', fontVariantNumeric: 'tabular-nums', lineHeight: 1.15 }}>
                    {s.valeur}
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,.62)', fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                    {s.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Container>
        </Box>
        </motion.div>

        {/* ── Feuille claire arrondie qui ouvre la vitrine ─────────── */}
        <Box
        sx={{
          position: 'absolute', left: 0, right: 0, bottom: -2, height: 56,
          bgcolor: '#fff', borderRadius: '52px 52px 0 0', zIndex: 4,
        }}
      />
    </Box>
  )
}
