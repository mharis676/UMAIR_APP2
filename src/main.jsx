import { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class RecordErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <main style={{ padding: 24 }}><h1>Unable to open saved records</h1><p>Keep the app data intact so your stock records can be recovered. Close and reopen the app to retry.</p></main>;
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RecordErrorBoundary><App /></RecordErrorBoundary>
  </StrictMode>,
)
