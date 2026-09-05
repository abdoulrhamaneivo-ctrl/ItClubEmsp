import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Chip from '@mui/material/Chip'
import Switch from '@mui/material/Switch'
import CircularProgress from '@mui/material/CircularProgress'
import { api } from '../../lib/api'
import { EnteteModule, MessageFlash, useFlash, BoutonExport } from './_Commun'
import { modulesBackoffice } from '../../data/backoffice'
import { Fragment } from 'react'

/**
 * Back-office — Administration (ADMIN) : annuaire des comptes
 * (activation/désactivation), passation des 10 postes par email,
 * matrice des permissions par poste.
 */

const LIBELLES_POSTES = {
  P1: 'Président', P2: 'Vice-Présidente', P3: 'Secrétaire Générale',
  P4: 'Resp. Cellules', P5: 'Resp. Communication',
  P6: 'Resp. Activités', P7: 'Resp. Innovation', P8: 'Coordinateur Opportunités',
  P9: 'Resp. Programmation', P10: 'Resp. Ateliers',
  CHEF_CELLULE: 'Chef de cellule', ADMIN: 'Administrateur', MEMBRE: 'Membre simple',
}

export default function Admin() {
  const [message, notify] = useFlash()
  const [onglet, setOnglet] = useState(0)
  const [recherche, setRecherche] = useState('')
  const [emails, setEmails] = useState({})
  const [envoi, setEnvoi] = useState(null)
  const client = useQueryClient()

  const { data: users = [], isLoading: chargeUsers } = useQuery({
    queryKey: ['admin-users'], queryFn: () => api.getAdminUsers(),
  })
  const { data: roles = [], isLoading: chargeRoles } = useQuery({
    queryKey: ['admin-roles'], queryFn: () => api.getAdminRoles(),
  })

  const basculerActif = async (u) => {
    try {
      await api.majAdminUser(u.id, { is_active: !u.is_active })
      client.invalidateQueries({ queryKey: ['admin-users'] })
      notify('info', u.is_active ? `${u.nom} désactivé.` : `${u.nom} réactivé.`)
    } catch (e) {
      notify('error', e.message ?? 'Action impossible')
    }
  }

  const passer = async (code) => {
    const email = (emails[code] ?? '').trim()
    if (!email || envoi) return
    setEnvoi(code)
    try {
      const res = await api.passationRole(code, email)
      client.invalidateQueries({ queryKey: ['admin-roles'] })
      notify('success', `${code} → ${res.titulaire ?? 'vacant'}.`)
      setEmails((m) => ({ ...m, [code]: '' }))
    } catch (e) {
      notify('error', e.message ?? 'Passation impossible')
    } finally {
      setEnvoi(null)
    }
  }

  const filtres = users.filter((u) => {
    const q = recherche.trim().toLowerCase()
    if (!q) return true
    return (u.nom ?? '').toLowerCase().includes(q) || (u.email ?? '').toLowerCase().includes(q)
  })

  return (
    <Box sx={{ maxWidth: '100%' }}>
      <EnteteModule
        titre={<>Administration <Box component="span" sx={{ color: '#9AFBD7' }}>· club</Box></>}
        sousTitre="Comptes, postes, passation — la continuité du club."
        actions={['Comptes', 'Postes & passation', 'Permissions'].map((label, i) => (
          <Chip key={label} label={label} onClick={() => setOnglet(i)}
            sx={{
              fontWeight: 800, cursor: 'pointer',
              bgcolor: onglet === i ? '#1FAF72' : 'rgba(255,255,255,.12)', color: '#fff',
              '&:hover': { bgcolor: onglet === i ? '#179963' : 'rgba(255,255,255,.22)' },
            }} />
        ))}
      />
      <MessageFlash message={message} />

      {onglet === 0 && (
        <Box sx={{ bgcolor: '#fff', borderRadius: '18px', border: '1px solid #E8ECEA', p: { xs: 2.4, md: 3 } }}>
          <TextField size="small" label="Rechercher (nom, email)" value={recherche}
            onChange={(e) => setRecherche(e.target.value)} fullWidth
            sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
          {chargeUsers && <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress sx={{ color: '#1FAF72' }} /></Box>}
          {!chargeUsers && filtres.length === 0 && (
            <Typography sx={{ color: '#5A6B63', fontSize: '0.88rem' }}>
              {api.isMockMode() ? 'Annuaire disponible quand l’API est branchée.' : 'Aucun compte trouvé.'}
            </Typography>
          )}
          {filtres.map((u) => (
            <Box key={u.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.2, borderBottom: '1px solid #EEF2F0', opacity: u.is_active ? 1 : 0.55 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: '#0F5B3A14', display: 'grid', placeItems: 'center', color: '#0F5B3A', fontWeight: 800, flexShrink: 0 }}>
                {(u.nom ?? '?').slice(0, 1).toUpperCase()}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: '0.86rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.nom}
                </Typography>
                <Typography variant="caption" sx={{ color: '#5A6B63' }}>
                  {u.email} · {u.points ?? 0} pts · {u.niveau ?? ''}
                </Typography>
              </Box>
              {(u.roles ?? []).map((r) => (
                <Chip key={r} label={r} size="small" sx={{ bgcolor: '#EDE9FE', color: '#5B21B6', fontWeight: 800, height: 22, fontFamily: "'JetBrains Mono',monospace", fontSize: '0.64rem' }} />
              ))}
              <Switch checked={!!u.is_active} onChange={() => basculerActif(u)} title={u.is_active ? 'Désactiver' : 'Réactiver'}
                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#1FAF72' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#1FAF72' } }} />
            </Box>
          ))}
        </Box>
      )}

      {onglet === 1 && (
        <Box sx={{ bgcolor: '#fff', borderRadius: '18px', border: '1px solid #E8ECEA', p: { xs: 2.4, md: 3 } }}>
          <Typography sx={{ fontWeight: 800, color: '#111827', mb: 0.5 }}>
            Les 10 postes du Bureau
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', color: '#5A6B63', mb: 2 }}>
            Saisis l'email du nouveau titulaire pour chaque poste — effet immédiat sur la vitrine.
          </Typography>
          {chargeRoles && <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress sx={{ color: '#1FAF72' }} /></Box>}
          {roles.map((r) => (
            <Box key={r.code} sx={{ display: 'flex', gap: 1.5, alignItems: 'center', py: 1.4, borderBottom: '1px solid #EEF2F0', flexWrap: 'wrap' }}>
              <Chip label={r.code} size="small" sx={{ bgcolor: '#0F5B3A', color: '#fff', fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", flexShrink: 0 }} />
              <Box sx={{ flex: 1, minWidth: 180 }}>
                <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: '0.86rem' }}>{r.poste}</Typography>
                <Typography variant="caption" sx={{ color: r.titulaire ? '#0B7A4B' : '#B45309', fontWeight: 700 }}>
                  {r.titulaire ?? 'Vacant'}
                </Typography>
              </Box>
              <TextField size="small" placeholder="nouveau.titulaire@emsp.int" value={emails[r.code] ?? ''}
                onChange={(e) => setEmails((m) => ({ ...m, [r.code]: e.target.value }))}
                sx={{ width: 240, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
              <Button size="small" variant="contained" onClick={() => passer(r.code)}
                disabled={!(emails[r.code] ?? '').trim() || envoi === r.code}
                sx={{ bgcolor: '#1FAF72', '&:hover': { bgcolor: '#179963' }, fontWeight: 800, borderRadius: '10px', flexShrink: 0 }}>
                {envoi === r.code ? '…' : 'Passer'}
              </Button>
            </Box>
          ))}
        </Box>
      )}

      {onglet === 2 && <MatricePermissions />}
    </Box>
  )
}

/* ── Matrice : ce que chaque poste a le droit de faire ──────── */
function MatricePermissions() {
  const postes = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10', 'CHEF_CELLULE', 'ADMIN']
  const acces = (code, mod) => mod.roles.includes(code) || code === 'ADMIN'

  return (
    <Box sx={{ bgcolor: '#fff', borderRadius: '18px', border: '1px solid #E8ECEA', p: { xs: 2, md: 3 } }}>
      <Typography sx={{ fontWeight: 800, color: '#111827', mb: 0.5 }}>
        Qui a droit à quoi
      </Typography>
      <Typography variant="caption" sx={{ display: 'block', color: '#5A6B63', mb: 2, lineHeight: 1.7 }}>
        L'ADMIN voit tout. Le membre simple n'a que son espace (vitrine, forum, sondages).
        Le serveur applique les mêmes règles — cette table est le reflet exact du code.
      </Typography>
      <Box sx={{ overflowX: 'auto' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: `180px repeat(${modulesBackoffice.length}, 44px)`, gap: 0.6, minWidth: 900 }}>
          <Box />
          {modulesBackoffice.map((m) => {
            const I = m.Icone
            return (
              <Box key={m.path} title={m.label} sx={{ display: 'grid', placeItems: 'center', color: '#0F5B3A' }}>
                {I ? <I size={19} /> : null}
              </Box>
            )
          })}
          {postes.map((code) => (
            <Fragment key={code}>
              <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: '0.74rem', alignSelf: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {LIBELLES_POSTES[code] ?? code}
              </Typography>
              {modulesBackoffice.map((m) => (
                <Box key={`${code}-${m.path}`} title={`${LIBELLES_POSTES[code]} — ${m.label}`}
                  sx={{
                    width: 26, height: 26, borderRadius: '8px', placeSelf: 'center',
                    bgcolor: acces(code, m) ? '#1FAF72' : '#EEF2F0',
                    border: acces(code, m) ? '1px solid #0E7A50' : '1px solid #E2E8E5',
                  }} />
              ))}
            </Fragment>
          ))}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
        {modulesBackoffice.map((m) => (
          <Typography key={m.path} variant="caption" sx={{ color: '#5A6B63' }}>
            <Box component="span" sx={{ color: '#0F5B3A', fontWeight: 800 }}>{m.label}</Box> : {m.roles.join(' · ')}
          </Typography>
        ))}
      </Box>
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <BoutonExport action={() => api.exporterMembres()} label="Annuaire CSV" variant="contained" />
      </Box>
    </Box>
  )
}
