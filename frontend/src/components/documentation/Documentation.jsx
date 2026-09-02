import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import FondPropre from '../ui-components/FondPropre'
import { BandeauAccent } from '../ui-components/FondPropre'
import TitreSection from '../ui-components/TitreSection'
import FondDonnees from '../ui-components/FondDonnees'
import { IcDocument, IcCube, IcMembres } from '../ui-components/IconesClub'
import { useContenu } from '../../lib/contenu'

/**
 * Documentation — regroupée par familles (tout savoir en un coup d'œil).
 * Structure par lecture : Charte & Règles → Vie du club → Archives.
 * Chaque ligne : icône, titre, description lisible, format, ouvrir.
 */

// Familles logiques — l'ordre = l'ordre de lecture du visiteur
const FAMILLES = [
  {
    id: 'fondamentaux',
    titre: 'Les fondamentaux',
    sousTitre: 'Ce qui régit le club — à lire en premier',
    ids: ['charte', 'reglement', 'statuts', 'statutsCI'],
  },
  {
    id: 'organisation',
    titre: 'Vie du club',
    sousTitre: 'Qui fait quoi, qui est membre',
    ids: ['missions', 'membres'],
  },
  {
    id: 'archives',
    titre: 'Archives des réunions',
    sousTitre: 'Les comptes-rendus officiels',
    ids: ['pv1', 'pv7mai'],
  },
]

const iconesFamille = {
  fondamentaux: IcDocument,
  organisation: IcCube,
  archives: IcMembres,
}

export default function Documentation() {
  const familleActive = useState(null)

  const documents = useContenu('documents')

  const parId = Object.fromEntries(documents.map((d) => [d.id, d]))

  return (
    <Box id="documentation" sx={{ py: { xs: 6, md: 8 }, position: 'relative', overflow: 'hidden' }}>
      <FondPropre variante="doux" />
      <BandeauAccent couleur="#1FAF72" />
      <FondDonnees intensite={0.85} />

      <Container maxWidth={false} sx={{ position: 'relative', maxWidth: '1100px !important', px: { xs: 2.5, md: 4 } }}>
        <TitreSection
          badge="Ressources"
          titre="Documentation & Règles"
          sousTitre="Charte, règlement, statuts, procès-verbaux. Tout est classé par famille — lis-les dans l'ordre, ils se complètent."
          couleur="#1FAF72"
        />

        <Box sx={{ display: 'grid', gap: 4 }}>
          {FAMILLES.map((fam, fIdx) => {
            const Icone = iconesFamille[fam.id]
            const docs = fam.ids.map((id) => parId[id]).filter(Boolean)
            return (
              <motion.div
                key={fam.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '0px' }}
                transition={{ delay: fIdx * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* En-tête de famille */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8, mb: 2 }}>
                  <Box sx={{
                    width: 42, height: 42, borderRadius: '12px', bgcolor: '#fff',
                    border: '1px solid #E8ECEA', display: 'grid', placeItems: 'center',
                    boxShadow: '0 2px 8px rgba(13,27,42,.05)',
                  }}>
                    <Icone taille={20} couleur="#0F5B3A" />
                  </Box>
                  <Box>
                    <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: '1.05rem', color: '#111827' }}>
                      {fam.titre}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#5A6B63', fontWeight: 600 }}>
                      {fam.sousTitre}
                    </Typography>
                  </Box>
                </Box>

                {/* Lignes de documents */}
                <Box sx={{ bgcolor: '#fff', borderRadius: '16px', border: '1px solid #E8ECEA', overflow: 'hidden', boxShadow: '0 4px 14px rgba(13,27,42,.05)' }}>
                  {docs.map((doc, i) => (
                    <Box
                      key={doc.id}
                      component="a"
                      href={`/documents/${doc.fichier}`}
                      target="_blank"
                      rel="noopener"
                      sx={{
                        display: 'flex', alignItems: 'center', gap: 2.2,
                        px: { xs: 2.2, md: 3 }, py: 2.2,
                        borderTop: i === 0 ? 'none' : '1px solid #EDF2EF',
                        textDecoration: 'none',
                        transition: 'background 200ms ease',
                        '&:hover': { bgcolor: '#F6FBF9' },
                      }}
                    >
                      {/* Icône fichier */}
                      <Box sx={{
                        width: 44, height: 44, borderRadius: '12px', flexShrink: 0,
                        bgcolor: `${doc.couleur}12`, border: `1px solid ${doc.couleur}30`,
                        display: 'grid', placeItems: 'center',
                      }}>
                        <IcDocument taille={21} couleur={doc.couleur} />
                      </Box>

                      {/* Texte — lisible, structuré */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: '0.95rem', lineHeight: 1.35 }}>
                          {doc.titre}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#5A6B63', lineHeight: 1.6, mt: 0.3 }}>
                          {doc.description}
                        </Typography>
                      </Box>

                      {/* Format + action */}
                      <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Chip
                          label={doc.fichier.toLowerCase().endsWith('.pdf') ? 'PDF' : 'DOCX'}
                          size="small"
                          sx={{ bgcolor: '#F5F7F6', color: '#4B5563', fontWeight: 800, fontSize: '0.64rem', height: 22 }}
                        />
                        <Box sx={{
                          display: { xs: 'none', sm: 'inline-flex' }, alignItems: 'center', gap: 0.5,
                          color: doc.couleur, fontWeight: 800, fontSize: '0.82rem',
                        }}>
                          Ouvrir →
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </motion.div>
            )
          })}
        </Box>

        {/* Note de lecture */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '0px' }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <Box sx={{
            mt: 5, p: 2.5, borderRadius: '14px', bgcolor: '#F6FBF9', border: '1px solid #E3EEE8',
            display: 'flex', gap: 1.5, alignItems: 'flex-start', maxWidth: 720, mx: 'auto',
          }}>
            <IcDocument taille={18} couleur="#0F5B3A" />
            <Typography variant="body2" sx={{ color: '#5A6B63', lineHeight: 1.7 }}>
              <b style={{ color: '#0F5B3A' }}>Par où commencer ?</b> Lis la <b>Charte</b> puis le
              <b> Règlement</b> — ils expliquent l'esprit et les règles du club. Les <b>Statuts</b>
              détaillent le cadre officiel, et les <b>PV</b> racontent ce qui s'est déjà dit en réunion.
            </Typography>
          </Box>
        </motion.div>
      </Container>
    </Box>
  )
}
