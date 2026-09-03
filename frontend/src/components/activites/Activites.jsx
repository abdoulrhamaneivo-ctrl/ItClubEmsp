import { useState } from 'react'
import { motion } from 'framer-motion'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import FondPropre from '../ui-components/FondPropre'
import { BandeauAccent } from '../ui-components/FondPropre'
import TitreSection from '../ui-components/TitreSection'
import { IcCalendrier, IcRocket, IcMembres, IcLieu, IcFormation, IcTrophee } from '../ui-components/IconesClub'
import { useActivites } from '../../hooks/useApi'

/**
 * Activités à venir — Timeline « journal » : pas de liseré coloré générique.
 * La couleur vit DANS la date (badge calendrier par activité) et l'icône du type.
 * Cartes blanc pur, bordure neutre unique, hover subtil.
 */

const iconesType = {
  Atelier: IcFormation,
  Compétition: IcTrophee,
  Conférence: IcRocket,
}

export default function Activites() {
  const { data: activites, loading, error } = useActivites({ upcoming: true, limit: 10 })

  if (loading) return <SqueletteActivites />
  if (error) return <ErreurChargement message={error} />
  if (!activites || activites.length === 0) return <Box sx={{ py: 8, textAlign: 'center' }}><Typography color="textSecondary">Aucune activité à venir</Typography></Box>

  // Grouper par mois
  const grouped = activites.reduce((acc, a) => {
    const mois = new Date(a.date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    if (!acc[mois]) acc[mois] = []
    acc[mois].push(a)
    return acc
  }, {})

  const moisOrdres = Object.keys(grouped).sort((a, b) => new Date(grouped[a][0].date) - new Date(grouped[b][0].date))

  return (
    <Box id="activites" sx={{ py: { xs: 6, md: 8 }, position: 'relative', overflow: 'hidden' }}>
      <FondPropre variante="blanc" />
      <BandeauAccent couleur="#2563EB" />

      <Container maxWidth={false} sx={{ position: 'relative', maxWidth: '1440px !important', px: { xs: 2.5, md: 4 } }}>
        <TitreSection
          badge="Calendrier"
          titre="Activités à venir"
          sousTitre="Inscriptions en ligne, places limitées, rappels automatiques. Clique sur une activité pour t'inscrire."
          couleur="#2563EB"
        />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px' }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* ── Timeline journal — ligne neutre fine ──────────────── */}
          <Box sx={{ position: 'relative', paddingLeft: { xs: 0, md: 2 } }}>
            <Box sx={{ position: 'absolute', left: { xs: 12, md: 24 }, top: 0, bottom: 0, width: 1.5, bgcolor: '#E5E9E7' }} />

            {moisOrdres.map((mois, mIdx) => (
              <motion.div
                key={mois}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '0px' }}
                transition={{ duration: 0.35, delay: mIdx * 0.06, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* En-tête du mois */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 3.5, mt: mIdx === 0 ? 0 : 4, position: 'relative', zIndex: 2 }}>
                  <Box sx={{
                    width: { xs: 46, md: 52 }, height: { xs: 46, md: 52 },
                    borderRadius: 3, bgcolor: '#111827',
                    color: '#fff', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    boxShadow: '0 6px 16px rgba(13,27,42,.18)',
                  }}>
                    <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800, fontSize: '0.56rem', opacity: 0.75 }}>
                      {mois.split(' ')[0].slice(0, 3)}
                    </Typography>
                    <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: '1.2rem', lineHeight: 1 }}>
                      {new Date(grouped[mois][0].date).getFullYear()}
                    </Typography>
                  </Box>
                  <Typography component="h3" sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 700, fontSize: { xs: '1.1rem', md: '1.35rem' }, color: '#111827', textTransform: 'capitalize' }}>
                    {mois}
                  </Typography>
                </Box>

                {/* Cartes du mois */}
                <Box sx={{ ml: { xs: 0, md: 4 }, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  {grouped[mois].map((a, aIdx) => {
                    const IconeType = iconesType[a.type] ?? IcCalendrier
                    const d = new Date(a.date)
                    return (
                      <motion.div
                        key={a.id}
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '0px' }}
                        transition={{ duration: 0.32, delay: (mIdx + aIdx) * 0.04, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <Box
                          sx={{
                            display: 'flex', gap: 2.5, p: 2.8,
                            bgcolor: '#fff', borderRadius: 3,
                            border: '1px solid #E8ECEA',
                            boxShadow: '0 2px 10px rgba(13,27,42,.04)',
                            textDecoration: 'none', color: 'inherit',
                            transition: 'all 220ms ease',
                            '&:hover': { transform: 'translateX(6px)', borderColor: '#C9D4CF', boxShadow: '0 6px 18px rgba(13,27,42,.08)' },
                          }}
                        >
                          {/* Point timeline neutre */}
                          <Box sx={{
                            width: 11, height: 11, borderRadius: '50%', bgcolor: '#fff',
                            border: '3px solid #C9D4CF', flexShrink: 0, mt: 2.6,
                            position: 'relative', zIndex: 1, ml: { xs: -0.5, md: -1.1 },
                          }} />

                          {/* Badge date — LA couleur est ici, fonctionnelle */}
                          <Box sx={{
                            width: { xs: 50, sm: 58 }, flexShrink: 0, borderRadius: '14px', py: 1.4,
                            bgcolor: `${a.couleur}14`, border: `1px solid ${a.couleur}30`,
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.2,
                            alignSelf: 'flex-start',
                            transition: 'transform 200ms ease',
                          }}>
                            <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: '1.35rem', lineHeight: 1, color: a.couleur }}>
                              {d.getDate()}
                            </Typography>
                            <Typography sx={{ fontWeight: 800, fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: a.couleur }}>
                              {d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')}
                            </Typography>
                          </Box>

                          {/* Icône du type */}
                          <Box sx={{
                            width: 48, height: 48, borderRadius: '14px', flexShrink: 0, mt: 0.3,
                            bgcolor: '#F5F7F6', display: 'grid', placeItems: 'center',
                          }}>
                            <IconeType taille={24} couleur="#4B5563" />
                          </Box>

                          {/* Contenu */}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.8, flexWrap: 'wrap' }}>
                              <Chip label={a.type} size="small" sx={{ bgcolor: '#F5F7F6', color: '#4B5563', fontWeight: 800, fontSize: '0.66rem', height: 22 }} />
                              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6 }}>
                                <IcLieu taille={13} couleur="#6B7280" />
                                <Typography variant="caption" sx={{ color: '#374151', fontWeight: 600, fontSize: '0.78rem' }}>
                                  {a.lieu}
                                </Typography>
                              </Box>
                              {a.places && (
                                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6 }}>
                                  <IcMembres taille={13} couleur="#6B7280" />
                                  <Typography variant="caption" sx={{ color: '#374151', fontWeight: 600, fontSize: '0.78rem' }}>
                                    {a.places} places
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                            <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 700, fontSize: { xs: '1rem', md: '1.1rem' }, color: '#111827', mb: 0.8 }}>
                              {a.titre}
                            </Typography>
                            <Typography variant="body2" color="textSecondary" sx={{ lineHeight: 1.65, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {a.description}
                            </Typography>
                          </Box>

                          {/* CTA discret */}
                          <Button
                            variant="outlined" size="small" href="#adhesion"
                            sx={{ alignSelf: 'center', borderColor: '#D1D5DB', color: '#374151', fontWeight: 700, flexShrink: 0, display: { xs: 'none', md: 'inline-flex' } }}
                          >
                            S'inscrire
                          </Button>
                        </Box>
                      </motion.div>
                    )
                  })}
                </Box>
              </motion.div>
            ))}
          </Box>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px' }}
          transition={{ duration: 0.3, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <Box sx={{ mt: 8, textAlign: 'center' }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Tu veux organiser une activité ?
            </Typography>
            <Button variant="contained" size="large" href="#adhesion"
              sx={{ bgcolor: '#2563EB', '&:hover': { bgcolor: '#1D4ED8' }, fontWeight: 800, borderRadius: '9999px', px: 4 }}>
              Proposer une activité
            </Button>
          </Box>
        </motion.div>
      </Container>
    </Box>
  )
}

/* ── Squelette & erreur ─────────────────────────────────────── */
function SqueletteActivites() {
  return (
    <Box sx={{ py: 8 }}>
      <Container>
        <Typography component="h2" sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 700, fontSize: { xs: '1.75rem', md: '2.5rem' }, color: '#111827', mb: 4 }}>
          Activités à venir
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {[1, 2, 3, 4].map((i) => (
            <Box key={i} sx={{ height: 110, bgcolor: '#F5F5F5', borderRadius: 3 }} />
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
