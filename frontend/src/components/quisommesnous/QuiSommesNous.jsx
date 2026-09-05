import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import FondPropre from '../ui-components/FondPropre'
import { BandeauAccent } from '../ui-components/FondPropre'
import { SectionTitleUnifiee, CarteUnifiee, gridStandard, colors, ButtonStyles, StatCard } from '../ui-components/DesignSystem'
import { usePresentation } from '../../hooks/useApi'
import { mediasGalerie } from '../../data/galerie'
import { MotFort, ParagrapheIntro } from '../ui-components/Typographie'
import { ArrowRight } from '../ui-components/IconesClub'

/**
 * Qui sommes-nous — Fond propre, stats, galerie photos, design cohérent
 */
export default function QuiSommesNous() {
  const { data: presentation, loading, error } = usePresentation()
  const [openDoc, setOpenDoc] = useState(null)
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const yContainer = useTransform(scrollYProgress, [0, 1], [40, 0])
  const opacityContainer = useTransform(scrollYProgress, [0, 0.3], [0, 1])

  if (loading) return <SquelettePresentation />
  if (error) return <ErreurChargement message={error} />
  if (!presentation) return null

  const { titre, intro, priorites, galerie } = presentation

  return (
    <Box id="qui-sommes-nous" ref={ref} sx={{ py: { xs: 6, md: 8 }, position: 'relative', overflow: 'hidden' }}>
      {/* Fond PROPRE — blanc */}
      <FondPropre variante="blanc" />
      <BandeauAccent couleur="#1FAF72" />

      <Container maxWidth={false} sx={{ position: 'relative', maxWidth: '1440px !important', px: { xs: 2.5, md: 4 } }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        >
          <Box sx={{ mb: 6 }}>
            <Typography variant="overline" sx={{ color: '#1FAF72', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', mb: 1.5, display: 'inline-block', borderBottom: '3px solid #1FAF72', paddingBottom: 0.5 }}>
              Identité
            </Typography>
            <Typography component="h2" sx={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: { xs: '1.75rem', md: '2.5rem' }, lineHeight: 1.2, color: '#111827', mb: 2 }}>
              {titre}
            </Typography>
            <ParagrapheIntro maxWidth={620}>
              {intro}
            </ParagrapheIntro>
            <Typography sx={{ mt: 1.5, color: '#374151', fontSize: { xs: '1rem', md: '1.08rem' }, lineHeight: 1.85, maxWidth: 620 }}>
              Notre conviction : au club, on ne regarde pas la tech — <MotFort couleur="#1FAF72">on la construit</MotFort>,
              <MotFort couleur="#2563EB"> ensemble</MotFort>, et <MotFort couleur="#F5A623">on la ramène au campus</MotFort>.
            </Typography>
          </Box>
        </motion.div>

        {/* Bandeau stats « highlight » — bloc coloré arrondi inset */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        >
          <Box sx={{
            mb: 8, borderRadius: '26px', overflow: 'hidden', position: 'relative',
            background: 'linear-gradient(135deg,#0D1B2A 0%,#0F5B3A 120%)',
            boxShadow: '0 20px 48px rgba(15,91,58,.25)',
          }}>
            {/* Cercles décoratifs */}
            <Box sx={{ position: 'absolute', top: -70, right: -50, width: 220, height: 220, borderRadius: '50%', bgcolor: 'rgba(31,175,114,.18)' }} />
            <Box sx={{ position: 'absolute', bottom: -90, left: '30%', width: 260, height: 260, borderRadius: '50%', bgcolor: 'rgba(154,251,215,.07)' }} />
            <Box sx={{
              position: 'relative', display: 'flex', flexWrap: 'wrap',
              justifyContent: 'space-around', py: { xs: 4, md: 5 }, px: { xs: 2, md: 6 }, gap: { xs: 3, md: 0 },
            }}>
              {[
                { valeur: '3', label: 'Piliers fondateurs' },
                { valeur: '4', label: 'Cellules thématiques' },
                { valeur: '100%', label: 'Bénévolat & entraide' },
                { valeur: '48h', label: 'Réponse à ta candidature' },
              ].map((s, i) => (
                <Box key={s.label} sx={{
                  textAlign: 'center', px: { xs: 2, md: 4 },
                  borderLeft: i === 0 ? 'none' : '1px solid rgba(255,255,255,.18)',
                }}>
                  <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: { xs: '2rem', md: '2.6rem' }, color: '#fff', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
                    {s.valeur}
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,.66)', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', mt: 0.5 }}>
                    {s.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </motion.div>

        {/* L'histoire */}
        <motion.div
          style={{ y: yContainer }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          <Box sx={{ mb: 8 }}>
            <Typography component="h3" sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 700, fontSize: { xs: '1.25rem', md: '1.5rem' }, color: '#111827', mb: 3 }}>
              Notre histoire
            </Typography>
            <Box sx={{ maxWidth: 680, borderLeft: '3px solid #1FAF72', pl: { xs: 0, md: 4 }, position: 'relative' }}>
              <Typography color="textSecondary" sx={{ lineHeight: 1.85, fontSize: { xs: '0.95rem', md: '1rem' } }}>
                {intro}
              </Typography>
            </Box>
          </Box>
        </motion.div>

        {/* Les 3 piliers — cartes distinctes */}
        <motion.div
          style={{ y: yContainer }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          <Box sx={{ mb: 4 }}>
            <Typography variant="overline" sx={{ color: '#1FAF72', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', mb: 1.5, display: 'inline-block', borderBottom: '3px solid #1FAF72', paddingBottom: 0.5 }}>
              Nos piliers
            </Typography>
          </Box>
          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'repeat(3,1fr)' } }}>
            {[
              { numero: '01', titre: 'Apprendre en codant vrai', texte: "Pas de sujets de cours abstraits. Cette plateforme, les outils du club, les projets — c'est de la vraie techno qu'on construit ensemble. C'est la cellule Web qui l'a faite, les autres cellules y participent. On apprend parce qu'on veut produire quelque chose qui marche.", icone: '', couleur: '#1FAF72' },
              { numero: '02', titre: "Se retrouver et s'entraider", texte: "Sur le campus, toutes les bonnes idées et les bugs s'éparpillent dans des groupes WhatsApp. On a créé l'endroit où tout se retrouve : annonces, ateliers, ressources, forum. Si tu bloques, quelqu'un a déjà connu le problème — et il t'aide, ou tu prends, tu aides après.", icone: '', couleur: '#2563EB' },
              { numero: '03', titre: "Ouvrir les horizons", texte: "On va chercher ce qui se fait ailleurs — hackathons, conférences, modèles IA, CTF — et on ramène le meilleur sur le campus. Pas par vanité, mais pour que chacun voie ce qui est possible. Le club, c'est aussi pour voir plus loin et ne pas se limiter à la routine.", icone: '', couleur: '#F5A623' },
            ].map((p, i) => (
              <motion.div
                key={p.numero}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.32, delay: i * 0.0355, ease: [0.22, 1, 0.36, 1] }}
              >
                <Box
                  sx={{
                    bgcolor: '#fff',
                    borderRadius: 3,
                    p: { xs: 3, md: 4 },
                    border: '1px solid #E5E7EB',
                    boxShadow: '0 2px 12px rgba(0,0,0,.04)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 250ms ease, box-shadow 250ms ease',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 32px rgba(0,0,0,.1)' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
                    <Typography sx={{ fontSize: 40, lineHeight: 1 }}>{p.icone}</Typography>
                    <Box>
                      <Typography variant="overline" sx={{ color: p.couleur, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', mb: 0.5 }}>
                        Pilier {p.numero}
                      </Typography>
                      <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 700, fontSize: '1.15rem', color: '#111827', mb: 1 }}>
                        {p.titre}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="textSecondary" sx={{ lineHeight: 1.8, flex: 1 }}>
                    {p.texte}
                  </Typography>
                </Box>
              </motion.div>
            ))}
          </Box>
        </motion.div>
        {/* Bandeau galerie — teaser vers la page dédiée */}
        <motion.div
          style={{ y: yContainer }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          <Box
            component="a" href="/galerie"
            sx={{
              mt: 4, mb: 2, display: 'block', textDecoration: 'none',
              borderRadius: '22px', overflow: 'hidden', position: 'relative',
              background: 'linear-gradient(120deg,#0D1B2A 0%,#0F5B3A 90%)',
              px: { xs: 3, md: 5 }, py: { xs: 3.5, md: 4.5 },
              boxShadow: '0 16px 40px rgba(15,91,58,.22)',
              transition: 'transform 250ms ease, box-shadow 250ms ease',
              '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 20px 48px rgba(15,91,58,.3)' },
            }}
          >
            <Box sx={{ position: 'absolute', top: -60, right: '12%', width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle,rgba(154,251,215,.16),transparent 70%)', filter: 'blur(30px)' }} />
            <Box sx={{ position: 'absolute', bottom: -70, left: '8%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle,rgba(31,175,114,.2),transparent 70%)', filter: 'blur(34px)' }} />
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 3, flexWrap: 'wrap' }}>
              <Box>
                <Typography sx={{ color: '#9AFBD7', fontWeight: 800, fontSize: '0.7rem', letterSpacing: '0.22em', textTransform: 'uppercase', mb: 1 }}>
                  La vie du club en images
                </Typography>
                <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: { xs: '1.25rem', md: '1.7rem' }, color: '#fff' }}>
                  Vibeathon, ateliers, hackathons…
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,.72)', mt: 0.8, maxWidth: 480 }}>
                  Photos et vidéos de chaque moment fort — le stand du club, le podium, les sessions de code.
                </Typography>
              </Box>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Box sx={{
                  display: 'inline-flex', alignItems: 'center', gap: 1.2,
                  bgcolor: '#1FAF72', color: '#fff', fontWeight: 800,
                  borderRadius: 9999, px: 3.5, py: 1.5, fontSize: '0.95rem',
                  boxShadow: '0 8px 22px rgba(31,175,114,.45)',
                }}>
                  Explorer la galerie <ArrowRight size={18} color="#fff" />
                </Box>
              </motion.div>
            </Box>
          </Box>
        </motion.div>

        {/* CTA — carte d'engagement ancrée (pas de boutons flottants) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <Box sx={{
            mt: 6, position: 'relative', overflow: 'hidden',
            borderRadius: '22px',
            background: 'linear-gradient(120deg,#0D1B2A 0%,#0F5B3A 100%)',
            px: { xs: 3, md: 6 }, py: { xs: 4, md: 5 },
            boxShadow: '0 18px 44px rgba(15,91,58,.25)',
            textAlign: 'center',
          }}>
            {/* Orbes subtils */}
            <Box sx={{ position: 'absolute', top: -70, left: '10%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle,rgba(31,175,114,.25),transparent 70%)', filter: 'blur(36px)' }} />
            <Box sx={{ position: 'absolute', bottom: -80, right: '6%', width: 230, height: 230, borderRadius: '50%', background: 'radial-gradient(circle,rgba(154,251,215,.14),transparent 70%)', filter: 'blur(40px)' }} />
            <Box sx={{ position: 'relative' }}>
              <Typography sx={{ color: '#9AFBD7', fontWeight: 800, fontSize: '0.7rem', letterSpacing: '0.22em', textTransform: 'uppercase', mb: 1.5 }}>
                Prêt à faire partie de l'aventure ?
              </Typography>
              <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: { xs: '1.3rem', md: '1.8rem' }, color: '#fff', mb: 1.2 }}>
                Tu te reconnais dans nos valeurs ?
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,.75)', maxWidth: 520, mx: 'auto', mb: 3.5, lineHeight: 1.75 }}>
                Rejoins un club où l'on apprend en construisant — et lis la charte pour connaître l'état d'esprit avant de t'inscrire.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  <Button variant="contained" size="large" href="/adhesion" sx={{ bgcolor: '#1FAF72', color: '#fff', '&:hover': { bgcolor: '#25C482' }, px: 4.5, py: 1.5, fontWeight: 800, borderRadius: 9999, boxShadow: '0 8px 24px rgba(31,175,114,.5)' }}>
                    Rejoins-nous
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  <Button variant="outlined" size="large" href="#documentation" sx={{ borderColor: 'rgba(255,255,255,.5)', color: '#fff', '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,.08)' }, px: 4, py: 1.5, fontWeight: 800, borderRadius: 9999 }}>
                    Lire la charte
                  </Button>
                </motion.div>
              </Box>
            </Box>
          </Box>
        </motion.div>
      </Container>
    </Box>
  )
}

function SquelettePresentation() {
  return (
    <Box sx={{ py: 8 }}>
      <Container>
        <Typography variant="overline" sx={{ color: '#1FAF72', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', mb: 1.5, display: 'inline-block', borderBottom: '3px solid #1FAF72', paddingBottom: 0.5 }}>
          Identité
        </Typography>
        <Typography component="h2" sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 700, fontSize: { xs: '1.75rem', md: '2.5rem' }, color: '#111827', mb: 4 }}>
          Qui sommes-nous ?
        </Typography>
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'repeat(3,1fr)' } }}>
          {[1,2,3].map(i => (
            <Box key={i} sx={{ p: 3, bgcolor: '#F5F5F5', borderRadius: 3 }}>
              <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.2, repeat: Infinity }} sx={{ height: 120, borderRadius: 3, bgcolor: 'linear-gradient(90deg,#E5E7EB,#D1D5DB)' }} />
              <Box sx={{ mt: 2, height: 24, bgcolor: '#D1D5DB', borderRadius: 2 }} />
              <Box sx={{ mt: 1, height: 16, width: '70%', bgcolor: '#D1D5DB', borderRadius: 2 }} />
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  )
}

function ErreurChargement({ message }) {
  return (
    <Box sx={{ py: 8, textAlign: 'center' }}>
      <Typography variant="h6" color="error" gutterBottom>Erreur de chargement</Typography>
      <Typography color="textSecondary" sx={{ mb: 3 }}>{message}</Typography>
      <Button variant="contained" onClick={() => window.location.reload()}>Réessayer</Button>
    </Box>
  )
}