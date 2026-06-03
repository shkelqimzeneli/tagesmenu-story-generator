import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright';
import { google } from 'googleapis';

const app = express();
const port = Number(process.env.PORT || 4300);

app.use(cors());
app.use(express.json({ limit: '2mb' }));

const sampleMenus = {
  tuermli: {
    restaurantId: 'tuermli',
    restaurantName: 'Türmli',
    template: 'tuermli',
    date: formatStoryDate(),
    introTitle: 'Menü inklusive',
    introDescription: 'Chili con Carne oder Tagessalat',
    dishes: [
      {
        name: 'Risotto',
        description: 'Gambas | Zitrone Sauce',
        price: 'CHF 19.80'
      },
      {
        name: 'Lachs vom Grill',
        description: 'Safran Sauce | Parmesanrisotto',
        price: 'CHF 22.80'
      }
    ]
  },
  kuonimatt: {
    restaurantId: 'kuonimatt',
    restaurantName: 'Kuonimatt',
    template: 'kuonimatt',
    date: formatStoryDate(),
    introTitle: 'MENÜ INKLUSIVE',
    introDescription: 'Süsskartoffelcremesuppe oder Tagessalat',
    dishes: [
      {
        name: 'Safranrisotto',
        description: 'mit Flusskrebse und Zucchettistreifen',
        descriptionLines: ['mit Flusskrebse', 'und Zucchettistreifen'],
        price: 'CHF 21.80'
      },
      {
        name: 'Grilliertes Schweinsteak mit Cafe de Parisbutter',
        description: 'dazu Rosmarinkartoffeln und Marktgemüse',
        descriptionLines: ['dazu Rosmarinkartoffeln', 'und Marktgemüse'],
        price: 'CHF 24.80'
      }
    ],
    pizza: {
      name: 'HOLZOFENPIZZA',
      description: 'nach Wahl'
    }
  },
  militaergarten: {
    restaurantId: 'militaergarten',
    restaurantName: 'Militärgarten',
    template: 'militaergarten',
    date: formatStoryDate(),
    introTitle: 'Menü Inklusive',
    introDescription: 'kleinen Salat vom Buffet',
    dishes: [
      {
        name: 'Gremiges Risotto mit Lauch und Speck,',
        description: 'dazu knusprige Parmesanchips',
        price: 'CHF 20.50'
      },
      {
        name: 'Pouletbrust mit Tomatensauce, Oliven und Rosmarin,',
        description: 'serviert mit Kroketten und Karotten aromatisiert mit Thymiane',
        price: 'CHF 22.50'
      }
    ]
  },
  lux: {
    restaurantId: 'lux',
    restaurantName: 'LUX',
    template: 'lux',
    date: formatStoryDate(),
    introTitle: 'Menu inklusive',
    introDescription: 'Tagessalat oder Tagessuppe',
    dishes: [
      {
        name: 'Risotto mit Taleggio E Porcini',
        description: 'Porcini pilze | Cress',
        price: 'CHF 19.80'
      },
      {
        name: 'SchweinsrahmSchnitzel',
        description: 'Pilzrahmsauce | Marktgemüse | Cremiges Polenta',
        descriptionLines: ['Pilzrahmsauce | Marktgemüse |', 'Cremiges Polenta'],
        price: 'CHF 22.80'
      }
    ]
  },
  zellfeld: {
    restaurantId: 'zellfeld',
    restaurantName: 'Zellfeld',
    template: 'zellfeld',
    date: '20.05.2026',
    introTitle: 'Menu inklusive',
    introDescription: 'Tagessalat oder Spargelcremesuppe',
    dishes: [
      {
        name: 'Spaghetti con Spinaci e Gorgonzola',
        description: 'Hausgemachte Spaghetti | Gorgonzola | Rahm | Spinat',
        descriptionLines: ['Hausgemachte Spaghetti | Gorgonzola |', 'Rahm | Spinat'],
        price: 'CHF 22.80'
      },
      {
        name: 'Gegrilltes Schweinsfilet an Sauce Bearnaise',
        description: 'Frühlingskartoffeln und Spargel',
        price: 'CHF 24.80'
      }
    ],
    pizza: {
      name: 'Pizza nach Wahl',
      description: ''
    }
  },
  fischerstube: {
    restaurantId: 'fischerstube',
    restaurantName: 'Fischerstube',
    template: 'fischerstube',
    date: '01.06.2026',
    introTitle: '',
    introDescription: '',
    dishes: [
      {
        name: 'Rinderschmorbraten',
        description: 'an Rotweinjus Rosmarinkartoffeln, Gemüse',
        descriptionLines: ['an Rotweinjus', 'Rosmarinkartoffeln,', 'Gemüse'],
        price: 'CHF 25.80'
      },
      {
        name: 'Gebratenes Doradenfilet',
        description: 'an Weissweinsauce Grünem Spargel-Risotto, Apfel',
        descriptionLines: ['an Weissweinsauce', 'Grünem Spargel-Risotto,', 'Apfel'],
        price: 'CHF 29.80'
      },
      {
        name: 'Frühlingsrollen',
        description: 'mit Sweet-Chili-Sauce Gemischtem Salat-Teller',
        descriptionLines: ['mit Sweet-Chili-Sauce', 'Gemischtem', 'Salat-Teller'],
        price: 'CHF 19.80'
      }
    ]
  }
};

const TEMPLATE_ROOT = path.join(process.cwd(), 'public', 'templates');
const TUERMLI_TEMPLATE = path.join(TEMPLATE_ROOT, 'tuermli-template.png');
const KUONIMATT_TEMPLATE = path.join(TEMPLATE_ROOT, 'kuonimatt-template.png');
const MILITAERGARTEN_TEMPLATE = path.join(TEMPLATE_ROOT, 'miga-tagesmenu-clean.jpg');
const LUX_TEMPLATE = path.join(TEMPLATE_ROOT, 'lux-template.png');
const ZELLFELD_TEMPLATE = path.join(TEMPLATE_ROOT, 'zellfeld-template.png');
const FISCHERSTUBE_TEMPLATE = path.join(TEMPLATE_ROOT, 'fischerstube-template.png');
const TUERMLI_MENU_API = 'https://api2.lunchgate.ch/menu/box/id/3234/';
const KUONIMATT_MENU_API = 'https://api2.lunchgate.ch/menu/box/id/10941/';
const MILITAERGARTEN_MENU_API = 'https://api2.lunchgate.ch/menu/box/id/15878/';
const LUX_MENU_API = 'https://api2.lunchgate.ch/menu/box/id/14178/';
const ZELLFELD_MENU_API = 'https://api2.lunchgate.ch/menu/box/id/5706/';
const FISCHERSTUBE_MENU_API = 'https://api2.lunchgate.ch/menu/box/id/5493/';
const ACTIVE_RESTAURANTS = ['tuermli', 'kuonimatt', 'lux', 'zellfeld', 'fischerstube', 'militaergarten'];
const APP_EXPORT_ROOT = process.env.APP_EXPORT_ROOT || path.join(process.cwd(), 'exports');

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/restaurants', (_req, res) => {
  res.json([
    { id: 'tuermli', name: 'Türmli' },
    { id: 'kuonimatt', name: 'Kuonimatt' },
    { id: 'lux', name: 'LUX' },
    { id: 'zellfeld', name: 'Zellfeld' },
    { id: 'fischerstube', name: 'Fischerstube' },
    { id: 'militaergarten', name: 'Militärgarten' },
    
  ]);
});

app.get('/api/menu/:restaurantId', async (req, res) => {
  try {
    const dayIndex = Number(req.query.day || 0);
    const fetchedMenu = await fetchRestaurantMenu(req.params.restaurantId, dayIndex);
    if (fetchedMenu) {
      res.json(fetchedMenu);
      return;
    }

    const menu = sampleMenus[req.params.restaurantId] || sampleMenus.tuermli;
    res.json(menu);
  } catch (error) {
    console.warn(`Using fallback menu because Lunchgate fetch failed: ${error.message}`);
    res.json(sampleMenus.tuermli);
  }
});

app.get('/api/template/tuermli', (_req, res) => {
  res.sendFile(TUERMLI_TEMPLATE);
});

app.get('/api/template/kuonimatt', (_req, res) => {
  res.sendFile(KUONIMATT_TEMPLATE);
});

app.get('/api/template/militaergarten', (_req, res) => {
  res.sendFile(MILITAERGARTEN_TEMPLATE);
});

app.get('/api/template/lux', (_req, res) => {
  res.sendFile(LUX_TEMPLATE);
});

app.get('/api/template/zellfeld', (_req, res) => {
  res.sendFile(ZELLFELD_TEMPLATE);
});

app.get('/api/template/fischerstube', (_req, res) => {
  res.sendFile(FISCHERSTUBE_TEMPLATE);
});

app.post('/api/render', async (req, res, next) => {
  let browser;

  try {
    const menu = req.body.menu || sampleMenus['tue-main'];
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
    const payload = encodeURIComponent(Buffer.from(JSON.stringify(menu)).toString('base64url'));

    await page.goto(`http://127.0.0.1:5173/render?menu=${payload}`, { waitUntil: 'networkidle' });
    const story = page.locator('[data-story-frame]');
    const png = await story.screenshot({ type: 'png' });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName(menu.restaurantName)}-${safeName(menu.date)}.png"`);
    res.send(png);
  } catch (error) {
    next(error);
  } finally {
    if (browser) await browser.close();
  }
});

app.post('/api/render-to-drive', async (req, res, next) => {
  try {
    const png = await renderPng(req.body.menu || sampleMenus['tue-main']);
    const fileName = `${safeName(req.body.menu?.restaurantName || 'tagesmenu')}-${safeName(req.body.menu?.date || 'today')}.png`;
    const result = await uploadToDrive(fileName, png);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.post('/api/render-all-to-drive', async (req, res, next) => {
  try {
    const dayIndex = Number(req.body.day || 0);
    const targetDate = req.body.date || null;
    const results = [];
    let exportDate = targetDate;

    for (const restaurantId of ACTIVE_RESTAURANTS) {
      try {
        const menu = targetDate
          ? await fetchRestaurantMenuForDate(restaurantId, targetDate)
          : await fetchRestaurantMenu(restaurantId, dayIndex);

        if (!menu?.hasMenu) {
          results.push({ restaurantId, ok: false, skipped: true, error: `No menu for ${targetDate || `day ${dayIndex}`}` });
          continue;
        }

        exportDate = exportDate || menu.date;
        const png = await renderPng(menu);
        const fileName = `${safeName(menu.restaurantName)}-${safeName(menu.date)}.png`;
        const result = await uploadToDrive(fileName, png, { localDir: path.join(APP_EXPORT_ROOT, safeFolderName(menu.date)) });
        results.push({ restaurantId, ok: true, fileName, ...result });
      } catch (error) {
        results.push({ restaurantId, ok: false, error: error.message });
      }
    }

    res.json({
      ok: results.some((result) => result.ok),
      uploaded: results.filter((result) => result.uploaded).length,
      savedLocal: results.filter((result) => result.localPath).length,
      skipped: results.filter((result) => result.skipped).length,
      failed: results.filter((result) => !result.ok && !result.skipped).length,
      exportFolder: exportDate ? path.join(APP_EXPORT_ROOT, safeFolderName(exportDate)) : null,
      results
    });
  } catch (error) {
    next(error);
  }
});

async function renderPng(menu) {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
    const payload = encodeURIComponent(Buffer.from(JSON.stringify(menu)).toString('base64url'));
    await page.goto(`http://127.0.0.1:5173/render?menu=${payload}`, { waitUntil: 'networkidle' });
    return await page.locator('[data-story-frame]').screenshot({ type: 'png' });
  } finally {
    await browser.close();
  }
}

async function fetchRestaurantMenu(restaurantId, dayIndex = 0) {
  if (restaurantId === 'tuermli') return await fetchTuermliMenu(dayIndex);
  if (restaurantId === 'kuonimatt') return await fetchKuonimattMenu(dayIndex);
  if (restaurantId === 'militaergarten') return await fetchMilitaergartenMenu(dayIndex);
  if (restaurantId === 'lux') return await fetchLuxMenu(dayIndex);
  if (restaurantId === 'zellfeld') return await fetchZellfeldMenu(dayIndex);
  if (restaurantId === 'fischerstube') return await fetchFischerstubeMenu(dayIndex);
  return null;
}

async function fetchRestaurantMenuForDate(restaurantId, targetDate) {
  const html = await fetchRestaurantHtml(restaurantId);
  const days = lunchgateDays(html);
  const matchedDay = days.find((day) => day.date === targetDate);

  if (!matchedDay) {
    return null;
  }

  return await fetchRestaurantMenu(restaurantId, matchedDay.index);
}

async function fetchRestaurantHtml(restaurantId) {
  const api = {
    tuermli: TUERMLI_MENU_API,
    kuonimatt: KUONIMATT_MENU_API,
    militaergarten: MILITAERGARTEN_MENU_API,
    lux: LUX_MENU_API,
    zellfeld: ZELLFELD_MENU_API,
    fischerstube: FISCHERSTUBE_MENU_API
  }[restaurantId];

  if (!api) throw new Error(`Unknown restaurant ${restaurantId}`);

  const response = await fetch(api, {
    headers: { 'User-Agent': 'Tagesmenu Story Generator/0.1' }
  });

  if (!response.ok) {
    throw new Error(`Lunchgate responded with ${response.status}`);
  }

  return await response.text();
}

async function uploadToDrive(fileName, png, options = {}) {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!folderId || !credentialsPath) {
    const outputDir = options.localDir || path.join(process.cwd(), 'exports');
    await fs.mkdir(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, fileName);
    await fs.writeFile(outputPath, png);
    return { uploaded: false, localPath: outputPath, note: 'Google Drive credentials are not configured yet.' };
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: credentialsPath,
    scopes: ['https://www.googleapis.com/auth/drive.file']
  });
  const drive = google.drive({ version: 'v3', auth });
  const tempPath = path.join(os.tmpdir(), fileName);
  await fs.writeFile(tempPath, png);

  const response = await drive.files.create({
    requestBody: { name: fileName, parents: [folderId] },
    media: { mimeType: 'image/png', body: (await import('node:fs')).createReadStream(tempPath) },
    fields: 'id,name,webViewLink'
  });

  return { uploaded: true, file: response.data };
}

async function fetchTuermliMenu(dayIndex = 0) {
  const response = await fetch(TUERMLI_MENU_API, {
    headers: { 'User-Agent': 'Tagesmenu Story Generator/0.1' }
  });

  if (!response.ok) {
    throw new Error(`Lunchgate responded with ${response.status}`);
  }

  const html = await response.text();
  const days = lunchgateDays(html);
  const displayDays = days.length ? days : fallbackWeekDays();
  const items = parseLunchgateMenu(html, dayIndex);
  const included = items.find((item) => !item.price)?.name || sampleMenus.tuermli.introDescription;
  const dishes = items
    .filter((item) => item.price)
    .slice(0, 2)
    .map((item) => ({
      name: item.name,
      description: item.description,
      price: `CHF ${Number(item.price).toFixed(2)}`
    }));

  return {
    restaurantId: 'tuermli',
    restaurantName: 'Türmli',
    template: 'tuermli',
    date: lunchgateDayDate(html, dayIndex) || displayDays.find((day) => day.index === dayIndex)?.date || formatStoryDate(),
    days: displayDays,
    selectedDay: dayIndex,
    hasMenu: dishes.length > 0,
    introTitle: 'Menü inklusive',
    introDescription: included,
    dishes: dishes.length ? dishes : sampleMenus.tuermli.dishes
  };
}

async function fetchKuonimattMenu(dayIndex = 0) {
  const response = await fetch(KUONIMATT_MENU_API, {
    headers: { 'User-Agent': 'Tagesmenu Story Generator/0.1' }
  });

  if (!response.ok) {
    throw new Error(`Lunchgate responded with ${response.status}`);
  }

  const html = await response.text();
  const days = lunchgateDays(html);
  const items = parseLunchgateMenu(html, dayIndex);
  const dishes = items
    .filter((item) => !/^holzofen/i.test(item.name) && !/menu|menÃ¼|inkl/i.test(item.name))
    .slice(0, 2)
    .map((item, index) => ({
      name: item.name,
      description: item.description,
      descriptionLines: item.descriptionLines,
      price: item.price ? `CHF ${Number(item.price).toFixed(2)}` : (index === 1 ? 'CHF 24.80' : '')
    }));
  const pizzaItem = items.find((item) => /^holzofen/i.test(item.name));
  const includedItem = items.find((item) => /menu|menü|inkl/i.test(item.name));

  return {
    restaurantId: 'kuonimatt',
    restaurantName: 'Kuonimatt',
    template: 'kuonimatt',
    date: lunchgateDayDate(html, dayIndex) || formatStoryDate(),
    days,
    selectedDay: dayIndex,
    hasMenu: dishes.length > 0,
    introTitle: 'MENÜ INKLUSIVE',
    introDescription: includedItem?.description || sampleMenus.kuonimatt.introDescription,
    dishes: dishes.length ? dishes : sampleMenus.kuonimatt.dishes,
    pizza: {
      name: 'HOLZOFENPIZZA',
      description: pizzaItem?.description || sampleMenus.kuonimatt.pizza.description
    }
  };
}

async function fetchMilitaergartenMenu(dayIndex = 0) {
  const response = await fetch(MILITAERGARTEN_MENU_API, {
    headers: { 'User-Agent': 'Tagesmenu Story Generator/0.1' }
  });

  if (!response.ok) {
    throw new Error(`Lunchgate responded with ${response.status}`);
  }

  const html = await response.text();
  const days = lunchgateDays(html);
  const displayDays = days.length ? days : fallbackWeekDays();
  const items = parseLunchgateMenu(html, dayIndex);
  const dishes = items
    .filter((item) => item.price)
    .slice(0, 2)
    .map(normalizeMilitaergartenDish);
  const includedItem = items.find((item) => /menu|menü|inkl/i.test(item.name));

  return {
    restaurantId: 'militaergarten',
    restaurantName: 'Militärgarten',
    template: 'militaergarten',
    date: lunchgateDayDate(html, dayIndex) || displayDays.find((day) => day.index === dayIndex)?.date || formatStoryDate(),
    days: displayDays,
    selectedDay: dayIndex,
    hasMenu: dishes.length > 0,
    introTitle: 'Menü Inklusive',
    introDescription: includedItem?.name?.replace(/^menu inklusive\s*/i, '') || sampleMenus.militaergarten.introDescription,
    dishes: dishes.length ? dishes : sampleMenus.militaergarten.dishes
  };
}

function normalizeMilitaergartenDish(item) {
  const descriptionLines = item.descriptionLines?.length ? item.descriptionLines : [item.description].filter(Boolean);

  return {
    name: item.name,
    description: descriptionLines.join(' '),
    descriptionLines,
    price: `CHF ${Number(item.price).toFixed(2)}`
  };
}

async function fetchLuxMenu(dayIndex = 0) {
  const response = await fetch(LUX_MENU_API, {
    headers: { 'User-Agent': 'Tagesmenu Story Generator/0.1' }
  });

  if (!response.ok) {
    throw new Error(`Lunchgate responded with ${response.status}`);
  }

  const html = await response.text();
  const days = lunchgateDays(html);
  const displayDays = days.length ? days : fallbackWeekDays();
  const items = parseLunchgateMenu(html, dayIndex);
  const dishes = items
    .filter((item) => item.price)
    .slice(0, 2)
    .map((item) => ({
      name: item.name,
      description: item.description,
      descriptionLines: item.descriptionLines,
      price: `CHF ${Number(item.price).toFixed(2)}`
    }));

  return {
    restaurantId: 'lux',
    restaurantName: 'LUX',
    template: 'lux',
    date: lunchgateDayDate(html, dayIndex) || displayDays.find((day) => day.index === dayIndex)?.date || formatStoryDate(),
    days: displayDays,
    selectedDay: dayIndex,
    hasMenu: dishes.length > 0,
    introTitle: 'Menu inklusive',
    introDescription: sampleMenus.lux.introDescription,
    dishes: dishes.length ? dishes : sampleMenus.lux.dishes
  };
}

async function fetchZellfeldMenu(dayIndex = 0) {
  const response = await fetch(ZELLFELD_MENU_API, {
    headers: { 'User-Agent': 'Tagesmenu Story Generator/0.1' }
  });

  if (!response.ok) {
    throw new Error(`Lunchgate responded with ${response.status}`);
  }

  const html = await response.text();
  const days = lunchgateDays(html);
  const items = parseLunchgateMenu(html, dayIndex);
  const dishes = items
    .filter((item) => item.price)
    .slice(0, 2)
    .map((item) => ({
      name: item.name,
      description: item.description,
      descriptionLines: item.descriptionLines,
      price: `CHF ${Number(item.price).toFixed(2)}`
    }));
  const pizzaItem = items.find((item) => /^pizza nach wahl/i.test(item.name));
  const includedItem = items.find((item) => /menu|menü|inkl/i.test(item.name));

  return {
    restaurantId: 'zellfeld',
    restaurantName: 'Zellfeld',
    template: 'zellfeld',
    date: lunchgateDayDate(html, dayIndex) || formatStoryDate(),
    days,
    selectedDay: dayIndex,
    hasMenu: dishes.length > 0,
    introTitle: 'Menu inklusive',
    introDescription: includedItem?.description || sampleMenus.zellfeld.introDescription,
    dishes: dishes.length ? dishes : sampleMenus.zellfeld.dishes,
    pizza: {
      name: pizzaItem?.name || sampleMenus.zellfeld.pizza.name,
      description: pizzaItem?.description || sampleMenus.zellfeld.pizza.description
    }
  };
}

async function fetchFischerstubeMenu(dayIndex = 0) {
  const response = await fetch(FISCHERSTUBE_MENU_API, {
    headers: { 'User-Agent': 'Tagesmenu Story Generator/0.1' }
  });

  if (!response.ok) {
    throw new Error(`Lunchgate responded with ${response.status}`);
  }

  const html = await response.text();
  const days = lunchgateDays(html);
  const items = parseLunchgateMenuWithBreaks(html, dayIndex);
  const dishes = items
    .filter((item) => item.price)
    .slice(0, 3)
    .map((item) => ({
      name: item.name,
      description: item.description,
      descriptionLines: item.descriptionLines.slice(0, 3),
      price: `CHF ${Number(item.price).toFixed(2)}`
    }));

  return {
    restaurantId: 'fischerstube',
    restaurantName: 'Fischerstube',
    template: 'fischerstube',
    date: lunchgateDayDate(html, dayIndex) || formatStoryDate(),
    days,
    selectedDay: dayIndex,
    hasMenu: dishes.length > 0,
    introTitle: '',
    introDescription: '',
    dishes: dishes.length ? dishes : sampleMenus.fischerstube.dishes
  };
}

function parseLunchgateMenu(html, dayIndex = 0) {
  const tabNumber = Math.max(1, Number(dayIndex || 0) + 1);
  const menuMatch = html.match(new RegExp(`<div id="tab-container_${tabNumber}"[\\s\\S]*?<\\/div>\\s*<\\/div>`, 'i'));
  const menuHtml = menuMatch?.[0] || html;
  const itemPattern = /<h2[^>]*class=['"]title['"][^>]*>([\s\S]*?)<\/h2>\s*<p>([\s\S]*?)<\/p>/gi;
  const items = [];
  let match;

  while ((match = itemPattern.exec(menuHtml))) {
    const paragraph = match[2];
    const lineMatch = paragraph.match(/<span class="line2">([\s\S]*?)<\/span>/i);
    const line3Match = paragraph.match(/<span class="line3">([\s\S]*?)<\/span>/i);
    const priceMatch = paragraph.match(/<span class="price">([\s\S]*?)<\/span>/i);
    const descriptionLines = [lineMatch?.[1], line3Match?.[1]]
      .map((line) => decodeHtml(stripTags(line || '')).trim())
      .filter(Boolean);

    items.push({
      name: decodeHtml(stripTags(match[1])).trim(),
      description: descriptionLines.join(' '),
      descriptionLines,
      price: decodeHtml(stripTags(priceMatch?.[1] || '')).trim()
    });
  }

  return items.filter((item) => item.name);
}

function parseLunchgateMenuWithBreaks(html, dayIndex = 0) {
  const tabNumber = Math.max(1, Number(dayIndex || 0) + 1);
  const menuMatch = html.match(new RegExp(`<div id="tab-container_${tabNumber}"[\\s\\S]*?<\\/div>\\s*<\\/div>`, 'i'));
  const menuHtml = menuMatch?.[0] || html;
  const itemPattern = /<h2[^>]*class=['"]title['"][^>]*>([\s\S]*?)<\/h2>\s*<p>([\s\S]*?)<\/p>/gi;
  const items = [];
  let match;

  while ((match = itemPattern.exec(menuHtml))) {
    const paragraph = match[2];
    const lineMatch = paragraph.match(/<span class="line2">([\s\S]*?)<\/span>/i);
    const line3Match = paragraph.match(/<span class="line3">([\s\S]*?)<\/span>/i);
    const priceMatch = paragraph.match(/<span class="price">([\s\S]*?)<\/span>/i);
    const descriptionLines = [lineMatch?.[1], line3Match?.[1]]
      .flatMap((line) => splitHtmlLines(line || ''))
      .map((line) => decodeHtml(stripTags(line)).trim())
      .filter(Boolean);

    items.push({
      name: decodeHtml(stripTags(match[1])).trim(),
      description: descriptionLines.join(' '),
      descriptionLines,
      price: decodeHtml(stripTags(priceMatch?.[1] || '')).trim()
    });
  }

  return items.filter((item) => item.name);
}

function splitHtmlLines(value) {
  return String(value || '').split(/<br\s*\/?>/i);
}

function lunchgateDays(html) {
  const days = [];
  const pattern = /<li[^>]*class="tab"[^>]*>\s*<a[^>]*href="#tab-container_(\d+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = pattern.exec(String(html || '')))) {
    const index = Number(match[1]) - 1;
    const label = decodeHtml(stripTags(match[2])).trim();
    days.push({
      index,
      label,
      date: lunchgateLabelDate(label)
    });
  }

  return days;
}

function lunchgateDayDate(html, dayIndex = 0) {
  const day = lunchgateDays(html).find((item) => item.index === Number(dayIndex || 0));
  return day?.date || null;
}

function lunchgateLabelDate(label) {
  if (/morgen/i.test(String(label || ''))) {
    return formatStoryDate(addDays(new Date(), 1));
  }
  if (/heute/i.test(String(label || ''))) {
    return formatStoryDate();
  }

  const match = String(label || '').match(/(\d{2})\.(\d{2})\./);
  if (!match) return null;
  return `${match[1]}.${match[2]}.${new Date().getFullYear()}`;
}

function firstLunchgateTabDate(html) {
  const match = String(html || '').match(/<li[^>]*class="tab"[^>]*>\s*<a[^>]*>(?:[A-Za-z]{2}\s+)?(\d{2})\.(\d{2})\./i);
  if (!match) return null;
  return `${match[1]}.${match[2]}.${new Date().getFullYear()}`;
}

function stripTags(value) {
  return String(value || '').replace(/<[^>]+>/g, ' ');
}

function decodeHtml(value) {
  return String(value || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

function formatStoryDate(date = new Date()) {
  return new Intl.DateTimeFormat('de-CH', {
    timeZone: 'Europe/Zurich',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

function fallbackWeekDays(count = 5) {
  return Array.from({ length: count }, (_unused, index) => {
    const date = addDays(new Date(), index);
    const dateText = formatStoryDate(date);
    const label = index === 0
      ? 'Heute'
      : index === 1
        ? 'Morgen'
        : new Intl.DateTimeFormat('de-CH', {
          timeZone: 'Europe/Zurich',
          weekday: 'short',
          day: '2-digit',
          month: '2-digit'
        }).format(date);

    return { index, label, date: dateText };
  });
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function safeName(value) {
  return String(value || 'menu')
    .replace(/Ã¼|ü/g, 'ue')
    .replace(/Ã¤|ä/g, 'ae')
    .replace(/Ã¶|ö/g, 'oe')
    .replace(/Ãœ|Ü/g, 'Ue')
    .replace(/Ã„|Ä/g, 'Ae')
    .replace(/Ã–|Ö/g, 'Oe')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function safeFolderName(value) {
  return String(value || 'today').replace(/[<>:"/\\|?*]+/g, '-').trim();
}

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: error.message });
});

app.listen(port, () => {
  console.log(`Menu automation server running on http://127.0.0.1:${port}`);
});
