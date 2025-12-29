'use client'

import { Box, Select, MenuItem, FormControl, IconButton, SelectChangeEvent } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import SettingsIcon from '@mui/icons-material/Settings'
import { useChatContext } from './ChatProvider'
import { useState, useEffect } from 'react'
import { PROVIDER_CONFIGS, saveLLMConfigToStorage } from '@/utils/llmConfig'
import { Provider } from '@/types/chat'

interface ChatHeaderProps {
  onToggleSidebar: () => void
  onSettingsClick: () => void
}

export function ChatHeader({ onToggleSidebar, onSettingsClick }: ChatHeaderProps) {
  const { llmConfig, setLLMConfig, provider, setProvider } = useChatContext()
  const [currentProvider, setCurrentProvider] = useState<Provider>(provider)

  useEffect(() => {
    setCurrentProvider(provider)
  }, [provider])

  const handleProviderChange = (event: SelectChangeEvent) => {
    const newProvider = event.target.value as Provider
    setCurrentProvider(newProvider)
    setProvider(newProvider)

    const config = PROVIDER_CONFIGS[newProvider]
    const newLLMConfig = {
      baseUrl: config.baseUrl,
      modelName: config.models[0] || ''
    }

    setLLMConfig(newLLMConfig)
    saveLLMConfigToStorage('', newProvider, newLLMConfig)
  }

  const handleModelChange = (event: SelectChangeEvent) => {
    const newModelName = event.target.value
    const newLLMConfig = {
      ...llmConfig,
      modelName: newModelName
    }

    setLLMConfig(newLLMConfig)
    saveLLMConfigToStorage('', currentProvider, newLLMConfig)
  }

  const currentModels = PROVIDER_CONFIGS[currentProvider]?.models || []

  return (
    <Box
      sx={{
        height: 60,
        borderBottom: '1px solid #3e3e3e',
        bgcolor: '#212121',
        px: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        flexShrink: 0,
      }}
    >
      {/* Hamburger Menu Button */}
      <IconButton
        onClick={onToggleSidebar}
        sx={{
          color: '#ececec',
          '&:hover': {
            bgcolor: '#40414f'
          }
        }}
      >
        <MenuIcon />
      </IconButton>

      {/* Provider Selection */}
      <FormControl size="small" sx={{ minWidth: 110 }}>
        <Select
          value={currentProvider}
          onChange={handleProviderChange}
          sx={{
            color: '#ececec',
            fontSize: 13,
            fontWeight: 500,
            '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
            '& .MuiSelect-select': {
              py: 0.75,
              px: 1.5,
              borderRadius: 1.5,
              bgcolor: '#40414f',
              '&:hover': {
                bgcolor: '#4a4b56'
              }
            },
            '& .MuiSvgIcon-root': {
              color: '#8e8ea0'
            }
          }}
        >
          <MenuItem value="openai">{PROVIDER_CONFIGS.openai.name}</MenuItem>
          <MenuItem value="doubao">{PROVIDER_CONFIGS.doubao.name}</MenuItem>
          <MenuItem value="qwen">{PROVIDER_CONFIGS.qwen.name}</MenuItem>
        </Select>
      </FormControl>

      {/* Model Selection */}
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <Select
          value={llmConfig.modelName}
          onChange={handleModelChange}
          sx={{
            color: '#ececec',
            fontSize: 13,
            fontWeight: 500,
            '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
            '& .MuiSelect-select': {
              py: 0.75,
              px: 1.5,
              borderRadius: 1.5,
              bgcolor: '#40414f',
              '&:hover': {
                bgcolor: '#4a4b56'
              }
            },
            '& .MuiSvgIcon-root': {
              color: '#8e8ea0'
            }
          }}
        >
          {currentModels.map((model) => (
            <MenuItem key={model} value={model}>
              {model}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Spacer to push settings to the right */}
      <Box sx={{ flex: 1 }} />

      {/* Settings Button */}
      <IconButton
        onClick={onSettingsClick}
        sx={{
          color: '#ececec',
          '&:hover': {
            bgcolor: '#40414f'
          }
        }}
      >
        <SettingsIcon />
      </IconButton>
    </Box>
  )
}
