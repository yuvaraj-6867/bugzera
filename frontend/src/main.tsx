import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Remove the HTML loader once React has mounted
const loader = document.getElementById('app-loader')
if (loader) {
  loader.style.transition = 'opacity 0.3s ease'
  loader.style.opacity = '0'
  setTimeout(() => loader.remove(), 300)
}
