import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

/** Titre de section réutilisable (overline + titre pointu). */
export default function SectionTitle({ overline, title }) {
  return (
    <Box mb={1}>
      <Typography variant="overline" color="secondary" fontWeight={800}>
        {overline}
      </Typography>
      <Typography variant="h3" component="h2" sx={{ fontSize: { xs: '1.8rem', md: '2.4rem' }, mb: 1 }}>
        {title}
      </Typography>
    </Box>
  )
}
