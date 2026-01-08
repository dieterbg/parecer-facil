import { test, expect } from '@playwright/test';

// Fixture para login e navegar para perfil do aluno
test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', 'demo@floresce.ai');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button:has-text("Entrar")');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
});

test.describe('Perfil do Aluno', () => {
    test('deve navegar para perfil do aluno via turma', async ({ page }) => {
        // Ir para turmas
        await page.goto('/turmas');

        // Entrar em uma turma
        await page.click('text=Ver Turma >> nth=0');
        await page.waitForURL(/\/turmas\/[a-z0-9-]+/);

        // Ir para aba Alunos
        await page.click('text=Alunos');
        await page.waitForTimeout(500);

        // Clicar no link externo de um aluno (ícone)
        const alunoLink = page.locator('a[href*="/alunos/"]').first();
        if (await alunoLink.isVisible()) {
            await alunoLink.click();
            await page.waitForURL(/\/alunos\/[a-z0-9-]+/);

            // Verificar elementos do perfil
            await expect(page.locator('text=Registros')).toBeVisible();
            await expect(page.locator('text=Fotos')).toBeVisible();
            await expect(page.locator('text=Marcos')).toBeVisible();
        }
    });

    test('deve exibir dados básicos do aluno', async ({ page }) => {
        await page.goto('/turmas');
        await page.click('text=Ver Turma >> nth=0');
        await page.click('text=Alunos');
        await page.waitForTimeout(500);

        const alunoLink = page.locator('a[href*="/alunos/"]').first();
        if (await alunoLink.isVisible()) {
            await alunoLink.click();
            await page.waitForURL(/\/alunos\/[a-z0-9-]+/);

            // Verificar que nome do aluno é exibido
            const nomeAluno = page.locator('h1').first();
            await expect(nomeAluno).toBeVisible();

            // Verificar botão de gerar parecer
            await expect(page.locator('text=Gerar Esboço de Parecer')).toBeVisible();
        }
    });

    test('deve alternar entre abas do perfil', async ({ page }) => {
        await page.goto('/turmas');
        await page.click('text=Ver Turma >> nth=0');
        await page.click('text=Alunos');
        await page.waitForTimeout(500);

        const alunoLink = page.locator('a[href*="/alunos/"]').first();
        if (await alunoLink.isVisible()) {
            await alunoLink.click();
            await page.waitForURL(/\/alunos\/[a-z0-9-]+/);

            // Testar navegação pelas abas
            await page.click('text=Galeria');
            await expect(page.locator('text=Galeria').first()).toBeVisible();

            await page.click('text=Timeline');
            await expect(page.locator('text=Timeline').first()).toBeVisible();

            await page.click('text=Marcos');
            await expect(page.locator('text=Marcos').first()).toBeVisible();
        }
    });
});
