import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// O watcher do Vite não enxerga alterações em bind mount do Docker no Windows e
// no macOS: os eventos do sistema de arquivos do host não cruzam a fronteira do
// container. Sem polling, editar um arquivo não recarrega a página — parece que
// a alteração não surtiu efeito, e o hot reload some sem aviso.
//
// Fica atrás de uma variável para só custar CPU dentro do container; rodando
// nativo (`npm run dev`), os eventos nativos funcionam e o polling é dispensável.
const usarPolling = process.env.CHOKIDAR_USEPOLLING === 'true'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    watch: usarPolling ? { usePolling: true, interval: 300 } : undefined,
  },
})
