import { test, expect } from '@playwright/test';

// Helper para navegar até a aba de marcos do aluno
async function navegarParaMarcos(page: any) {
    await page.goto('/');
    await page.fill('input[type="email"]', 'demo@floresce.ai');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button:has-text("Entrar")');
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    await page.goto('/turmas');
    await page.click('text=Ver Turma >> nth=0');
    await page.click('text=Alunos');
    await page.waitForTimeout(500);

    const alunoLink = page.locator('a[href*="/alunos/"]').first();
    if (await alunoLink.isVisible()) {
        await alunoLink.click();
        await page.waitForURL(/\/alunos\/[a-z0-9-]+/);
        await page.click('text=Marcos');
        await page.waitForTimeout(500);
        return true;
    }
    return false;
}

test.describe('Marcos de Desenvolvimento', () => {
    test('deve exibir área de desenvolvimento por área', async ({ page }) => {
        const success = await navegarParaMarcos(page);
        if (!success) {
            test.skip();
            return;
        }

        // Verificar seção de desenvolvimento
        await expect(page.locator('text=Desenvolvimento por Área')).toBeVisible();

        // Verificar que áreas estão visíveis (corrigidas - não duplicadas)
        await expect(page.locator('text=M. Fina').or(page.locator('text=Linguagem'))).toBeVisible();
    });

    test('deve abrir formulário de novo marco', async ({ page }) => {
        const success = await navegarParaMarcos(page);
        if (!success) {
            test.skip();
            return;
        }

        // Clicar em Novo Marco
        await page.click('button:has-text("Novo Marco")');

        // Verificar que formulário aparece
        await expect(page.locator('input[placeholder*="Título"]')).toBeVisible({ timeout: 3000 });
        await expect(page.locator('textarea[placeholder*="Descrição"]')).toBeVisible();
    });

    test('deve criar um novo marco', async ({ page }) => {
        const success = await navegarParaMarcos(page);
        if (!success) {
            test.skip();
            return;
        }

        // Abrir formulário
        await page.click('button:has-text("Novo Marco")');
        await page.waitForTimeout(500);

        // Preencher dados
        const tituloMarco = `Marco E2E ${Date.now()}`;
        await page.fill('input[placeholder*="Título"]', tituloMarco);
        await page.fill('textarea[placeholder*="Descrição"]', 'Descrição do marco de teste E2E');

        // Salvar
        await page.click('button:has-text("Salvar")');

        // Verificar que marco aparece na lista
        await page.waitForTimeout(2000);
        await expect(page.locator(`text=${tituloMarco}`)).toBeVisible({ timeout: 5000 });
    });

    test('deve cancelar criação de marco', async ({ page }) => {
        const success = await navegarParaMarcos(page);
        if (!success) {
            test.skip();
            return;
        }

        // Abrir formulário
        await page.click('button:has-text("Novo Marco")');
        await page.waitForTimeout(500);

        // Cancelar
        await page.click('button:has-text("Cancelar")');

        // Verificar que formulário fechou
        await expect(page.locator('input[placeholder*="Título"]')).not.toBeVisible({ timeout: 2000 });
    });
});
