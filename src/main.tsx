import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css' 
import { BrowserRouter } from 'react-router-dom'

// --- CORREÇÃO DA TELA BRANCA ---
// A barra '/' no final da palavra 'buffer/' é OBRIGATÓRIA no Vite.
// Ela impede que o Vite bloqueie a aplicação e resolve o erro do PDF.
import { Buffer } from 'buffer/';
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
}
// --------------------------------

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter> 
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)