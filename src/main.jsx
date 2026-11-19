// src/main.jsx - Punto de entrada principal de React para inicializar BeaverVault
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Montaje del árbol de componentes en el elemento DOM #root con modo estricto activado
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
