import { test, expect } from '@playwright/test';

const profiles = [
  { name: 'small-phone', width: 320, height: 640, top: 30, bottom: 24, left: 0, right: 0 },
  { name: 'gesture-navigation', width: 390, height: 844, top: 44, bottom: 28, left: 0, right: 0 },
  { name: 'three-button-navigation', width: 412, height: 915, top: 32, bottom: 48, left: 0, right: 0 },
  { name: 'landscape-cutout', width: 844, height: 390, top: 0, bottom: 24, left: 44, right: 24 },
];

for (const profile of profiles) {
  test(`${profile.name}: screens, calendars and pickers respect safe areas`, async ({ page }, testInfo) => {
    await page.setViewportSize(profile);
    await page.addInitScript(() => {
      const timestamp = new Date().toISOString();
      const products = Array.from({ length: 16 }, (_, i) => ({ id: `p${i}`, name: `${i ? 'Product' : 'Very long product name that wraps on a narrow mobile screen'} ${i + 1}`, unit: 'boxes', stock: 10, createdAt: timestamp }));
      const transactions = products.map(p => ({ id: `t${p.id}`, productId: p.id, productName: p.name, unit: p.unit, quantity: 10, type: 'RECEIVED', timestamp, prevBalance: 0, newBalance: 10 }));
      localStorage.setItem('stocktrack_ledger_v2', JSON.stringify({ products, transactions }));
    });
    await page.goto('/');
    await page.evaluate(p => {
      for (const side of ['top', 'bottom', 'left', 'right']) document.documentElement.style.setProperty(`--safe-area-inset-${side}`, `${p[side]}px`);
    }, profile);
    async function noOverflow() {
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    }
    const header = await page.locator('header').boundingBox();
    expect(header.y).toBeGreaterThanOrEqual(profile.top);
    expect(header.x).toBeGreaterThanOrEqual(profile.left);
    await noOverflow();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const nav = await page.getByRole('navigation').boundingBox();
    expect(nav.y).toBeGreaterThanOrEqual(profile.top);
    const footer = await page.locator('.device-note').boundingBox();
    expect(footer.y + footer.height).toBeLessThanOrEqual(profile.height - profile.bottom + 1);
    for (const tab of ['Receive', 'Deliver']) {
      await page.getByRole('navigation').getByRole('button', { name: tab, exact: true }).click();
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.getByRole('button', { name: /Entry date/ }).click();
      await expect(page.locator('.calendar-grid')).toBeVisible();
      await noOverflow();
      await page.getByRole('button', { name: /Entry date/ }).click();
      await page.getByRole('button', { name: /^Product:/ }).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      const bounds = await dialog.boundingBox();
      expect(bounds.x).toBeGreaterThanOrEqual(profile.left);
      expect(bounds.y).toBeGreaterThanOrEqual(profile.top);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(profile.width - profile.right + 1);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(profile.height - profile.bottom + 1);
      await page.getByRole('textbox', { name: 'Search product' }).fill('Very long');
      await page.getByRole('button', { name: /Very long product/ }).click();
      await expect(dialog).not.toBeVisible();
      await noOverflow();
    }
    await page.getByRole('navigation').getByRole('button', { name: 'Records', exact: true }).click();
    await page.getByRole('button', { name: /Summary date/ }).click();
    await expect(page.locator('.calendar-grid')).toBeVisible();
    await noOverflow();
    await page.getByRole('button', { name: /Summary date/ }).click();
    await page.getByRole('button', { name: 'Custom range', exact: true }).click();
    await expect(page.locator('.calendar-grid')).toBeVisible();
    await noOverflow();

    // QA: Verify Backup & Reports modal within safe areas
    await page.getByRole('button', { name: /Backup & Reports/ }).click();
    const backupDialog = page.getByRole('dialog', { name: /Backup & Reports/ });
    await expect(backupDialog).toBeVisible();
    const backupBounds = await backupDialog.boundingBox();
    expect(backupBounds.x).toBeGreaterThanOrEqual(profile.left);
    expect(backupBounds.y).toBeGreaterThanOrEqual(profile.top);
    expect(backupBounds.x + backupBounds.width).toBeLessThanOrEqual(profile.width - profile.right + 1);
    expect(backupBounds.y + backupBounds.height).toBeLessThanOrEqual(profile.height - profile.bottom + 1);
    await expect(page.getByRole('button', { name: /Export Full Backup/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Stock CSV/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Stock PDF/ })).toBeVisible();
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(backupDialog).not.toBeVisible();
    await noOverflow();

    await page.screenshot({ path: testInfo.outputPath('records-mobile.png'), fullPage: true });
  });
}
