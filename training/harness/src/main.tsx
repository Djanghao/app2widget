import React from 'react'
import ReactDOM from 'react-dom/client'
import Widget from './App'

declare global {
  interface Window {
    __RENDER_COMPLETE__: boolean
  }
}

// Error boundary to prevent crashes from killing the page
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16, color: 'red', fontFamily: 'monospace', fontSize: 12 }}>
          Render Error: {this.state.error}
        </div>
      )
    }
    return this.props.children
  }
}

const root = ReactDOM.createRoot(document.getElementById('root')!)

root.render(
  <ErrorBoundary>
    <Widget />
  </ErrorBoundary>
)

// Signal render completion after a delay to allow MUI components to settle
setTimeout(() => {
  window.__RENDER_COMPLETE__ = true
}, 2000)
