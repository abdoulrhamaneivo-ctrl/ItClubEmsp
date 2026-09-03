import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'

/**
 * Carousel automatique (slides avec transition douce + contrôles).
 * Chaque slide : { image?, titre?, texte?, couleur? }
 */
export default function Carousel({ slides = [], intervalle = 5000, height = 380 }) {
  const [index, setIndex] = useState(0)
  const n = slides.length

  useEffect(() => {
    if (n <= 1) return
    const t = setInterval(() => setIndex((i) => (i + 1) % n), intervalle)
    return () => clearInterval(t)
  }, [n, intervalle])

  if (!n) return null

  return (
    <Box sx={{ position: 'relative', overflow: 'hidden', borderRadius: 5, height }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'absolute',
            inset: 0,
            background: slides[index].image
              ? `url(${slides[index].image}) center/cover`
              : `linear-gradient(120deg, ${slides[index].couleur ?? '#0F5B3A'}, #1FAF72)`,
            display: 'flex',
            alignItems: 'flex-end',
          }}
        >
          {(slides[index].titre || slides[index].texte) && (
            <Box sx={{ p: { xs: 3, md: 5 }, color: '#fff', bgcolor: 'rgba(13,27,42,.45)', width: '100%' }}>
              <Box component="h2" sx={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 800, fontSize: { xs: '1.4rem', md: '2rem' }, m: 0 }}>
                {slides[index].titre}
              </Box>
              <Box component="p" sx={{ m: 0.5, opacity: 0.9 }}>{slides[index].texte}</Box>
            </Box>
          )}
        </motion.div>
      </AnimatePresence>

      {n > 1 && (
        <>
          <IconButton
            onClick={() => setIndex((index - 1 + n) % n)}
            sx={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,.85)', '&:hover': { bgcolor: '#fff' } }}
          >
            <ArrowBackIosNewIcon fontSize="small" />
          </IconButton>
          <IconButton
            onClick={() => setIndex((index + 1) % n)}
            sx={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,.85)', '&:hover': { bgcolor: '#fff' } }}
          >
            <ArrowForwardIosIcon fontSize="small" />
          </IconButton>
          <Box sx={{ position: 'absolute', bottom: 12, left: 0, right: 0, display: 'flex', gap: 1, justifyContent: 'center' }}>
            {slides.map((_, i) => (
              <Box
                key={i}
                onClick={() => setIndex(i)}
                sx={{ width: i === index ? 26 : 10, height: 10, borderRadius: 5, cursor: 'pointer', bgcolor: i === index ? '#9AFBD7' : 'rgba(255,255,255,.55)', transition: 'width .3s' }}
              />
            ))}
          </Box>
        </>
      )}
    </Box>
  )
}
