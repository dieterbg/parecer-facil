import { test, expect } from '@playwright/test';

// Fixture para login antes dos testes
test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', 'demo@floresce.ai');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button:has-text("Entrar")');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
});

test.describe('Turmas', () => {
    test('deve navegar para lista de turmas', async ({ page }) => {
        // Clicar em Minhas Turmas na sidebar
        await page.click('text=Minhas Turmas');
        await page.waitForURL('**/turmas');

        // Verificar título
        await expect(page.locator('h1:has-text("Minhas Turmas")')).toBeVisible();
    });

    test('deve exibir turmas existentes', async ({ page }) => {
        await page.goto('/turmas');

        // Verificar se há pelo menos um card de turma (botão Ver Turma)
        await expect(page.locator('button:has-text("Ver Turma")').first()).toBeVisible({ timeout: 5000 });
    });

    test('deve abrir modal de criar turma', async ({ page }) => {
        await page.goto('/turmas');

        // Clicar no botão Nova Turma
        await page.click('button:has-text("Nova Turma")');

        // Verificar que modal aparece (input para nome da turma)
        await expect(page.locator('input').first()).toBeVisible({ timeout: 3000 });
    });

    test('deve criar uma nova turma', async ({ page }) => {
        await page.goto('/turmas');

        // Abrir modal
        await page.click('button:has-text("Nova Turma")');

        // Preencher nome (usando placeholder para ser específico)
        const nomeTurma = `Turma E2E ${Date.now()}`;
        await page.fill('input[placeholder="Ex: Jardim II A"]', nomeTurma);

        // Clicar em criar
        await page.click('button:has-text("Criar Turma")');

        // Aguardar modal fechar e turma aparecer (aumentando timeout por segurança)
        await expect(page.locator(`text=${nomeTurma}`)).toBeVisible({ timeout: 10000 });
    });

    test('deve acessar detalhes de uma turma', async ({ page }) => {
        await page.goto('/turmas');

        // Garantir que a lista carregou
        await expect(page.locator('text=Minhas Turmas')).toBeVisible();

        // Encontrar o botão 'Ver Turma' do primeiro card
        const viewButton = page.locator('a[href^="/turmas/"] button').first();
        await expect(viewButton).toBeVisible({ timeout: 10000 });

        // Clicar e aguardar navegação
        await viewButton.click();
        await page.waitForURL(/\/turmas\/[a-z0-9-]+/);

        // Verificar elementos da página de detalhes
        await expect(page.locator('text=Registros e Observações')).toBeVisible();
    });
});
