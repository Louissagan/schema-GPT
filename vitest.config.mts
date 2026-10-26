import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
export default defineConfig({resolve:{alias:{'@':fileURLToPath(new URL('./vendor/open-intelligent-ui/src',import.meta.url))}},test:{include:['vendor/open-intelligent-ui/src/**/*.test.ts','src/**/*.test.ts']}});
