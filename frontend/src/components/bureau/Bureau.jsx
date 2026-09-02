import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import FondPropre from '../ui-components/FondPropre'
import { BandeauAccent } from '../ui-components/FondPropre'
import TitreSection from '../ui-components/TitreSection'
import FondHalos from '../ui-components/FondHalos'
import { IcMembres, IcCube, IcDocument, iconePoste } from '../ui-components/IconesClub'
import { useBureau } from '../../hooks/useApi'

/**
 * Le Bureau — ORGANIGRAMME hiérarchique :
 *   Président (carte vedette) ──┬── Vice-Présidente ── Secrétaire Générale
 *                               └── grille des 7 responsables
 * Photos dès que disponibles (m.photo) — initiale en attendant.
 * Clic sur une carte = mission + objectif déployés.
 */

function AvatarMembre({ m, px, radius }) {
  return m.photo ? (
    <Box
      component="img"
      src={m.photo}
      alt={m.nom}
      sx={{
        width: px, height: px, borderRadius: radius, objectFit: 'cover',
        border: `2.5px solid ${m.couleur}`, flexShrink: 0,
        boxShadow: `0 8px 20px ${m.couleur}44`,
      }}
    />
  ) : (
    <Box sx={{
      width: px, height: px, borderRadius: radius, flexShrink: 0,
      background: `linear-gradient(135deg,${m.couleur},${m.couleur}CC 60%,#0D1B2A)`,
      display: 'grid', placeItems: 'center',
      color: '#fff', fontWeight: 800, fontSize: px * 0.34, fontFamily: "'Orbitron',sans-serif",
      boxShadow: `0 8px 20px ${m.couleur}44`,
    }}>
      {(m.nom || 'M')[0]}
    </Box>
  )
}

export default function Bureau() {
  const { data: bureau, loading, error } = useBureau()
  const [ouvert, setOuvert] = useState(null)

  if (loading) return <SqueletteBureau />
  if (error) return <ErreurChargement message={error} />
  if (!bureau || bureau.length === 0) return <Box sx={{ py: 8, textAlign: 'center' }}><Typography color="textSecondary">Aucun membre du bureau</Typography></Box>

  const tries = [...bureau].sort((a, b) => (a.ordre ?? a.id) - (b.ordre ?? b.id))
  const president = tries[0]
  const niveau2 = tries.slice(1, 3)
  const responsables = tries.slice(3)

  return (
    <Box id="bureau" sx={{ py: { xs: 6, md: 8 }, position: 'relative', overflow: 'hidden' }}>
      <FondPropre variante="gris" />
      <BandeauAccent couleur="#1FAF72" />
      <FondHalos couleurs={['rgba(31,175,114,.13)', 'rgba(37,99,235,.10)', 'rgba(245,166,35,.08)']} />

      <Container maxWidth={false} sx={{ position: 'relative', maxWidth: '1440px !important', px: { xs: 2.5, md: 4 } }}>
        <TitreSection
          badge="Gouvernance"
          titre="Le Bureau"
          sousTitre="Une équipe structurée pour t'accompagner : de la présidence aux cellules, chaque rôle a son interlocuteur."
          couleur="#1FAF72"
        />

        {/* ═══ NIVEAU 1 — Président (carte vedette centrée) ═════════ */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px' }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <Box
            onClick={() => setOuvert(ouvert === president.id ? null : president.id)}
            sx={{
              maxWidth: 720, mx: 'auto', bgcolor: '#fff', borderRadius: '20px', overflow: 'hidden',
              border: ouvert === president.id ? `1.5px solid ${president.couleur}` : '1px solid #E8ECEA',
              boxShadow: ouvert === president.id ? `0 14px 34px ${president.couleur}26` : '0 6px 20px rgba(13,27,42,.07)',
              cursor: 'pointer', position: 'relative',
              transition: 'border 220ms ease, box-shadow 220ms ease',
              '&:hover': { boxShadow: '0 12px 28px rgba(13,27,42,.12)' },
            }}
          >
            <Box sx={{ height: 8, background: `linear-gradient(90deg,${president.couleur},#1FAF72,#0D1B2A)` }} />
            <Box sx={{ p: 3.5, display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
              <AvatarMembre m={president} px={96} radius="24px" />
              <Box sx={{ flex: 1, minWidth: 220 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 0.5 }}>
                  {(() => { const I = iconePoste(president.poste); return <I taille={16} couleur={president.couleur} /> })()}
                  <Typography sx={{ color: president.couleur, fontWeight: 800, fontSize: '0.78rem', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
                    {president.poste}
                  </Typography>
                </Box>
                <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: { xs: '1.4rem', md: '1.7rem' }, color: '#111827' }}>
                  {president.nom}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1, lineHeight: 1.75 }}>
                  {president.mission}
                </Typography>
              </Box>
              <Box sx={{ px: 1.8, py: 0.6, borderRadius: 9999, bgcolor: `${president.couleur}14`, color: president.couleur, fontWeight: 800, fontSize: '0.62rem', letterSpacing: '0.12em' }}>
                BUREAU EXÉCUTIF
              </Box>
            </Box>
          </Box>
        </motion.div>

        {/* Connecteur vertical Président → niveau 2 */}
        <Box sx={{
          width: 2, height: 34, mx: 'auto',
          background: 'linear-gradient(180deg,#1FAF72,#C9D4CF)',
          display: { xs: 'none', md: 'block' },
        }} />

        {/* ═══ NIVEAU 2 — VP + SG (connectés au Président) ══════════ */}
        <Box sx={{
          display: { xs: 'flex', md: 'grid' }, flexDirection: 'column', gap: 2.5,
          gridTemplateColumns: '1fr 1fr', maxWidth: 860, mx: 'auto', position: 'relative',
        }}>
          {/* Barre horizontale de branchement (desktop) */}
          <Box sx={{
            display: { xs: 'none', md: 'block' },
            position: 'absolute', top: -18, left: '25%', right: '25%', height: 2,
            background: '#C9D4CF',
          }} />
          {niveau2.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '0px' }}
              transition={{ delay: 0.08 + i * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Tige verticale vers cette carte */}
              <Box sx={{ display: { xs: 'none', md: 'block' }, width: 2, height: 16, mx: 'auto', background: '#C9D4CF', mb: 0.5 }} />
              <CartePoste m={m} ouvert={ouvert === m.id} onToggle={() => setOuvert(ouvert === m.id ? null : m.id)} moyenne />
            </motion.div>
          ))}
        </Box>

        {/* ═══ NIVEAU 3 — Les responsables ═══════════════════════════ */}
        <Box sx={{ textAlign: 'center', mt: 6, mb: 3 }}>
          <Typography sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5, color: '#5A6B63', fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            <span style={{ width: 40, height: 1, background: '#C9D4CF', display: 'inline-block' }} />
            Les responsables
            <span style={{ width: 40, height: 1, background: '#C9D4CF', display: 'inline-block' }} />
          </Typography>
        </Box>
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(3,1fr)' }, alignItems: 'start' }}>
          {responsables.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '0px' }}
              transition={{ delay: Math.min(i * 0.045, 0.3), duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <CartePoste m={m} ouvert={ouvert === m.id} onToggle={() => setOuvert(ouvert === m.id ? null : m.id)} />
            </motion.div>
          ))}
        </Box>

        {/* KPIs */}
        <Box sx={{ mt: 6, display: 'flex', gap: { xs: 2, md: 4 }, justifyContent: 'center', flexWrap: 'wrap' }}>
          <StatRapide label="Postes du Bureau" valeur={bureau.length} icone={<IcMembres taille={22} couleur="#1FAF72" />} />
          <StatRapide label="Cellules animées" valeur={4} icone={<IcCube taille={22} couleur="#2563EB" />} />
          <StatRapide label="Documents de référence" valeur={15} icone={<IcDocument taille={22} couleur="#7B61FF" />} />
        </Box>
      </Container>
    </Box>
  )
}

/* ── Carte poste (niveaux 2 et 3) ───────────────────────────── */
function CartePoste({ m, ouvert, onToggle, moyenne = false }) {
  const I = iconePoste(m.poste)
  return (
    <Box
      onClick={onToggle}
      sx={{
        bgcolor: '#fff', borderRadius: '16px', overflow: 'hidden',
        border: ouvert ? `1.5px solid ${m.couleur}` : '1px solid #E8ECEA',
        boxShadow: ouvert ? `0 12px 30px ${m.couleur}22` : '0 2px 10px rgba(13,27,42,.05)',
        cursor: 'pointer', height: '100%',
        transition: 'border 220ms ease, box-shadow 220ms ease',
        '&:hover': { boxShadow: '0 8px 22px rgba(13,27,42,.1)' },
      }}
    >
      <Box sx={{ p: moyenne ? 2.4 : 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <AvatarMembre m={m} px={moyenne ? 60 : 48} radius={moyenne ? '16px' : '13px'} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.3 }}>
            <I taille={13} couleur={m.couleur} />
            <Typography noWrap sx={{ color: m.couleur, fontWeight: 800, fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', lineHeight: 1.3, maxWidth: '100%' }}>
              {m.poste}
            </Typography>
          </Box>
          <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: moyenne ? '0.98rem' : '0.88rem', color: '#111827', lineHeight: 1.35 }}>
            {m.nom}
          </Typography>
        </Box>
      </Box>

      <AnimatePresence initial={false}>
        {ouvert && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <Box sx={{ px: moyenne ? 2.4 : 2, pb: moyenne ? 2.4 : 2, display: 'grid', gap: 1.4 }}>
              <Box sx={{ p: 1.7, bgcolor: 'rgba(31,175,114,.06)', borderRadius: '10px' }}>
                <Typography variant="subtitle2" sx={{ color: '#0F5B3A', fontWeight: 800, mb: 0.4, fontSize: '0.74rem' }}>
                  Mission
                </Typography>
                <Typography variant="body2" sx={{ color: '#5A6B63', lineHeight: 1.7 }}>
                  {m.mission}
                </Typography>
              </Box>
              <Box sx={{ p: 1.7, bgcolor: 'rgba(37,99,235,.06)', borderRadius: '10px' }}>
                <Typography variant="subtitle2" sx={{ color: '#1E40AF', fontWeight: 800, mb: 0.4, fontSize: '0.74rem' }}>
                  Objectif prioritaire
                </Typography>
                <Typography variant="body2" sx={{ color: '#5A6B63', lineHeight: 1.7 }}>
                  {m.objectif}
                </Typography>
              </Box>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  )
}

/* ── Stat rapide ────────────────────────────────────────────── */
function StatRapide({ label, valeur, icone, couleur }) {
  return (
    <Box sx={{ textAlign: 'center', p: { xs: 2, md: 3 }, minWidth: 130, bgcolor: '#fff', borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,.04)' }}>
      <Box sx={{ width: 46, height: 46, borderRadius: '12px', mx: 'auto', mb: 1, bgcolor: `${couleur}14`, display: 'grid', placeItems: 'center' }}>
        {icone}
      </Box>
      <Typography variant="h5" sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>
        {valeur}
      </Typography>
      <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.62rem' }}>
        {label}
      </Typography>
    </Box>
  )
}

/* ── Squelette & erreur ─────────────────────────────────────── */
function SqueletteBureau() {
  return (
    <Box sx={{ py: 8 }}>
      <Container>
        <Typography component="h2" sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 700, fontSize: { xs: '1.75rem', md: '2.5rem' }, color: '#111827', mb: 4 }}>
          Le Bureau
        </Typography>
        <Box sx={{ maxWidth: 720, mx: 'auto', height: 170, bgcolor: '#F5F5F5', borderRadius: '20px', mb: 2.5 }} />
        <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, maxWidth: 860, mx: 'auto', mb: 2.5 }}>
          <Box sx={{ height: 130, bgcolor: '#F5F5F5', borderRadius: '16px' }} />
          <Box sx={{ height: 130, bgcolor: '#F5F5F5', borderRadius: '16px' }} />
        </Box>
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(3,1fr)' } }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Box key={i} sx={{ height: 100, bgcolor: '#F5F5F5', borderRadius: '16px' }} />
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
