// @ts-check
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  reporter: [['list'], ['html', { open: 'never' }]], // lista en consola + reporte web
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'on',          // toma captura de cada prueba (tu evidencia)
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {                 // enciende tu página automáticamente antes de probar
    command: 'npx http-server . -p 3000 -c-1',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
  },
});

