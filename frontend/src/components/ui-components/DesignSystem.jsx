import { useState, useRef, useEffect } from 'react'
import { motion, useScroll } from 'framer-motion'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

/**
 * DESIGN SYSTEM — Composants unifiés pour cohérence visuelle totale
 */

/* ============================================================
   ESPACEMENT STANDARD
   ============================================================ */
export const spacing = {
  section: { xs: 6, md: 10 },        // py des sections
  container: { xs: 2, md: 3 },       // px du container
  card: { xs: 2.5, md: 3 },          // p des cartes
  gridGap: { xs: 2, md: 3 },         // gap grille
  inline: { xs: 1.5, md: 2 },        // gap éléments inline
}

/* ============================================================
   COULEURS SÉMANTIQUES (pas de vert dominant)
   ============================================================ */
export const colors = {
  // Couleurs d'accent (pour boutons, liens, bandeaux)
  accent: {
    primary: '#1FAF72',    // Vert émeraude - actions principales
    secondary: '#2563EB',  // Bleu - actions secondaires
    warning: '#F5A623',    // Orange/Or - attention, stats
    danger: '#EF4444',     // Rouge - erreurs, danger
    info: '#06B6D4',       // Cyan - info
    purple: '#7B61FF',     // Violet - design, créatif
  },
  // Neutres
  neutral: {
    bg: '#FAFAFA',         // Fond principal
    bgAlt: '#F5F5F5',      // Fond alterné (sections paires)
    card: '#FFFFFF',       // Fond cartes
    border: '#E5E7EB',     // Bordures
    text: '#111827',       // Texte principal
    textSecondary: '#6B7280', // Texte secondaire
    textMuted: '#9CA3AF',  // Texte muet
    placeholder: '#F3F4F6', // Placeholders
  },
  // Par rôle (bureau)
  roles: {
    P1: '#1FAF72', P2: '#1FAF72', P3: '#2563EB', P4: '#F5A623',
    P5: '#06B6D4', P6: '#7B61FF', P7: '#EF4444', P8: '#8B5CF6',
    P9: '#10B981', P10: '#F97316',
  },
}

/* ============================================================
   TYPOGRAPHIE
   ============================================================ */
export const typo = {
  fontDisplay: "'Orbitron', sans-serif",  // Titres marquants
  fontBody: "'Inter', 'Poppins', sans-serif", // Corps de texte
  scale: {
    h1: { xs: '2.5rem', md: '3.5rem', weight: 800, lineHeight: 1.15 },
    h2: { xs: '1.75rem', md: '2.5rem', weight: 700, lineHeight: 1.25 },
    h3: { xs: '1.25rem', md: '1.75rem', weight: 700, lineHeight: 1.3 },
    body: { xs: '0.95rem', md: '1rem', weight: 400, lineHeight: 1.7 },
    bodySmall: { xs: '0.875rem', md: '0.9rem', weight: 400, lineHeight: 1.6 },
    caption: { xs: '0.75rem', md: '0.8rem', weight: 500, lineHeight: 1.5 },
  },
}

/* ============================================================
   OMBORES COHÉRENTS
   ============================================================ */
export const shadows = {
  card: '0 2px 12px rgba(0,0,0,.06)',
  cardHover: '0 12px 32px rgba(0,0,0,.10)',
  cardActive: '0 20px 40px rgba(0,0,0,.12)',
  modal: '0 32px 64px rgba(0,0,0,.18)',
  dropdown: '0 8px 24px rgba(0,0,0,.12)',
}

/* ============================================================
   RAYONS COHÉRENTS
   ============================================================ */
export const radius = {
  sm: 2,      // 8px
  md: 3,      // 12px
  lg: 4,      // 16px
  xl: 5,      // 20px
  full: 9999, // pilule
}

/* ============================================================
   TRANSITIONS COHÉRENTES
   ============================================================ */
export const transitions = {
  fast: '150ms ease',
  normal: '250ms ease',
  slow: '350ms ease',
  spring: { type: 'spring', stiffness: 300, damping: 25 },
}

/* ============================================================
   COMPOSANT CARTE UNIFIÉE
   ============================================================ */
export function CarteUnifiee({
  children,
  accentColor = colors.accent.primary,
  hover = true,
  active = false,
  padding = spacing.card,
  borderRadius = radius.lg,
  shadow = active ? 'cardActive' : (hover ? 'cardHover' : 'card'),
  border = false,
  className,
  ...props
}) {
  const shadowValue = shadows[shadow] || shadows.card

  return (
    <motion.div
      whileHover={hover ? { y: -4, boxShadow: shadows.cardHover } : undefined}
      transition={transitions.spring}
      style={{ ...props }}
    >
      <Box
        sx={{
          bgcolor: colors.neutral.card,
          borderRadius: borderRadius,
          p: padding,
          boxShadow: shadowValue,
          border: border ? `1px solid ${colors.neutral.border}` : 'none',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 250ms ease, box-shadow 250ms ease',
          ...(className ? { className } : {}),
        }}
      >
        {/* Bandeau d'accent en haut */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(90deg, ${accentColor}, ${accentColor}80)`,
          }}
        />
        <Box sx={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
          {children}
        </Box>
      </Box>
    </motion.div>
  )
}

/* ============================================================
   COMPOSANT STATISTIQUE (compteur animé)
   ============================================================ */
export function StatCard({ valeur, label, icone, couleur = colors.accent.primary, suffixe = '' }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })

  useEffect(() => {
    const target = Number(valeur)
    const duration = 1500
    const start = performance.now()
    const animate = (now) => {
      const progress = Math.min((now - start) / 1500, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(target * eased))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [valeur])

  return (
    <Box ref={ref} sx={{ textAlign: 'center', p: 2 }}>
      <Box sx={{ color: couleur, fontSize: 36, mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        {icone && <Typography sx={{ fontSize: 28 }}>{icone}</Typography>}
        <Typography
          variant="h3"
          sx={{
            fontFamily: "'Orbitron', sans-serif",
            fontWeight: 800,
            color: colors.neutral.text,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {count}{suffixe}
        </Typography>
      </Box>
      <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
        {label}
      </Typography>
    </Box>
  )
}

/* ============================================================
   SECTION TITLE UNIFIÉ
   ============================================================ */
export function SectionTitleUnifiee({ overline, titre, description, align = 'left', accentColor = colors.accent.primary }) {
  return (
    <Box sx={{ textAlign: align, mb: { xs: 4, md: 6 } }}>
      {overline && (
        <Typography
          variant="overline"
          sx={{
            color: accentColor,
            fontWeight: 800,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            mb: 1.5,
            display: 'inline-block',
            borderBottom: `3px solid ${accentColor}`,
            paddingBottom: 4,
          }}
        >
          {overline}
        </Typography>
      )}
      <Typography
        component="h2"
        sx={{
          fontFamily: "'Orbitron', sans-serif",
          fontWeight: 700,
          fontSize: { xs: '1.75rem', md: '2.5rem' },
          lineHeight: 1.2,
          color: colors.neutral.text,
          mb: description ? 2 : 0,
        }}
      >
        {titre}
      </Typography>
      {description && (
        <Typography
          variant="body1"
          color="textSecondary"
          sx={{ maxWidth: 600, mx: align === 'center' ? 'auto' : align === 'right' ? '0 auto 0 0' : 0, lineHeight: 1.7 }}
        >
          {description}
        </Typography>
      )}
    </Box>
  )
}

/* ============================================================
   BOUTONS UNIFIÉS
   ============================================================ */
export const ButtonStyles = {
  primary: {
    bgcolor: colors.accent.primary,
    color: '#fff',
    '&:hover': { bgcolor: '#179963' },
    fontWeight: 700,
    px: 4,
    py: 1.5,
    borderRadius: radius.md,
    fontSize: '1rem',
    boxShadow: '0 4px 16px rgba(31,175,114,.3)',
  },
  secondary: {
    bgcolor: colors.neutral.card,
    color: colors.accent.primary,
    border: `2px solid ${colors.accent.primary}`,
    '&:hover': { bgcolor: 'rgba(31,175,114,.08)' },
    fontWeight: 700,
    px: 4,
    py: 1.5,
    borderRadius: radius.md,
    fontSize: '1rem',
  },
  outline: {
    border: `1px solid ${colors.neutral.border}`,
    color: colors.neutral.text,
    '&:hover': { bgcolor: colors.neutral.bgAlt, borderColor: colors.accent.primary },
    fontWeight: 600,
    px: 3,
    py: 1,
    borderRadius: radius.md,
    fontSize: '0.9rem',
  },
  ghost: {
    color: colors.neutral.textSecondary,
    '&:hover': { bgcolor: colors.neutral.bgAlt, color: colors.accent.primary },
    fontWeight: 600,
    px: 2,
    py: 0.5,
    borderRadius: radius.sm,
    fontSize: '0.875rem',
  },
}

/* ============================================================
   GRILLE RESPONSIVE STANDARDE
   ============================================================ */
export const gridStandard = {
  container: {
    display: 'grid',
    gap: spacing.gridGap,
    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(3,1fr)', xl: 'repeat(4,1fr)' },
  },
  container3: {
    display: 'grid',
    gap: spacing.gridGap,
    gridTemplateColumns: { xs: '1fr', md: 'repeat(3,1fr)' },
  },
  container2: {
    display: 'grid',
    gap: spacing.gridGap,
    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
  },
  containerAuto: (minWidth = '280px') => ({
    display: 'grid',
    gap: spacing.gridGap,
    gridTemplateColumns: `repeat(auto-fill, minmax(${minWidth}, 1fr))`,
  }),
}

/* ============================================================
   EXPORTS
   ============================================================ */
export default {
  spacing,
  colors,
  typo,
  shadows,
  radius,
  transitions,
  CarteUnifiee,
  StatCard,
  SectionTitleUnifiee,
  ButtonStyles,
  gridStandard,
}