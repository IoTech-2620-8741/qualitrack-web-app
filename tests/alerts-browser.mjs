import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { createServer } from 'node:http';

const origin = process.env.WEB_URL ?? 'http://localhost:4200';
const directory = process.env.OUTPUT_DIR ?? 'test-results/alerts';
await mkdir(directory, { recursive: true });

const environments = [
  { id: 1, code: 'PROD-SOL-01', name: 'Área de producción de sólidos', usage: null },
  { id: 2, code: 'CAD-FRIO-01', name: 'Cámara de cadena de frío para medicamentos termolábiles', usage: null },
  { id: 3, code: 'ALM-MP-01', name: 'Almacén de materias primas', usage: null },
];
const devices = [
  { id: 11, name: 'Monitor ambiental PROD-SOL' },
  { id: 12, name: 'Refrigerador CF-01' },
  { id: 13, name: 'Monitor ambiental ALM-MP' },
];
const alertOf = (id, environmentId, equipmentId, changes) => ({
  id, laboratoryId: 42, environmentId, equipmentId, origin: 'ENVIRONMENT', parameterName: 'AIR_QUALITY',
  recordedValue: 951, thresholdValue: 900, unit: 'ppm', timestamp: '2026-10-04T22:01:00Z',
  severity: 'CRITICAL', status: 'UNRESOLVED', deviationCount: 1, ...changes,
});
const alerts = () => ({
  1: [alertOf(101, 1, 11)],
  2: [alertOf(102, 2, 12, { origin: 'CONTAINER', parameterName: 'TEMPERATURE', recordedValue: 12.5,
    thresholdValue: 8, unit: '°C', timestamp: '2026-10-04T19:04:00Z' })],
  3: [alertOf(103, 3, 13, { status: 'ACKNOWLEDGED', recordedValue: 935, deviationCount: 4,
    timestamp: '2026-10-03T14:00:00Z', acknowledgedBy: 27, acknowledgedAt: '2026-10-03T14:14:00Z',
    normalizedAt: '2026-10-05T05:15:00Z' }),
  alertOf(104, 3, 13, { severity: 'WARNING', parameterName: 'HUMIDITY', recordedValue: 71, thresholdValue: 65,
    unit: '%', timestamp: '2026-10-08T14:00:00Z' })],
});

const newPlatformState = () => ({ alerts: alerts(), failing: new Set(), acknowledgements: [], acknowledgeStatus: 200 });

/** What the platform of the fixture answers to a request. */
function answerOf(state, method, path) {
  let body = [];
  let status = 200;
  const environmentAlerts = path.match(/environments\/(\d+)\/deviation-alerts$/);
  const acknowledgement = path.match(/deviation-alerts\/(\d+)\/acknowledgements$/);
  const alertDetail = path.match(/deviation-alerts\/(\d+)$/);
  if (path.endsWith('/users/me/onboarding')) body = { userId: 27, laboratoryId: 42, subscriptionId: 73, subscriptionStatus: 'ACTIVE', nextStep: 'READY' };
  else if (path.endsWith('/users/me/profile')) body = { userId: 27, staffId: null, username: 'fixture', email: null, roles: [], fullName: 'Alerts Fixture', dni: null, phoneNumber: null, location: null, position: null, hasPhoto: false };
  else if (path.endsWith('/laboratories/42')) body = { id: 42, name: 'Multilab', ownerId: 27 };
  else if (path.endsWith('/laboratories/42/environments')) body = environments;
  else if (path.endsWith('/equipments')) body = devices;
  else if (environmentAlerts) {
    const environmentId = Number(environmentAlerts[1]);
    if (state.failing.has(environmentId)) status = 503;
    else body = state.alerts[environmentId] ?? [];
  } else if (acknowledgement && method === 'POST') {
    const alertId = Number(acknowledgement[1]);
    state.acknowledgements.push(alertId);
    status = state.acknowledgeStatus;
    const alert = Object.values(state.alerts).flat().find((item) => item.id === alertId);
    if (status === 200) {
      Object.assign(alert, { status: 'ACKNOWLEDGED', acknowledgedBy: 27, acknowledgedAt: new Date().toISOString() });
      body = alert;
    } else {
      body = { details: 'Already attended' };
    }
  } else if (alertDetail) {
    body = Object.values(state.alerts).flat().find((item) => item.id === Number(alertDetail[1]));
  }
  return { status, body };
}

/** Opens the inbox on an isolated session; nothing reaches a real platform. */
async function openInbox(browser, { width = 1280, height = 900, roles = '["ROLE_QA_MANAGER"]', api, intercepted = true, platformState } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, locale: 'es-PE' });
  await context.addInitScript((sessionRoles) => {
    localStorage.setItem('token', 'test.' + btoa(JSON.stringify({ exp: Date.now() / 1000 + 3600 })) + '.test');
    localStorage.setItem('userId', '27');
    localStorage.setItem('username', 'Alerts fixture');
    localStorage.setItem('roles', sessionRoles);
  }, roles);
  const state = platformState ?? newPlatformState();
  if (intercepted) {
    await context.route('**/api/v1/**', async (route) => {
      const request = route.request();
      const { status, body } = answerOf(state, request.method(), new URL(request.url()).pathname);
      await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    });
  }
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await api?.(state);
  await page.goto(origin + '/alerts');
  await page.getByRole('radio', { name: 'Español', exact: true }).click();
  await page.locator('app-alert-card, app-empty-state, app-action-banner').first().waitFor();
  return { context, page, state, errors };
}

const titles = (page) => page.locator('app-alert-card h2').allInnerTexts();
const cardsShown = (page, count) =>
  page.waitForFunction((expected) => document.querySelectorAll('app-alert-card').length === expected, count);
const statusShown = (page, device, status) =>
  page.locator('app-alert-card', { hasText: device }).locator('app-status-chip', { hasText: status }).waitFor();
const attendButton = (page, device) =>
  page.locator('app-alert-card', { hasText: device }).getByRole('button', { name: /Registrar atención/ });
/** Elements of the inbox past the right edge of the page, which the scrolling container hides; the tabs scroll by themselves. */
const overflowing = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('main.operations-page *')]
      .filter((element) => !element.closest('.mat-mdc-tab-header'))
      .filter((element) => element.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
      .map((element) => element.tagName + '.' + element.className),
  );

/**
 * Answers on the address of the platform in development, because a request sent while the page goes away is lost when
 * the browser intercepts it. Port 8080 must be free, so stop a local platform before running this test.
 */
async function withRealPlatform(run) {
  const state = newPlatformState();
  const authorizations = [];
  const server = createServer((request, response) => {
    response.setHeader('Access-Control-Allow-Origin', request.headers.origin ?? '*');
    response.setHeader('Access-Control-Allow-Headers', 'authorization,content-type');
    response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    if (request.method === 'OPTIONS') return response.writeHead(204).end();
    const path = request.url.split('?')[0];
    if (path.endsWith('/acknowledgements')) authorizations.push(Boolean(request.headers.authorization));
    const { status, body } = answerOf(state, request.method, path);
    response.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(body));
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(8080, resolve);
  });
  try {
    await run(state, authorizations);
  } finally {
    server.close();
  }
}

const browser = await chromium.launch();
try {
  // Every environment, the most urgent first.
  {
    const { context, page, errors } = await openInbox(browser);
    const order = await titles(page);
    assert.match(order[0], /Refrigerador CF-01/);
    assert.match(order[1], /PROD-SOL/);
    assert.match(order[2], /ALM-MP/);
    assert.match(await page.locator('app-action-banner').innerText(), /2 alertas críticas sin atender/);
    await page.getByRole('button', { name: 'Ver críticas sin atender' }).click();
    await cardsShown(page, 2);
    assert.equal(await page.getByRole('button', { name: /^Críticas/ }).getAttribute('aria-pressed'), 'true');
    await page.getByRole('button', { name: /^Alertas abiertas/ }).click();
    await cardsShown(page, 4);
    await page.getByRole('searchbox').fill('refrigerador');
    await cardsShown(page, 1);
    await page.getByRole('searchbox').fill('');
    await cardsShown(page, 4);
    await page.screenshot({ path: `${directory}/inbox-1280.png`, fullPage: true });
    assert.deepEqual(errors, []);
    await context.close();
  }

  // Attention waits for the time to undo, which can stop.
  {
    const { context, page, state, errors } = await openInbox(browser);
    await attendButton(page, 'Refrigerador').click();
    await statusShown(page, 'Refrigerador', 'En atención');
    assert.deepEqual(state.acknowledgements, []);
    await page.screenshot({ path: `${directory}/undo-window.png` });
    await page.waitForFunction(() => /^Resolver: .*Refrigerador/.test(document.activeElement?.getAttribute('aria-label') ?? ''));
    await page.getByRole('button', { name: 'Deshacer' }).click();
    await page.locator('app-undo-toast').waitFor({ state: 'detached' });
    await statusShown(page, 'Refrigerador', 'Abierta');
    await page.waitForTimeout(5500);
    assert.deepEqual(state.acknowledgements, [], 'Undone attention must never reach the platform');

    await attendButton(page, 'Refrigerador').click();
    await page.locator('app-undo-toast').waitFor({ state: 'detached', timeout: 7000 });
    assert.deepEqual(state.acknowledgements, [102]);
    await statusShown(page, 'Refrigerador', 'En atención');
    assert.deepEqual(errors, []);
    await context.close();
  }

  // A second attention closes the time to undo the first one.
  {
    const { context, page, state } = await openInbox(browser);
    await attendButton(page, 'Refrigerador').click();
    await attendButton(page, 'PROD-SOL').click();
    await page.waitForTimeout(600);
    assert.deepEqual(state.acknowledgements, [102]);
    await context.close();
  }

  // Whatever way the person leaves, what was waiting is sent once and with the session.
  {
    const leavingWays = {
      'going to another address': (page) => page.goto('about:blank'),
      'reloading': (page) => page.reload(),
      'closing the tab': async (page, context) => {
        await context.newPage();
        await page.close({ runBeforeUnload: false });
      },
      'signing out': (page) => page.locator('app-user-session-section button').first().click(),
    };
    for (const [way, leave] of Object.entries(leavingWays)) {
      await withRealPlatform(async (state, authorizations) => {
        const { context, page } = await openInbox(browser, { intercepted: false, platformState: state });
        await attendButton(page, 'Refrigerador').click();
        await leave(page, context);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        assert.deepEqual(state.acknowledgements, [102], way);
        assert.deepEqual(authorizations, [true], way);
        await context.close();
      });
    }
  }

  // Moving on inside the application keeps the time to undo running.
  {
    const { context, page, state } = await openInbox(browser);
    await attendButton(page, 'Refrigerador').click();
    await page.getByRole('tab', { name: /Historial/ }).click();
    await page.waitForURL('**/alerts/history');
    assert.deepEqual(state.acknowledgements, []);
    await page.locator('app-undo-toast').waitFor({ state: 'detached', timeout: 7000 });
    assert.deepEqual(state.acknowledgements, [102]);
    await context.close();
  }

  // Opening the alert that is waiting sends it first.
  {
    const { context, page, state } = await openInbox(browser);
    await attendButton(page, 'Refrigerador').click();
    await page.locator('app-alert-card', { hasText: 'Refrigerador' }).getByRole('link', { name: /Ver detalle/ }).click();
    await page.waitForURL('**/alerts/102');
    await page.getByRole('heading', { level: 1 }).waitFor();
    assert.deepEqual(state.acknowledgements, [102]);
    await context.close();
  }

  // Another person got there first.
  {
    const { context, page, state } = await openInbox(browser, { width: 1280, height: 500 });
    state.acknowledgeStatus = 409;
    await attendButton(page, 'Refrigerador').click();
    state.alerts[2][0].status = 'ACKNOWLEDGED';
    state.alerts[2][0].acknowledgedAt = new Date().toISOString();
    await page.locator('app-undo-toast').waitFor({ state: 'detached', timeout: 7000 });
    await page.getByText('Otra persona ya atendió esta alerta.').waitFor();
    await page.waitForFunction(() => {
      const banner = document.querySelector('app-error-banner').getBoundingClientRect();
      return banner.top >= 0 && banner.bottom <= window.innerHeight;
    });
    await statusShown(page, 'Refrigerador', 'En atención');
    await context.close();
  }

  // An environment that does not answer does not hide the others, and never reads as good news.
  {
    const { context, page, state, errors } = await openInbox(browser, {
      api: async (fixtureState) => {
        fixtureState.failing.add(2);
      },
    });
    await page.getByText(/No se pudieron leer las alertas de: CAD-FRIO-01/).waitFor();
    await cardsShown(page, 3);
    state.failing.clear();
    await page.getByRole('button', { name: 'Reintentar' }).click();
    await page.locator('app-alert-card', { hasText: 'Refrigerador' }).waitFor();
    await page.getByText(/No se pudieron leer/).waitFor({ state: 'detached' });
    assert.deepEqual(errors, []);
    await context.close();
  }

  // Nothing open is good news.
  {
    const { context, page } = await openInbox(browser, {
      api: async (fixtureState) => {
        fixtureState.alerts = {};
      },
    });
    await page.getByRole('heading', { name: 'Todo dentro de los parámetros BPM' }).waitFor();
    await page.getByText('No hay alertas abiertas en los 3 ambientes.').waitFor();
    await page.screenshot({ path: `${directory}/all-clear.png` });
    await context.close();
  }

  // Auditors only consult.
  {
    const { context, page } = await openInbox(browser, { roles: '["ROLE_AUDITOR"]' });
    assert.equal(await page.getByRole('button', { name: /Registrar atención/ }).count(), 0);
    assert.equal(await page.getByRole('link', { name: /^Resolver/ }).count(), 0);
    assert.equal(await page.getByRole('link', { name: /Ver detalle/ }).count(), 4);
    await context.close();
  }

  // The chosen environment lives in the address and is shown in full.
  {
    const { context, page } = await openInbox(browser);
    await page.locator('app-environment-selector mat-select').click();
    await page.getByRole('option', { name: /CAD-FRIO-01/ }).click();
    await page.waitForURL('**/alerts?environmentId=2');
    await cardsShown(page, 1);
    const selected = page.locator('app-environment-selector .mat-mdc-select-min-line');
    assert.equal(await selected.evaluate((text) => getComputedStyle(text).whiteSpace), 'normal');
    assert.ok(
      await selected.evaluate((text) => {
        const shown = text.closest('mat-form-field').getBoundingClientRect();
        const name = text.getBoundingClientRect();
        return name.bottom <= shown.bottom && name.right <= shown.right;
      }),
      'The environment selector must show the whole name',
    );
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${directory}/one-environment.png` });
    await context.close();
  }

  // No width scrolls sideways.
  for (const width of [1440, 1024, 768, 375, 320]) {
    const { context, page, errors } = await openInbox(browser, { width, height: 3200 });
    assert.deepEqual(await overflowing(page), [], `Sideways scroll at ${width} px`);
    await page.locator('main.operations-page').screenshot({ path: `${directory}/inbox-${width}.png` });
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log('Alerts browser checks passed');
} finally {
  await browser.close();
}
