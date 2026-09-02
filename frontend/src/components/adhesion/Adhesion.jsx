import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import FondPropre from '../ui-components/FondPropre'
import { BandeauAccent } from '../ui-components/FondPropre'
import FondHalos from '../ui-components/FondHalos'
import { ButtonStyles } from '../ui-components/DesignSystem'
import { api } from '../../lib/api'
import { chargerConfig, validerChamp } from '../../data/formulaireConfig'

/**
 * Parcours d'adhésion — 3 étapes animées, champs DYNAMIQUES issus de la
 * configuration du back-office (data/formulaireConfig.js — éditables dans
 * /backoffice/formulaire). Transitions directionnelles + écran de succès festif.
 */

const CELLULES = [
  { id: 'web', nom: 'Cellule Web', couleur: '#1FAF72', icone: '💻', tag: 'React · Django · Déploiement' },
  { id: 'ia', nom: 'Cellule IA', couleur: '#2563EB', icone: '🤖', tag: 'Python · LLMs · Data' },
  { id: 'cyber', nom: 'Cellule Cybersécurité', couleur: '#0F5B3A', icone: '🛡️', tag: 'Linux · CTF · Sécurité' },
  { id: 'design', nom: 'Cellule Design', couleur: '#7B61FF', icone: '🎨', tag: 'Figma · Vidéo · Identité' },
]

const ETAPES = [
  { titre: 'Qui es-tu ?', sousTitre: 'On veut savoir qui tu es avant tout' },
  { titre: 'Tes cellules', sousTitre: 'Choisis au moins une — tu pourras changer plus tard' },
  { titre: 'Dernière ligne droite', sousTitre: 'Compléments, conditions, et c’est parti' },
]

const slideVariants = {
  entree: (dir) => ({ opacity: 0, x: dir >= 0 ? 60 : -60 }),
  centre: { opacity: 1, x: 0 },
  sortie: (dir) => ({ opacity: 0, x: dir >= 0 ? -60 : 60 }),
}

export default function Adhesion() {
  const [etape, setEtape] = useState(0)
  const [direction, setDirection] = useState(1)
  const [envoye, setEnvoye] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState(null)
  const [choix, setChoix] = useState({})
  const [accepteConditions, setAccepteConditions] = useState(false)
  const champs = useMemo(() => chargerConfig(), [])
  const [donnees, setDonnees] = useState(() => {
    // état initial piloté par la config dynamique
    const init = {}
    for (const c of chargerConfig()) init[c.id] = ''
    return init
  })

  const maj = (champ) => (e) => setDonnees((d) => ({ ...d, [champ]: e.target.value }))
  const cellulesChoisies = Object.keys(choix).filter((k) => choix[k])

  const champsIdentite = champs.filter((c) => c.groupe === 'identite')
  const champsComplement = champs.filter((c) => c.groupe === 'complement')

  const allerA = (n) => { setDirection(n > etape ? 1 : -1); setErreur(null); setEtape(n) }

  const validerEtape1 = () => {
    for (const c of champsIdentite) {
      const err = validerChamp(c, donnees[c.id])
      if (err) return err
    }
    return null
  }

  const suivant = () => {
    if (etape === 0) {
      const err = validerEtape1()
      if (err) return setErreur(err)
    }
    if (etape === 1 && cellulesChoisies.length === 0) return setErreur('Choisis au moins une cellule')
    allerA(etape + 1)
  }

  const submit = async () => {
    // validation finale de tous les champs dynamiques
    for (const c of champs) {
      const err = validerChamp(c, donnees[c.id])
      if (err) { setErreur(err); allerA(c.groupe === 'identite' ? 0 : 2); return }
    }
    if (!accepteConditions) return setErreur('Tu dois accepter la charte et le règlement intérieur')
    setEnvoi(true)
    setErreur(null)
    const payload = {
      ...donnees,
      cellules: cellulesChoisies,
      accepteConditions: true,
      dateAcceptation: new Date().toISOString(),
    }
    try {
      await api.postAdhesion(payload)
      setEnvoye(true)
    } catch (e) {
      setErreur(e.message || 'Erreur lors de l’envoi')
    } finally {
      setEnvoi(false)
    }
  }

  const rendreChamp = (c) => {
    const labelMaj = (
      <Box component="span" sx={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#374151' }}>
        {c.label} {c.requis && <Box component="span" sx={{ color: '#B42318' }}>*</Box>}
      </Box>
    )
    if (c.type === 'textarea') {
      return <TextField key={c.id} label={labelMaj} multiline rows={3} value={donnees[c.id] ?? ''} onChange={maj(c.id)} placeholder={c.aide} fullWidth />
    }
    if (c.type === 'select') {
      return (
        <TextField key={c.id} select label={labelMaj} value={donnees[c.id] ?? ''} onChange={maj(c.id)} fullWidth>
          {(c.options ?? []).map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
        </TextField>
      )
    }
    return <TextField key={c.id} label={labelMaj} type={c.type === 'tel' ? 'tel' : c.type} value={donnees[c.id] ?? ''} onChange={maj(c.id)} placeholder={c.aide} fullWidth />
  }

  return (
    <Box id="adhesion" sx={{ py: { xs: 6, md: 8 }, position: 'relative', overflow: 'hidden' }}>
      <FondPropre variante="doux" />
      <BandeauAccent couleur="#F5A623" />
      <FondHalos couleurs={['rgba(245,166,35,.13)', 'rgba(31,175,114,.12)', 'rgba(37,99,235,.10)']} />

      <Container maxWidth="md" sx={{ position: 'relative' }}>
        {/* ── Titre ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px' }}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        >
          <Box sx={{ mb: 5 }}>
            <Typography variant="overline" sx={{ color: '#F5A623', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', mb: 1.5, display: 'inline-block', borderBottom: '3px solid #F5A623', paddingBottom: 4 }}>
              Nous rejoindre
            </Typography>
            <Typography component="h2" sx={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: { xs: '1.75rem', md: '2.5rem' }, lineHeight: 1.2, color: '#111827', mb: 2 }}>
              Rejoins le club en 3 étapes
            </Typography>
            <Typography color="textSecondary" maxWidth={580} sx={{ lineHeight: 1.7 }}>
              Pas de conditions compliquées : si tu es à l&apos;EMSP et que la tech t&apos;intéresse,
              tu es au bon endroit. Ta candidature est validée par un membre du Bureau sous 48h.
            </Typography>
          </Box>
        </motion.div>

        {envoye ? (
          <EcranSucces prenom={donnees.prenom || donnees[Object.keys(donnees)[0]]} />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.38, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
          >
            <Box sx={{
              bgcolor: '#fff', borderRadius: '22px', border: '1px solid #E5E7EB',
              boxShadow: '0 16px 44px rgba(15,91,58,.10)', overflow: 'hidden',
            }}>
              {/* ── Bandeau d'en-tête du formulaire (style image 9) ── */}
              <Box sx={{
                position: 'relative', overflow: 'hidden',
                background: 'linear-gradient(135deg,#0D1B2A 0%,#0F5B3A 130%)',
                px: { xs: 2.5, md: 5 }, py: 3.5,
              }}>
                <Box sx={{ position: 'absolute', top: -60, right: -40, width: 180, height: 180, borderRadius: '50%', bgcolor: 'rgba(31,175,114,.22)' }} />
                <Box sx={{ position: 'relative' }}>
                  <Typography sx={{ color: '#9AFBD7', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.26em', textTransform: 'uppercase', mb: 0.5 }}>
                    IT-CLUB EMSP
                  </Typography>
                  <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: { xs: '1.3rem', md: '1.6rem' }, color: '#fff' }}>
                    Devenir membre
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,.75)', mt: 0.5 }}>
                    Remplis le formulaire ci-dessous pour soumettre ta demande d&apos;adhésion.
                  </Typography>
                </Box>
              </Box>

              {/* ── Stepper ─────────────────────────────────────── */}
              <Box sx={{ px: { xs: 2.5, md: 5 }, pt: 4, pb: 3, borderBottom: '1px solid #EEF2F0', bgcolor: '#FBFDFC' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {ETAPES.map((e, i) => (
                    <Box key={e.titre} sx={{ display: 'flex', alignItems: 'center', flex: i < ETAPES.length - 1 ? 1 : '0 0 auto' }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.8 }}>
                        <motion.div
                          animate={{
                            scale: etape === i ? 1.12 : 1,
                            backgroundColor: etape > i ? '#1FAF72' : etape === i ? '#0F5B3A' : '#E5E7EB',
                            color: etape >= i ? '#fff' : '#9CA3AF',
                          }}
                          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                          style={{
                            width: 42, height: 42, borderRadius: '50%', display: 'grid', placeItems: 'center',
                            fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: 15,
                            boxShadow: etape === i ? '0 6px 18px rgba(15,91,58,.35)' : 'none',
                            cursor: etape > i ? 'pointer' : 'default',
                          }}
                          onClick={() => etape > i && allerA(i)}
                        >
                          {etape > i ? '✓' : i + 1}
                        </motion.div>
                        <Typography variant="caption" sx={{
                          fontWeight: 800, fontSize: '0.68rem', letterSpacing: '0.04em',
                          color: etape === i ? '#0F5B3A' : '#9CA3AF', textTransform: 'uppercase',
                          whiteSpace: 'nowrap',
                        }}>
                          {e.titre}
                        </Typography>
                      </Box>
                      {i < ETAPES.length - 1 && (
                        <Box sx={{ flex: 1, mx: 1.5, mb: 2.6 }}>
                          <Box sx={{ height: 3, borderRadius: 2, bgcolor: '#E5E7EB', overflow: 'hidden' }}>
                            <motion.div
                              animate={{ width: etape > i ? '100%' : '0%' }}
                              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                              style={{ height: '100%', background: 'linear-gradient(90deg,#0F5B3A,#1FAF72)' }}
                            />
                          </Box>
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* ── Contenu de l'étape ──────────────────────────── */}
              <Box sx={{ px: { xs: 2.5, md: 5 }, py: 4, minHeight: 380 }}>
                <AnimatePresence mode="wait" custom={direction} initial={false}>
                  <motion.div
                    key={etape}
                    custom={direction}
                    variants={slideVariants}
                    initial="entree"
                    animate="centre"
                    exit="sortie"
                    transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: '1.15rem', mb: 0.4 }}>
                      {ETAPES[etape].titre}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                      {ETAPES[etape].sousTitre}
                    </Typography>

                    {erreur && (
                      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                        <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2, bgcolor: '#FEF2F2', color: '#991B1B' }}>
                          {erreur}
                        </Alert>
                      </motion.div>
                    )}

                    {etape === 0 && (
                      <Box sx={{ display: 'grid', gap: 2.5 }}>
                        <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                          {champsIdentite.slice(0, 2).map(rendreChamp)}
                        </Box>
                        {champsIdentite.slice(2).map(rendreChamp)}
                      </Box>
                    )}

                    {etape === 1 && (
                      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                        {CELLULES.map((c, i) => (
                          <motion.button
                            key={c.id}
                            type="button"
                            onClick={() => setChoix((p) => ({ ...p, [c.id]: !p[c.id] }))}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                            whileHover={{ scale: 1.02, y: -3 }}
                            whileTap={{ scale: 0.97 }}
                            style={{
                              position: 'relative', textAlign: 'left', cursor: 'pointer',
                              border: `2px solid ${choix[c.id] ? c.couleur : '#E5E7EB'}`,
                              borderRadius: 16, padding: '18px 18px 15px',
                              background: choix[c.id] ? `${c.couleur}0D` : '#fff',
                              boxShadow: choix[c.id] ? `0 10px 26px ${c.couleur}33` : '0 2px 10px rgba(0,0,0,.04)',
                              fontFamily: 'inherit',
                            }}
                          >
                            <AnimatePresence>
                              {choix[c.id] && (
                                <motion.div
                                  initial={{ scale: 0, rotate: -90 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  exit={{ scale: 0 }}
                                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                                  style={{
                                    position: 'absolute', top: 12, right: 12, width: 26, height: 26,
                                    borderRadius: '50%', background: c.couleur, color: '#fff',
                                    display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 800,
                                  }}
                                >
                                  ✓
                                </motion.div>
                              )}
                            </AnimatePresence>
                            <Typography sx={{ fontSize: 30, mb: 0.8 }}>{c.icone}</Typography>
                            <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: '0.98rem' }}>{c.nom}</Typography>
                            <Typography variant="caption" sx={{ color: '#5A6B63', display: 'block', mt: 0.4 }}>{c.tag}</Typography>
                          </motion.button>
                        ))}
                      </Box>
                    )}

                    {etape === 2 && (
                      <Box sx={{ display: 'grid', gap: 2.5 }}>
                        {/* Récap animé */}
                        <Box sx={{
                          p: 2.5, borderRadius: '14px', bgcolor: '#F6FBF9', border: '1px solid #E3EEE8',
                          display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center',
                        }}>
                          <Chip label={`${donnees.prenom || ''} ${donnees.nom || ''}`.trim() || 'Candidat'} sx={{ bgcolor: '#0F5B3A', color: '#fff', fontWeight: 700 }} />
                          {donnees.email && <Chip label={donnees.email} variant="outlined" sx={{ fontWeight: 600 }} />}
                          {donnees.filiere && <Chip label={donnees.filiere} variant="outlined" sx={{ fontWeight: 600 }} />}
                          {cellulesChoisies.map((id) => {
                            const c = CELLULES.find((x) => x.id === id)
                            return (
                              <motion.div key={id} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 18 }}>
                                <Chip label={`${c.icone} ${c.nom}`} sx={{ bgcolor: `${c.couleur}1A`, color: c.couleur, fontWeight: 800 }} />
                              </motion.div>
                            )
                          })}
                        </Box>

                        {champsComplement.map(rendreChamp)}

                        <Box sx={{ p: 2.5, bgcolor: '#F0FDF4', border: '1px solid #1FAF72', borderRadius: 3 }}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={accepteConditions}
                                onChange={() => setAccepteConditions((v) => !v)}
                                sx={{ color: '#1FAF72' }}
                              />
                            }
                            label={
                              <Box sx={{ lineHeight: 1.6 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F5B3A', mb: 0.5 }}>
                                  J&apos;accepte la charte et le règlement intérieur du IT-CLUB EMSP
                                </Typography>
                                <Typography variant="body2" color="textSecondary" sx={{ lineHeight: 1.7 }}>
                                  Je certifie que les informations fournies sont exactes et m&apos;engage à respecter
                                  la charte du club et les décisions du Bureau.
                                  <Box component="a" href="#documentation" sx={{ color: '#1FAF72', textDecoration: 'underline', cursor: 'pointer', ml: 0.5 }}>
                                    Consulter la charte →
                                  </Box>
                                </Typography>
                              </Box>
                            }
                          />
                        </Box>
                      </Box>
                    )}
                  </motion.div>
                </AnimatePresence>
              </Box>

              {/* ── Navigation — CTA aligné à droite (convention formulaire progressif) ── */}
              <Box sx={{
                px: { xs: 2.5, md: 5 }, py: 2.5, borderTop: '1px solid #EEF2F0',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#FBFDFC',
              }}>
                <Button onClick={() => allerA(etape - 1)} disabled={etape === 0} sx={{ color: '#5A6B63', fontWeight: 700, visibility: etape === 0 ? 'hidden' : 'visible' }}>
                  ← Retour
                </Button>

                <Typography variant="caption" sx={{ color: '#9CA3AF', fontWeight: 700, letterSpacing: '0.06em' }}>
                  ÉTAPE {etape + 1} / 3
                </Typography>

                {etape < 2 ? (
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button
                      variant="contained" onClick={suivant}
                      sx={{ bgcolor: '#0F5B3A', '&:hover': { bgcolor: '#0c4a2f' }, fontWeight: 800, borderRadius: '12px', px: 3.5 }}
                    >
                      Continuer →
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button
                      variant="contained" onClick={submit} disabled={envoi || !accepteConditions}
                      sx={{
                        bgcolor: '#1FAF72', '&:hover': { bgcolor: '#179963' },
                        fontWeight: 800, borderRadius: '12px', px: 3.5,
                        opacity: accepteConditions ? 1 : 0.6,
                      }}
                    >
                      {envoi ? 'Envoi…' : 'Envoyer ma candidature →'}
                    </Button>
                  </motion.div>
                )}
              </Box>
            </Box>
          </motion.div>
        )}
      </Container>
    </Box>
  )
}

/* ── Écran de succès avec confettis ─────────────────────────── */
function EcranSucces({ prenom }) {
  const confettis = Array.from({ length: 14 }, (_, i) => ({
    x: (i - 7) * 34, r: 360 * (i % 2 ? 1 : -1), c: ['#1FAF72', '#F5A623', '#2563EB', '#7B61FF'][i % 4],
  }))
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box sx={{ position: 'relative', p: { xs: 4, md: 6 }, bgcolor: '#fff', borderRadius: '22px', border: '1px solid #E3EEE8', textAlign: 'center', overflow: 'hidden', boxShadow: '0 16px 44px rgba(15,91,58,.12)' }}>
        {confettis.map((cf, i) => (
          <motion.span
            key={i}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
            animate={{ x: cf.x, y: [-10, -120, 60][i % 3], opacity: [1, 1, 0], scale: [0, 1.2, 0.6], rotate: cf.r }}
            transition={{ duration: 1.4, delay: 0.08 + i * 0.04, ease: 'easeOut' }}
            style={{ position: 'absolute', left: '50%', top: '38%', width: 9, height: 9, borderRadius: 2, background: cf.c }}
          />
        ))}
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.06 }}
          style={{ width: 84, height: 84, margin: '0 auto 20px', borderRadius: '50%', background: 'linear-gradient(135deg,#0F5B3A,#1FAF72)', display: 'grid', placeItems: 'center', fontSize: 40, color: '#fff' }}
        >
          ✓
        </motion.div>
        <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: '1.4rem', color: '#0F5B3A', mb: 1.5 }}>
          Bienvenue{prenom ? ` ${prenom}` : ''} !
        </Typography>
        <Typography color="textSecondary" sx={{ maxWidth: 420, mx: 'auto', lineHeight: 1.7 }}>
          Ta candidature est enregistrée. Tu recevras un e-mail dès sa validation
          par le Bureau — et ton QR code d&apos;accès membre.
        </Typography>
      </Box>
    </motion.div>
  )
}
