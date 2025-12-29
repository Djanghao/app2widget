'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material'
import { LLMConfig, Provider } from '@/types/chat'
import { PROVIDER_CONFIGS, STORAGE_KEYS } from '@/utils/llmConfig'

interface SettingsProps {
  onConfigChange: (apiKey: string, config: LLMConfig) => void
  open?: boolean
  onClose?: () => void
}

export function Settings({ onConfigChange, open: externalOpen, onClose: externalOnClose }: SettingsProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = externalOpen !== undefined ? externalOpen : internalOpen
  const [provider, setProvider] = useState<Provider>('qwen')
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState(PROVIDER_CONFIGS.qwen.baseUrl)
  const [modelName, setModelName] = useState(PROVIDER_CONFIGS.qwen.models[0])

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedProvider = (localStorage.getItem(STORAGE_KEYS.PROVIDER) as Provider) || 'qwen'
    const savedApiKey = localStorage.getItem(STORAGE_KEYS.API_KEY) || ''
    const savedBaseUrl =
      localStorage.getItem(STORAGE_KEYS.BASE_URL) ||
      PROVIDER_CONFIGS[savedProvider].baseUrl
    const savedModelName =
      localStorage.getItem(STORAGE_KEYS.MODEL_NAME) ||
      PROVIDER_CONFIGS[savedProvider].models[0] || ''

    setProvider(savedProvider)
    setApiKey(savedApiKey)
    setBaseUrl(savedBaseUrl)
    setModelName(savedModelName)

    // Notify parent of initial config
    onConfigChange(savedApiKey, { baseUrl: savedBaseUrl, modelName: savedModelName })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleProviderChange = (event: SelectChangeEvent) => {
    const newProvider = event.target.value as Provider
    setProvider(newProvider)

    if (newProvider !== 'custom') {
      const config = PROVIDER_CONFIGS[newProvider]
      setBaseUrl(config.baseUrl)
      setModelName(config.models[0] || '')
    }
  }

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEYS.PROVIDER, provider)
    localStorage.setItem(STORAGE_KEYS.API_KEY, apiKey)
    localStorage.setItem(STORAGE_KEYS.BASE_URL, baseUrl)
    localStorage.setItem(STORAGE_KEYS.MODEL_NAME, modelName)

    onConfigChange(apiKey, { baseUrl, modelName })
    if (externalOnClose) {
      externalOnClose()
    } else {
      setInternalOpen(false)
    }
  }

  const handleOpen = () => {
    if (externalOpen === undefined) {
      setInternalOpen(true)
    }
  }

  const handleClose = () => {
    if (externalOnClose) {
      externalOnClose()
    } else {
      setInternalOpen(false)
    }
  }

  const currentConfig = PROVIDER_CONFIGS[provider]
  const isCustomProvider = provider === 'custom'

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#202123',
          backgroundImage: 'none',
          borderRadius: 2,
        }
      }}
    >
        <DialogTitle sx={{ pb: 1 }}>LLM Configuration</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* Provider Selection */}
            <FormControl fullWidth>
              <InputLabel sx={{ color: '#8e8ea0', '&.Mui-focused': { color: '#10a37f' } }}>Provider</InputLabel>
              <Select
                value={provider}
                label="Provider"
                onChange={handleProviderChange}
                sx={{
                  bgcolor: '#40414f',
                  color: '#ececec',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#565869' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#8e8ea0' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#10a37f' },
                }}
              >
                <MenuItem value="doubao">{PROVIDER_CONFIGS.doubao.name}</MenuItem>
                <MenuItem value="qwen">{PROVIDER_CONFIGS.qwen.name}</MenuItem>
                <MenuItem value="openai">{PROVIDER_CONFIGS.openai.name}</MenuItem>
                <MenuItem value="custom">{PROVIDER_CONFIGS.custom.name}</MenuItem>
              </Select>
            </FormControl>

            {/* API Key */}
            <TextField
              label="API Key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              fullWidth
              required
              helperText={`Your ${currentConfig.name} API key`}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#40414f',
                  color: '#ececec',
                  '& fieldset': { borderColor: '#565869' },
                  '&:hover fieldset': { borderColor: '#8e8ea0' },
                  '&.Mui-focused fieldset': { borderColor: '#10a37f' }
                },
                '& .MuiInputLabel-root': { color: '#8e8ea0' },
                '& .MuiInputLabel-root.Mui-focused': { color: '#10a37f' },
                '& .MuiFormHelperText-root': { color: '#8e8ea0' }
              }}
            />

            {/* Model Selection (for preset providers) */}
            {!isCustomProvider && currentConfig.models.length > 0 && (
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#8e8ea0', '&.Mui-focused': { color: '#10a37f' } }}>Model</InputLabel>
                <Select
                  value={modelName}
                  label="Model"
                  onChange={(e) => setModelName(e.target.value)}
                  sx={{
                    bgcolor: '#40414f',
                    color: '#ececec',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#565869' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#8e8ea0' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#10a37f' },
                  }}
                >
                  {currentConfig.models.map((model) => (
                    <MenuItem key={model} value={model}>
                      {model}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* Base URL (editable for custom provider or advanced users) */}
            {isCustomProvider && (
              <TextField
                label="Base URL"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                fullWidth
                required
                helperText="e.g., https://api.openai.com/v1"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#40414f',
                    color: '#ececec',
                    '& fieldset': { borderColor: '#565869' },
                    '&:hover fieldset': { borderColor: '#8e8ea0' },
                    '&.Mui-focused fieldset': { borderColor: '#10a37f' }
                  },
                  '& .MuiInputLabel-root': { color: '#8e8ea0' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#10a37f' },
                  '& .MuiFormHelperText-root': { color: '#8e8ea0' }
                }}
              />
            )}

            {/* Model Name (for custom provider) */}
            {isCustomProvider && (
              <TextField
                label="Model Name"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                fullWidth
                required
                helperText="e.g., gpt-4, llama-3"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#40414f',
                    color: '#ececec',
                    '& fieldset': { borderColor: '#565869' },
                    '&:hover fieldset': { borderColor: '#8e8ea0' },
                    '&.Mui-focused fieldset': { borderColor: '#10a37f' }
                  },
                  '& .MuiInputLabel-root': { color: '#8e8ea0' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#10a37f' },
                  '& .MuiFormHelperText-root': { color: '#8e8ea0' }
                }}
              />
            )}

            {/* Action Buttons */}
            <Stack direction="row" spacing={2} sx={{ mt: 3, pb: 1 }}>
              <Button
                variant="contained"
                onClick={handleSave}
                fullWidth
                sx={{
                  bgcolor: '#10a37f',
                  color: 'white',
                  textTransform: 'none',
                  py: 1.5,
                  fontSize: 15,
                  fontWeight: 500,
                  '&:hover': { bgcolor: '#0d8c6d' }
                }}
              >
                Save
              </Button>
              <Button
                variant="outlined"
                onClick={handleClose}
                fullWidth
                sx={{
                  borderColor: '#565869',
                  color: '#ececec',
                  textTransform: 'none',
                  py: 1.5,
                  fontSize: 15,
                  fontWeight: 500,
                  '&:hover': { borderColor: '#8e8ea0', bgcolor: '#40414f' }
                }}
              >
                Cancel
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
  )
}
