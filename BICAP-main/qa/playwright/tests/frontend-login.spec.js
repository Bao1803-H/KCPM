const { test, expect } = require('@playwright/test');

const host = process.env.QA_BASE_HOST || '127.0.0.1';
const guestPort = process.env.GUEST_WEB_PORT || '3405';
const farmPort = process.env.FARM_WEB_PORT || '3402';
const adminPort = process.env.ADMIN_WEB_PORT || '3401';
const retailerPort = process.env.RETAILER_WEB_PORT || '3400';
const shippingManagerPort = process.env.SHIPPING_MANAGER_WEB_PORT || '3403';

test.describe('BICAP Frontend E2E - Login Pages Smoke Test', () => {

  test('Guest Web login page should load correctly', async ({ page }) => {
    await page.goto(`http://${host}:${guestPort}/login`);
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[name="password"]')).toBeVisible({ timeout: 5000 });
  });

  test('Retailer Web login page should load correctly', async ({ page }) => {
    await page.goto(`http://${host}:${retailerPort}/login`);
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[name="password"]')).toBeVisible({ timeout: 5000 });
  });

  test('Admin Web login page should load correctly', async ({ page }) => {
    await page.goto(`http://${host}:${adminPort}/login`);
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[name="password"]')).toBeVisible({ timeout: 5000 });
  });

  test('Farm Management Web login page should load correctly', async ({ page }) => {
    await page.goto(`http://${host}:${farmPort}/login`);
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[name="password"]')).toBeVisible({ timeout: 5000 });
  });

  test('Shipping Manager Web login page should load correctly', async ({ page }) => {
    await page.goto(`http://${host}:${shippingManagerPort}/login`);
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[name="password"]')).toBeVisible({ timeout: 5000 });
  });
});
