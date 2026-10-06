import { test, expect, type Page } from '@playwright/test';

// The spec does not name the button, so it is found by role and an accessible
// name containing "top" (e.g. "Back to top", "Scroll to top").
const backToTop = (page: Page) => page.getByRole('button', { name: /\btop\b/i });

// "Appears" is checked as: rendered, not visibility:hidden, not fully transparent,
// and inside the viewport. Playwright's toBeVisible alone treats opacity:0 as visible.
const isShown = (page: Page) =>
  backToTop(page)
    .first()
    .evaluate((el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return (
        cs.display !== 'none' &&
        cs.visibility !== 'hidden' &&
        parseFloat(cs.opacity) > 0 &&
        r.width > 0 &&
        r.height > 0 &&
        r.bottom > 0 &&
        r.top < innerHeight
      );
    }, undefined, { timeout: 2000 })
    .catch(() => false);

// Scroll so the bottom of #hero is above the top of the viewport.
const scrollPastHero = (page: Page) =>
  page.evaluate(() => {
    const hero = document.querySelector('#hero')!;
    const bottom = hero.getBoundingClientRect().bottom + scrollY;
    scrollTo({ top: bottom + 50, behavior: 'instant' });
  });

// SPEC.md line 14: "A back-to-top button appears once the user has scrolled past the hero section."
test('SPEC L14: back-to-top button is hidden at the top and appears after scrolling past #hero', async ({ page }) => {
  await page.goto('./');
  await expect(backToTop(page), 'expected one back-to-top button').toHaveCount(1);

  expect(await isShown(page), 'should not be shown while at the top').toBe(false);

  await scrollPastHero(page);
  await expect.poll(() => isShown(page), 'should be shown once past #hero').toBe(true);
});

// SPEC.md line 15: "Clicking it scrolls the page back to the top."
test('SPEC L15: clicking back-to-top scrolls to the top', async ({ page }) => {
  await page.goto('./');
  await expect(backToTop(page), 'expected one back-to-top button').toHaveCount(1);
  await scrollPastHero(page);
  await expect.poll(() => isShown(page)).toBe(true);

  await backToTop(page).click();
  await expect.poll(() => page.evaluate(() => scrollY), { timeout: 5000 }).toBe(0);
});
