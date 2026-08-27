import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateIcons() {
  console.log('🎨 Gerando ícones PNG para PWA...');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();

  const svgPath = path.resolve(__dirname, '../public/icons/water-drop.svg');
  const svgContent = fs.readFileSync(svgPath, 'utf8');

  // Gerar 192x192
  await page.setViewport({ width: 192, height: 192 });
  await page.setContent(`<body style="margin:0;padding:0;background:transparent;overflow:hidden">${svgContent}</body>`);
  await page.screenshot({ path: path.resolve(__dirname, '../public/icons/icon-192x192.png'), omitBackground: true });
  console.log('✅ icon-192x192.png gerado.');

  // Gerar 512x512
  await page.setViewport({ width: 512, height: 512 });
  await page.setContent(`<body style="margin:0;padding:0;background:transparent;overflow:hidden">${svgContent}</body>`);
  await page.screenshot({ path: path.resolve(__dirname, '../public/icons/icon-512x512.png'), omitBackground: true });
  console.log('✅ icon-512x512.png gerado.');

  // Gerar apple-touch-icon.png 180x180
  await page.setViewport({ width: 180, height: 180 });
  await page.setContent(`<body style="margin:0;padding:0;background:#0f172a;overflow:hidden">${svgContent}</body>`);
  await page.screenshot({ path: path.resolve(__dirname, '../public/icons/apple-touch-icon.png') });
  console.log('✅ apple-touch-icon.png gerado.');

  await browser.close();
}

generateIcons().catch(console.error);
