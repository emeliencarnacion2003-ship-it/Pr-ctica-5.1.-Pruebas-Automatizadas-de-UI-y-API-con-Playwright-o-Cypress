import { test, expect } from '@playwright/test';


const datosReserva = {
  restaurante: 'mar',            // id del restaurante en menu.json
  nombre: 'Ana Pérez',
  telefono: '809-555-1234',
  hora: '19:30',
  personas: 4,
};

// La fecha debe ser de hoy en adelante, así que usamos mañana
function fechaManana() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().split('T')[0];
}

// Función auxiliar para no repetir el llenado del formulario
async function llenarFormulario(page, d) {
  await page.getByLabel('Restaurante', { exact: true }).selectOption(d.restaurante);
  await page.getByLabel('Nombre completo').fill(d.nombre);
  await page.getByLabel('Teléfono').fill(d.telefono);
  await page.getByLabel('Fecha').fill(fechaManana());
  await page.getByLabel('Hora').fill(d.hora);
  await page.getByLabel('Cantidad de personas').fill(String(d.personas));
}

test('1. El menú carga desde el JSON y se puede navegar', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Mesa Lista/);
  await expect(page.locator('#contenido h2')).toHaveText('Inicio');

  await page.getByRole('button', { name: 'Contacto' }).click();
  await expect(page.locator('#contenido h2')).toHaveText('Contacto');
  await expect(page.locator('#contenido')).toContainText('reservas@mesalista.do');

  // Submenú: pasar el mouse por "Restaurantes" y elegir una opción
  await page.locator('.etiqueta').hover();
  await page.getByRole('button', { name: 'Sabor Criollo' }).click();
  await expect(page.locator('#contenido h2')).toHaveText('Sabor Criollo');
});

test('2. Crear una reserva y verla en "Mis reservas"', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Reservar mesa' }).click();
  await llenarFormulario(page, datosReserva);
  await page.getByRole('button', { name: 'Confirmar reserva' }).click();
  await expect(page.locator('#mensaje')).toContainText('Reserva confirmada');

  await page.getByRole('button', { name: 'Mis reservas' }).click();
  await expect(page.locator('.tarjeta-reserva')).toHaveCount(1);
  await expect(page.locator('.tarjeta-reserva')).toContainText('Brisa Marina');
  await expect(page.locator('.tarjeta-reserva')).toContainText('4 persona(s)');

  // Comprobar que se guardó (localStorage) aunque se recargue la página
  await page.reload();
  await page.getByRole('button', { name: 'Mis reservas' }).click();
  await expect(page.locator('.tarjeta-reserva')).toHaveCount(1);
});

test('3. No permite dos reservas iguales', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Reservar mesa' }).click();

  await llenarFormulario(page, datosReserva);
  await page.getByRole('button', { name: 'Confirmar reserva' }).click();
  await expect(page.locator('#mensaje')).toContainText('Reserva confirmada');

  await llenarFormulario(page, datosReserva);   // mismos datos otra vez
  await page.getByRole('button', { name: 'Confirmar reserva' }).click();
  await expect(page.locator('#mensaje')).toContainText('Ya existe una reserva');

  await page.getByRole('button', { name: 'Mis reservas' }).click();
  await expect(page.locator('.tarjeta-reserva')).toHaveCount(1);
});