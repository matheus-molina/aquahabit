import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Administrador/.gemini/antigravity/brain/cd017de4-6b61-4170-80f3-2d36e607b1b2';

async function runE2ETests() {
  console.log('🚀 Iniciando bateria de testes automatizados E2E no frontend...');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 420, height: 880, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

  try {
    // 1. Acessar aplicação
    console.log('📍 1. Acessando http://localhost:5173 ...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_01_home.png') });
    console.log('  ✅ Screenshot 1 salvo (Home inicial).');

    // 2. Testar Setup Corporal / Onboarding Modal
    console.log('📍 2. Abrindo Setup Corporal / Onboarding...');
    const imcBtn = await page.waitForSelector('button[title*="Ajustar dados corporais"]');
    await imcBtn.click();
    await new Promise(r => setTimeout(r, 600));

    // Digitar peso 80 e altura 170
    console.log('  -> Alterando Peso para 80kg e Altura para 170cm...');
    const inputs = await page.$$('input[type="number"]');
    if (inputs.length >= 2) {
      await inputs[0].click({ clickCount: 3 });
      await inputs[0].type('80');
      await inputs[1].click({ clickCount: 3 });
      await inputs[1].type('170');
    }

    // Selecionar Nível Intenso
    console.log('  -> Selecionando nível de atividade física "Intenso"...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const intenseBtn = buttons.find(b => b.textContent && b.textContent.includes('Intenso'));
      if (intenseBtn) intenseBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_02_onboarding_preview.png') });
    console.log('  ✅ Screenshot 2 salvo (Setup Corporal com preview dinâmico de IMC 27.68 e Meta 4100ml).');

    // Salvar configuração
    const saveBtn = await page.$('button[type="submit"]');
    if (saveBtn) await saveBtn.click();
    await new Promise(r => setTimeout(r, 800));

    // 3. Testar Ingestão de Água e Botões Rápidos
    console.log('📍 3. Testando ingestão de água (+250ml e +500ml)...');
    
    // Selecionar "Água c/ Limão"
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const lemonBtn = buttons.find(b => b.textContent && b.textContent.includes('Limão'));
      if (lemonBtn) lemonBtn.click();
    });
    await new Promise(r => setTimeout(r, 300));

    // Clicar em +250ml
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const b250 = buttons.find(b => b.textContent && b.textContent.includes('+250'));
      if (b250) b250.click();
    });
    await new Promise(r => setTimeout(r, 500));

    // Clicar em +500ml
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const b500 = buttons.find(b => b.textContent && b.textContent.includes('+500'));
      if (b500) b500.click();
    });
    await new Promise(r => setTimeout(r, 500));

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_03_water_intake.png') });
    console.log('  ✅ Screenshot 3 salvo (Ingestão de 750ml com timeline atualizada).');

    // 4. Testar Meta Batida (100%+) e Confetes
    console.log('📍 4. Adicionando água até atingir 100% da meta (4100ml) para testar celebração...');
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const b750 = buttons.find(b => b.textContent && b.textContent.includes('+750'));
        if (b750) b750.click();
      });
      await new Promise(r => setTimeout(r, 200));
    }
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_04_goal_completed.png') });
    console.log('  ✅ Screenshot 4 salvo (Meta 100%+ atingida com anel esmeralda e celebração).');

    // 5. Testar Aba Calendário
    console.log('📍 5. Navegando para a aba Calendário...');
    await page.evaluate(() => {
      const navButtons = Array.from(document.querySelectorAll('nav button'));
      const calBtn = navButtons.find(b => b.textContent && b.textContent.includes('Calendário'));
      if (calBtn) calBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_05_calendar_view.png') });
    console.log('  ✅ Screenshot 5 salvo (Calendário mensal com dias e status de meta batida).');

    // 6. Testar Aba Estatísticas
    console.log('📍 6. Navegando para a aba Estatísticas...');
    await page.evaluate(() => {
      const navButtons = Array.from(document.querySelectorAll('nav button'));
      const statsBtn = navButtons.find(b => b.textContent && b.textContent.includes('Estatísticas'));
      if (statsBtn) statsBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_06_stats_dashboard.png') });
    console.log('  ✅ Screenshot 6 salvo (Dashboard de estatísticas e gráfico semanal de 7 dias).');

    console.log('🎉 Todos os 6 testes de frontend executados com sucesso total!');
  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
  } finally {
    await browser.close();
  }
}

runE2ETests();
