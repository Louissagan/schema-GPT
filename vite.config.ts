import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./vendor/open-intelligent-ui/src', import.meta.url)) } },
  define: { 'process.env.NEXT_PUBLIC_BASE_PATH': '""', 'process.env.NEXT_PUBLIC_OPENUI_DEVTOOLS': '"0"' },
  build: { rollupOptions: { input: { main: 'index.html', gallery: 'openui-gallery.html', chat: 'openui-chat.html', chatRoute: 'openui-chat/index.html' } } },
});
