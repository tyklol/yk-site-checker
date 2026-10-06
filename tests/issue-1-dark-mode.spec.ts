import { test, expect, type Page } from '@playwright/test';

// The spec says "a button in the nav" without naming it, so the test requires
// exactly one visible button inside the page's navigation landmark.
async function navToggle(page: Page) {
  const buttons = page.getByRole('navigation').getByRole('button').filter({ visible: true });
  await expect(buttons, 'expected exactly one visible button in the nav').toHaveCount(1);
  return buttons.first();
}

const hasDark = (page: Page) => page.evaluate(() => document.body.classList.contains('dark'));

// SPEC.md line 10: "A button in the nav toggles a 'dark' class on <body>."
test('SPEC L10: nav button toggles the dark class on <body>', async ({ page }) => {
  await page.goto('./');
  const toggle = await navToggle(page);
  const initial = await hasDark(page);

  await toggle.click();
  await expect.poll(() => hasDark(page), 'first click flips the class').toBe(!initial);

  await toggle.click();
  await expect.poll(() => hasDark(page), 'second click flips it back').toBe(initial);
});

// SPEC.md line 11: "The choice is kept for the session."
// Interpreted as: in the same browser session (same tab), the choice survives a
// page reload, in both directions. The spec does not say whether it must be
// forgotten in a new session, so that is not tested.
test('SPEC L11: dark-mode choice survives a reload in the same session', async ({ page }) => {
  await page.goto('./');
  const initial = await hasDark(page);

  await (await navToggle(page)).click();
  await expect.poll(() => hasDark(page)).toBe(!initial);
  await page.reload();
  expect(await hasDark(page), 'toggled choice should survive reload').toBe(!initial);

  await (await navToggle(page)).click();
  await expect.poll(() => hasDark(page)).toBe(initial);
  await page.reload();
  expect(await hasDark(page), 'toggling back should also survive reload').toBe(initial);
});
