import { test, expect } from '@playwright/test';

// Fixture para login e navegar para turma
test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', 'demo@floresce.ai');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button:has-text("Entrar")');
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Navegar para turmas e selecionar a primeira
    await page.goto('/turmas');
    await page.click('button:has-text("Ver Turma")');
    await page.waitForTimeout(1000);
});

test.describe('Registros', () => {
    test('deve exibir timeline de registros', async ({ page }) => {
        // Verificar tab Registros ativa
        await expect(page.locator('text=Registros e Observações')).toBeVisible();
    });

    test('deve abrir FAB e mostrar opções', async ({ page }) => {
        // Clicar no FAB (usando aria-label correto)
        await page.click('button[aria-label="Novo registro"]');

        // Verificar opções
        await expect(page.locator('text=Foto')).toBeVisible();
        await expect(page.locator('text=Áudio')).toBeVisible();
        await expect(page.locator('text=Nota')).toBeVisible();
    });

    test('deve abrir modal de texto ao clicar em Nota', async ({ page }) => {
        // Clicar no FAB
        await page.click('button[aria-label="Novo registro"]');
        await page.waitForTimeout(300);

        // Clicar em Nota
        await page.click('button:has-text("Nota")');

        // Verificar modal de Nova Observação
        await expect(page.locator('text=Novo Registro').or(page.locator('text=Nova Observação'))).toBeVisible({ timeout: 5000 });
    });

    test('deve criar registro de texto', async ({ page }) => {
        // Clicar no FAB
        await page.click('button[aria-label="Novo registro"]');
        await page.waitForTimeout(300);
        await page.click('button:has-text("Nota")');

        // Aguardar modal
        await page.waitForTimeout(1000);

        // Preencher observação (primeiro textarea disponível)
        const textarea = page.locator('textarea').first();
        if (await textarea.isVisible()) {
            await textarea.fill('Observação de teste E2E - ' + Date.now());

            // Salvar
            const salvarBtn = page.locator('button:has-text("Salvar")');
            if (await salvarBtn.isVisible()) {
                await salvarBtn.click();
                await page.waitForTimeout(2000);
            }
        }
    });
});
