import { test, expect } from '@playwright/test';

// Fixture para login
test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', 'demo@floresce.ai');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button:has-text("Entrar")');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
});

test.describe('Meu Perfil', () => {
    test('deve navegar para página de perfil', async ({ page }) => {
        await page.click('text=Meu Perfil');
        await page.waitForURL('**/perfil');

        await expect(page.locator('h1:has-text("Meu Perfil")')).toBeVisible();
    });

    test('deve exibir formulário de perfil', async ({ page }) => {
        await page.goto('/perfil');

        // Verificar campos
        await expect(page.locator('text=Nome Completo')).toBeVisible();
        await expect(page.locator('button:has-text("Salvar Perfil")')).toBeVisible();
    });

    test('deve salvar alterações no perfil', async ({ page }) => {
        await page.goto('/perfil');

        // Preencher nome
        const nomeInput = page.locator('input').first();
        await nomeInput.fill(`Professor E2E ${Date.now()}`);

        // Salvar
        await page.click('button:has-text("Salvar Perfil")');

        // Aguardar feedback
        await page.waitForTimeout(2000);

        // Verificar que salvou (não tem erro visível)
        await expect(page.locator('text=Erro')).not.toBeVisible();
    });
});

test.describe('Dashboard', () => {
    test('deve exibir métricas do dashboard', async ({ page }) => {
        await page.goto('/dashboard');

        // Verificar cards de métricas (pelo menos H1 ou título)
        await expect(page.locator('h1:has-text("Dashboard")').or(page.locator('text=Resumo'))).toBeVisible();
    });

    test('deve ter link para turmas', async ({ page }) => {
        await page.goto('/dashboard');

        // Verificar que sidebar tem link para turmas
        await expect(page.locator('text=Minhas Turmas')).toBeVisible();
    });
});
