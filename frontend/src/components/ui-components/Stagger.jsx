import { motion } from 'framer-motion'
import Box from '@mui/material/Box'

/**
 * Grille animée en cascade : Box MUI (pour le layout grid) + variants framer-motion.
 * Props grid : identiques à sx d'un Box MUI.
 */
export function Stagger({ children, gap = 0.08, sx, ...props }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '0px' }}
      variants={{ visible: { transition: { staggerChildren: gap } } }}
      {...props}
    >
      <Box sx={sx}>{children}</Box>
    </motion.div>
  )
}

export const staggerItem = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.34, ease: [0.22, 1, 0.36, 1] } },
}
