import { useState } from 'react'
import { motion } from 'framer-motion'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import FondPropre from '../ui-components/FondPropre'
import { BandeauAccent } from '../ui-components/FondPropre'
import TitreSection from '../ui-components/TitreSection'
import { useContenu } from '../../lib/contenu'
import { CELLULES_TAGGABLES } from '../../lib/contenu'
import { api } from '../../lib/api'
import { useAuth } from '../../stores/auth'

const EMOJIS = ['👍', '❤️', '🔥']

/**
 * Actualités — fil d'annonces dynamique depuis le magasin de contenu
 * (back-office « Actualités & contenu »). Image d'illustration optionnelle,
 * tag cellule affiché, dates en clair.
 */
export default function Actualites() {
  const actualites = useContenu('actualites')

  return (
    <Box id="actualites" sx={{ py: { xs: 6, md: 8 }, position: 'relative', overflow: 'hidden' }}>
      <FondPropre variante="doux" />
      <BandeauAccent couleur="#1FAF72" />

      <Container maxWidth={false} sx={{ position: 'relative', maxWidth: '1440px !important', px: { xs: 2.5, md: 4 } }}>
        <TitreSection
          badge="Communication"
          titre="Actualités"
          sousTitre="Les annonces officielles du Bureau — centralisées, archivées, accessibles."
          couleur="#1FAF72"
        />

        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, alignItems: 'stretch' }}>
          {actualites.map((n, i) => (
            <CarteActu key={n.id} n={n} index={i} />
          ))}
        </Box>
      </Container>
    </Box>
  )
}

/* ── Carte avec réactions + commentaires ───────────────────── */
function CarteActu({ n, index }) {
  const user = useAuth((s) => s.user)
  const [reactions, setReactions] = useState(n.reactions ?? { '👍': 0, '❤️': 0, '🔥': 0 })
  const [maReaction, setMaReaction] = useState(n.ma_reaction ?? null)
  const [ouverts, setOuverts] = useState(false)
  const [commentaires, setCommentaires] = useState(null)
  const [texte, setTexte] = useState('')
  const [envoi, setEnvoi] = useState(false)

  const reagir = async (emoji) => {
    if (!user) { window.location.href = '/login'; return }
    try {
      const res = await api.reagir(n.id, emoji)
      setReactions(res.reactions ?? reactions)
      setMaReaction(res.ma_reaction ?? null)
    } catch { /* silencieux : le compteur reste */ }
  }

  const basculerCommentaires = async () => {
    if (ouverts) { setOuverts(false); return }
    setOuverts(true)
    if (commentaires === null) {
      try {
        setCommentaires(await api.getCommentaires(n.id))
      } catch {
        setCommentaires([])
      }
    }
  }

  const commenter = async () => {
    if (!user) { window.location.href = '/login'; return }
    if (!texte.trim() || envoi) return
    if (api.isMockMode()) {
      // Sans backend : commentaire local uniquement
      setCommentaires([...(commentaires ?? []), {
        id: Date.now(), auteur: user.nom ?? 'Moi',
        contenu: texte.trim(), cree_le: new Date().toISOString(),
      }])
      setTexte('')
      return
    }
    setEnvoi(true)
    try {
      await api.posterCommentaire(n.id, texte.trim())
      setTexte('')
      setCommentaires(await api.getCommentaires(n.id))
    } catch { /* silencieux */ } finally {
      setEnvoi(false)
    }
  }

  return (
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.3), ease: [0.22, 1, 0.36, 1] }}
              style={{ height: '100%' }}
            >
              <Box sx={{
                height: '100%', display: 'flex', flexDirection: 'column',
                bgcolor: '#fff', borderRadius: '18px', overflow: 'hidden',
                border: '1px solid #E8ECEA', boxShadow: '0 4px 16px rgba(13,27,42,.05)',
                transition: 'box-shadow 220ms ease, transform 220ms ease',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 30px rgba(13,27,42,.1)', borderColor: '#BFD8CC' },
              }}>
                {/* Image d'illustration si présente */}
                {n.image ? (
                  <Box component="img" src={n.image} alt="" sx={{ width: '100%', height: 190, objectFit: 'cover' }} />
                ) : (
                  <Box sx={{
                    height: 90, background: `linear-gradient(135deg,${n.couleur},${n.couleur}88 60%,#0D1B2A)`,
                    position: 'relative', display: 'flex', alignItems: 'flex-end', p: 2,
                  }}>
                    <Chip label={n.tag} size="small" sx={{ bgcolor: 'rgba(255,255,255,.92)', color: n.couleur, fontWeight: 800, fontSize: '0.66rem' }} />
                  </Box>
                )}

                <Box sx={{ p: 2.8, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1.2 }}>
                    {n.image && <Chip label={n.tag} size="small" sx={{ bgcolor: `${n.couleur}14`, color: n.couleur, fontWeight: 800, fontSize: '0.66rem', height: 22 }} />}
                    <Chip
                      label={CELLULES_TAGGABLES.find((c) => c.id === n.cellule)?.label ?? 'Général'}
                      size="small"
                      sx={{ bgcolor: '#F0F5F2', color: '#374151', fontWeight: 700, fontSize: '0.64rem', height: 22 }}
                    />
                    <Typography variant="caption" sx={{ color: '#4B5563', fontWeight: 600, ml: 'auto' }}>
                      {new Date(n.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </Typography>
                  </Box>

                  <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 700, fontSize: '1.08rem', color: '#111827', lineHeight: 1.4, mb: 1 }}>
                    {n.titre}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#5A6B63', lineHeight: 1.75, flex: 1 }}>
                    {n.extrait}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, pt: 1.6, borderTop: '1px solid #EEF2F0' }}>
                    <Box sx={{
                      width: 26, height: 26, borderRadius: '50%', bgcolor: `${n.couleur}22`,
                      color: n.couleur, fontWeight: 800, fontSize: '0.7rem',
                      display: 'grid', placeItems: 'center',
                    }}>
                      {(n.auteur || 'B')[0]}
                    </Box>
                    <Typography variant="caption" sx={{ color: '#374151', fontWeight: 700 }}>
                      {n.auteur || 'Le Bureau'}
                    </Typography>
                    {/* Réactions */}
                    <Box sx={{ display: 'flex', gap: 0.6, ml: 'auto' }}>
                      {EMOJIS.map((emoji) => {
                        const actif = maReaction === emoji
                        const nb = reactions[emoji] ?? 0
                        return (
                          <Box key={emoji} component="button" onClick={() => reagir(emoji)}
                            title={user ? 'Réagir' : 'Connecte-toi pour réagir'}
                            sx={{
                              border: '1px solid', borderColor: actif ? '#1FAF72' : '#E5E7EB',
                              bgcolor: actif ? '#E4F8EF' : '#fff', borderRadius: '9999px',
                              px: 1, py: 0.2, fontSize: '0.8rem', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: 0.4,
                              transition: 'transform 140ms ease, background 140ms ease',
                              '&:hover': { transform: 'scale(1.08)', bgcolor: '#F6FBF9' },
                            }}>
                            <span>{emoji}</span>
                            {nb > 0 && (
                              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: actif ? '#0B7A4B' : '#6B7280' }}>
                                {nb}
                              </span>
                            )}
                          </Box>
                        )
                      })}
                    </Box>
                  </Box>

                  {/* Commentaires */}
                  <Button size="small" onClick={basculerCommentaires}
                    sx={{ alignSelf: 'flex-start', mt: 1, color: '#5A6B63', fontWeight: 700, fontSize: '0.76rem', p: 0, minWidth: 0 }}>
                    {ouverts ? 'Masquer les commentaires' : `Commentaires${(n.commentaires_count ?? 0) > 0 ? ` (${n.commentaires_count})` : ''}`}
                  </Button>
                  {ouverts && (
                    <Box sx={{ mt: 1, pt: 1.2, borderTop: '1px dashed #E5E7EB' }}>
                      {commentaires === null && (
                        <Typography variant="caption" sx={{ color: '#6B7280' }}>Chargement…</Typography>
                      )}
                      {(commentaires ?? []).map((c) => (
                        <Box key={c.id} sx={{ mb: 1.2 }}>
                          <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: '0.78rem' }}>
                            {c.auteur}{' '}
                            <Typography component="span" variant="caption" sx={{ color: '#6B7280', fontWeight: 600 }}>
                              {c.cree_le ? new Date(c.cree_le).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''}
                            </Typography>
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#374151', fontSize: '0.84rem', lineHeight: 1.6 }}>
                            {c.contenu}
                          </Typography>
                        </Box>
                      ))}
                      {commentaires !== null && commentaires.length === 0 && (
                        <Typography variant="caption" sx={{ color: '#6B7280' }}>
                          Sois le premier à réagir par écrit.
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <TextField size="small" fullWidth placeholder={user ? 'Écris un commentaire…' : 'Connecte-toi pour commenter'}
                          value={texte} onChange={(e) => setTexte(e.target.value.slice(0, 1000))}
                          onKeyDown={(e) => { if (e.key === 'Enter') commenter() }}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#F8FAF9' } }} />
                        <Button size="small" variant="contained" onClick={commenter} disabled={!texte.trim() || envoi}
                          sx={{ bgcolor: '#1FAF72', '&:hover': { bgcolor: '#179963' }, fontWeight: 800, borderRadius: '10px', flexShrink: 0 }}>
                          {envoi ? '…' : 'OK'}
                        </Button>
                      </Box>
                    </Box>
                  )}
                </Box>
              </Box>
            </motion.div>
  )
}
