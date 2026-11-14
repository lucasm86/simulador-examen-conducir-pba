import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './ui/App'
import { LimiteDeErrores } from './ui/componentes/LimiteDeErrores'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LimiteDeErrores>
      <App />
    </LimiteDeErrores>
  </StrictMode>,
)
