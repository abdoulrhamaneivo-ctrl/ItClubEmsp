import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Toolbar from '@mui/material/Toolbar'
import AppBar from '@mui/material/AppBar'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import { useAuth } from '../../stores/auth'
import { modulesPour, modulesBackoffice } from '../../data/backoffice'
import TachesNotion from './TachesNotion'
import EditeurFormulaire from './EditeurFormulaire'
import GestionContenu from './GestionContenu'

const drawerWidth = 260

/** Layout back-office : menu construit dynamiquement depuis les rôles du user. */
export default function BackofficeLayout() {
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)
  const modules = modulesPour(user)

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }} color="primary">
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight={800}>
            Back-office — IT-CLUB <span style={{ color: '#F5A623' }}>EMSP</span>
          </Typography>
          <Box>
            <Button color="inherit" href="/espace">Mon espace</Button>
            <Button color="inherit" onClick={logout}>Déconnexion</Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <List sx={{ px: 1 }}>
          {modules.map((m) => (
            <ListItemButton key={m.path} component={NavLink} to={`/backoffice/${m.path}`} sx={{ borderRadius: 2 }}>
              <ListItemText primary={m.label} primaryTypographyProps={{ fontWeight: 700 }} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 4, bgcolor: 'background.default' }}>
        <Toolbar />
        <Routes>
          <Route index element={<Navigate to={modules[0]?.path ?? '/espace'} replace />} />
          {modules.map((m) => (
            <Route key={m.path} path={m.path}
              element={
                m.path === 'taches-notion' ? <TachesNotion /> :
                m.path === 'formulaire' ? <EditeurFormulaire /> :
                m.path === 'contenu' ? <GestionContenu /> :
                <PlaceholderModule titre={m.label} desc={m.desc} />
              } />
          ))}
        </Routes>
      </Box>
    </Box>
  )
}

function PlaceholderModule({ titre, desc }) {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h5" fontWeight={800} gutterBottom>
        {titre}
      </Typography>
      <Typography color="text.secondary">
        {desc}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>
        Module prêt à recevoir son écran complet — le branchement API se fait avec le
        back-end Django (doc 04). Chaque module est déjà filtré par rôle.
      </Typography>
    </Container>
  )
}
