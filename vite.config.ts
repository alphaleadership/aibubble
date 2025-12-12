import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Use relative paths for better GitHub Pages compatibility
  define: {
    // Inject the API key from the build environment into the client code
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
})