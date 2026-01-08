import { test, expect } from '@playwright/test';

test.describe('Autenticação', () => {
    test('deve exibir página de login', async ({ page }) => {
        await page.goto('/');

        // Verificar elementos da página de login
        await expect(page.locator('text=Floresce.ai')).toBeVisible();
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();
        await expect(page.locator('button:has-text("Entrar")')).toBeVisible();
    });

    test('deve fazer login com credenciais demo', async ({ page }) => {
        await page.goto('/');

        // Preencher credenciais
        await page.fill('input[type="email"]', 'demo@floresce.ai');
        await page.fill('input[type="password"]', 'demo123');

        // Clicar no botão de login
        await page.click('button:has-text("Entrar")');

        // Aguardar redirecionamento para dashboard
        await page.waitForURL('**/dashboard', { timeout: 10000 });

        // Verificar que está no dashboard
        await expect(page.locator('text=Dashboard')).toBeVisible();
    });

    test('deve fazer logout corretamente', async ({ page }) => {
        // Login primeiro
        await page.goto('/');
        await page.fill('input[type="email"]', 'demo@floresce.ai');
        await page.fill('input[type="password"]', 'demo123');
        await page.click('button:has-text("Entrar")');
        await page.waitForURL('**/dashboard', { timeout: 10000 });

        // Clicar em Sair
        await page.click('button:has-text("Sair")');

        // Verificar retorno à página de login
        await page.waitForURL('/');
        await expect(page.locator('input[type="email"]')).toBeVisible();
    });

    test('deve mostrar erro com credenciais inválidas', async ({ page }) => {
        await page.goto('/');

        await page.fill('input[type="email"]', 'invalido@email.com');
        await page.fill('input[type="password"]', 'senhaerrada');
        await page.click('button:has-text("Entrar")');

        // Deve permanecer na página de login (não redireciona)
        await expect(page).toHaveURL('/');
    });
});
