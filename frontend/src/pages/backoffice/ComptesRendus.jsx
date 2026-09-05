import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Switch from '@mui/material/Switch'
import SendIcon from '@mui/icons-material/Send'
import AddIcon from '@mui/icons-material/Add'
import { api } from '../../lib/api'
import { BoutonExport } from './_Commun'

/**
 * Back-office — Comptes rendus & convocations (SG, P1/P3).
 * Onglet Convoquer : formulaire → POST /reunions/convocation
 * (tous les membres OU liste d'emails). Rappel H-48h auto via cron.
 * Onglet Envoyées : historique des convocations (traces Notification).
 * Onglet Comptes rendus : rédaction → validation → publication.
 */

const champSx = {
  '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#F8FAF9' },
}

export default function ComptesRendus() {
  const [onglet, setOnglet] = useState(0)
  const [titre, setTitre] = useState('')
  const [dateStr, setDateStr] = useState('')
  const [lieu, setLieu] = useState('')
  const [ordre, setOrdre] = useState('')
  const [tous, setTous] = useState(true)
  const [emails, setEmails] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [message, setMessage] = useState(null)

  const { data: notifs } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.getNotifications(),
  })
  const envoyees = (notifs ?? []).filter((n) => n.type === 'convocation').slice(0, 8)

  const notify = (t, m) => { setMessage({ t, m }); setTimeout(() => setMessage(null), 5000) }

  const listeEmails = emails.split(/[\n,;]+/).map((e) => e.trim()).filter(Boolean)

  const peutEnvoyer = titre.trim() && (tous || listeEmails.length > 0) && !envoi

  const envoyer = async () => {
    setEnvoi(true)
    try {
      const res = await api.envoyerConvocation({
        titre: titre.trim(),
        emails: tous ? [] : listeEmails,
        tous_membres: tous,
        date_str: dateStr.trim(),
        lieu: lieu.trim(),
        ordre_du_jour: ordre.trim(),
      })
      const nb = res.envoyes ?? 0
      notify('success', `Convocation envoyée à ${nb} destinataire${nb > 1 ? 's' : ''}${(res.ignores ?? []).length > 0 ? ` (${res.ignores.length} échec${res.ignores.length > 1 ? 's' : ''})` : ''} — rappel automatique 48h avant.`)
      setTitre(''); setDateStr(''); setLieu(''); setOrdre(''); setEmails('')
    } catch (e) {
      notify('error', e.message ?? 'Envoi impossible')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <Box sx={{ maxWidth: '100%' }}>
      <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <Box sx={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3,
          background: 'linear-gradient(135deg,#0D1B2A 0%,#0F5B3A 100%)',
          borderRadius: '20px', px: 3.5, py: 3,
        }}>
          <Box>
            <Typography sx={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: '1.45rem', color: '#fff' }}>
              Réunions <Box component="span" sx={{ color: '#9AFBD7' }}>· convocations</Box>
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,.78)', mt: 0.5 }}>
              Convoque le Bureau ou tous les membres — le rappel part seul 48h avant.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {['Convoquer', `Envoyées${envoyees.length > 0 ? ` (${envoyees.length})` : ''}`, 'Comptes rendus'].map((label, i) => (
              <Chip key={label} label={label} onClick={() => setOnglet(i)}
                sx={{
                  fontWeight: 800, cursor: 'pointer',
                  bgcolor: onglet === i ? '#1FAF72' : 'rgba(255,255,255,.12)', color: '#fff',
                  '&:hover': { bgcolor: onglet === i ? '#179963' : 'rgba(255,255,255,.22)' },
                }} />
            ))}
          </Box>
        </Box>
      </motion.div>

      <AnimatePresence>
        {message && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Alert severity={message.t === 'success' ? 'success' : 'error'} sx={{ mb: 2, borderRadius: '12px' }}>
              {message.m}
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {onglet === 0 && (
        <Box sx={{ bgcolor: '#fff', borderRadius: '18px', border: '1px solid #E8ECEA', p: { xs: 2.5, md: 3.2 }, display: 'grid', gap: 2 }}>
          <TextField label="Titre de la réunion *" value={titre} onChange={(e) => setTitre(e.target.value)}
            placeholder="Ex. Réunion Bureau — bilan du mois" fullWidth sx={champSx} />
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
            <TextField label="Date et heure" value={dateStr} onChange={(e) => setDateStr(e.target.value)}
              placeholder="Ex. samedi 12 octobre, 10h" fullWidth sx={champSx} />
            <TextField label="Lieu" value={lieu} onChange={(e) => setLieu(e.target.value)}
              placeholder="Ex. salle info 2" fullWidth sx={champSx} />
          </Box>
          <TextField label="Ordre du jour" value={ordre} onChange={(e) => setOrdre(e.target.value)}
            placeholder="1. Bilan activités&#10;2. Budget&#10;3. Divers" multiline rows={3} fullWidth sx={champSx} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.6, bgcolor: '#F6FBF9', borderRadius: '12px', border: '1px solid #E3EEE8' }}>
            <Switch checked={tous} onChange={() => setTous(!tous)}
              sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#1FAF72' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#1FAF72' } }} />
            <Box>
              <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: '0.88rem' }}>
                Tous les membres actifs
              </Typography>
              <Typography variant="caption" sx={{ color: '#5A6B63' }}>
                Sinon, colle ci-dessous les emails (un par ligne).
              </Typography>
            </Box>
          </Box>
          {!tous && (
            <TextField label="Emails destinataires" value={emails} onChange={(e) => setEmails(e.target.value)}
              placeholder={"prenom.nom@emsp.int\nprenom.nom@emsp.int"} multiline rows={3} fullWidth sx={champSx}
              helperText={listeEmails.length > 0 ? `${listeEmails.length} adresse${listeEmails.length > 1 ? 's' : ''} détectée${listeEmails.length > 1 ? 's' : ''}` : ' '} />
          )}
          <Box>
            <Button variant="contained" startIcon={envoi ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <SendIcon />}
              disabled={!peutEnvoyer} onClick={envoyer}
              sx={{ bgcolor: '#1FAF72', '&:hover': { bgcolor: '#179963' }, fontWeight: 800, borderRadius: '12px', px: 3.5, py: 1.2 }}>
              {envoi ? 'Envoi…' : 'Envoyer la convocation'}
            </Button>
          </Box>
        </Box>
      )}

      {onglet === 1 && (
        <Box sx={{ display: 'grid', gap: 1.4 }}>
          {envoyees.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6, bgcolor: '#fff', borderRadius: '18px', border: '1px solid #E8ECEA' }}>
              <Typography sx={{ color: '#5A6B63' }}>Aucune convocation envoyée pour le moment.</Typography>
            </Box>
          )}
          {envoyees.map((n) => (
            <Box key={n.id} sx={{ bgcolor: '#fff', borderRadius: '14px', border: '1px solid #E8ECEA', px: 2.4, py: 1.8, display: 'flex', gap: 1.6, alignItems: 'flex-start' }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#7B61FF', mt: 0.8, flexShrink: 0 }} />
              <Box>
                <Typography sx={{ fontWeight: 700, color: '#111827', fontSize: '0.88rem' }}>{n.titre}</Typography>
                <Typography variant="caption" sx={{ color: '#5A6B63' }}>
                  {n.cree_le ? new Date(n.cree_le).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : ''} → {n.destinataire_email ?? 'membres'}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {onglet === 2 && <OngletCR notify={notify} />}
    </Box>
  )
}

/* ── Comptes rendus : brouillon → validation → publié ───────── */
const COULEUR_CR = { brouillon: '#6B7280', en_validation: '#B45309', publie: '#0B7A4B' }
const LABEL_CR = { brouillon: 'Brouillon', en_validation: 'En validation', publie: 'Publié' }

function OngletCR({ notify }) {
  const [formOuvert, setFormOuvert] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [ouvert, setOuvert] = useState(null)
  const [form, setForm] = useState({ id: null, titre: '', reunion_date: '', lieu: '', ordre_du_jour: '', contenu: '', video_url: '', imageFile: null, imageActuelle: '' })
  const client = useQueryClient()

  const { data: crs = [], isLoading } = useQuery({
    queryKey: ['comptes-rendus'], queryFn: () => api.getComptesRendus(),
  })

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const reset = () => { setForm({ id: null, titre: '', reunion_date: '', lieu: '', ordre_du_jour: '', contenu: '', video_url: '', imageFile: null, imageActuelle: '' }); setFormOuvert(false) }

  const enregistrer = async () => {
    if (!form.titre.trim() || !form.reunion_date || !form.contenu.trim() || envoi) {
      if (!form.titre.trim() || !form.reunion_date || !form.contenu.trim()) notify('error', 'Titre, date et contenu sont requis.')
      return
    }
    setEnvoi(true)
    try {
      const payload = {
        titre: form.titre.trim(), reunion_date: form.reunion_date,
        lieu: form.lieu.trim(), ordre_du_jour: form.ordre_du_jour.trim(),
        contenu: form.contenu.trim(), video_url: form.video_url.trim(),
        ...(form.imageFile ? { imageFile: form.imageFile } : {}),
      }
      if (form.id) {
        await api.majCR(form.id, payload)
        notify('success', 'Brouillon mis à jour.')
      } else {
        await api.creerCR(payload)
        notify('success', 'Brouillon créé — soumets-le pour validation.')
      }
      client.invalidateQueries({ queryKey: ['comptes-rendus'] })
      reset()
    } catch (e) {
      notify('error', e.message ?? 'Enregistrement impossible')
    } finally {
      setEnvoi(false)
    }
  }

  const transition = async (cr, statut, okMsg) => {
    try {
      await api.majCR(cr.id, { statut })
      client.invalidateQueries({ queryKey: ['comptes-rendus'] })
      notify('success', okMsg)
    } catch (e) {
      notify('error', e.message ?? 'Transition impossible')
    }
  }

  const supprimer = async (id) => {
    try {
      await api.supprimerCR(id)
      client.invalidateQueries({ queryKey: ['comptes-rendus'] })
      notify('info', 'Compte rendu supprimé.')
    } catch (e) {
      notify('error', e.message ?? 'Suppression impossible')
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { reset(); setFormOuvert(true) }}
          sx={{ bgcolor: '#1FAF72', '&:hover': { bgcolor: '#179963' }, fontWeight: 800, borderRadius: '12px' }}>
          Rédiger un compte rendu
        </Button>
        <BoutonExport action={() => api.exporterComptesRendus()} label="Exporter CSV" notify={notify} variant="contained" />
      </Box>

      {formOuvert && (
        <Box sx={{ bgcolor: '#fff', borderRadius: '18px', border: '1px solid #1FAF7245', p: { xs: 2.4, md: 3 }, display: 'grid', gap: 2, mb: 2 }}>
          <TextField label="Titre *" value={form.titre} onChange={(e) => set('titre', e.target.value)} fullWidth sx={champSx} />
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
            <TextField type="date" label="Date de la réunion *" value={form.reunion_date} onChange={(e) => set('reunion_date', e.target.value)} fullWidth sx={champSx} InputLabelProps={{ shrink: true }} />
            <TextField label="Lieu" value={form.lieu} onChange={(e) => set('lieu', e.target.value)} fullWidth sx={champSx} />
          </Box>
          <TextField label="Ordre du jour" value={form.ordre_du_jour} onChange={(e) => set('ordre_du_jour', e.target.value)} multiline rows={2} fullWidth sx={champSx} />
          <TextField label="Contenu *" value={form.contenu} onChange={(e) => set('contenu', e.target.value)} multiline rows={6} fullWidth sx={champSx} placeholder="Décisions, actions, responsables…" />
          <TextField label="Lien vidéo (YouTube, Drive…)" value={form.video_url} onChange={(e) => set('video_url', e.target.value)} fullWidth sx={champSx} placeholder="https://…" />
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
            <Button variant="outlined" component="label" sx={{ borderColor: '#1FAF72', color: '#0E7A50', fontWeight: 800, borderRadius: '12px' }}>
              {form.imageFile ? 'Changer la photo' : (form.imageActuelle ? 'Remplacer la photo' : 'Ajouter une photo')}
              <input type="file" accept="image/*" hidden onChange={(e) => set('imageFile', e.target.files?.[0] ?? null)} />
            </Button>
            {(form.imageFile || form.imageActuelle) && (
              <Box component="img" src={form.imageFile ? URL.createObjectURL(form.imageFile) : form.imageActuelle}
                alt="" sx={{ width: 120, height: 74, objectFit: 'cover', borderRadius: 2, border: '1px solid #E5E7EB' }} />
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
            <Button onClick={reset} sx={{ color: '#5A6B63', fontWeight: 700 }}>Annuler</Button>
            <Button variant="contained" onClick={enregistrer} disabled={envoi}
              sx={{ bgcolor: '#1FAF72', '&:hover': { bgcolor: '#179963' }, fontWeight: 800, borderRadius: '12px' }}>
              {envoi ? 'Envoi…' : 'Enregistrer'}
            </Button>
          </Box>
        </Box>
      )}

      {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress sx={{ color: '#1FAF72' }} /></Box>}
      <Box sx={{ display: 'grid', gap: 1.2 }}>
        {crs.map((cr) => {
          const estOuvert = ouvert === cr.id
          return (
            <Box key={cr.id} sx={{ bgcolor: '#fff', borderRadius: '14px', border: '1px solid #E8ECEA', overflow: 'hidden' }}>
              <Box onClick={() => setOuvert(estOuvert ? null : cr.id)}
                sx={{ display: 'flex', gap: 1.5, alignItems: 'center', px: 2.2, py: 1.6, cursor: 'pointer', '&:hover': { bgcolor: '#F6FBF9' } }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cr.titre}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#5A6B63' }}>
                    Réunion du {(cr.reunion_date ?? '').slice(0, 10).split('-').reverse().join('/')} · {cr.auteur_nom ?? ''}
                    {cr.valide_par_nom && ` · validé par ${cr.valide_par_nom}`}
                  </Typography>
                </Box>
                <Chip label={LABEL_CR[cr.statut] ?? cr.statut} size="small"
                  sx={{ bgcolor: `${COULEUR_CR[cr.statut] ?? '#6B7280'}14`, color: COULEUR_CR[cr.statut] ?? '#6B7280', fontWeight: 800, flexShrink: 0 }} />
              </Box>
              {estOuvert && (
                <Box sx={{ px: 2.2, pb: 2, pt: 0.5, borderTop: '1px solid #EEF2F0' }}>
                  {cr.ordre_du_jour && (
                    <Typography variant="body2" sx={{ color: '#374151', fontSize: '0.84rem', mb: 1, whiteSpace: 'pre-wrap' }}>
                      <strong>Ordre du jour —</strong> {cr.ordre_du_jour}
                    </Typography>
                  )}
                  <Typography variant="body2" sx={{ color: '#111827', fontSize: '0.88rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {cr.contenu}
                  </Typography>
                  {(cr.image || cr.video_url) && (
                    <Box sx={{ display: 'flex', gap: 1.5, mt: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                      {cr.image && (
                        <Box component="img" src={cr.image} alt=""
                          sx={{ width: 'min(320px, 100%)', borderRadius: '12px', border: '1px solid #E5E7EB', objectFit: 'cover' }} />
                      )}
                      {cr.video_url && (
                        <Button size="small" variant="outlined" href={cr.video_url} target="_blank" rel="noreferrer"
                          sx={{ borderColor: '#7B61FF', color: '#5B3FD6', fontWeight: 800, borderRadius: '10px' }}>
                          Voir la vidéo
                        </Button>
                      )}
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', gap: 1, mt: 1.6, flexWrap: 'wrap' }}>
                    {cr.statut === 'brouillon' && (
                      <>
                        <Button size="small" variant="contained" onClick={() => transition(cr, 'en_validation', 'Soumis pour validation.')}
                          sx={{ bgcolor: '#F5A623', '&:hover': { bgcolor: '#D97706' }, fontWeight: 800, borderRadius: '10px' }}>
                          Soumettre
                        </Button>
                        <Button size="small" variant="outlined" onClick={() => { setForm({ id: cr.id, titre: cr.titre, reunion_date: (cr.reunion_date ?? '').slice(0, 10), lieu: cr.lieu ?? '', ordre_du_jour: cr.ordre_du_jour ?? '', contenu: cr.contenu, video_url: cr.video_url ?? '', imageFile: null, imageActuelle: cr.image ?? '' }); setFormOuvert(true) }}
                          sx={{ borderColor: '#D1D5DB', color: '#374151', fontWeight: 700 }}>
                          Modifier
                        </Button>
                        <Button size="small" onClick={() => supprimer(cr.id)} sx={{ color: '#B42318', fontWeight: 700 }}>
                          Supprimer
                        </Button>
                      </>
                    )}
                    {cr.statut === 'en_validation' && (
                      <>
                        <Button size="small" variant="contained" onClick={() => transition(cr, 'publie', 'Publié — visible des membres.')}
                          sx={{ bgcolor: '#1FAF72', '&:hover': { bgcolor: '#179963' }, fontWeight: 800, borderRadius: '10px' }}>
                          Valider & publier
                        </Button>
                        <Button size="small" variant="outlined" onClick={() => transition(cr, 'brouillon', 'Renvoyé en brouillon.')}
                          sx={{ borderColor: '#D1D5DB', color: '#374151', fontWeight: 700 }}>
                          Renvoyer
                        </Button>
                      </>
                    )}
                    {cr.statut === 'publie' && (
                      <Typography variant="caption" sx={{ color: '#0B7A4B', fontWeight: 700 }}>
                        Publié — lisible par les membres dans la Documentation.
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
            </Box>
          )
        })}
        {!isLoading && crs.length === 0 && (
          <Typography sx={{ color: '#5A6B63', fontSize: '0.88rem' }}>Aucun compte rendu pour le moment.</Typography>
        )}
      </Box>
    </Box>
  )
}
