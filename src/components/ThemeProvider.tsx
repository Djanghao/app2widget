'use client'

import { ThemeProvider as MUIThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#10a37f',
    },
    secondary: {
      main: '#5436DA',
    },
    background: {
      default: '#212121',
      paper: '#2f2f2f',
    },
    text: {
      primary: '#ececec',
      secondary: '#b4b4b4',
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#212121',
          color: '#ececec',
          overflow: 'hidden',
        },
        // Custom scrollbar styles for webkit browsers
        '*::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '*::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '*::-webkit-scrollbar-thumb': {
          background: '#565869',
          borderRadius: '4px',
        },
        '*::-webkit-scrollbar-thumb:hover': {
          background: '#6e6e80',
        },
        // Firefox scrollbar
        '*': {
          scrollbarWidth: 'thin',
          scrollbarColor: '#565869 transparent',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#202123',
          backgroundImage: 'none',
          boxShadow: '0 0 0 1px rgba(0,0,0,.1), 0 10px 15px -3px rgba(0,0,0,.1), 0 4px 6px -2px rgba(0,0,0,.05)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          color: '#ececec',
          fontSize: '18px',
          fontWeight: 600,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#10a37f',
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          '&.Mui-focused': {
            color: '#10a37f',
          },
        },
      },
    },
  },
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <MUIThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MUIThemeProvider>
  )
}
