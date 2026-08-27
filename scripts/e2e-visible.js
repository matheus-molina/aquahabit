import puppeteer from 'puppeteer';

async function runLiveBrowserTest() {
  console.log('🌐 Abrindo o navegador visível na sua tela...');

  // Iniciar navegador com janela visível (headless: false) e slowMo para visualização em tempo real
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    slowMo: 100, // Dá tempo para você ver cada clique e digitação na tela
    args: ['--start-maximized', '--no-sandbox']
  });

  const pages = await browser.pages();
  const page = pages[0] || (await browser.newPage());

  try {
    console.log('📍 1. Abrindo AquaHabit no navegador...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    console.log('📍 2. Abrindo Modal de Setup Corporal / IMC...');
    const imcBtn = await page.waitForSelector('button[title*="Ajustar dados corporais"]');
    await imcBtn.click();
    await new Promise(r => setTimeout(r, 1500));

    console.log('  -> Digitando Peso (80 kg) e Altura (170 cm)...');
    const inputs = await page.$$('input[type="number"]');
    if (inputs.length >= 2) {
      await inputs[0].click({ clickCount: 3 });
      await inputs[0].type('80', { delay: 100 });
      await new Promise(r => setTimeout(r, 500));

      await inputs[1].click({ clickCount: 3 });
      await inputs[1].type('170', { delay: 100 });
      await new Promise(r => setTimeout(r, 800));
    }

    console.log('  -> Selecionando Nível de Atividade: Intenso...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const intenseBtn = buttons.find(b => b.textContent && b.textContent.includes('Intenso'));
      if (intenseBtn) intenseBtn.click();
    });
    await new Promise(r => setTimeout(r, 2000));

    console.log('  -> Salvando perfil...');
    const saveBtn = await page.$('button[type="submit"]');
    if (saveBtn) await saveBtn.click();
    await new Promise(r => setTimeout(r, 1500));

    console.log('📍 3. Testando ingestão de água...');
    
    // Selecionar "Água c/ Limão"
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const lemonBtn = buttons.find(b => b.textContent && b.textContent.includes('Limão'));
      if (lemonBtn) lemonBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Adicionar +250ml
    console.log('  -> Clicando em +250ml...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const b250 = buttons.find(b => b.textContent && b.textContent.includes('+250'));
      if (b250) b250.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    // Adicionar +500ml
    console.log('  -> Clicando em +500ml...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const b500 = buttons.find(b => b.textContent && b.textContent.includes('+500'));
      if (b500) b500.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    // Adicionar água até bater a meta de 4100ml para acionar os confetes na tela
    console.log('📍 4. Adicionando água até bater 100% da meta para disparar a comemoração...');
    for (let i = 1; i <= 5; i++) {
      console.log(`  -> Adicionando +750ml (${i}/5)...`);
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const b750 = buttons.find(b => b.textContent && b.textContent.includes('+750'));
        if (b750) b750.click();
      });
      await new Promise(r => setTimeout(r, 1000));
    }

    console.log('  🎉 Meta batida! Aguardando visualização dos confetes e anel verde...');
    await new Promise(r => setTimeout(r, 3000));

    console.log('📍 5. Navegando para a aba Calendário...');
    await page.evaluate(() => {
      const navButtons = Array.from(document.querySelectorAll('nav button'));
      const calBtn = navButtons.find(b => b.textContent && b.textContent.includes('Calendário'));
      if (calBtn) calBtn.click();
    });
    await new Promise(r => setTimeout(r, 3000));

    console.log('📍 6. Navegando para a aba Estatísticas...');
    await page.evaluate(() => {
      const navButtons = Array.from(document.querySelectorAll('nav button'));
      const statsBtn = navButtons.find(b => b.textContent && b.textContent.includes('Estatísticas'));
      if (statsBtn) statsBtn.click();
    });
    await new Promise(r => setTimeout(r, 4000));

    console.log('📍 7. Voltando para o Diário...');
    await page.evaluate(() => {
      const navButtons = Array.from(document.querySelectorAll('nav button'));
      const plannerBtn = navButtons.find(b => b.textContent && b.textContent.includes('Diário'));
      if (plannerBtn) plannerBtn.click();
    });

    console.log('✨ Testes ao vivo finalizados! Deixando o navegador aberto para sua navegação...');
    // Manter o navegador aberto por 15 segundos para o usuário ver
    await new Promise(r => setTimeout(r, 15000));

  } catch (error) {
    console.error('Erro na execução:', error);
  } finally {
    await browser.close();
  }
}

runLiveBrowserTest();
