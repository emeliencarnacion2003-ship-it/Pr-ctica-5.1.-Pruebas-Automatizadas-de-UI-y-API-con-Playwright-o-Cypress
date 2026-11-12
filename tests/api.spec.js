import { test, expect } from '@playwright/test';

const BASE = 'https://jsonplaceholder.typicode.com';

test('GET /posts/1 responde 200 y devuelve un JSON válido', async ({ request }) => {
  const respuesta = await request.get(`${BASE}/posts/1`);
  expect(respuesta.status()).toBe(200);

  const datos = await respuesta.json();
  expect(datos.id).toBe(1);
  expect(datos).toHaveProperty('title');
  expect(datos).toHaveProperty('body');
  expect(typeof datos.userId).toBe('number');
});

test('GET /posts/99999 responde 404 porque no existe', async ({ request }) => {
  const respuesta = await request.get(`${BASE}/posts/99999`);
  expect(respuesta.status()).toBe(404);
});

test('POST /posts crea un recurso y responde 201', async ({ request }) => {
  const respuesta = await request.post(`${BASE}/posts`, {
    data: { title: 'Reserva de prueba', body: 'Mesa para 4', userId: 1 },
  });
  expect(respuesta.status()).toBe(201);

  const datos = await respuesta.json();
  expect(datos.title).toBe('Reserva de prueba');
  expect(datos).toHaveProperty('id');
});