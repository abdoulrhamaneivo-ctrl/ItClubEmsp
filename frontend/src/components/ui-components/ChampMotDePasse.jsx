import { useState } from 'react'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'

/**
 * Champ mot de passe avec œil (afficher/masquer).
 * MUI v9 : les ornements passent par slotProps.input (InputProps n'est plus
 * consommé par TextField et fuit vers le DOM → warning console).
 * Accepte aussi l'ancien InputProps (startAdornment conservé).
 */
export default function ChampMotDePasse({ value, onChange, label = 'Mot de passe', autoComplete = 'current-password', name = 'password', slotProps, InputProps: anciens = {}, ...props }) {
  const [visible, setVisible] = useState(false)
  return (
    <TextField
      {...props}
      name={name}
      type={visible ? 'text' : 'password'}
      label={label}
      value={value}
      onChange={onChange}
      autoComplete={autoComplete}
      slotProps={{
        ...slotProps,
        input: {
          ...anciens,
          ...slotProps?.input,
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setVisible((v) => !v)}
                edge="end"
                aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                sx={{ color: '#6B7280', width: 44, height: 44 }}
              >
                {visible ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  )
}
