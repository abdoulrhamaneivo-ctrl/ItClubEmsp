import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Collapse from '@mui/material/Collapse'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import FondPropre from '../ui-components/FondPropre'
import { BandeauAccent } from '../ui-components/FondPropre'
import TitreSection from '../ui-components/TitreSection'
import { IcDocument, IcCube, IcMembres } from '../ui-components/IconesClub'
import { useContenu } from '../../lib/contenu'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAuth } from '../../stores/auth'

/**
 * Documentation — layout COLONNES compactes + accordéon par famille :
 * grille 2-3 colonnes de familles repliables (ouverte par défaut pour
 * les fondamentaux), lignes aérées, « Ouvrir » au hover. Le contenu
 * vient du magasin dynamique (back-office « Actualités & contenu »).
 */

const FAMILLES = [
  { id: 'fondamentaux', titre: 'Les fondamentaux', sousTitre: 'À lire en premier', ids: ['charte', 'reglement', 'statuts'], couleur: '#1FAF72', Icone: IcDocument, ouverteDefaut: true },
  { id: 'vie', titre: 'Vie du club', sousTitre: 'Organisation & membres', ids: ['missions', 'membres'], couleur: '#2563EB', Icone: IcCube, ouverteDefaut: true },
  { id: 'archives', titre: 'Archives', sousTitre: 'Comptes rendus de réunions', ids: ['pv1', 'pv2'], couleur: '#7B61FF', Icone: IcMembres, ouverteDefaut: false },
]

export default function Documentation() {
  const docs = useContenu('documents')
  const user = useAuth((s) => s.user)
  // CR publiés : interne, visible des seuls membres connectés
  const { data: crs = [] } = useQuery({
    queryKey: ['comptes-rendus', 'publies'],
    queryFn: () => api.getComptesRendus(),
    enabled: !!user && !api.isMockMode(),
  })
  const publies = crs.filter((c) => c.statut === 'publie')
  const [crOuvert, setCrOuvert] = useState(null)
  const [etatFamilles, setEtatFamilles] = useState(() =>
    Object.fromEntries(FAMILLES.map((f) => [f.id, f.ouverteDefaut])),
  )

  const parId = useMemo(() => Object.fromEntries(docs.map((d) => [d.id, d])), [docs])

  const basculer = (id) =>
    setEtatFamilles((e) => ({ ...e, [id]: !e[id] }))

  const totalDocs = docs.length

  return (
    <Box id="documentation" sx={{ py: { xs: 6, md: 8 }, position: 'relative', overflow: 'hidden' }}>
      <FondPropre variante="doux" />
      <BandeauAccent couleur="#1FAF72" />

      <Container maxWidth={false} sx={{ position: 'relative', maxWidth: '1100px !important', px: { xs: 2.5, md: 4 } }}>
        <TitreSection
          badge="Ressources"
          titre="Documentation & Règles"
          sousTitre={`${totalDocs} documents classés par famille — déploie ce dont tu as besoin.`}
          couleur="#1FAF72"
        />

        {/* ═══ GRILLE COLONNES de familles ═══ */}
        <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
          {FAMILLES.map((fam, fIdx) => {
            const Icone = fam.Icone
            const docsFamille = fam.ids.map((id) => parId[id]).filter(Boolean)
            const ouverte = etatFamilles[fam.id] ?? false
            return (
              <motion.div
                key={fam.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: fIdx * 0.06, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                style={{ gridColumn: fam.id === 'fondamentaux' ? undefined : undefined }}
              >
                {/* Carte famille (accordéon) */}
                <Box sx={{
                  bgcolor: '#fff', borderRadius: '16px',
                  border: `1px solid ${ouverte ? fam.couleur + '40' : '#E8ECEA'}`,
                  boxShadow: ouverte ? `0 8px 24px ${fam.couleur}12` : '0 4px 14px rgba(13,27,42,.05)',
                  overflow: 'hidden',
                  transition: 'border-color 200ms ease, box-shadow 200ms ease',
                  height: '100%', display: 'flex', flexDirection: 'column',
                }}>
                  {/* En-tête cliquable */}
                  <Box
                    component="button"
                    onClick={() => basculer(fam.id)}
                    aria-expanded={ouverte}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 1.6, width: '100%',
                      px: { xs: 2, md: 2.6 }, py: 2, textAlign: 'left', cursor: 'pointer',
                      bgcolor: 'transparent', border: 'none', fontFamily: 'inherit',
                      transition: 'background 160ms ease',
                      '&:hover': { bgcolor: '#F6FBF9' },
                    }}
                  >
                    <Box sx={{
                      width: 42, height: 42, borderRadius: '12px', flexShrink: 0,
                      bgcolor: `${fam.couleur}12`, border: `1px solid ${fam.couleur}30`,
                      display: 'grid', placeItems: 'center',
                    }}>
                      <Icone taille={20} couleur={fam.couleur === '#1FAF72' ? '#0E7A50' : fam.couleur} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: '0.98rem', color: '#111827', lineHeight: 1.3 }}>
                        {fam.titre}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#5A6B63', fontWeight: 600, fontSize: '0.7rem' }}>
                        {fam.sousTitre} · {docsFamille.length} doc{docsFamille.length > 1 ? 's' : ''}
                      </Typography>
                    </Box>
                    <motion.span
                      animate={{ rotate: ouverte ? 180 : 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      style={{ display: 'grid', placeItems: 'center', width: 30, height: 30, borderRadius: '10px', bgcolor: ouverte ? fam.couleur + '14' : 'transparent' }}
                    >
                      <ExpandMoreIcon sx={{ fontSize: 20, color: ouverte ? '#0E7A50' : '#9CA3AF' }} />
                    </motion.span>
                  </Box>

                  {/* Contenu déroulant */}
                  <Collapse in={ouverte} timeout={260} unmountOnExit>
                    <Box sx={{ px: { xs: 1.2, md: 1.4 }, pb: 1.4 }}>
                      {docsFamille.map((doc, i) => (
                        <Box
                          key={doc.id}
                          component="a"
                          href={doc.fichierUrl ?? `/documents/${doc.fichier}`}
                          target="_blank"
                          rel="noopener"
                          sx={{
                            display: 'flex', alignItems: 'center', gap: 1.6,
                            px: 1.4, py: 1.5, mt: i === 0 ? 0.4 : 0,
                            borderRadius: '12px',
                            textDecoration: 'none',
                            transition: 'background 150ms ease',
                            '&:hover': { bgcolor: '#EDF7F1' },
                            '&:hover .doc-ouvrir': { opacity: 1, transform: 'translateX(0)' },
                          }}
                        >
                          <Box sx={{
                            width: 38, height: 38, borderRadius: '10px', flexShrink: 0,
                            bgcolor: `${doc.couleur}12`, border: `1px solid ${doc.couleur}30`,
                            display: 'grid', placeItems: 'center',
                          }}>
                            <IcDocument taille={18} couleur={doc.couleur === '#F5A623' ? '#B45309' : doc.couleur} />
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: '0.86rem', lineHeight: 1.35 }}>
                              {doc.titre}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#5A6B63', fontWeight: 600, fontSize: '0.72rem', display: 'block', lineHeight: 1.5 }}>
                              {doc.description}
                            </Typography>
                          </Box>
                          <Chip
                            label={doc.format ?? 'PDF'} size="small"
                            sx={{
                              bgcolor: `${doc.couleur}14`, color: doc.couleur === '#F5A623' ? '#B45309' : doc.couleur,
                              fontWeight: 800, fontSize: '0.6rem', flexShrink: 0, height: 22,
                            }}
                          />
                          <Box className="doc-ouvrir" sx={{
                            display: { xs: 'none', md: 'block' }, flexShrink: 0,
                            opacity: 0, transform: 'translateX(-4px)',
                            transition: 'opacity 160ms ease, transform 160ms ease',
                          }}>
                            <Typography sx={{ color: '#0E7A50', fontWeight: 800, fontSize: '0.72rem' }}>
                              Ouvrir →
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Collapse>
                </Box>
              </motion.div>
            )
          })}
        </Box>

        {/* ═══ Comptes rendus publiés (membres connectés) ═══ */}
        {user && !api.isMockMode() && publies.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: '1rem', color: '#111827', mb: 1.2 }}>
              Comptes rendus de réunions
              <Typography component="span" variant="caption" sx={{ color: '#5A6B63', fontWeight: 600, ml: 1 }}>
                {publies.length} publié{publies.length > 1 ? 's' : ''} · réservé aux membres
              </Typography>
            </Typography>
            <Box sx={{ display: 'grid', gap: 1.2 }}>
              {publies.map((cr) => {
                const ouvert = crOuvert === cr.id
                return (
                  <Box key={cr.id} sx={{ bgcolor: '#fff', borderRadius: '14px', border: '1px solid #E8ECEA', overflow: 'hidden' }}>
                    <Box onClick={() => setCrOuvert(ouvert ? null : cr.id)}
                      sx={{ display: 'flex', gap: 1.4, alignItems: 'center', px: 2.2, py: 1.5, cursor: 'pointer', '&:hover': { bgcolor: '#F6FBF9' } }}>
                      <Box sx={{ width: 38, height: 38, borderRadius: '10px', flexShrink: 0, bgcolor: '#7B61FF12', border: '1px solid #7B61FF30', display: 'grid', placeItems: 'center' }}>
                        <IcMembres taille={18} couleur="#7B61FF" />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: '0.86rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {cr.titre}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#5A6B63' }}>
                          Réunion du {(cr.reunion_date ?? '').slice(0, 10).split('-').reverse().join('/')}
                          {cr.valide_par_nom && ` · validé par ${cr.valide_par_nom}`}
                        </Typography>
                      </Box>
                      <ExpandMoreIcon sx={{ fontSize: 20, color: '#9CA3AF', transform: ouvert ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
                    </Box>
                    <Collapse in={ouvert} timeout={240} unmountOnExit>
                      <Box sx={{ px: 2.2, pb: 2, pt: 0.5, borderTop: '1px solid #EEF2F0' }}>
                        {cr.ordre_du_jour && (
                          <Typography variant="body2" sx={{ color: '#374151', fontSize: '0.82rem', mb: 1, whiteSpace: 'pre-wrap' }}>
                            <strong>Ordre du jour —</strong> {cr.ordre_du_jour}
                          </Typography>
                        )}
                        <Typography variant="body2" sx={{ color: '#111827', fontSize: '0.86rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                          {cr.contenu}
                        </Typography>
                      </Box>
                    </Collapse>
                  </Box>
                )
              })}
            </Box>
          </Box>
        )}

        {/* Guide de lecture — compact */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.3 }}
        >
          <Box sx={{
            mt: 3.5, px: { xs: 2.4, md: 3 }, py: 2,
            bgcolor: 'rgba(15,91,58,.06)', borderRadius: '14px',
            border: '1px solid rgba(15,91,58,.14)',
            display: 'flex', alignItems: 'center', gap: 1.8, flexWrap: 'wrap',
          }}>
            <Typography sx={{ fontWeight: 800, color: '#0F5B3A', fontSize: '0.84rem' }}>
              Par où commencer ?
            </Typography>
            <Typography variant="body2" sx={{ color: '#4B5563', lineHeight: 1.7, flex: 1, minWidth: 220 }}>
              <strong>Charte</strong> → <strong>Règlement</strong> → <strong>Statuts</strong>, puis les archives pour voir comment le club avance.
            </Typography>
          </Box>
        </motion.div>
      </Container>
    </Box>
  )
}
