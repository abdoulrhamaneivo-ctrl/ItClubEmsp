import { useState } from 'react'
import { motion } from 'framer-motion'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Divider from '@mui/material/Divider'
import { useAuth, hasRole } from '../stores/auth'
import FondGlobalDonnees from '../components/ui-components/FondGlobalDonnees'
import TitreSection from '../components/ui-components/TitreSection'
import { IcMembres, IcCube, IcCalendrier, IcDocument, IcPhoto, IcTrophee, IcCommunication, iconePoste } from '../components/ui-components/IconesClub'

/**
 * Espace membre — dashboard personnel cohérent avec la vitrine :
 * accueil (carte membre + actions selon rôle), mes inscriptions,
 * ma cellule, mon profil. Responsive drawer→tabs, touch targets 44px.
 */

const libellesRoles = {
  P1: 'Président', P2: 'Vice-Présidente', P3: 'Secrétaire Générale',
  P4: 'Responsable des Cellules', P5: 'Responsable Communication',
  P6: 'Responsable des Activités', P7: 'Resp. Innovation & Solutions',
  P8: 'Coordinateur des Opportunités', P9: 'Resp. Programmation',
  P10: 'Responsable des Ateliers', CHEF_CELLULE: 'Chef de cellule', ADMIN: 'Administrateur',
}

const CODES_BUREAU = Object.keys(libellesRoles)

/* Données de démonstration — remplacées par GET /api/v1/me/* côté Django */
const MES_INSCRIPTIONS = [
  { id: 1, titre: 'Atelier Git & GitHub', date: '2026-10-12', lieu: 'Salle info 2', statut: 'Confirmé', couleur: '#1FAF72' },
  { id: 2, titre: 'Hackathon interne — 48h', date: '2026-10-25', lieu: 'Amphi A', statut: 'En liste d’attente', couleur: '#2563EB' },
  { id: 3, titre: 'Sortie culturelle — Grand-Bassam', date: '2026-11-08', lieu: 'Rendez-vous campus', statut: 'Confirmé', couleur: '#F5A623' },
]

const MA_CELLULE = {
  id: 'web', nom: 'Cellule Web', couleur: '#1FAF72', membres: 14,
  role: 'Membre actif',
  prochainesSessions: [
    { date: 'Ven 18 Oct — 15h', sujet: 'Revue de code : la plateforme du club' },
    { date: 'Ven 25 Oct — 15h', sujet: 'Atelier Django REST — suite' },
  ],
}

export default function Espace() {
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)
  const [onglet, setOnglet] = useState(0)
  if (!user) return null

  const estBureau = hasRole(user, CODES_BUREAU)
  const rolePrincipal = (user.roles ?? [])[0]?.code
  const initiale = (user.nom || 'M')[0]

  return (
    <Box sx={{ minHeight: '100vh', position: 'relative', bgcolor: '#F6F8F7' }}>
      <FondGlobalDonnees />

      {/* ── Barre d'entête espace ─────────────────────────────── */}
      <Box sx={{
        position: 'sticky', top: 0, zIndex: 1200,
        bgcolor: 'rgba(13,27,42,.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(154,251,215,.18)',
      }}>
        <Container maxWidth={false} sx={{ maxWidth: '1280px !important', px: { xs: 2.5, md: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.6 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.6, minWidth: 0 }}>
              <Avatar sx={{
                width: 42, height: 42, bgcolor: '#1FAF72',
                fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: 18,
              }}>
                {initiale}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography noWrap sx={{ color: '#fff', fontWeight: 800, fontSize: '0.95rem', fontFamily: "'Orbitron',sans-serif" }}>
                  {user.nom || 'Membre'}
                </Typography>
                <Typography noWrap variant="caption" sx={{ color: '#9AFBD7', fontWeight: 700, fontSize: '0.64rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Espace membre — IT-CLUB EMSP
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button href="/" size="small" sx={{ color: '#9AFBD7', fontWeight: 700, minWidth: { xs: 44, md: 64 } }}>
                Site
              </Button>
              <Button onClick={logout} size="small" sx={{
                color: '#fff', fontWeight: 700, minWidth: { xs: 44, md: 64 },
                border: '1px solid rgba(255,255,255,.3)', borderRadius: 6,
              }}>
                Quitter
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth={false} sx={{ position: 'relative', maxWidth: '1280px !important', px: { xs: 2.5, md: 4 }, py: { xs: 4, md: 6 } }}>
        {/* ── Carte membre vedette ─────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
          <Box sx={{
            borderRadius: '22px', overflow: 'hidden', position: 'relative',
            background: 'linear-gradient(120deg,#0D1B2A 0%,#0F5B3A 100%)',
            boxShadow: '0 18px 44px rgba(15,91,58,.25)',
            px: { xs: 3, md: 5 }, py: { xs: 3.5, md: 4.5 },
            mb: 4,
          }}>
            <Box sx={{ position: 'absolute', top: -70, right: '8%', width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle,rgba(31,175,114,.28),transparent 70%)', filter: 'blur(34px)' }} />
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', gap: { xs: 2.5, md: 4 }, flexWrap: 'wrap' }}>
              <Avatar sx={{
                width: { xs: 72, md: 96 }, height: { xs: 72, md: 96 },
                bgcolor: '#1FAF72', border: '3px solid rgba(154,251,215,.5)',
                fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: { xs: 30, md: 40 },
                boxShadow: '0 10px 26px rgba(0,0,0,.35)',
              }}>
                {initiale}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <Typography sx={{ color: '#9AFBD7', fontWeight: 800, fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', mb: 0.6 }}>
                  Bienvenue dans ton espace
                </Typography>
                <Typography sx={{ color: '#fff', fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: { xs: '1.3rem', md: '1.8rem' }, lineHeight: 1.25 }}>
                  {user.nom || 'Membre'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1.4 }}>
                  {(user.roles ?? []).map((r) => (
                    <Chip key={r.code} label={libellesRoles[r.code] ?? r.code} size="small"
                      sx={{ bgcolor: 'rgba(154,251,215,.16)', color: '#9AFBD7', fontWeight: 800, fontSize: '0.66rem', border: '1px solid rgba(154,251,215,.3)' }} />
                  ))}
                </Box>
              </Box>
              {estBureau && (
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  <Button variant="contained" href="/backoffice" size="large" sx={{
                    bgcolor: '#1FAF72', color: '#fff', '&:hover': { bgcolor: '#25C482' },
                    fontWeight: 800, borderRadius: 9999, px: 4, py: 1.5,
                    boxShadow: '0 8px 24px rgba(31,175,114,.5)',
                  }}>
                    Mon back-office →
                  </Button>
                </motion.div>
              )}
            </Box>
          </Box>
        </motion.div>

        {/* ── Notifications + raccourcis rapides ────────────────── */}
        <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', md: '1.2fr 1fr' }, mb: 5, alignItems: 'start' }}>
          {/* Notifications */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.3 }}>
            <Box sx={{ bgcolor: '#fff', borderRadius: '18px', border: '1px solid #E8ECEA', overflow: 'hidden' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.8, py: 2, borderBottom: '1px solid #EEF2F0' }}>
                <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IcCommunication taille={17} couleur="#0F5B3A" /> Notifications
                </Typography>
                <Chip label="3 nouvelles" size="small" sx={{ bgcolor: '#E4F8EF', color: '#0B7A4B', fontWeight: 800, fontSize: '0.64rem', height: 22 }} />
              </Box>
              {[
                { id: 1, titre: 'Ta place au Hackathon est en liste d’attente', date: 'il y a 2h', couleur: '#2563EB' },
                { id: 2, titre: 'Session Cellule Web — vendredi 15h, salle info 2', date: 'il y a 1j', couleur: '#1FAF72' },
                { id: 3, titre: 'Le PV du 7 mai est disponible dans la Documentation', date: 'il y a 3j', couleur: '#F5A623' },
              ].map((n, i, arr) => (
                <Box key={n.id} sx={{
                  display: 'flex', gap: 1.8, px: 2.8, py: 2,
                  borderBottom: i < arr.length - 1 ? '1px solid #F0F4F2' : 'none',
                  transition: 'background 160ms ease',
                  '&:hover': { bgcolor: '#F6FBF9' }, cursor: 'pointer',
                }}>
                  <Box sx={{
                    width: 8, height: 8, borderRadius: '50%', bgcolor: n.couleur, mt: 1, flexShrink: 0,
                    ...(i === 0 && { boxShadow: `0 0 0 4px ${n.couleur}22` }),
                  }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, color: '#111827', fontSize: '0.86rem', lineHeight: 1.5 }}>
                      {n.titre}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600, fontSize: '0.68rem' }}>
                      {n.date}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </motion.div>

          {/* Raccourcis contextuels */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14, duration: 0.3 }}>
            <Box sx={{ bgcolor: '#fff', borderRadius: '18px', border: '1px solid #E8ECEA', p: 2.8 }}>
              <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: '0.95rem', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <IcTrophee taille={17} couleur="#0F5B3A" /> Accès rapides
              </Typography>
              <Box sx={{ display: 'grid', gap: 1.2 }}>
                {[
                  { label: 'Voir les activités à venir', href: '/#activites', icone: <IcCalendrier taille={16} couleur="#2563EB" /> },
                  { label: 'Les actualités du club', href: '/#actualites', icone: <IcCommunication taille={16} couleur="#1FAF72" /> },
                  { label: 'Explorer la galerie', href: '/galerie', icone: <IcPhoto taille={16} couleur="#F5A623" /> },
                  { label: 'Documentation officielle', href: '/#documentation', icone: <IcDocument taille={16} couleur="#7B61FF" /> },
                ].map((r) => (
                  <Button key={r.label} component="a" href={r.href} fullWidth sx={{
                    justifyContent: 'flex-start', gap: 1.4, py: 1.4,
                    bgcolor: '#F6FBF9', border: '1px solid #E3EEE8', borderRadius: '12px',
                    color: '#111827', fontWeight: 700, fontSize: '0.84rem',
                    '&:hover': { bgcolor: '#EDF7F1', borderColor: '#C9DED4' },
                  }}>
                    {r.icone} {r.texte ?? r.label}
                  </Button>
                ))}
              </Box>
            </Box>
          </motion.div>
        </Box>

        {/* ── Onglets ──────────────────────────────────────────── */}
        <Tabs value={onglet} onChange={(_, v) => setOnglet(v)} variant="fullWidth"
          sx={{
            mb: 4, bgcolor: '#fff', borderRadius: '16px',
            border: '1px solid #E8ECEA', overflow: 'hidden',
            '& .MuiTab-root': { minHeight: 56, fontWeight: 800, fontSize: { xs: '0.8rem', md: '0.9rem' } },
          }}>
          <Tab icon={<IcCalendrier taille={19} couleur={onglet === 0 ? '#0F5B3A' : '#5A6B63'} />} iconPosition="start" label="Mes inscriptions" />
          <Tab icon={<IcCube taille={19} couleur={onglet === 1 ? '#0F5B3A' : '#5A6B63'} />} iconPosition="start" label="Ma cellule" />
          <Tab icon={<IcMembres taille={19} couleur={onglet === 2 ? '#0F5B3A' : '#5A6B63'} />} iconPosition="start" label="Mon profil" />
        </Tabs>

        {/* ── Contenu des onglets ──────────────────────────────── */}
        {onglet === 0 && <OngletInscriptions />}
        {onglet === 1 && <OngletCellule />}
        {onglet === 2 && <OngletProfil user={user} libelles={libellesRoles} />}
      </Container>
    </Box>
  )
}

/* ── Onglet : mes inscriptions ──────────────────────────────── */
function OngletInscriptions() {
  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      {MES_INSCRIPTIONS.map((insc, i) => (
        <motion.div key={insc.id}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 2.2, p: { xs: 2, md: 2.6 },
            bgcolor: '#fff', borderRadius: '16px', border: '1px solid #E8ECEA',
            boxShadow: '0 2px 10px rgba(13,27,42,.05)',
            transition: 'box-shadow 200ms ease',
            '&:hover': { boxShadow: '0 8px 22px rgba(13,27,42,.1)' },
          }}>
            {/* Badge date */}
            <Box sx={{
              width: 54, flexShrink: 0, borderRadius: '12px', py: 1.2,
              bgcolor: `${insc.couleur}14`, border: `1px solid ${insc.couleur}30`,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
            }}>
              <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: '1.15rem', lineHeight: 1, color: insc.couleur }}>
                {new Date(insc.date).getDate()}
              </Typography>
              <Typography sx={{ fontWeight: 800, fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: insc.couleur }}>
                {new Date(insc.date).toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')}
              </Typography>
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: '0.95rem', lineHeight: 1.35 }}>
                {insc.titre}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.4, flexWrap: 'wrap' }}>
                <IcCalendrier taille={13} couleur="#6B7280" />
                <Typography variant="caption" sx={{ color: '#4B5563', fontWeight: 600, fontSize: '0.74rem' }}>
                  {new Date(insc.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </Typography>
                <IcMembres taille={13} couleur="#6B7280" sx={{ ml: 0.5 }} />
                <Typography variant="caption" sx={{ color: '#4B5563', fontWeight: 600, fontSize: '0.74rem' }}>
                  {insc.lieu}
                </Typography>
              </Box>
            </Box>
            <Chip label={insc.statut} size="small" sx={{
              bgcolor: insc.statut === 'Confirmé' ? '#E4F8EF' : '#FFF6E0',
              color: insc.statut === 'Confirmé' ? '#0E9F6E' : '#B45309',
              fontWeight: 800, fontSize: '0.66rem', flexShrink: 0,
            }} />
          </Box>
        </motion.div>
      ))}
    </Box>
  )
}

/* ── Onglet : ma cellule ────────────────────────────────────── */
function OngletCellule() {
  return (
    <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1.2fr 1fr' }, alignItems: 'start' }}>
      {/* Carte cellule */}
      <Box sx={{
        p: { xs: 2.8, md: 3.5 }, bgcolor: '#fff', borderRadius: '18px',
        border: `1.5px solid ${MA_CELLULE.couleur}45`,
        boxShadow: `0 12px 30px ${MA_CELLULE.couleur}1E`,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box sx={{
            width: 56, height: 56, borderRadius: '16px',
            background: `linear-gradient(135deg,${MA_CELLULE.couleur},${MA_CELLULE.couleur}CC 60%,#0D1B2A)`,
            display: 'grid', placeItems: 'center',
            boxShadow: `0 8px 20px ${MA_CELLULE.couleur}44`,
          }}>
            <IcCube taille={28} couleur="#fff" />
          </Box>
          <Box>
            <Typography sx={{ color: MA_CELLULE.couleur, fontWeight: 800, fontSize: '0.68rem', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              {MA_CELLULE.role}
            </Typography>
            <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: '1.25rem', color: '#111827' }}>
              {MA_CELLULE.nom}
            </Typography>
          </Box>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: '0.9rem', mb: 1.5 }}>
          Prochaines sessions
        </Typography>
        <Box sx={{ display: 'grid', gap: 1.2 }}>
          {MA_CELLULE.prochainesSessions.map((s, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 1.4, alignItems: 'flex-start', p: 1.6, bgcolor: '#F6FBF9', borderRadius: '12px', border: '1px solid #E3EEE8' }}>
              <IcCalendrier taille={15} couleur={MA_CELLULE.couleur} />
              <Box>
                <Typography sx={{ fontWeight: 800, color: '#0F5B3A', fontSize: '0.78rem' }}>{s.date}</Typography>
                <Typography variant="body2" sx={{ color: '#5A6B63', lineHeight: 1.6 }}>{s.sujet}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Stats personnelles */}
      <Box sx={{ display: 'grid', gap: 2, alignContent: 'start' }}>
        {[
          { label: 'Sessions suivies', valeur: 12, icone: <IcCalendrier taille={20} couleur="#1FAF72" />, couleur: '#1FAF72' },
          { label: 'Activités participées', valeur: 5, icone: <IcTrophee taille={20} couleur="#2563EB" />, couleur: '#2563EB' },
          { label: 'Documents partagés', valeur: 3, icone: <IcDocument taille={20} couleur="#7B61FF" />, couleur: '#7B61FF' },
        ].map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.06, duration: 0.3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.2, bgcolor: '#fff', borderRadius: '16px', border: '1px solid #E8ECEA' }}>
              <Box sx={{ width: 46, height: 46, borderRadius: '12px', bgcolor: `${s.couleur}14`, display: 'grid', placeItems: 'center' }}>
                {s.icone}
              </Box>
              <Box>
                <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: '1.4rem', color: '#111827', lineHeight: 1.2 }}>
                  {s.valeur}
                </Typography>
                <Typography variant="caption" sx={{ color: '#5A6B63', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.64rem' }}>
                  {s.label}
                </Typography>
              </Box>
            </Box>
          </motion.div>
        ))}
      </Box>
    </Box>
  )
}

/* ── Onglet : mon profil ────────────────────────────────────── */
function OngletProfil({ user, libelles }) {
  return (
    <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, alignItems: 'start' }}>
      <Box sx={{ p: { xs: 2.8, md: 3.5 }, bgcolor: '#fff', borderRadius: '18px', border: '1px solid #E8ECEA' }}>
        <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: '1rem', mb: 2 }}>
          Mes informations
        </Typography>
        {[
          ['Nom', user.nom || '—'],
          ['Email', user.email || 'prenom.nom@emsp.int'],
        ].map(([label, valeur]) => (
          <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 1.4, borderBottom: '1px solid #EEF2F0' }}>
            <Typography variant="body2" sx={{ color: '#5A6B63', fontWeight: 600 }}>{label}</Typography>
            <Typography variant="body2" sx={{ color: '#111827', fontWeight: 700, textAlign: 'right', wordBreak: 'break-word' }}>{valeur}</Typography>
          </Box>
        ))}
        <Typography variant="caption" sx={{ display: 'block', mt: 2, color: '#5A6B63', lineHeight: 1.7 }}>
          Pour corriger une information, contacte la Secrétaire Générale — les données viennent de l'annuaire du club.
        </Typography>
      </Box>

      <Box sx={{ p: { xs: 2.8, md: 3.5 }, bgcolor: '#fff', borderRadius: '18px', border: '1px solid #E8ECEA' }}>
        <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: '1rem', mb: 2 }}>
          Mes rôles & permissions
        </Typography>
        <Box sx={{ display: 'grid', gap: 1.2 }}>
          {(user.roles ?? []).map((r) => {
            const I = iconePoste(libelles[r.code] ?? '')
            return (
              <Box key={r.code} sx={{ display: 'flex', alignItems: 'center', gap: 1.6, p: 1.6, bgcolor: '#F6FBF9', borderRadius: '12px', border: '1px solid #E3EEE8' }}>
                <Box sx={{ width: 38, height: 38, borderRadius: '10px', bgcolor: '#0F5B3A14', display: 'grid', placeItems: 'center' }}>
                  <I taille={18} couleur="#0F5B3A" />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: '0.86rem' }}>
                    {libelles[r.code] ?? r.code}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#5A6B63', fontWeight: 600 }}>
                    Code rôle : {r.code}
                  </Typography>
                </Box>
              </Box>
            )
          })}
        </Box>
      </Box>
    </Box>
  )
}
