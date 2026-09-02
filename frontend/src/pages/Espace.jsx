import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import { useAuth, hasRole } from '../stores/auth'

const libellesRoles = {
  P1: 'Président', P2: 'Vice-Présidente', P3: 'Secrétaire Générale',
  P4: 'Responsable des Cellules', P5: 'Responsable Communication',
  P6: 'Responsable des Activités', P7: 'Resp. Innovation & Solutions',
  P8: 'Coordinateur des Opportunités', P9: 'Resp. Programmation',
  P10: 'Responsable des Ateliers', CHEF_CELLULE: 'Chef de cellule', ADMIN: 'Administrateur',
}

/** Espace membre : profil + entrée vers le back-office si rôle Bureau. */
export default function Espace() {
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)
  if (!user) return null

  return (
    <Container maxWidth="md" sx={{ py: 12 }}>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Bonjour {user.prenom ?? user.nom ?? 'membre'} 👋
      </Typography>
      <Typography color="text.secondary" mb={4}>
        Ton espace personnel : cellules, inscriptions, badges. (Contenu enrichi au fil du
        branchement API.)
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="overline" color="secondary" fontWeight={800}>
            Mes rôles
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
            {(user.roles ?? []).map((r) => (
              <Chip key={r.code} label={libellesRoles[r.code] ?? r.code} color="secondary" variant="outlined" />
            ))}
          </Box>
        </CardContent>
      </Card>

      {hasRole(user, Object.keys(libellesRoles)) && (
        <Button variant="contained" color="primary" href="/backoffice" size="large">
          Ouvrir mon back-office
        </Button>
      )}

      <Button onClick={logout} sx={{ ml: 2 }}>
        Se déconnecter
      </Button>
    </Container>
  )
}
