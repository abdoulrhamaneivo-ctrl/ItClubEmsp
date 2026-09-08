import { motion } from 'framer-motion'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'

export default function Footer() {
  return (
    <Box component="footer" sx={{ bgcolor: '#0D1B2A', color: '#fff', py: 7, position: 'relative', overflow: 'hidden' }}>
      {/* Ligne circuit décorative */}
      <motion.div
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3 }}
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        sx={{ transformOrigin: 'left' }}
      >
        <Box sx={{ height: '100%', background: 'linear-gradient(90deg,#0F5B3A,#1FAF72,#9AFBD7)' }} />
      </motion.div>

      <Container>
        <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: 22 }}>
          IT-CLUB <span style={{ color: '#1FAF72' }}>EMSP</span>
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.7, mt: 1, maxWidth: 520 }}>
          Ensemble, innovons, communiquons — annonces, cellules, activités et ressources
          du club sur une seule plateforme.
        </Typography>
        {/* Accès rapide — les rubriques vivantes du club */}
        <Box sx={{ mt: 4, display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }, maxWidth: 720 }}>
          {[
            { label: 'Forum des membres', cible: '/forum', note: 'Les échanges' },
            { label: 'Sondages', cible: '/sondages', note: 'Donne ton avis' },
            { label: 'Veille techno', cible: '/veille', note: 'Les liens du club' },
            { label: 'Galerie', cible: '/galerie', note: 'Nos moments' },
          ].map((l) => (
            <Box
              key={l.cible}
              component="a"
              href={l.cible}
              sx={{
                display: 'grid', gap: 0.4, p: 1.8, borderRadius: '14px',
                border: '1px solid rgba(154,251,215,.16)', bgcolor: 'rgba(255,255,255,.04)',
                textDecoration: 'none', minHeight: 64,
                transition: 'border-color 160ms ease, background 160ms ease',
                '&:hover': { borderColor: '#1FAF72', bgcolor: 'rgba(31,175,114,.08)' },
                '&:focus-visible': { outline: '2px solid #1FAF72', outlineOffset: '2px' },
              }}
            >
              <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '0.875rem' }}>{l.label}</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,.55)', fontSize: '0.75rem' }}>{l.note}</Typography>
            </Box>
          ))}
        </Box>
        <Typography variant="body2" sx={{ opacity: 0.55, mt: 3 }}>
          Réseaux : LinkedIn · Instagram · WhatsApp (liens gérés par la Resp. Communication)
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.4, display: 'block', mt: 3 }}>
          © {new Date().getFullYear()} IT-CLUB EMSP — propulsé par la cellule Web.
        </Typography>
      </Container>
    </Box>
  )
}
