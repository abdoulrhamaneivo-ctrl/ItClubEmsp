import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import SaveIcon from '@mui/icons-material/Save'
import {
  useContenu, sauverActualite, supprimerActualite,
  sauverDocument, supprimerDocument, sauverMedia, supprimerMedia,
  fichierVersDataUrl, CELLULES_TAGGABLES,
} from '../../lib/contenu'

/**
 * Back-office — Gestionnaire de contenu : Actualités / Documents / Galerie.
 * Ajout, modification, suppression ; images uploadées (dataURL) ;
 * chaque item taggable par cellule. Mise à jour publique instantanée.
 */

const FAMILLES_DOC = [
  { id: 'fondamentaux', label: 'Les fondamentaux' },
  { id: 'organisation', label: 'Vie du club' },
  { id: 'archives', label: 'Archives des réunions' },
]

const EVENEMENTS = ['vibeathon', 'atelier', 'sortie', 'hackathon']

export default function GestionContenu() {
  const [onglet, setOnglet] = useState(0)
  const [message, setMessage] = useState(null)
  const notify = (t, m) => { setMessage({ t, m }); setTimeout(() => setMessage(null), 3500) }

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
              Contenu du site <Box component="span" sx={{ color: '#9AFBD7' }}>· gestion</Box>
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,.78)', mt: 0.5 }}>
              Actualités, documents, galerie — tout ce que tu modifies ici s'affiche immédiatement sur la vitrine.
            </Typography>
          </Box>
        </Box>
      </motion.div>

      {message && <Alert severity={message.t} sx={{ mb: 2, borderRadius: 2 }}>{message.m}</Alert>}

      <Paper elevation={0} sx={{ borderRadius: '16px', border: '1px solid #E3EEE8', mb: 2.5, overflow: 'hidden' }}>
        <Tabs value={onglet} onChange={(_, v) => setOnglet(v)} variant="fullWidth">
          <Tab label="📰 Actualités" />
          <Tab label="📄 Documents" />
          <Tab label="🖼️ Galerie" />
        </Tabs>
      </Paper>

      {onglet === 0 && <OngletActualites notify={notify} />}
      {onglet === 1 && <OngletDocuments notify={notify} />}
      {onglet === 2 && <OngletGalerie notify={notify} />}
    </Box>
  )
}

/* ═══════════ ACTUALITÉS ═══════════ */
function OngletActualites({ notify }) {
  const items = useContenu('actualites')
  const [edition, setEdition] = useState(null) // null | {} (nouveau) | item

  const initForm = (a) => ({
    id: a?.id || null, titre: a?.titre || '', extrait: a?.extrait || '',
    auteur: a?.auteur || '', tag: a?.tag || 'Annonce officielle',
    cellule: a?.cellule || 'general', date: a?.date || new Date().toISOString().slice(0, 10),
    image: a?.image || null,
  })
  const [form, setForm] = useState(initForm())

  const enregistrer = async () => {
    if (!form.titre.trim() || !form.extrait.trim()) return notify('error', 'Titre et extrait sont requis.')
    sauverActualite(form)
    notify('success', '✅ Actualité enregistrée — visible sur la vitrine.')
    setEdition(null)
  }

  const choisirImage = async (e) => {
    const res = await fichierVersDataUrl(e.target.files?.[0])
    if (res?.erreur) return notify('error', res.erreur)
    setForm((f) => ({ ...f, image: res }))
  }

  return (
    <Box>
      {!edition ? (
        <>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setForm(initForm()); setEdition('nouveau') }}
            sx={{ bgcolor: '#1FAF72', '&:hover': { bgcolor: '#179963' }, fontWeight: 800, borderRadius: '28px', mb: 2 }}>
            Nouvelle actualité
          </Button>
          {items.map((a) => (
            <LigneItem key={a.id}
              titre={a.titre} sousTitre={`${a.date} · ${a.auteur || '—'}`}
              chip={<Chip label={labelCellule(a.cellule)} size="small" sx={{ bgcolor: '#F0F5F2', color: '#374151', fontWeight: 700, height: 22 }} />}
              surImage={!!a.image}
              onEdit={() => { setForm(initForm(a)); setEdition(a.id) }}
              onDelete={() => { supprimerActualite(a.id); notify('info', 'Actualité supprimée.') }}
            />
          ))}
        </>
      ) : (
        <Formulaire onAnnuler={() => setEdition(null)} onEnregistrer={enregistrer} titre={edition === 'nouveau' ? 'Nouvelle actualité' : 'Modifier l’actualité'}>
          <ChampsActualite form={form} setForm={setForm} choisirImage={choisirImage} />
        </Formulaire>
      )}
    </Box>
  )
}

function ChampsActualite({ form, setForm, choisirImage }) {
  return (
    <>
      <TextField label="Titre" value={form.titre} onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))} fullWidth required />
      <TextField label="Extrait / résumé" value={form.extrait} onChange={(e) => setForm((f) => ({ ...f, extrait: e.target.value }))} multiline rows={3} fullWidth required />
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
        <TextField label="Auteur" value={form.auteur} onChange={(e) => setForm((f) => ({ ...f, auteur: e.target.value }))} fullWidth />
        <TextField label="Étiquette" value={form.tag} onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))} fullWidth placeholder="Ex. Annonce officielle, Événement…" />
        <TextField select label="Taguée à la cellule" value={form.cellule} onChange={(e) => setForm((f) => ({ ...f, cellule: e.target.value }))} fullWidth>
          {CELLULES_TAGGABLES.map((c) => <MenuItem key={c.id} value={c.id}>{c.label}</MenuItem>)}
        </TextField>
        <TextField type="date" label="Date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} fullWidth InputLabelProps={{ shrink: true }} />
      </Box>
      {/* Image d'illustration */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        {form.image && (
          <Box component="img" src={form.image} alt="" sx={{ width: 120, height: 74, objectFit: 'cover', borderRadius: 2, border: '1px solid #E5E7EB' }} />
        )}
        <Button variant="outlined" component="label" sx={{ borderColor: '#1FAF72', color: '#1FAF72', fontWeight: 700 }}>
          {form.image ? 'Changer l’image' : '+ Ajouter une image'}
          <input type="file" accept="image/*" hidden onChange={choisirImage} />
        </Button>
        {form.image && (
          <Button color="error" onClick={() => setForm((f) => ({ ...f, image: null }))} sx={{ fontWeight: 700 }}>Retirer</Button>
        )}
      </Box>
    </>
  )
}

/* ═══════════ DOCUMENTS ═══════════ */
function OngletDocuments({ notify }) {
  const items = useContenu('documents')
  const [edition, setEdition] = useState(null)
  const initForm = (d) => ({ id: d?.id || null, titre: d?.titre || '', description: d?.description || '', famille: d?.famille || 'fondamentaux', categorie: d?.categorie || '', fichier: d?.fichier || '', format: d?.format || (d?.fichier?.toLowerCase().endsWith('.pdf') ? 'PDF' : 'DOCX') })
  const [form, setForm] = useState(initForm())

  const enregistrer = () => {
    if (!form.titre.trim() || !form.fichier.trim()) return notify('error', 'Titre et nom de fichier sont requis.')
    sauverDocument(form)
    notify('success', '✅ Document enregistré — la Documentation publique est à jour.')
    setEdition(null)
  }

  return (
    <Box>
      {!edition ? (
        <>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setForm(initForm()); setEdition('nouveau') }}
            sx={{ bgcolor: '#1FAF72', '&:hover': { bgcolor: '#179963' }, fontWeight: 800, borderRadius: '28px', mb: 2 }}>
            Ajouter un document
          </Button>
          {items.map((d) => (
            <LigneItem key={d.id}
              titre={d.titre} sousTitre={`${d.fichier} · ${d.description}`}
              chip={<Chip label={labelFamille(d.famille)} size="small" sx={{ bgcolor: '#F0F5F2', color: '#374151', fontWeight: 700, height: 22 }} />}
              onEdit={() => { setForm(initForm(d)); setEdition(d.id) }}
              onDelete={() => { supprimerDocument(d.id); notify('info', 'Document supprimé.') }}
            />
          ))}
        </>
      ) : (
        <Formulaire onAnnuler={() => setEdition(null)} onEnregistrer={enregistrer} titre={edition === 'nouveau' ? 'Nouveau document' : 'Modifier le document'}>
          <TextField label="Titre" value={form.titre} onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))} fullWidth required />
          <TextField label="Description (visible sous le titre)" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} multiline rows={2} fullWidth />
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
            <TextField select label="Famille (classement)" value={form.famille} onChange={(e) => setForm((f) => ({ ...f, famille: e.target.value }))} fullWidth>
              {FAMILLES_DOC.map((f) => <MenuItem key={f.id} value={f.id}>{f.label}</MenuItem>)}
            </TextField>
            <TextField label="Nom du fichier (dans /documents/)" value={form.fichier} onChange={(e) => setForm((f) => ({ ...f, fichier: e.target.value, format: e.target.value.toLowerCase().endsWith('.pdf') ? 'PDF' : 'DOCX' }))} fullWidth required placeholder="Ex. Mon_Document.pdf" />
          </Box>
        </Formulaire>
      )}
    </Box>
  )
}

/* ═══════════ GALERIE ═══════════ */
function OngletGalerie({ notify }) {
  const items = useContenu('medias')
  const [edition, setEdition] = useState(null)
  const initForm = (m) => ({ id: m?.id || null, titre: m?.titre || '', legende: m?.legende || '', type: m?.type || 'photo', evenement: m?.evenement || 'atelier', cellule: m?.cellule || 'general', date: m?.date || new Date().toISOString().slice(0, 10), youtube: m?.youtube || '', image: m?.image || null })
  const [form, setForm] = useState(initForm())

  const enregistrer = () => {
    if (!form.titre.trim()) return notify('error', 'Le titre est requis.')
    if (form.type === 'video' && !form.youtube.trim()) return notify('error', 'L’ID YouTube est requis pour une vidéo.')
    sauverMedia(form)
    notify('success', '✅ Média enregistré — la galerie est à jour.')
    setEdition(null)
  }

  const choisirImage = async (e) => {
    const res = await fichierVersDataUrl(e.target.files?.[0])
    if (res?.erreur) return notify('error', res.erreur)
    setForm((f) => ({ ...f, image: res }))
  }

  return (
    <Box>
      {!edition ? (
        <>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setForm(initForm()); setEdition('nouveau') }}
            sx={{ bgcolor: '#1FAF72', '&:hover': { bgcolor: '#179963' }, fontWeight: 800, borderRadius: '28px', mb: 2 }}>
            Ajouter un média
          </Button>
          {items.map((m) => (
            <LigneItem key={m.id}
              titre={m.titre} sousTitre={`${m.type === 'video' ? 'Vidéo YouTube' : 'Photo'} · ${m.date} · ${m.evenement}`}
              chip={<Chip label={labelCellule(m.cellule)} size="small" sx={{ bgcolor: '#F0F5F2', color: '#374151', fontWeight: 700, height: 22 }} />}
              surImage={!!m.image}
              onEdit={() => { setForm(initForm(m)); setEdition(m.id) }}
              onDelete={() => { supprimerMedia(m.id); notify('info', 'Média supprimé.') }}
            />
          ))}
        </>
      ) : (
        <Formulaire onAnnuler={() => setEdition(null)} onEnregistrer={enregistrer} titre={edition === 'nouveau' ? 'Nouveau média' : 'Modifier le média'}>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
            <TextField select label="Type" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} fullWidth>
              <MenuItem value="photo">Photo</MenuItem>
              <MenuItem value="video">Vidéo (YouTube)</MenuItem>
            </TextField>
            <TextField select label="Événement" value={form.evenement} onChange={(e) => setForm((f) => ({ ...f, evenement: e.target.value }))} fullWidth>
              {EVENEMENTS.map((ev) => <MenuItem key={ev} value={ev} sx={{ textTransform: 'capitalize' }}>{ev}</MenuItem>)}
            </TextField>
          </Box>
          <TextField label="Titre" value={form.titre} onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))} fullWidth required />
          <TextField label="Légende" value={form.legende} onChange={(e) => setForm((f) => ({ ...f, legende: e.target.value }))} fullWidth />
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
            <TextField select label="Taguée à la cellule" value={form.cellule} onChange={(e) => setForm((f) => ({ ...f, cellule: e.target.value }))} fullWidth>
              {CELLULES_TAGGABLES.map((c) => <MenuItem key={c.id} value={c.id}>{c.label}</MenuItem>)}
            </TextField>
            <TextField type="date" label="Date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} fullWidth InputLabelProps={{ shrink: true }} />
          </Box>
          {form.type === 'video' ? (
            <TextField label="ID YouTube" value={form.youtube} onChange={(e) => setForm((f) => ({ ...f, youtube: e.target.value }))} fullWidth placeholder="Ex. dQw4w9WgXcQ" helperText="L'identifiant dans l'URL youtube.com/watch?v=…" />
          ) : (
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              {form.image && <Box component="img" src={form.image} alt="" sx={{ width: 120, height: 74, objectFit: 'cover', borderRadius: 2, border: '1px solid #E5E7EB' }} />}
              <Button variant="outlined" component="label" sx={{ borderColor: '#1FAF72', color: '#1FAF72', fontWeight: 700 }}>
                {form.image ? 'Changer la photo' : '+ Ajouter la photo'}
                <input type="file" accept="image/*" hidden onChange={choisirImage} />
              </Button>
              {form.image && <Button color="error" onClick={() => setForm((f) => ({ ...f, image: null }))} sx={{ fontWeight: 700 }}>Retirer</Button>}
            </Box>
          )}
        </Formulaire>
      )}
    </Box>
  )
}

/* ═══════════ Briques communes ═══════════ */
function LigneItem({ titre, sousTitre, chip, surImage, onEdit, onDelete }) {
  return (
    <Paper elevation={0} sx={{
      p: 2, mb: 1.2, borderRadius: '12px', border: '1px solid #E8ECEA',
      display: 'flex', alignItems: 'center', gap: 2,
      transition: 'border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease',
      '&:hover': { borderColor: '#BFD8CC', boxShadow: '0 6px 18px rgba(13,27,42,.08)', transform: 'translateY(-1px)' },
      '&:hover .actions-item': { opacity: 1, transform: 'translateX(0)' },
    }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          {surImage && <Chip label="🖼️ image" size="small" sx={{ bgcolor: '#E7F0FE', color: '#175CD3', fontWeight: 700, height: 20, fontSize: '0.62rem' }} />}
          <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: '0.92rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {titre}
          </Typography>
          {chip}
        </Box>
        <Typography variant="caption" sx={{ color: '#5A6B63', display: 'block', mt: 0.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {sousTitre}
        </Typography>
      </Box>
      <Box className="actions-item" sx={{
        display: 'flex', gap: 0.4,
        opacity: { xs: 1, md: 0.45 }, transform: { xs: 'none', md: 'translateX(4px)' },
        transition: 'opacity 180ms ease, transform 180ms ease',
      }}>
        <IconButton onClick={onEdit} size="small" aria-label="Modifier" sx={{
          color: '#2563EB', '&:hover': { bgcolor: '#E8F0FE', transform: 'scale(1.12)' },
          transition: 'transform 140ms ease, background 140ms ease',
        }}><EditIcon fontSize="small" /></IconButton>
        <IconButton onClick={onDelete} size="small" aria-label="Supprimer" sx={{
          color: '#B42318', '&:hover': { bgcolor: '#FDECE9', transform: 'scale(1.12)' },
          transition: 'transform 140ms ease, background 140ms ease',
        }}><DeleteIcon fontSize="small" /></IconButton>
      </Box>
    </Paper>
  )
}

function Formulaire({ titre, onAnnuler, onEnregistrer, children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
      <Paper elevation={0} sx={{
        p: 3, borderRadius: '16px', border: '1px solid #1FAF7245', bgcolor: '#FBFDFC',
        boxShadow: '0 10px 30px rgba(31,175,114,.08)',
      }}>
        <Typography sx={{ fontWeight: 800, color: '#0F5B3A', mb: 2.5, fontFamily: "'Orbitron',sans-serif", fontSize: '1.05rem' }}>
          {titre}
        </Typography>
        <Box sx={{ display: 'grid', gap: 2 }}>
          {children}
          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', mt: 1 }}>
            <Button onClick={onAnnuler} sx={{ color: '#5A6B63', fontWeight: 700 }}>Annuler</Button>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button variant="contained" startIcon={<SaveIcon />} onClick={onEnregistrer}
                sx={{ bgcolor: '#1FAF72', '&:hover': { bgcolor: '#179963' }, fontWeight: 800, borderRadius: '12px' }}>
                Enregistrer
              </Button>
            </motion.div>
          </Box>
        </Box>
      </Paper>
    </motion.div>
  )
}

function labelCellule(id) { return CELLULES_TAGGABLES.find((c) => c.id === id)?.label ?? id }
function labelFamille(id) { return FAMILLES_DOC.find((f) => f.id === id)?.label ?? id }
