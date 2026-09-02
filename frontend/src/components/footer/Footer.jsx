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
        <Typography variant="body2" sx={{ opacity: 0.55, mt: 2 }}>
          Réseaux : LinkedIn · Instagram · WhatsApp (liens gérés par la Resp. Communication)
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.4, display: 'block', mt: 3 }}>
          © {new Date().getFullYear()} IT-CLUB EMSP — propulsé par la cellule Web.
        </Typography>
      </Container>
    </Box>
  )
}
