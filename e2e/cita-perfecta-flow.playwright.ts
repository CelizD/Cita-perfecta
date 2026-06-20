import { expect, test } from '@playwright/test';

test('MVP flow: register, onboarding, photo, explore, match and chat', async ({ page }) => {
  const email = `demo-${Date.now()}@example.com`;

  await page.goto('/register');
  await page.getByLabel(/nombre/i).fill('Demo Cita');
  await page.getByLabel(/correo|email/i).fill(email);
  await page.getByLabel(/contrasena|password/i).first().fill('Demo123456!');
  await page.getByLabel(/confirmar/i).fill('Demo123456!');
  await page.getByRole('button', { name: /crear/i }).click();

  await page.goto('/onboarding');
  await page.getByLabel(/acepto/i).check();
  await page.getByRole('button', { name: /continuar/i }).click();
  await page.getByLabel(/nombre/i).fill('Demo Cita');
  await page.getByLabel(/ciudad/i).fill('Tijuana');
  await page.getByRole('button', { name: /continuar/i }).click();

  const sliders = page.locator('input[type="range"]');
  for (let index = 0; index < await sliders.count(); index += 1) {
    await sliders.nth(index).fill('4');
  }
  await page.getByRole('button', { name: /aura|dashboard/i }).click();

  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: /editar perfil/i })).toBeVisible();

  await page.goto('/explore');
  await page.getByRole('button', { name: /like/i }).first().click();

  await page.goto('/matches');
  await expect(page.getByRole('heading', { name: /matches/i })).toBeVisible();

  await page.goto('/chats');
  await expect(page.getByText(/chat|conversacion/i).first()).toBeVisible();
});
